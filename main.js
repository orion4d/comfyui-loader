// main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('node:fs'); // Pour existsSync (synchrone)
const fsPromises = require('node:fs/promises'); // Pour les opérations asynchrones
const axios = require('axios');

console.log("[MAIN.JS] Début du script main.js.");

let mainWindow;
const WORKFLOWS_SUBFOLDER = 'workflows';
const CONFIGS_SUBFOLDER = 'config_user';
const SUPPORTED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.bmp'];

function createWindow() {
    console.log("[MAIN.JS] LOG 1: Début de createWindow()");

    try {
        mainWindow = new BrowserWindow({
            width: 850,
            height: 950,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'), // Assurez-vous que preload.js existe
                contextIsolation: true,
                nodeIntegration: false
            }
        });
        console.log("[MAIN.JS] LOG 2: BrowserWindow créé.");

        // Optionnel : Ouvrir les outils de dev immédiatement pour voir les erreurs de chargement de la page renderer
        // mainWindow.webContents.openDevTools();

        mainWindow.loadFile('index.html'); // Assurez-vous que index.html existe à la racine
        console.log("[MAIN.JS] LOG 3: mainWindow.loadFile('index.html') appelé.");

        mainWindow.on('closed', () => {
            console.log("[MAIN.JS] Fenêtre principale fermée.");
            mainWindow = null;
        });

    } catch (e) {
        console.error("[MAIN.JS] ERREUR FATALE DANS createWindow():", e);
    }
    console.log("[MAIN.JS] LOG 4: Fin de createWindow()");
}

// Vérification de l'existence des fichiers clés
try {
    console.log("[MAIN.JS] Vérification de l'existence de index.html:", fs.existsSync(path.join(__dirname, 'index.html')));
    console.log("[MAIN.JS] Vérification de l'existence de preload.js:", fs.existsSync(path.join(__dirname, 'preload.js')));
} catch(e) {
    console.error("[MAIN.JS] Erreur lors de la vérification de l'existence des fichiers:", e);
}


app.whenReady().then(() => {
    console.log("[MAIN.JS] LOG 5: app.whenReady() - Appel de createWindow()");
    createWindow();

    app.on('activate', function () {
        console.log("[MAIN.JS] LOG 6: Événement 'activate'");
        if (BrowserWindow.getAllWindows().length === 0) {
            console.log("[MAIN.JS] 'activate' - Aucune fenêtre, appel de createWindow()");
            createWindow();
        }
    });
}).catch(err => {
    console.error("[MAIN.JS] Erreur dans app.whenReady():", err);
});

app.on('window-all-closed', () => {
    console.log("[MAIN.JS] LOG 7: Événement 'window-all-closed'");
    if (process.platform !== 'darwin') {
        console.log("[MAIN.JS] 'window-all-closed' - Quitting app (not macOS)");
        app.quit();
    }
});

// --- Handlers IPC ---
console.log("[MAIN.JS] Configuration des handlers IPC...");

ipcMain.handle('dialog:openFile', async (event, dialogOptions) => {
    console.log("[MAIN.JS] IPC 'dialog:openFile' appelé avec options:", dialogOptions);
    try {
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: dialogOptions.filters || [{ name: 'All Files', extensions: ['*'] }]
        });
        if (canceled || !filePaths || filePaths.length === 0) {
            console.log("[MAIN.JS] Sélection de fichier annulée.");
            return null;
        }
        const filePath = filePaths[0];
        console.log("[MAIN.JS] Fichier sélectionné:", filePath);
        if (dialogOptions.readFileContent && dialogOptions.filters && dialogOptions.filters.some(f => f.extensions.includes('json'))) {
            const content = await fsPromises.readFile(filePath, 'utf-8');
            console.log("[MAIN.JS] Contenu du fichier JSON lu.");
            return { filePath, content };
        } else {
            return { filePath };
        }
    } catch (error) {
        console.error("[MAIN.JS] Erreur dans 'dialog:openFile':", error);
        return { error: "Erreur lors de la sélection/lecture du fichier: " + error.message };
    }
});

