import GameManager from "./game.js";

// Get control buttons
const btnStart = document.querySelector('#btn-start-game');
const btnSpawn = document.querySelector('#btn-spawn-robot');
const btnMove1 = document.querySelector('#btn-move-one');
const btnMove2 = document.querySelector('#btn-move-two');
const btnMove3 = document.querySelector('#btn-move-three');
const turnLeft = document.querySelector('#btn-turn-left');
const turnRight = document.querySelector('#btn-turn-right');

// Get inputs for settings
const inputRows = document.getElementById('input-rows');
const inputColumns = document.getElementById('input-columns');
const inputTilesize = document.getElementById('input-tile-size');
const inputRandomMap = document.getElementById('input-random-map')

function startGame() {
    const settings = {};
    settings.rows = Number(inputRows.value);
    settings.columns = Number(inputColumns.value);
    settings.tileSize = Number(inputTilesize.value);
    settings.randomMap = inputRandomMap.checked;
    console.log('settings', settings)

    const gm = new GameManager(settings);
    gm.run();
    
}

btnStart.addEventListener('click', startGame);
