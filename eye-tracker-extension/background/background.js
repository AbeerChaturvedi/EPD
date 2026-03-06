/**
 * EyeTrack Reader Extension - Background Service Worker
 */

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Set default settings
        chrome.storage.sync.set({
            eyeTrackerSettings: {
                isActive: false,
                autoScroll: true,
                showGaze: false,
                scrollSpeed: 5,
                sensitivity: 20
            }
        });
        
        // Open welcome page
        chrome.tabs.create({
            url: 'https://eyetrackreader.vercel.app/?installed=true'
        });
    }
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'getSettings':
            chrome.storage.sync.get('eyeTrackerSettings', (result) => {
                sendResponse(result.eyeTrackerSettings || {});
            });
            return true;
            
        case 'saveSettings':
            chrome.storage.sync.set({ eyeTrackerSettings: message.settings }, () => {
                sendResponse({ success: true });
            });
            return true;
            
        case 'injectWebGazer':
            // Inject WebGazer into the active tab
            if (sender.tab?.id) {
                chrome.scripting.executeScript({
                    target: { tabId: sender.tab.id },
                    files: ['lib/webgazer.min.js']
                });
            }
            sendResponse({ success: true });
            return true;
    }
});

// Handle tab updates to potentially inject content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Skip chrome:// and extension pages
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
            return;
        }
        
        // Inject content script if needed
        chrome.storage.sync.get('eyeTrackerSettings', (result) => {
            if (result.eyeTrackerSettings?.isActive) {
                chrome.scripting.executeScript({
                    target: { tabId },
                    files: ['content/content.js']
                }).catch(() => {
                    // Ignore errors for restricted pages
                });
            }
        });
    }
});
