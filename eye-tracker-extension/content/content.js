/**
 * EyeTrack Reader Extension - Content Script
 * Injected into web pages to enable eye tracking
 */

(function() {
    'use strict';
    
    // Avoid running multiple times
    if (window.eyeTrackReaderInjected) return;
    window.eyeTrackReaderInjected = true;
    
    // State
    let isActive = false;
    let isCalibrating = false;
    let showGaze = false;
    let autoScrollEnabled = true;
    let scrollSpeed = 5;
    let sensitivity = 20;
    
    let gazeHistory = [];
    const historySize = 5;
    let scrollCooldown = false;
    const cooldownTime = 1000;
    
    // Elements
    let gazeIndicator = null;
    let floatingControls = null;
    let calibrationOverlay = null;
    
    /**
     * Initialize the content script
     */
    function init() {
        loadSettings();
        createUI();
        setupMessageListeners();
    }
    
    /**
     * Load settings from storage
     */
    async function loadSettings() {
        try {
            const result = await chrome.storage.sync.get('eyeTrackerSettings');
            if (result.eyeTrackerSettings) {
                autoScrollEnabled = result.eyeTrackerSettings.autoScroll ?? true;
                showGaze = result.eyeTrackerSettings.showGaze ?? false;
                scrollSpeed = result.eyeTrackerSettings.scrollSpeed ?? 5;
                sensitivity = result.eyeTrackerSettings.sensitivity ?? 20;
            }
        } catch (error) {
            console.log('Using default settings');
        }
    }
    
    /**
     * Create UI elements
     */
    function createUI() {
        // Gaze indicator
        gazeIndicator = document.createElement('div');
        gazeIndicator.id = 'eyetrack-gaze-indicator';
        gazeIndicator.style.display = 'none';
        document.body.appendChild(gazeIndicator);
        
        // Floating controls
        floatingControls = document.createElement('div');
        floatingControls.id = 'eyetrack-controls';
        floatingControls.innerHTML = `
            <button id="eyetrack-toggle" title="Toggle Eye Tracking">👁️</button>
            <button id="eyetrack-settings" title="Settings">⚙️</button>
        `;
        floatingControls.style.display = 'none';
        document.body.appendChild(floatingControls);
        
        // Event listeners for controls
        document.getElementById('eyetrack-toggle')?.addEventListener('click', toggleTracking);
    }
    
    /**
     * Setup message listeners for popup communication
     */
    function setupMessageListeners() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.action) {
                case 'getStatus':
                    sendResponse({ isActive, isCalibrating });
                    break;
                    
                case 'toggleTracking':
                    toggleTracking();
                    sendResponse({ isActive });
                    break;
                    
                case 'startCalibration':
                    startCalibration();
                    sendResponse({ success: true });
                    break;
                    
                case 'updateSettings':
                    updateSettings(message.settings);
                    sendResponse({ success: true });
                    break;
                    
                default:
                    sendResponse({ error: 'Unknown action' });
            }
            return true; // Keep channel open for async response
        });
    }
    
    /**
     * Toggle eye tracking on/off
     */
    async function toggleTracking() {
        if (isActive) {
            stopTracking();
        } else {
            await startTracking();
        }
    }
    
    /**
     * Start eye tracking
     */
    async function startTracking() {
        if (typeof webgazer === 'undefined') {
            console.error('WebGazer not available');
            showNotification('WebGazer failed to load. Please refresh the page.');
            return;
        }
        
        try {
            // Configure WebGazer
            webgazer.setRegression('ridge')
                .showVideoPreview(false)
                .showPredictionPoints(false)
                .showFaceOverlay(false)
                .showFaceFeedbackBox(false);
            
            // Set gaze listener
            webgazer.setGazeListener((data, timestamp) => {
                handleGaze(data);
            });
            
            // Start
            await webgazer.begin();
            
            // Hide WebGazer elements
            hideWebGazerElements();
            
            isActive = true;
            updateUI();
            showFloatingControls();
            showNotification('Eye tracking enabled');
            
        } catch (error) {
            console.error('Failed to start eye tracking:', error);
            showNotification('Failed to start eye tracking. Check camera permissions.');
        }
    }
    
    /**
     * Stop eye tracking
     */
    function stopTracking() {
        if (typeof webgazer !== 'undefined') {
            webgazer.pause();
        }
        
        isActive = false;
        hideGazeIndicator();
        updateUI();
        showNotification('Eye tracking disabled');
    }
    
    /**
     * Handle gaze data from WebGazer
     */
    function handleGaze(data) {
        if (!data || !isActive) return;
        
        const { x, y } = data;
        const smoothed = smoothGaze(x, y);
        
        // Update gaze indicator
        if (showGaze) {
            showGazeIndicator(smoothed.x, smoothed.y);
        }
        
        // Check for scroll trigger
        if (autoScrollEnabled) {
            checkScrollTrigger(smoothed.y);
        }
    }
    
    /**
     * Smooth gaze position
     */
    function smoothGaze(x, y) {
        gazeHistory.push({ x, y });
        
        if (gazeHistory.length > historySize) {
            gazeHistory.shift();
        }
        
        const avgX = gazeHistory.reduce((sum, p) => sum + p.x, 0) / gazeHistory.length;
        const avgY = gazeHistory.reduce((sum, p) => sum + p.y, 0) / gazeHistory.length;
        
        return { x: avgX, y: avgY };
    }
    
    /**
     * Check if gaze triggers scroll
     */
    function checkScrollTrigger(gazeY) {
        const viewportHeight = window.innerHeight;
        const triggerThreshold = viewportHeight * (1 - sensitivity / 100);
        
        if (gazeY > triggerThreshold && !scrollCooldown) {
            triggerScroll();
        }
    }
    
    /**
     * Trigger scroll action
     */
    function triggerScroll() {
        scrollCooldown = true;
        
        const scrollAmount = 100 + (scrollSpeed * 30);
        
        window.scrollBy({
            top: scrollAmount,
            behavior: 'smooth'
        });
        
        setTimeout(() => {
            scrollCooldown = false;
        }, cooldownTime);
    }
    
    /**
     * Show gaze indicator at position
     */
    function showGazeIndicator(x, y) {
        if (gazeIndicator) {
            gazeIndicator.style.display = 'block';
            gazeIndicator.style.left = `${x}px`;
            gazeIndicator.style.top = `${y}px`;
        }
    }
    
    /**
     * Hide gaze indicator
     */
    function hideGazeIndicator() {
        if (gazeIndicator) {
            gazeIndicator.style.display = 'none';
        }
    }
    
    /**
     * Show floating controls
     */
    function showFloatingControls() {
        if (floatingControls) {
            floatingControls.style.display = 'flex';
        }
    }
    
    /**
     * Update UI based on state
     */
    function updateUI() {
        const toggleBtn = document.getElementById('eyetrack-toggle');
        if (toggleBtn) {
            toggleBtn.classList.toggle('active', isActive);
        }
    }
    
    /**
     * Update settings
     */
    function updateSettings(settings) {
        if (settings.autoScroll !== undefined) autoScrollEnabled = settings.autoScroll;
        if (settings.showGaze !== undefined) {
            showGaze = settings.showGaze;
            if (!showGaze) hideGazeIndicator();
        }
        if (settings.scrollSpeed !== undefined) scrollSpeed = settings.scrollSpeed;
        if (settings.sensitivity !== undefined) sensitivity = settings.sensitivity;
    }
    
    /**
     * Start calibration
     */
    function startCalibration() {
        isCalibrating = true;
        createCalibrationOverlay();
    }
    
    /**
     * Create calibration overlay
     */
    function createCalibrationOverlay() {
        calibrationOverlay = document.createElement('div');
        calibrationOverlay.id = 'eyetrack-calibration-overlay';
        calibrationOverlay.innerHTML = `
            <div class="calibration-content">
                <h2>Eye Tracking Calibration</h2>
                <p>Click each dot while looking directly at it. Click each dot 5 times.</p>
                <div class="calibration-points">
                    ${generateCalibrationPoints()}
                </div>
                <div class="calibration-progress">
                    <div class="progress-bar"><div class="progress-fill" id="cal-progress"></div></div>
                    <span id="cal-progress-text">0 / 9 points</span>
                </div>
                <button id="cal-close">Cancel</button>
            </div>
        `;
        document.body.appendChild(calibrationOverlay);
        
        // Bind events
        document.getElementById('cal-close')?.addEventListener('click', closeCalibration);
        
        let pointClicks = {};
        let calibratedPoints = 0;
        
        calibrationOverlay.querySelectorAll('.cal-point').forEach(point => {
            point.addEventListener('click', function() {
                const id = this.dataset.id;
                pointClicks[id] = (pointClicks[id] || 0) + 1;
                
                // Record with WebGazer
                if (typeof webgazer !== 'undefined') {
                    const rect = this.getBoundingClientRect();
                    webgazer.recordScreenPosition(rect.left + 20, rect.top + 20);
                }
                
                if (pointClicks[id] >= 5) {
                    this.classList.add('completed');
                    calibratedPoints++;
                    updateCalibrationProgress(calibratedPoints);
                    
                    if (calibratedPoints >= 9) {
                        completeCalibration();
                    }
                }
            });
        });
    }
    
    /**
     * Generate calibration point HTML
     */
    function generateCalibrationPoints() {
        const positions = [
            { x: 10, y: 10 }, { x: 50, y: 10 }, { x: 90, y: 10 },
            { x: 10, y: 50 }, { x: 50, y: 50 }, { x: 90, y: 50 },
            { x: 10, y: 90 }, { x: 50, y: 90 }, { x: 90, y: 90 }
        ];
        
        return positions.map((pos, i) => 
            `<div class="cal-point" data-id="${i}" style="left: ${pos.x}%; top: ${pos.y}%;"></div>`
        ).join('');
    }
    
    /**
     * Update calibration progress
     */
    function updateCalibrationProgress(count) {
        const progressFill = document.getElementById('cal-progress');
        const progressText = document.getElementById('cal-progress-text');
        
        if (progressFill) progressFill.style.width = `${(count / 9) * 100}%`;
        if (progressText) progressText.textContent = `${count} / 9 points`;
    }
    
    /**
     * Complete calibration
     */
    function completeCalibration() {
        chrome.storage.local.set({ webgazerCalibrated: true });
        showNotification('Calibration complete!');
        
        setTimeout(() => {
            closeCalibration();
        }, 1000);
    }
    
    /**
     * Close calibration overlay
     */
    function closeCalibration() {
        isCalibrating = false;
        if (calibrationOverlay) {
            calibrationOverlay.remove();
            calibrationOverlay = null;
        }
    }
    
    /**
     * Hide WebGazer UI elements
     */
    function hideWebGazerElements() {
        const ids = ['webgazerVideoFeed', 'webgazerFaceOverlay', 'webgazerFaceFeedbackBox', 'webgazerGazeDot'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }
    
    /**
     * Show notification toast
     */
    function showNotification(message) {
        const toast = document.createElement('div');
        toast.className = 'eyetrack-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
