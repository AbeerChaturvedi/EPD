# EyeTrack Reader

A revolutionary eye-tracking web application that automatically scrolls pages as you read. Read hands-free with your eyes!

## 🌟 Features

- **Eye Tracking** - Webcam-based gaze detection using WebGazer.js
- **Auto-Scroll** - Pages scroll automatically when your eyes reach the bottom
- **PDF Support** - Upload and read PDF documents
- **Browser Extension** - Enable eye tracking on any website
- **Customizable** - Adjust scroll speed, sensitivity, and themes

## 🚀 Quick Start

### Web App

1. Open `index.html` in a web browser (use a local server for best results)
2. Click "Start Reading" to begin calibration
3. Allow camera access when prompted
4. Complete the 9-point calibration
5. Upload a PDF or paste text to start reading

### Local Development

```bash
# Navigate to the web app directory
cd eye-tracker-reader

# Start a local server
npx serve .

# Or use Python
python -m http.server 8000
```

Then open `http://localhost:3000` (or `http://localhost:8000`) in your browser.

### Browser Extension

1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `eye-tracker-extension` folder
5. The extension icon will appear in your toolbar

## 📁 Project Structure

```
EPD/
├── eye-tracker-reader/         # Web Application
│   ├── index.html              # Landing page
│   ├── calibration.html        # Calibration flow
│   ├── reader.html             # PDF/text reader
│   ├── css/                    # Stylesheets
│   └── js/                     # JavaScript modules
│
└── eye-tracker-extension/      # Chrome Extension
    ├── manifest.json           # Extension manifest
    ├── popup/                  # Popup UI
    ├── content/                # Content script
    └── background/             # Service worker
```

## 🔧 Technologies

- **WebGazer.js** - Eye tracking library
- **PDF.js** - PDF rendering
- **Chrome Extension API** - Browser extension
- **Vanilla JS/CSS** - No framework dependencies

## ⚙️ Settings

- **Scroll Speed** - Control how fast pages scroll
- **Sensitivity** - Size of the trigger zone at bottom of screen
- **Show Gaze** - Display where you're looking
- **Theme** - Dark or light mode

## 📝 Notes

- Works best with good lighting
- Position yourself so your face is clearly visible
- Calibration improves accuracy significantly
- Camera data is processed locally (not uploaded)

## 🎯 Calibration Tips

1. Sit at a comfortable distance from the screen
2. Look directly at each calibration dot when clicking
3. Keep your head relatively still during calibration
4. Recalibrate if accuracy decreases over time

## 📄 License

Open source - free to use and modify.