ipcMain.handle('dialog:openDirectory', async () => {
    console.log("[MAIN.JS] IPC 'dialog:openDirectory' appelé.");
    try {
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });
        if (canceled || !filePaths || filePaths.length === 0) {
            console.log("[MAIN.JS] Sélection de dossier annulée.");
            return null;
        }
        console.log("[MAIN.JS] Dossier sélectionné:", filePaths[0]);
        return filePaths[0];
    } catch (error) {
        console.error("[MAIN.JS] Erreur dans 'dialog:openDirectory':", error);
        return null; // Ou retourner un objet erreur
    }
});

ipcMain.handle('images:readDirectory', async (event, folderPath) => {
    console.log("[MAIN.JS] IPC 'images:readDirectory' appelé pour dossier:", folderPath);
    try {
        const files = await fsPromises.readdir(folderPath);
        const imageFiles = files
            .filter(file => SUPPORTED_IMAGE_EXTENSIONS.includes(path.extname(file).toLowerCase()))
            .map(file => path.join(folderPath, file).replace(/\\/g, '/'));
        console.log(`[MAIN.JS] ${imageFiles.length} images trouvées dans ${folderPath}`);
        return { success: true, imagePaths: imageFiles };
    } catch (error) {
        console.error(`[MAIN.JS] Erreur lecture dossier d'images ${folderPath}:`, error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('workflows:getList', async () => {
    console.log("[MAIN.JS] IPC 'workflows:getList' appelé.");
    const workflowsDir = path.join(app.getAppPath(), WORKFLOWS_SUBFOLDER);
    try {
        if (!fs.existsSync(workflowsDir)) {
            await fsPromises.mkdir(workflowsDir, { recursive: true });
            console.log(`[MAIN.JS] Dossier des workflows créé : ${workflowsDir}`);
            return [];
        }
        const files = await fsPromises.readdir(workflowsDir);
        const jsonFiles = files
            .filter(file => file.toLowerCase().endsWith('.json'))
            .map(file => ({ name: file, path: path.join(workflowsDir, file) }));
        console.log("[MAIN.JS] Workflows locaux listés:", jsonFiles.length);
        return jsonFiles;
    } catch (error) {
        console.error("[MAIN.JS] Erreur lors de la lecture du dossier des workflows:", error);
        return { error: error.message };
    }
});

ipcMain.handle('workflows:loadFileContent', async (event, filePath) => {
    console.log("[MAIN.JS] IPC 'workflows:loadFileContent' appelé pour:", filePath);
    try {
        const resolvedAppPath = path.resolve(app.getAppPath());
        const resolvedFilePath = path.resolve(filePath);
        if (!resolvedFilePath.startsWith(path.join(resolvedAppPath, WORKFLOWS_SUBFOLDER))) {
             console.error("[MAIN.JS] Tentative d'accès non autorisé au fichier workflow:", filePath);
             return { success: false, error: "Accès non autorisé au fichier." };
        }
        const content = await fsPromises.readFile(filePath, 'utf-8');
        return { success: true, content };
    } catch (error) {
        console.error(`[MAIN.JS] Erreur de lecture du fichier workflow ${filePath}:`, error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('configs:getList', async () => { /* ... (similaire à workflows:getList, avec CONFIGS_SUBFOLDER) ... */
    console.log("[MAIN.JS] IPC 'configs:getList' appelé.");
    const configsDir = path.join(app.getAppPath(), CONFIGS_SUBFOLDER);
    try {
        if (!fs.existsSync(configsDir)) {
            await fsPromises.mkdir(configsDir, { recursive: true });
            return [];
        }
        const files = await fsPromises.readdir(configsDir);
        const jsonFiles = files.filter(f => f.toLowerCase().endsWith('.json')).map(f => ({ name: f, path: path.join(configsDir, f)}));
        return jsonFiles;
    } catch (e) { console.error("[MAIN.JS] Erreur listage configs:", e); return {error: e.message}; }
});

ipcMain.handle('configs:loadFileContent', async (event, filePath) => { /* ... (similaire à workflows:loadFileContent) ... */
    console.log("[MAIN.JS] IPC 'configs:loadFileContent' appelé pour:", filePath);
    try {
        const resolvedAppPath = path.resolve(app.getAppPath());
        const resolvedFilePath = path.resolve(filePath);
        if (!resolvedFilePath.startsWith(path.join(resolvedAppPath, CONFIGS_SUBFOLDER))) {
             return { success: false, error: "Accès non autorisé au fichier config." };
        }
        const content = await fsPromises.readFile(filePath, 'utf-8');
        return { success: true, content };
    } catch (e) { console.error("[MAIN.JS] Erreur lecture config:", e); return {success: false, error: e.message};}
});

ipcMain.handle('config:save', async (event, configString) => { /* ... (comme avant) ... */
    console.log("[MAIN.JS] IPC 'config:save' appelé.");
    const configsDir = path.join(app.getAppPath(), CONFIGS_SUBFOLDER);
     if (!fs.existsSync(configsDir)) {
        try { await fsPromises.mkdir(configsDir, { recursive: true }); }
        catch (e) { console.error("[MAIN.JS] Erreur création dossier config_user:", e); }
    }
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Sauvegarder la Configuration', defaultPath: path.join(configsDir, 'app-settings.json'),
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
    if (canceled || !filePath) return { success: false, error: 'Sauvegarde annulée' };
    try {
        await fsPromises.writeFile(filePath, configString, 'utf-8');
        return { success: true, filePath };
    } catch (error) { return { success: false, error: error.message }; }
});

ipcMain.handle('comfy:runWorkflow', async (event, { comfyapiUrl, workflowJsonString, batchInfo }) => {
    const clientIdSuffix = batchInfo ? `batch_${batchInfo.imageName}_${Date.now()}` : `single_${Date.now()}`;
    console.log(`[MAIN.JS] IPC 'comfy:runWorkflow'. Client Suffix: ${clientIdSuffix}`);

    if (!comfyapiUrl || !workflowJsonString) {
        console.error("[MAIN.JS] runWorkflow: URL API ou données workflow manquantes.");
        return { success: false, error: "URL API ComfyUI ou données workflow manquantes." };
    }
    try {
        const workflowData = JSON.parse(workflowJsonString);
        const payload = { prompt: workflowData, client_id: `electron_adv_app_${clientIdSuffix}` };
        
        console.log(`[MAIN.JS] Envoi payload pour ${batchInfo ? batchInfo.imageName : 'single run'}.`);
        // Log des injections (si les clés existent)
        const logIfExists = (obj, pathKeys, label) => {
            let current = obj;
            for (const key of pathKeys) {
                if (current && typeof current === 'object' && current.hasOwnProperty(key)) {
                    current = current[key];
                } else { return; /* Clé non trouvée, ne rien logger */ }
            }
            console.log(`  ${label}:`, String(current).substring(0,70) + (String(current).length > 70 ? "..." : ""));
        };
        logIfExists(payload, ['prompt', batchInfo?.promptNodeId || '19', 'inputs', batchInfo?.promptInputName || 'text'], 'Prompt');
        logIfExists(payload, ['prompt', batchInfo?.imageNodeId || '10', 'inputs', batchInfo?.imageInputName || 'image'], 'Image');
        logIfExists(payload, ['prompt', batchInfo?.seedNodeId || '37', 'inputs', batchInfo?.seedInputName || 'seed'], 'Seed');

        const response = await axios.post(`${comfyapiUrl}/prompt`, payload, { headers: { 'Content-Type': 'application/json' }});
        console.log(`[MAIN.JS] Réponse ComfyUI pour ${batchInfo ? batchInfo.imageName : 'single run'}:`, response.data.prompt_id);
        return { success: true, data: response.data, imageName: batchInfo ? batchInfo.imageName : null };
    } catch (error) {
        let errorMessage = `Erreur inattendue: ${error.message}`;
        if (error.isAxiosError) {
            errorMessage = `Erreur ComfyUI: ${error.response?.status || 'N/A'} - ${JSON.stringify(error.response?.data) || error.message}`;
            console.error("[MAIN.JS] Erreur Axios (ComfyUI):", error.message, error.response?.data);
        } else if (error instanceof SyntaxError) {
             errorMessage = "Erreur de parsing du JSON du workflow: " + error.message;
             console.error("[MAIN.JS] Erreur parsing JSON workflow:", error);
        } else {
            console.error("[MAIN.JS] Erreur inattendue (runWorkflow):", error);
        }
        return { success: false, error: errorMessage };
    }
});

console.log("[MAIN.JS] Fin de l'initialisation de main.js, handlers IPC configurés.");