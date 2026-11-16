const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getAppState: () => ipcRenderer.invoke('get-app-state'),
  setWidgetMode: (enabled) => ipcRenderer.send('set-widget-mode', enabled),
  setWidgetView: (viewType) => ipcRenderer.send('set-widget-view', viewType),
  setWidgetOpacity: (opacity) => ipcRenderer.send('set-widget-opacity', opacity),
  setLocked: (locked) => ipcRenderer.send('set-locked', locked),
  setAlwaysOnBottom: (bottom) => ipcRenderer.send('set-always-on-bottom', bottom),
  setAutoStart: (enabled) => ipcRenderer.send('set-auto-start', enabled),
  minimizeToTray: () => ipcRenderer.send('minimize-to-tray'),
  closeApp: () => ipcRenderer.send('close-app'),

  onWidgetModeChanged: (callback) => {
    const handler = (_event, val) => callback(val);
    ipcRenderer.on('widget-mode-changed', handler);
    return () => ipcRenderer.removeListener('widget-mode-changed', handler);
  },
  onWidgetViewChanged: (callback) => {
    const handler = (_event, val) => callback(val);
    ipcRenderer.on('widget-view-changed', handler);
    return () => ipcRenderer.removeListener('widget-view-changed', handler);
  },
  onLockedChanged: (callback) => {
    const handler = (_event, val) => callback(val);
    ipcRenderer.on('locked-changed', handler);
    return () => ipcRenderer.removeListener('locked-changed', handler);
  },
  onAlwaysOnBottomChanged: (callback) => {
    const handler = (_event, val) => callback(val);
    ipcRenderer.on('always-on-bottom-changed', handler);
    return () => ipcRenderer.removeListener('always-on-bottom-changed', handler);
  },
  onAutoStartChanged: (callback) => {
    const handler = (_event, val) => callback(val);
    ipcRenderer.on('auto-start-changed', handler);
    return () => ipcRenderer.removeListener('auto-start-changed', handler);
  }
});

