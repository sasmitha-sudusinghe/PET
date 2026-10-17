const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('jarvisDesktop', Object.freeze({
  setExpanded: value => ipcRenderer.invoke('notch:expand', value),
  getSettings: () => ipcRenderer.invoke('notch:settings'),
  setStartAtLogin: value => ipcRenderer.invoke('notch:startup', value),
  openWebsite: value => ipcRenderer.invoke('notch:website', value),
  getAIModels: () => ipcRenderer.invoke('notch:ai-models'),
  setAIModel: value => ipcRenderer.invoke('notch:ai-model', value),
  askAI: text => ipcRenderer.invoke('notch:ai-chat', text),
  listen: () => ipcRenderer.invoke('notch:listen'),
  cancelListening: () => ipcRenderer.invoke('notch:cancel-listening'),
  quit: () => ipcRenderer.invoke('notch:quit'),
  onExpanded: callback => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('notch:expanded', handler);
    return () => ipcRenderer.removeListener('notch:expanded', handler);
  }
}));
