# Lanceur de Workflow ComfyUI Avancé

Une application de bureau construite avec Electron pour faciliter le lancement et la gestion des workflows ComfyUI, incluant l'injection de prompts, d'images (pour img2img), la gestion des seeds, et le traitement par lot.


[![screen-comfyui-loader.png](https://i.postimg.cc/0QkMDW6f/screen-comfyui-loader.png)](https://postimg.cc/4K0xT1Q7)



## Fonctionnalités

*   **Chargement de Workflows :**
    *   Chargez des fichiers de workflow ComfyUI (`.json`) via un dialogue de fichier.
    *   Sélectionnez des workflows fréquemment utilisés depuis un menu déroulant (les fichiers doivent être placés dans le sous-dossier `workflows` de l'application).
    *   Visualisez et éditez (basiquement) le JSON du workflow chargé directement dans l'application.
*   **Injection de Paramètres :**
    *   **Prompt Texte :** Injectez un prompt texte personnalisé dans un nœud et une entrée spécifiques de votre workflow.
    *   **Image d'Entrée (Img2Img) :**
        *   Sélectionnez une image unique pour l'injecter dans un nœud `LoadImage`.
        *   Sélectionnez un dossier d'images pour un traitement par lot, chaque image étant injectée successivement dans le nœud `LoadImage`.
    *   **Seed :** Contrôlez le seed à injecter dans un nœud spécifique. Option pour générer un seed aléatoire ou incrémenter le seed pour chaque image d'un lot.
*   **Gestion de Configuration :**
    *   Sauvegardez vos paramètres d'application courants (URL de ComfyUI, ID de nœuds par défaut pour les injections) dans un fichier de configuration JSON.
    *   Chargez des configurations précédemment sauvegardées depuis un menu déroulant (les fichiers sont stockés dans le sous-dossier `config_user`).
*   **Exécution sur ComfyUI :**
    *   Lancez le workflow (modifié ou non) sur une instance ComfyUI en cours d'exécution.
    *   Visualisez le statut de base et le `prompt_id` retourné par ComfyUI.

## Prérequis

*   **Node.js et npm :** Nécessaires pour exécuter l'application. <a href="https://nodejs.org/" target="_blank">Téléchargez Node.js ici</a> (npm est inclus).
*   **ComfyUI :** Une instance de ComfyUI doit être installée et en cours d'exécution. L'API de ComfyUI doit être accessible (par défaut : `http://127.0.0.1:8188`).
    *   Assurez-vous que les modèles, VAEs, et custom nodes requis par vos workflows sont correctement installés dans ComfyUI.

## Installation

1.  **Cloner le dépôt (ou télécharger les fichiers) :**
    ```bash
[   git clonehttps://github.com/orion4d/comfyui-loader.git
2.  **Installer les dépendances :**
    Ouvrez un terminal ou une invite de commande dans le dossier du projet et exécutez :
    ```bash
    npm install
    ```
    Cela installera Electron, Axios, et toute autre dépendance listée dans `package.json`.

## Utilisation

1.  **Démarrer ComfyUI :**
    Assurez-vous que votre instance ComfyUI est lancée et accessible à l'URL que vous allez spécifier dans l'application (par défaut `http://127.0.0.1:8188`).

2.  **Lancer l'Application Electron :**
    Depuis le terminal, à la racine du projet :
    ```bash
    npm start
    ```
    La fenêtre de l'application "Lanceur de Workflow ComfyUI" devrait s'ouvrir.

3.  **Configuration de l'Application (Panneau Supérieur) :**
    *   **URL API ComfyUI :** Vérifiez ou modifiez l'URL de votre API ComfyUI.
    *   **Sélectionner une configuration enregistrée :** Si vous avez déjà sauvegardé des configurations d'application, vous pouvez les charger ici. Une configuration inclut l'URL ComfyUI et les ID/noms de nœuds par défaut pour les injections.
    *   **Exporter Config Actuelle :** Sauvegarde les valeurs actuelles des champs de configuration (URL, ID de nœuds pour prompt/image/seed) dans un fichier JSON dans le dossier `config_user` de l'application.

4.  **Charger un Workflow (Section 1) :**
    *   **Menu déroulant "Sélectionner un workflow local" :** Choisissez un workflow parmi ceux présents dans le dossier `workflows` de l'application.
        *   *Pour ajouter des workflows à cette liste, placez vos fichiers `.json` de workflow dans un sous-dossier nommé `workflows` à la racine du projet de cette application.*
    *   **Bouton "Charger un Autre Workflow (.json)" :** Ouvre un dialogue pour sélectionner un fichier de workflow depuis n'importe quel emplacement sur votre ordinateur.
    *   Le chemin du workflow chargé et son contenu JSON (éditable) s'affichent.

5.  **Paramètres Optionnels d'Injection (Section 2) :**
    *   **A. Injection de Prompt Texte :**
        *   **Prompt à injecter :** Entrez le texte de votre prompt.
        *   **ID Nœud Cible Prompt :** Spécifiez l'ID numérique du nœud ComfyUI (ex: `CLIPTextEncode`) où ce prompt doit être injecté.
        *   **Nom Entrée Cible :** Le nom du champ d'input dans ce nœud (généralement `text`).
    *   **B. Injection d'Image d'Entrée (pour Img2Img) :**
        *   **Pour une seule image :** Cliquez sur "Sélectionner UNE Image d'Entrée" pour choisir une image. Son chemin s'affichera.
        *   **Pour un lot d'images :** Cliquez sur "Sélectionner un DOSSIER d'Images d'Entrée". Toutes les images supportées dans ce dossier seront traitées séquentiellement. Le chemin du dossier s'affichera. *Si un dossier est sélectionné, il prendra la priorité sur une image unique sélectionnée.*
        *   **ID Nœud Cible 'LoadImage' :** L'ID numérique du nœud `LoadImage` dans votre workflow où le chemin de l'image sera injecté.
        *   **Nom Entrée Cible :** Le nom du champ d'input (généralement `image` pour un nœud `LoadImage`).
    *   **C. Contrôle du Seed :**
        *   **Seed :** Entrez une valeur numérique pour le seed. Laissez vide pour utiliser le seed défini dans le workflow ou pour un seed aléatoire (selon le comportement du KSampler de ComfyUI).
        *   **Bouton "Seed Aléatoire" :** Génère un grand nombre aléatoire et le place dans le champ Seed.
        *   **ID Nœud Cible Seed :** L'ID numérique du nœud où le seed doit être injecté (ex: un nœud `Seed (rgthree)` ou directement un `KSampler`).
        *   **Nom Entrée Cible :** Le nom du champ d'input (souvent `seed`, parfois `noise_seed` pour certains KSamplers).
        *   **Checkbox "Incrémenter le seed..." :** Si cochée, lors d'un traitement par lot d'images, le seed sera incrémenté de 1 pour chaque image successive.

6.  **Exécuter sur ComfyUI (Section 3) :**
    *   Cliquez sur le bouton **"Lancer le Workflow / le Lot"**.
    *   Si un dossier d'images est sélectionné, l'application enverra une requête à ComfyUI pour chaque image du dossier.
    *   Sinon, une seule requête sera envoyée.
    *   Le **Statut** affichera le `prompt_id` retourné par ComfyUI pour chaque tâche soumise et un aperçu de la réponse de l'API.
    *   Surveillez votre interface ComfyUI ou votre dossier `output` de ComfyUI pour voir les images générées.

## Structure des Dossiers (Créés par l'Application si besoin)

*   `VOTRE_PROJET_APP/workflows/` : Placez ici vos fichiers de workflow `.json` pour qu'ils apparaissent dans le menu déroulant "Sélectionner un workflow local".
*   `VOTRE_PROJET_APP/config_user/` : Les configurations d'application exportées seront sauvegardées ici par défaut et lues pour le menu déroulant "Sélectionner une configuration enregistrée".

## Dépannage

*   **L'application ne se lance pas / Fenêtre blanche :**
    *   Vérifiez la console du terminal où vous avez exécuté `npm start` pour des erreurs dans `main.js`.
    *   Ouvrez les outils de développement d'Electron (souvent `Ctrl+Shift+I` ou via le menu "View") et regardez l'onglet "Console" pour des erreurs JavaScript dans `renderer.js`.
*   **Les workflows/configurations ne s'affichent pas dans les menus déroulants :**
    *   Assurez-vous d'avoir créé les sous-dossiers `workflows` et `config_user` à la racine du projet de l'application et d'y avoir placé des fichiers `.json` valides.
*   **L'injection ne fonctionne pas :**
    *   Vérifiez que les **ID de Nœud Cible** et les **Noms d'Entrée Cible** dans l'application correspondent exactement à ceux de votre workflow ComfyUI. Vous pouvez inspecter le JSON du workflow dans l'éditeur de l'application pour trouver ces valeurs.
    *   Pour l'injection d'image, assurez-vous que le nœud cible est bien de type `LoadImage` et que l'input est correct (généralement `image`).
*   **ComfyUI ne produit pas le résultat attendu :**
    *   Vérifiez la console du serveur ComfyUI pour des messages d'erreur (modèles manquants, etc.).
    *   Assurez-vous que le workflow JSON envoyé (visible dans l'éditeur de l'application juste avant le lancement) est correct.

## Contribuer

Les contributions sont les bienvenues ! Veuillez ouvrir une issue pour discuter des changements majeurs ou soumettre une Pull Request.

## Licence

- **Auteur** : Philippe Joye (Orion4D)
- **Licence** : [MIT](./LICENSE).

<div align="center">

### 🌟 **Soutenez le projet**

Si ce projet vous a été utile, pensez à lui laisser une ⭐ sur GitHub !

**Fait avec ❤️ pour la communauté open source**  
**par Orion4D**

[![Offrez-moi un café](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/orion4d)

</div>
