import GameManager from "./game.js";

// Get input controls
const btnStart = document.querySelector('#btn-start-game');
const btnSpawn = document.querySelector('#btn-spawn-robot');
const btnMove1 = document.querySelector('#btn-move-one');
const btnMove2 = document.querySelector('#btn-move-two');
const btnMove3 = document.querySelector('#btn-move-three');
const turnLeft = document.querySelector('#btn-turn-left');
const turnRight = document.querySelector('#btn-turn-right');


function startGame() {
    const gm = new GameManager();
    gm.run();
    
}

btnStart.addEventListener('click', startGame);
