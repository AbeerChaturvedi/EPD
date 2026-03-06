/**
 * EyeTrack Reader Extension - Popup Controller
 */

class PopupController {
    constructor() {
        this.elements = {
            statusCard: document.getElementById('status-card'),
            statusText: document.getElementById('status-text'),
            powerBtn: document.getElementById('power-btn'),
            calibrationValue: document.getElementById('calibration-value'),
            calibrateBtn: document.getElementById('calibrate-btn'),
            toggleAutoScroll: document.getElementById('toggle-autoscroll'),
            toggleGaze: document.getElementById('toggle-gaze'),
            scrollSpeed: document.getElementById('scroll-speed'),
            speedValue: document.getElementById('speed-value'),
            sensitivity: document.getElementById('sensitivity'),
            sensitivityValue: document.getElementById('sensitivity-value'),
            openWebapp: document.getElementById('open-webapp'),
            openHelp: document.getElementById('open-help')
        };
        
        this.settings = {
            isActive: false,
            autoScroll: true,
            showGaze: false,
            scrollSpeed: 5,
            sensitivity: 20
        };
        
        this.init();
    }
    
    async init() {
        await this.loadSettings();
        this.applySettings();
        this.checkCalibration();
        this.bindEvents();
        await this.getActiveTabStatus();
    }
    
    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get('eyeTrackerSettings');
            if (result.eyeTrackerSettings) {
                this.settings = { ...this.settings, ...result.eyeTrackerSettings };
            }
        } catch (error) {
            console.log('Using default settings');
        }
    }
    
    async saveSettings() {
        try {
            await chrome.storage.sync.set({ eyeTrackerSettings: this.settings });
            // Notify content script
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
                chrome.tabs.sendMessage(tab.id, { 
                    action: 'updateSettings', 
                    settings: this.settings 
                });
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }
    
    applySettings() {
        // Toggle states
        this.elements.toggleAutoScroll?.classList.toggle('active', this.settings.autoScroll);
        this.elements.toggleGaze?.classList.toggle('active', this.settings.showGaze);
        
        // Sliders
        if (this.elements.scrollSpeed) {
            this.elements.scrollSpeed.value = this.settings.scrollSpeed;
            this.elements.speedValue.textContent = this.settings.scrollSpeed;
        }
        
        if (this.elements.sensitivity) {
            this.elements.sensitivity.value = this.settings.sensitivity;
            this.elements.sensitivityValue.textContent = `${this.settings.sensitivity}%`;
        }
        
        // Status
        this.updateStatus(this.settings.isActive);
    }
    
    async checkCalibration() {
        try {
            const result = await chrome.storage.local.get('webgazerCalibrated');
            if (result.webgazerCalibrated) {
                this.elements.calibrationValue.textContent = 'Ready';
                this.elements.calibrationValue.classList.add('calibrated');
            } else {
                this.elements.calibrationValue.textContent = 'Not calibrated';
                this.elements.calibrationValue.classList.remove('calibrated');
            }
        } catch (error) {
            console.log('Calibration check failed');
        }
    }
    
    async getActiveTabStatus() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
                const response = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
                if (response) {
                    this.settings.isActive = response.isActive;
                    this.updateStatus(response.isActive);
                }
            }
        } catch (error) {
            // Content script not loaded on this page
            console.log('Content script not available on this page');
        }
    }
    
    updateStatus(isActive) {
        this.elements.statusCard?.classList.toggle('active', isActive);
        this.elements.statusText.textContent = isActive ? 'Active' : 'Off';
    }
    
    bindEvents() {
        // Power button
        this.elements.powerBtn?.addEventListener('click', async () => {
            await this.toggleTracking();
        });
        
        // Calibrate button
        this.elements.calibrateBtn?.addEventListener('click', async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
                chrome.tabs.sendMessage(tab.id, { action: 'startCalibration' });
                window.close();
            }
        });
        
        // Toggle auto-scroll
        this.elements.toggleAutoScroll?.addEventListener('click', () => {
            this.settings.autoScroll = !this.settings.autoScroll;
            this.elements.toggleAutoScroll.classList.toggle('active', this.settings.autoScroll);
            this.saveSettings();
        });
        
        // Toggle gaze
        this.elements.toggleGaze?.addEventListener('click', () => {
            this.settings.showGaze = !this.settings.showGaze;
            this.elements.toggleGaze.classList.toggle('active', this.settings.showGaze);
            this.saveSettings();
        });
        
        // Scroll speed slider
        this.elements.scrollSpeed?.addEventListener('input', (e) => {
            this.settings.scrollSpeed = parseInt(e.target.value);
            this.elements.speedValue.textContent = this.settings.scrollSpeed;
            this.saveSettings();
        });
        
        // Sensitivity slider
        this.elements.sensitivity?.addEventListener('input', (e) => {
            this.settings.sensitivity = parseInt(e.target.value);
            this.elements.sensitivityValue.textContent = `${this.settings.sensitivity}%`;
            this.saveSettings();
        });
        
        // Open web app
        this.elements.openWebapp?.addEventListener('click', (e) => {
            e.preventDefault();
            // Open the hosted web app URL
            chrome.tabs.create({ url: 'https://eyetrackreader.vercel.app' });
        });
        
        // Help link
        this.elements.openHelp?.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: 'https://eyetrackreader.vercel.app/#how-it-works' });
        });
    }
    
    async toggleTracking() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
                const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggleTracking' });
                if (response) {
                    this.settings.isActive = response.isActive;
                    this.updateStatus(response.isActive);
                    this.saveSettings();
                }
            }
        } catch (error) {
            console.error('Failed to toggle tracking:', error);
            // Show error in popup
            this.elements.statusText.textContent = 'Not available';
        }
    }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});
