import GameManager from "./game.js";
import { DEFAULT_SETTINGS, GAME_DATA } from "./game.js";
import { AudioController } from "./helpers.js";


// NOTE Getting all control elements/setting up variables and constants to use
// Get control buttons
const btnStart = document.getElementById('btn-start-game');

// Get input elements for settings
// const inputRows = document.getElementById('input-rows');
// const inputColumns = document.getElementById('input-columns');
const inputTilesize = document.getElementById('input-tile-size');
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

// Setting up tthe event handlers
btnOpenSettings.addEventListener('click', showSettings);
btnCloseSettingsWithoutSaving.addEventListener('click', closeSettingsWithoutSaving);
btnCloseSettingsWithSaving.addEventListener('click', saveSettings);

// NOTE load default settings
const settings = {
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

// Finally, we start the game engine
startGame();

// NOTE function definitions for event handlers, no direct code execution below this line
/**
 * Generate a new map and start the game based on current settings.
 */
function startGame() {
    // start playing backgroundmusic, if setting is enabled
    const gm = new GameManager(settings);
    gm.startGameEngine();
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
    // inputRows.value = settings.rows;
    // inputColumns.value = settings.columns;
    inputTilesize.value = settings.tileSize;
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
    settings.music = inputMusic.checked;
    settings.soundEffects = inputSoundEffects.checked;

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