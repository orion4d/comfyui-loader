// renderer.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("[RENDERER.JS] DOMContentLoaded - Initialisation du script renderer.");

    // --- SECTION 1: Sélection des éléments DOM ---
    const comfyUrlInput = document.getElementById('comfyUrl');
    const savedConfigsSelect = document.getElementById('savedConfigs');
    const saveConfigBtn = document.getElementById('saveConfigBtn');

    const savedWorkflowsSelect = document.getElementById('savedWorkflows');
    const selectWorkflowBtn = document.getElementById('selectWorkflowBtn');
    const workflowPathDisplay = document.getElementById('workflowPath');
    const workflowJsonEditor = document.getElementById('workflowJsonEditor');

    const promptTextInput = document.getElementById('promptText');
    const promptNodeIdInput = document.getElementById('promptNodeId');
    const promptInputNameInput = document.getElementById('promptInputName');

    const selectImageBtn = document.getElementById('selectImageBtn');
    const imagePathDisplay = document.getElementById('imagePath');
    const imageNodeIdInput = document.getElementById('imageNodeId');
    const imageInputNameInput = document.getElementById('imageInputName');
    const selectImageFolderBtn = document.getElementById('selectImageFolderBtn');
    const imageFolderPathDisplay = document.getElementById('imageFolderPath');

    const seedValueInput = document.getElementById('seedValue');
    const randomSeedBtn = document.getElementById('randomSeedBtn');
    const seedNodeIdInput = document.getElementById('seedNodeId');
    const seedInputNameInput = document.getElementById('seedInputName');
    const incrementSeedBatchCheckbox = document.getElementById('incrementSeedBatch');

    const runWorkflowBtn = document.getElementById('runWorkflowBtn');
    const statusDiv = document.getElementById('status');

    // Variables d'état
    let currentWorkflowObject = null;
    let selectedImagePath = null;
    let selectedImageFolderPath = null;

    // --- SECTION 2: Définition de TOUTES les fonctions ---

    function collectConfig() {
        console.time("collectConfigExecution");
        const config = {
            comfyUrl: comfyUrlInput.value,
            promptNodeId: promptNodeIdInput.value,
            promptInputName: promptInputNameInput.value,
            imageNodeId: imageNodeIdInput.value,
            imageInputName: imageInputNameInput.value,
            seedNodeId: seedNodeIdInput.value,
            seedInputName: seedInputNameInput.value
        };
        console.timeEnd("collectConfigExecution");
        return config;
    }

    function applyConfig(config) {
        console.time("applyConfigDOMUpdates");
        const cfg = config || {};
        if(comfyUrlInput) comfyUrlInput.value = cfg.comfyUrl || "http://127.0.0.1:8188";
        if(promptNodeIdInput) promptNodeIdInput.value = cfg.promptNodeId || "";
        if(promptInputNameInput) promptInputNameInput.value = cfg.promptInputName || "text";
        if(imageNodeIdInput) imageNodeIdInput.value = cfg.imageNodeId || "";
        if(imageInputNameInput) imageInputNameInput.value = cfg.imageInputName || "image";
        if(seedNodeIdInput) seedNodeIdInput.value = cfg.seedNodeId || "";
        if(seedInputNameInput) seedInputNameInput.value = cfg.seedInputName || "seed";
        console.log("[RENDERER.JS] Configuration appliquée:", cfg);
        console.timeEnd("applyConfigDOMUpdates");
    }

    async function populateConfigList() {
        console.time("populateConfigListExecution");
        console.log("[RENDERER.JS] Tentative de peuplement de la liste des configs.");
        if (!savedConfigsSelect) {
            console.error("[RENDERER.JS] populateConfigList: savedConfigsSelect est null!");
            console.timeEnd("populateConfigListExecution");
            return;
        }
        const result = await window.electronAPI.listConfigs();
        if (result && !result.error && Array.isArray(result)) {
            const currentSelectedPath = savedConfigsSelect.value;
            savedConfigsSelect.innerHTML = '<option value="">-- Aucune configuration --</option>';
            result.forEach(conf => {
                const option = document.createElement('option');
                option.value = conf.path;
                option.textContent = conf.name;
                savedConfigsSelect.appendChild(option);
            });
            if (Array.from(savedConfigsSelect.options).some(opt => opt.value === currentSelectedPath)) {
                savedConfigsSelect.value = currentSelectedPath;
            }
        } else if (result && result.error) {
            console.error("[RENDERER.JS] Erreur listage configurations locales:", result.error);
        }
        console.timeEnd("populateConfigListExecution");
    }

    async function loadSelectedConfig(filePath) {
        console.time("loadSelectedConfigExecution");
        if (!filePath) {
            applyConfig(null);
            console.log("[RENDERER.JS] Aucune configuration sélectionnée, application des valeurs par défaut.");
            console.timeEnd("loadSelectedConfigExecution");
            return;
        }
        console.log("[RENDERER.JS] Chargement de la config:", filePath);
        const result = await window.electronAPI.loadConfigContent(filePath);
        if (result && result.success) {
            try {
                const config = JSON.parse(result.content);
                applyConfig(config);
                const fileName = filePath.substring(filePath.lastIndexOf(filePath.includes('/') ? '/' : '\\') + 1);
                if(statusDiv) statusDiv.textContent = `Configuration '${fileName}' chargée.`;
                // alert(`Configuration '${fileName}' chargée !`); // Peut-être trop intrusif
            } catch (e) {
                if(statusDiv) statusDiv.textContent = 'Erreur: Fichier de configuration JSON invalide.';
                console.error("[RENDERER.JS] Erreur parsing config JSON:", e);
            }
        } else if (result && result.error) {
            if(statusDiv) statusDiv.textContent = 'Erreur chargement contenu configuration: ' + result.error;
        }
        console.timeEnd("loadSelectedConfigExecution");
    }

    async function populateWorkflowList() {
        console.time("populateWorkflowListExecution");
        if (!savedWorkflowsSelect) {
            console.error("[RENDERER.JS] populateWorkflowList: savedWorkflowsSelect est null!");
            console.timeEnd("populateWorkflowListExecution");
            return;
        }
        console.log("[RENDERER.JS] Tentative de peuplement de la liste des workflows.");
        const result = await window.electronAPI.listWorkflows();
        if (result && !result.error && Array.isArray(result)) {
            const currentSelectedPath = savedWorkflowsSelect.value;
            savedWorkflowsSelect.innerHTML = '<option value="">-- Choisir un workflow du dossier \'workflows\' --</option>';
            result.forEach(wf => {
                const option = document.createElement('option');
                option.value = wf.path;
                option.textContent = wf.name;
                savedWorkflowsSelect.appendChild(option);
            });
            if (Array.from(savedWorkflowsSelect.options).some(opt => opt.value === currentSelectedPath)) {
                savedWorkflowsSelect.value = currentSelectedPath;
            }
        } else if (result && result.error) {
            console.error("[RENDERER.JS] Erreur listage workflows locaux:", result.error);
        }
        console.timeEnd("populateWorkflowListExecution");
    }

    async function loadWorkflowFromPath(filePath, source = "liste") {
        console.time("loadWorkflowFromPathExecution");
        if (!filePath) {
            if(workflowPathDisplay) workflowPathDisplay.textContent = "Aucun workflow chargé.";
            if(workflowJsonEditor) workflowJsonEditor.value = "";
            currentWorkflowObject = null;
            if (runWorkflowBtn) runWorkflowBtn.disabled = true;
            console.timeEnd("loadWorkflowFromPathExecution");
            return;
        }
        console.log(`[RENDERER.JS] Chargement du workflow depuis ${source}:`, filePath);
        const result = await window.electronAPI.loadWorkflowContent(filePath);
        if (result && result.success) {
            const fileName = filePath.substring(filePath.lastIndexOf(filePath.includes('/') ? '/' : '\\') + 1);
            if(workflowPathDisplay) workflowPathDisplay.textContent = `Workflow : ${fileName}`;
            try {
                currentWorkflowObject = JSON.parse(result.content);
                if(workflowJsonEditor) workflowJsonEditor.value = JSON.stringify(currentWorkflowObject, null, 2);
                if (runWorkflowBtn) runWorkflowBtn.disabled = false;
                if(statusDiv) statusDiv.textContent = `Workflow '${fileName}' chargé.`;
            } catch (e) {
                if(workflowPathDisplay) workflowPathDisplay.textContent = `Erreur: Fichier JSON du workflow '${fileName}' invalide.`;
                if(workflowJsonEditor) workflowJsonEditor.value = result.content;
                currentWorkflowObject = null;
                if (runWorkflowBtn) runWorkflowBtn.disabled = true;
                if(statusDiv) statusDiv.textContent = "Erreur de parsing du JSON du workflow sélectionné.";
                console.error("[RENDERER.JS] Erreur parsing JSON du workflow:", e);
            }
        } else if (result && result.error) {
            if(statusDiv) statusDiv.textContent = `Erreur chargement contenu workflow: ${result.error}`;
        }
        console.timeEnd("loadWorkflowFromPathExecution");
    }
    
    async function processSingleWorkflow(workflowObject, imagePathForInjection, seedForInjection, batchInfo) {
        console.time(`processSingleWorkflowExecution_${batchInfo ? batchInfo.imageName : 'single'}`);
        let workflowToSend = JSON.parse(JSON.stringify(workflowObject));

        const promptTextVal = promptTextInput ? promptTextInput.value.trim() : "";
        const promptNodeIdVal = promptNodeIdInput ? promptNodeIdInput.value.trim() : "";
        const promptInputNameVal = promptInputNameInput ? promptInputNameInput.value.trim() : "text";
        
        const imageNodeIdVal = imageNodeIdInput ? imageNodeIdInput.value.trim() : "";
        const imageInputNameVal = imageInputNameInput ? imageInputNameInput.value.trim() : "image";
        
        const seedNodeIdVal = seedNodeIdInput ? seedNodeIdInput.value.trim() : "";
        const seedInputNameVal = seedInputNameInput ? seedInputNameInput.value.trim() : "seed";

        if (promptTextVal && promptNodeIdVal && promptInputNameVal) {
            if (workflowToSend[promptNodeIdVal]?.inputs) workflowToSend[promptNodeIdVal].inputs[promptInputNameVal] = promptTextVal;
        }
        if (imagePathForInjection && imageNodeIdVal && imageInputNameVal) {
            if (workflowToSend[imageNodeIdVal]?.inputs && workflowToSend[imageNodeIdVal].class_type === "LoadImage") {
                workflowToSend[imageNodeIdVal].inputs[imageInputNameVal] = imagePathForInjection;
            } else {
                 console.warn(`[RENDERER.JS] Pour ${batchInfo?.imageName || 'single run'}, Nœud LoadImage (${imageNodeIdVal}) non trouvé/type incorrect pour injection d'image.`);
            }
        }
        if (seedForInjection !== null && seedForInjection !== undefined && seedNodeIdVal && seedInputNameVal) {
            if (workflowToSend[seedNodeIdVal]?.inputs) workflowToSend[seedNodeIdVal].inputs[seedInputNameVal] = seedForInjection;
        }
        
        if (workflowJsonEditor && (!batchInfo || batchInfo.isFirst)) {
            workflowJsonEditor.value = JSON.stringify(workflowToSend, null, 2);
        }
        const comfyapiUrl = comfyUrlInput ? comfyUrlInput.value.trim() : "";
        const result = await window.electronAPI.runWorkflow(comfyapiUrl, JSON.stringify(workflowToSend), batchInfo);
        console.timeEnd(`processSingleWorkflowExecution_${batchInfo ? batchInfo.imageName : 'single'}`);
        return result;
    }

    // --- SECTION 3: Attachement des écouteurs d'événements ---
    if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', async () => {
            console.log("[RENDERER.JS] Clic sur 'Exporter Config Actuelle'.");
            console.time("saveConfigProcess");
            const config = collectConfig();
            const result = await window.electronAPI.saveConfig(JSON.stringify(config, null, 2));
            if (result.success) {
                alert('Configuration de l\'application sauvegardée !');
                const configsDirName = 'config_user'; 
                if (result.filePath && (result.filePath.includes(`/${configsDirName}/`) || result.filePath.includes(`\\${configsDirName}\\`))) {
                    console.time("populateConfigListAfterSave");
                    if(savedConfigsSelect) await populateConfigList();
                    console.timeEnd("populateConfigListAfterSave");
                }
            } else if (result.error && result.error !== 'Sauvegarde de configuration annulée') {
                alert('Erreur sauvegarde configuration: ' + result.error);
            }
            console.timeEnd("saveConfigProcess");
        });
    } else { console.error("[RENDERER.JS] Bouton saveConfigBtn non trouvé !");}

    if(savedConfigsSelect) {
        savedConfigsSelect.addEventListener('change', (event) => {
            if(promptTextInput) promptTextInput.value = ""; 
            if(statusDiv) statusDiv.textContent = "Chargement de la configuration...";
            loadSelectedConfig(event.target.value);
        });
    } else { console.error("[RENDERER.JS] Élément savedConfigsSelect non trouvé !");}
    
    if(savedWorkflowsSelect) {
        savedWorkflowsSelect.addEventListener('change', (event) => {
            if(event.target.value) loadWorkflowFromPath(event.target.value, "la liste locale");
            else loadWorkflowFromPath(null);
        });
    } else { console.error("[RENDERER.JS] Élément savedWorkflowsSelect non trouvé !");}

    if (selectWorkflowBtn) {
        selectWorkflowBtn.addEventListener('click', async () => {
            console.log("[RENDERER.JS] Clic sur 'Charger un Autre Workflow (.json)'.");
            const result = await window.electronAPI.selectFile({
                filters: [{ name: 'ComfyUI Workflows', extensions: ['json'] }],
                readFileContent: true
            });
            if (result && result.filePath && result.content) {
                const fileName = result.filePath.substring(result.filePath.lastIndexOf(result.filePath.includes('/') ? '/' : '\\') + 1);
                if(workflowPathDisplay) workflowPathDisplay.textContent = `Workflow : ${fileName}`;
                try {
                    currentWorkflowObject = JSON.parse(result.content);
                    if(workflowJsonEditor) workflowJsonEditor.value = JSON.stringify(currentWorkflowObject, null, 2);
                    if(runWorkflowBtn) runWorkflowBtn.disabled = false;
                    if(statusDiv) statusDiv.textContent = "Workflow chargé via dialogue.";
                    if(savedWorkflowsSelect) savedWorkflowsSelect.value = "";
                } catch (e) {
                    if(workflowPathDisplay) workflowPathDisplay.textContent = `Erreur: Fichier JSON '${fileName}' invalide.`;
                    if(workflowJsonEditor) workflowJsonEditor.value = result.content;
                    currentWorkflowObject = null;
                    if(runWorkflowBtn) runWorkflowBtn.disabled = true;
                    if(statusDiv) statusDiv.textContent = "Erreur de parsing du JSON du workflow (dialogue).";
                    console.error("[RENDERER.JS] Erreur parsing JSON (dialogue):", e);
                }
            } else if (result && result.error) {
                if(workflowPathDisplay) workflowPathDisplay.textContent = `Erreur : ${result.error}`;
            }
        });
    } else { console.error("[RENDERER.JS] Bouton selectWorkflowBtn non trouvé !"); }

    if(selectImageBtn) {
        selectImageBtn.addEventListener('click', async () => {
            console.log("[RENDERER.JS] Clic sur 'Sélectionner UNE Image d'Entrée'.");
            const result = await window.electronAPI.selectFile({
                filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] }],
                readFileContent: false
            });
            if (result && result.filePath) {
                selectedImagePath = result.filePath.replace(/\\/g, '/');
                const imageName = selectedImagePath.substring(selectedImagePath.lastIndexOf('/') + 1);
                if(imagePathDisplay) imagePathDisplay.textContent = `Image : ${imageName}`;
                if(statusDiv) statusDiv.textContent = "Image d'entrée individuelle sélectionnée.";
                selectedImageFolderPath = null;
                if(imageFolderPathDisplay) imageFolderPathDisplay.textContent = "Aucun dossier (image individuelle prioritaire).";
            } else if (result && result.error) {
                if(imagePathDisplay) imagePathDisplay.textContent = `Erreur image : ${result.error}`;
                selectedImagePath = null;
            } else {
                if(imagePathDisplay) imagePathDisplay.textContent = "Aucune image individuelle sélectionnée.";
                selectedImagePath = null;
            }
        });
    } else { console.error("[RENDERER.JS] Bouton selectImageBtn non trouvé !"); }
    
    if (selectImageFolderBtn) {
        selectImageFolderBtn.addEventListener('click', async () => {
            console.log("[RENDERER.JS] Clic sur 'Sélectionner un DOSSIER d'Images'.");
            const folderPath = await window.electronAPI.selectDirectory();
            if (folderPath) {
                selectedImageFolderPath = folderPath.replace(/\\/g, '/');
                const folderName = selectedImageFolderPath.substring(selectedImageFolderPath.lastIndexOf('/') + 1);
                if(imageFolderPathDisplay) imageFolderPathDisplay.textContent = `Dossier : ${folderName} (${selectedImageFolderPath})`;
                if(statusDiv) statusDiv.textContent = "Dossier d'images pour lot sélectionné.";
                selectedImagePath = null;
                if(imagePathDisplay) imagePathDisplay.textContent = "Aucune image individuelle (dossier prioritaire).";
            }
        });
    } else { console.error("[RENDERER.JS] Bouton selectImageFolderBtn non trouvé !"); }

    if(randomSeedBtn && seedValueInput) {
        randomSeedBtn.addEventListener('click', () => {
            seedValueInput.value = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        });
    } else { console.error("[RENDERER.JS] randomSeedBtn ou seedValueInput non trouvé !"); }

    if(runWorkflowBtn) {
        runWorkflowBtn.addEventListener('click', async () => {
            console.time("runWorkflowTotalExecution");
            console.log("[RENDERER.JS] Clic sur 'Lancer le Workflow / le Lot'.");
            
            if (!workflowJsonEditor || !workflowJsonEditor.value) {
                alert("Veuillez d'abord charger un workflow."); return;
            }
            let baseWorkflowObject;
            try {
                baseWorkflowObject = JSON.parse(workflowJsonEditor.value);
            } catch (e) {
                alert("Le JSON du workflow dans l'éditeur est invalide.");
                if(statusDiv) statusDiv.textContent = "Erreur: JSON du workflow invalide dans l'éditeur.";
                console.error("[RENDERER.JS] JSON invalide avant exécution:", e); return;
            }
            
            const comfyapiUrlVal = comfyUrlInput ? comfyUrlInput.value.trim() : "";
            if (!comfyapiUrlVal) { 
                alert("URL API ComfyUI manquante."); 
                if(statusDiv) statusDiv.textContent = "URL API ComfyUI manquante."; return;
            }

            runWorkflowBtn.disabled = true;
            if(statusDiv) statusDiv.innerHTML = "Préparation du lancement...";
            
            let currentSeedVal = seedValueInput ? (seedValueInput.value.trim() ? parseInt(seedValueInput.value.trim(), 10) : null) : null;
            const incrementSeed = incrementSeedBatchCheckbox ? incrementSeedBatchCheckbox.checked : false;

            if (selectedImageFolderPath && imageNodeIdInput && imageNodeIdInput.value.trim() && imageInputNameInput && imageInputNameInput.value.trim()) {
                if(statusDiv) statusDiv.innerHTML = `Lecture du dossier d'images : ${selectedImageFolderPath}...<br>`;
                const dirReadResult = await window.electronAPI.readImageDirectory(selectedImageFolderPath);

                if (dirReadResult.success && dirReadResult.imagePaths && dirReadResult.imagePaths.length > 0) {
                    const totalImages = dirReadResult.imagePaths.length;
                    if(statusDiv) statusDiv.innerHTML += `Trouvé ${totalImages} images. Lancement du lot...<br>`;
                    let resultsHtml = "Résultats du lot :<br>";

                    for (let i = 0; i < totalImages; i++) {
                        const imgPath = dirReadResult.imagePaths[i];
                        const imgName = imgPath.substring(imgPath.lastIndexOf('/') + 1);
                        if(statusDiv) statusDiv.innerHTML = `Traitement du lot (${i + 1}/${totalImages}): ${imgName}...<br><hr>${resultsHtml}`;
                        
                        let seedForThisImage = null;
                        if (currentSeedVal !== null) {
                            seedForThisImage = incrementSeed ? currentSeedVal + i : currentSeedVal;
                        }
                        
                        const batchInfo = { 
                            imageName: imgName, isFirst: i === 0,
                            imageNodeId: imageNodeIdInput.value.trim(), imageInputName: imageInputNameInput.value.trim(),
                            seedNodeId: seedNodeIdInput.value.trim(), seedInputName: seedInputNameInput.value.trim(),
                            promptNodeId: promptNodeIdInput.value.trim(), promptInputName: promptInputNameInput.value.trim()
                        };
                        const response = await processSingleWorkflow(baseWorkflowObject, imgPath, seedForThisImage, batchInfo);
                        
                        if (response.success) {
                            resultsHtml += `<b>${imgName}</b>: Lancé (ID: ${response.data.prompt_id || 'N/A'})<br>`;
                        } else {
                            resultsHtml += `<b>${imgName}</b>: Erreur - ${response.error}<br>`;
                        }
                    }
                    if(statusDiv) statusDiv.innerHTML = `<hr>Traitement par lot terminé (tâches mises en file d'attente sur ComfyUI).<br>${resultsHtml}`;
                    console.log("[RENDERER.JS] Traitement par lot terminé.");

                } else if (dirReadResult.error) {
                    if(statusDiv) statusDiv.textContent = `Erreur lecture dossier : ${dirReadResult.error}`;
                } else {
                    if(statusDiv) statusDiv.textContent = "Aucune image supportée trouvée dans le dossier sélectionné.";
                }
            } else {
                if(statusDiv) statusDiv.textContent = "Envoi du workflow unique...";
                const seedForSingle = currentSeedVal !== null ? currentSeedVal : undefined;
                const batchInfoSingle = { 
                    imageNodeId: imageNodeIdInput.value.trim(), imageInputName: imageInputNameInput.value.trim(),
                    seedNodeId: seedNodeIdInput.value.trim(), seedInputName: seedInputNameInput.value.trim(),
                    promptNodeId: promptNodeIdInput.value.trim(), promptInputName: promptInputNameInput.value.trim()
                }; // Passer les infos même pour un single run, pour les logs dans main.js
                const response = await processSingleWorkflow(baseWorkflowObject, selectedImagePath, seedForSingle, batchInfoSingle);
                if (response.success) {
                    if(statusDiv) statusDiv.innerHTML = `Workflow envoyé avec succès !<br>
                                       Prompt ID: ${response.data.prompt_id || 'N/A'}<br>
                                       Réponse: <pre>${JSON.stringify(response.data, null, 2)}</pre>`;
                } else {
                    if(statusDiv) statusDiv.textContent = `Erreur lors de l'envoi : ${response.error}`;
                }
            }
            runWorkflowBtn.disabled = false;
            console.timeEnd("runWorkflowTotalExecution");
        });
    } else { console.error("[RENDERER.JS] Bouton runWorkflowBtn non trouvé !"); }

    // --- SECTION 4: Appels d'Initialisation ---
    if (savedWorkflowsSelect) {
        populateWorkflowList();
    } else {
        console.error("[RENDERER.JS] Élément savedWorkflowsSelect non trouvé pour l'appel initial à populateWorkflowList !");
    }

    if (savedConfigsSelect) {
        populateConfigList().then(() => {
            console.log("[RENDERER.JS] Liste des configurations peuplée initialement.");
            applyConfig(null); 
        });
    } else {
        console.error("[RENDERER.JS] Élément savedConfigsSelect non trouvé pour l'appel initial à populateConfigList !");
        applyConfig(null);
    }
    
    console.log("[RENDERER.JS] Renderer initialisé. Tous les écouteurs d'événements et appels initiaux sont configurés.");
});