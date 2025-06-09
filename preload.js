// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Pour workflows chargés via dialogue "Ouvrir" et pour sélection d'images/dossiers
    selectFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
    selectDirectory: () => ipcRenderer.invoke('dialog:openDirectory'), // NOUVEAU
    
    // Pour workflows locaux listés dans le menu déroulant
    listWorkflows: () => ipcRenderer.invoke('workflows:getList'),
    loadWorkflowContent: (filePath) => ipcRenderer.invoke('workflows:loadFileContent', filePath),

    // Pour la configuration de l'app via menu déroulant et bouton "Exporter"
    listConfigs: () => ipcRenderer.invoke('configs:getList'),
    loadConfigContent: (filePath) => ipcRenderer.invoke('configs:loadFileContent', filePath),
    saveConfig: (configString) => ipcRenderer.invoke('config:save', configString),

    // Pour exécuter sur ComfyUI
    runWorkflow: (comfyapiUrl, workflowJsonString) => ipcRenderer.invoke('comfy:runWorkflow', { comfyapiUrl, workflowJsonString }),

    // NOUVEAU: Pour lire le contenu d'un dossier (liste des fichiers image)
    readImageDirectory: (folderPath) => ipcRenderer.invoke('images:readDirectory', folderPath)
});