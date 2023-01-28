import GameManager from "./game.js";
import { DEFAULT_SETTINGS } from "./game.js";

// Get control buttons
const btnStart = document.querySelector('#btn-start-game');
const btnSpawn = document.querySelector('#btn-spawn-robot');
const btnMove1 = document.querySelector('#btn-move-one');
const btnMove2 = document.querySelector('#btn-move-two');
const btnMove3 = document.querySelector('#btn-move-three');
const turnLeft = document.querySelector('#btn-turn-left');
const turnRight = document.querySelector('#btn-turn-right');
const btnUnknown = document.querySelector('#btn-unknown');

// Get elements for settings
const inputRows = document.getElementById('input-rows');
const inputColumns = document.getElementById('input-columns');
const inputTilesize = document.getElementById('input-tile-size');
const inputRandomMap = document.getElementById('input-random-map');
const btnOpenSettings = document.querySelector('#navbar button.settings');
const dlgSettings = document.getElementById('dlg-settings');
const btnCloseSettingsWithoutSaving = document.getElementById('btn-cancel-settings');
const btnCloseSettingsWithSaving = document.getElementById('btn-save-settings');
const root = document.querySelector(':root');

let currentBoard = null;

btnStart.addEventListener('click', startGame);
btnOpenSettings.addEventListener('click', showSettings);
btnCloseSettingsWithoutSaving.addEventListener('click', closeSettingsWithoutSaving);
btnCloseSettingsWithSaving.addEventListener('click', saveSettings);

const settings = {
    rows: DEFAULT_SETTINGS.rows,
    columns: DEFAULT_SETTINGS.columns,
    tileSize: DEFAULT_SETTINGS.tileSize,
    randomMap: DEFAULT_SETTINGS.randomMap,
}

// to initialize the setting inputs with default values, we set the inputs once on load with values from settings
initializeInputsFromSettings();

// dev tool to export a map to save as possible static map (with some editing)
btnUnknown.addEventListener('click', ()=>{{
    const blob = new Blob([JSON.stringify(currentBoard)], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'robotracingmap.json';
    a.click();
    
}})

function startGame() {
    const gm = new GameManager(settings);
    currentBoard = gm.run();
}

function showSettings() {
    dlgSettings.showModal();
}

function initializeInputsFromSettings() {
    inputRows.value = settings.rows;
    inputColumns.value = settings.columns;
    inputTilesize.value = settings.tileSize;
    inputRandomMap.checked = settings.randomMap;
    root.style.setProperty('--tile-size', `${settings.tileSize}px`);
}

function closeSettingsWithoutSaving() {
    initializeInputsFromSettings();
    dlgSettings.close();
}

function saveSettings() {
    settings.rows = Number(inputRows.value);
    settings.columns = Number(inputColumns.value);
    settings.tileSize = Number(inputTilesize.value);
    settings.randomMap = inputRandomMap.checked;
    dlgSettings.close();

    // randomMap, rows and columns are only used on starting a new game
    // but tile size is immediately applied, so we can resize an existing game board
    root.style.setProperty('--tile-size', `${settings.tileSize}px`);
}