/*
* Default settings - can be adjusted (all at once or individually) when calling 
* the GameManager constructor
*/

import { getRandomArrayElement } from "./helpers.js";

import easyMap from '../assets/maps/easy.js';
import mediumMap from '../assets/maps/medium.js';
import hardMap from '../assets/maps/hard.js';
import mountainMap from '../assets/maps/mountains.js';

class Terrain {
    constructor(name, classes) {
        this.name = name;
        this.classes = classes;
    }
}

/**
 * Default settings for the game. These values can be modified
 * by the application and will effect
 * the ongoing game: music, soundEffects, tileSize
 * the next new game: rows, columns, randomMap, players (if I get to that point...)
 */
export const DEFAULT_SETTINGS = {
    rows: 20,
    columns: 20,
    tileSize: 30,
    randomMap: false,
    players: 1,
    music: false,
    soundEffects: false,
    
}

/**
 * Game data that should not be modified, but may need to be accessed outside 
 * the game logic itself (for example to set up audio controller or for a level
 * editor) 
 */
export const GAME_DATA = {
    terrainOptions: {
        grass: new Terrain('grass', ['grass', 'grass2', 'grass3']),
        water: new Terrain('water', ['water', 'water2']),
        rock: new Terrain('rock', ['rock', 'rock2']),
        lava: new Terrain('lava', ['lava']),
    },
    backgroundMusic: 'Equilibrium.wav',
    soundEffects: {
        acknowledged: 'acknowledged.wav',
        collision: 'collision.wav',
        explosion: 'explosion.wav',
        water: 'water.wav',
    },
}

class GameManager {
    /**
     * Create a new game manager for a round of RobotRacing
     * @param {Object} setup Optional setup instructions
     */
    constructor(setup) {
        if (!setup) setup = {};
        this.running = false;
        this.state = null;

        this.rows = setup.rows ? setup.rows : DEFAULT_SETTINGS.rows;
        this.columns = setup.columns ? setup.columns : DEFAULT_SETTINGS.columns;
        this.tileSize = setup.tileSize ? setup.tileSize : DEFAULT_SETTINGS.tileSize;
        this.randomMap = setup.randomMap !== undefined ? setup.randomMap : DEFAULT_SETTINGS.randomMap;

        this.audioController = setup.audioController;
        for (let clipName in GAME_DATA.soundEffects) {
            this.audioController.addClip(clipName, GAME_DATA.soundEffects[clipName]);
        }
        
        this.terrainOptions = GAME_DATA.terrainOptions;

        this.gameBoard = new GameBoard(this.rows, this.columns, this.terrainOptions);
    }

    run() {
        this.running = true;


        if (this.randomMap) this.gameBoard.randomMap();
        else {
            const defaultBoardSize = this.gameBoard.loadDefaultMap();
            this.rows = defaultBoardSize.rows;
            this.columns = defaultBoardSize.columns;
        }

        console.log(this.columns, this.rows)

        this.generateGrid();

        this.gameBoard.drawBoard(this.gameBoard);

        this.state = new InputState();    
        this.state.turn();

        this.audioController.playClip('explosion');

        return (this.gameBoard.board)
    }

    // TODO: Think about a way to refactor this - move it from inside the game to outside
    // (game should have only the logic, no direct effect on the html - maybe add a UIController? or just keep it in main)
    generateGrid() {
        console.log('generating grid')
        const boardContainer = document.getElementById('game-board-container');

        // setting up the CSS variables to adjust the grid to the rows, columns 
        // and tile size chosen in settings
        const root = document.querySelector(':root');
        root.style.setProperty('--columns', this.columns);
        root.style.setProperty('--rows', this.rows);
        
        console.log(this.columns, this.rows)
        
        // reset the grid, in case there was already something in there
        boardContainer.innerHTML = '';

        // generate a new grid
        for (let row = 0; row < this.rows; row++) {
            const rowDiv = document.createElement('div');
            rowDiv.classList.add('grid-row');           
            
            for (let column = 0; column < this.columns; column++) {
                const gridTile = document.createElement('div');
                gridTile.classList.add('tile');
                gridTile.setAttribute('row', row);
                gridTile.setAttribute('column', column);
                rowDiv.appendChild(gridTile);
            }
            boardContainer.appendChild(rowDiv);
        }
    }

}

