import GameManager from "./game.js";
import { DEFAULT_SETTINGS, GAME_DATA, LevelEditor } from "./game.js";
import { AudioController } from "./helpers.js";


// NOTE Getting all control elements/setting up variables and constants to use
// Get control buttons
const btnStart = document.getElementById('btn-start-game');
const btnSpawn = document.getElementById('btn-spawn-robot');
const btnMove1 = document.getElementById('btn-move-one');
const btnMove2 = document.getElementById('btn-move-two');
const btnMove3 = document.getElementById('btn-move-three');
const turnLeft = document.getElementById('btn-turn-left');
const turnRight = document.getElementById('btn-turn-right');
const btnExportMap = document.getElementById('btn-export-map');
const btnLevelEditor = document.getElementById('btn-level-editor');


// Get input elements for settings
const inputRows = document.getElementById('input-rows');
const inputColumns = document.getElementById('input-columns');
const inputTilesize = document.getElementById('input-tile-size');
const inputRandomMap = document.getElementById('input-random-map');
const inputMusic = document.getElementById('input-music');
const inputMusicVolume = document.getElementById('input-music-volume');
const inputSoundEffects = document.getElementById('input-sound-effects');
const inputSoundEffectsVolume = document.getElementById('input-sound-effects-volume');


// get setting dialog elements
const dlgSettings = document.getElementById('dlg-settings');
const btnOpenSettings = document.querySelector('#navbar button.settings');
const btnCloseSettingsWithoutSaving = document.getElementById('btn-cancel-settings');
const btnCloseSettingsWithSaving = document.getElementById('btn-save-settings');
const root = document.querySelector(':root');

// Additional Variables
let currentBoard = null;

// Setting up tthe event handlers
btnStart.addEventListener('click', startGame);
btnLevelEditor.addEventListener('click', startLevelEditor);
btnOpenSettings.addEventListener('click', showSettings);
btnCloseSettingsWithoutSaving.addEventListener('click', closeSettingsWithoutSaving);
btnCloseSettingsWithSaving.addEventListener('click', saveSettings);

// dev tool to export a map to save as possible static map (with some editing)
btnExportMap.addEventListener('click', exportMap);

// NOTE load default settings
const settings = {
    // rows and columns are part of the dev only level editor
    // rows: DEFAULT_SETTINGS.rows,
    // columns: DEFAULT_SETTINGS.columns,
    tileSize: DEFAULT_SETTINGS.tileSize,
    music: DEFAULT_SETTINGS.music,
    soundEffects: DEFAULT_SETTINGS.soundEffects,
    musicVolume: DEFAULT_SETTINGS.musicVolume,
    soundEffectsVolume: DEFAULT_SETTINGS.soundEffectsVolume,
}

// setting up AudioController for sound effects and music
const audioController = new AudioController(settings);
settings.audioController = audioController;
if (GAME_DATA.backgroundMusic) audioController.addMusic('background', GAME_DATA.backgroundMusic);

// to initialize the setting inputs with default values, we set the inputs once on load with values from settings
generateInputValuesFromSettings();

// NOTE function definitions for event handlers, no direct code execution below this line
/**
 * Generate a new map and start the game based on current settings.
 */
function startGame() {
    // start playing backgroundmusic, if setting is enabled
    const gm = new GameManager(settings);
    gm.init();
    gm.startGame();
}

/**
 * DEV OPTION: Opens the Level Editor (will not be available in the actual game)
 */
function startLevelEditor() {
    const gm = new LevelEditor(settings);
    currentBoard = gm.startGame();
}

/**
 * Open the settings dialog.
 */
function showSettings() {
    dlgSettings.showModal();
}

/**
 * Set the values in the setting input fields to the current value from the settings variable.
 */
function generateInputValuesFromSettings() {
    inputRows.value = settings.rows;
    inputColumns.value = settings.columns;
    inputTilesize.value = settings.tileSize;
    inputRandomMap.checked = settings.randomMap;
    inputMusic.checked = settings.music;
    inputSoundEffects.checked = settings.soundEffects;
    inputMusicVolume.value = 100 * settings.musicVolume;
    inputSoundEffectsVolume.value = 100 * settings.soundEffectsVolume;
    root.style.setProperty('--tile-size', `${settings.tileSize}px`);
}

/**
 * Close setting window without modifying the current settings. Values in the setting 
 * inputs are reset to their current values from settings.
 */
function closeSettingsWithoutSaving() {
    generateInputValuesFromSettings();
    dlgSettings.close();
}

/**
 * Close settings window and save the values from setting inputs to the settings object.
 */
function saveSettings() {
    settings.tileSize = Number(inputTilesize.value);
    settings.randomMap = inputRandomMap.checked;
    settings.music = inputMusic.checked;
    settings.soundEffects = inputSoundEffects.checked;

    if (settings.randomMap) {
        settings.rows = Number(inputRows.value);
        settings.columns = Number(inputColumns.value);
    } else {
        settings.rows = DEFAULT_SETTINGS.rows;
        settings.columns = DEFAULT_SETTINGS.columns;
    }

    if (settings.musicVolume !== inputMusicVolume.value / 100) {
        settings.musicVolume = inputMusicVolume.value / 100;
        audioController.setMusicVolume(settings.musicVolume);
    }

    if (settings.soundEffectsVolume !== inputSoundEffectsVolume / 100) {
        settings.soundEffectsVolume = inputSoundEffectsVolume.value / 100;
        audioController.setSoundEffectVolume(settings.soundEffectsVolume);
    }    

    if (settings.music) audioController.playMusic('background');
    else if (!settings.music) audioController.pauseMusic('background');


    dlgSettings.close();

    // randomMap, rows and columns are only used on starting a new game
    // but tile size is immediately applied, so we can resize an existing game board
    root.style.setProperty('--tile-size', `${settings.tileSize}px`);
}

/**
 * DEV OPTION - This is part of the level editor, which will be disabled in actual game.
 * Generates and automatically downloads a json file with the current map data.
 */
function exportMap () {
    const exportedMap = [];
    for (let row of currentBoard) {
        const newRow = []
        exportedMap.push(newRow);
        for (let column of row) {
            newRow.push(column.terrainName);
        }
    }
    const blob = new Blob([JSON.stringify(exportedMap)], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'robotracingmap.json';
    a.click();
}