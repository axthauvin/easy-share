const { contextBridge, ipcRenderer } = require('electron');

// Minimal bridge for the desktop app; the web UI also runs in plain browsers
// (phones), where window.easyShareDesktop is simply undefined.
contextBridge.exposeInMainWorld('easyShareDesktop', {
  onDownloadDone(callback) {
    ipcRenderer.on('download-done', (_event, info) => callback(info));
  },
  showInFolder(filePath) {
    ipcRenderer.send('show-in-folder', filePath);
  }
});