class GameBoard {
    constructor(rows, columns, terrain) {
        this.rows = rows;
        this.columns = columns;
        this.board = [];
        this.terrain = terrain;
    }

    randomMap() {
        for (let row = 0; row < this.rows; row++) {
            const currentRow = [];
            this.board.push(currentRow);
            for (let column = 0; column < this.columns; column++) {
                const rng = Math.random();
                let type = this.terrain.grass;
                if (rng > .98) type = this.terrain.lava;
                else if (rng > .93) type = this.terrain.rock
                else if (rng > .78) type = this.terrain.water;
                currentRow.push(new Tile(row, column, type))
            }
        }
    }

    loadDefaultMap () {
        // TODO change saved map from hard coded in the .js file to being imported from json
        // this will load a hand crafted map, as I do not have that ready yet, will start
        // with just a full grass map

        // const savedMap = easyMap;
        // const savedMap = mediumMap;
        // const savedMap = hardMap;
        const savedMap = mountainMap;

        this.rows = savedMap.length;
        this.columns = savedMap[0].length;
        
        for (let row = 0; row < this.rows; row++) {
            const currentRow = [];
            this.board.push(currentRow);
            for (let column = 0; column < this.columns; column++) {
                const terrainName = savedMap[row][column];
                let tile = new Tile(row, column, GAME_DATA.terrainOptions[terrainName]);

                currentRow.push(tile)
            }
        }

        return {rows: this.rows, columns: this.columns};
    }

    loadGrassMap() {
        for (let row = 0; row < this.rows; row++) {
            const currentRow = [];
            this.board.push(currentRow);
            for (let column = 0; column < this.columns; column++) {
                let tile = new Tile(row, column, GAME_DATA.terrainOptions['grass']);
                currentRow.push(tile)
            }
        }
    }

    drawBoard() {
        if (document.querySelectorAll('#game-board-container > .grid-row > .tile').length !== this.columns * this.rows)
            throw Error('[GameBoard]: Unable to draw map on this game board');

        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                document.querySelector(`[row='${row}'][column='${column}'`).classList.add(this.board[row][column].terrainClass);
            }
        }
    }
}

class Tile {
    constructor(row, column, terrain) {
        this.row = row;
        this.column = column;
        if (terrain) this.terrainClass = getRandomArrayElement(terrain.classes);
        else this.terrainClass = 'tile';
        this.terrainName = terrain.name;
    }
}

class State {
    enter () {

    }

    turn () {

    }
}

class InputState extends State {

}

class ExecuteState extends State {

}

class Player {

}

class Dice {

}

export class LevelEditor extends GameManager{
    run() {
        // generate the grid
        this.generateGrid();
        // initialize all tiles with grass
        this.gameBoard.loadGrassMap();
        this.gameBoard.drawBoard();


        // attach event handlers to all tiles that cycle through the terrain options on click
        document.querySelectorAll('.tile').forEach(tile => tile.addEventListener('click', this.changeTerrain.bind(this)));
        return this.gameBoard.board;
    }

    changeTerrain(event) {
        const tileDiv = event.target;
        const row = tileDiv.getAttribute('row');
        const column = tileDiv.getAttribute('column');
        const tile = this.gameBoard.board[row][column];
        console.log(tile)
        tileDiv.classList.remove(tile.terrainClass)
        switch (tile.terrainName) {
            case 'grass':
                tile.terrainName = 'rock';
                break;
            case 'rock':
                tile.terrainName = 'water';
                break;
            case 'water':
                tile.terrainName = 'lava';
                break;
            case 'lava':
                tile.terrainName = 'grass';
                break;
        }
        tile.terrainClass = tile.terrainName;
        tileDiv.classList.add(tile.terrainName);
    }
}

export default GameManager;