const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktopApp: true,
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  silentPrint: (payload) => ipcRenderer.invoke('silent-print', payload)
});
