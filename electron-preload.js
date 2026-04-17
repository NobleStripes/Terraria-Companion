// Preload script for Electron
// This runs in a secure context between the main process and renderer process

const { contextBridge } = require('electron');

// Safely expose APIs to the renderer process
contextBridge.exposeInMainWorld('electron', {
  // You can add custom APIs here if needed
  isElectron: true,
  appVersion: require('electron').app.getVersion?.() || '1.0.0',
});