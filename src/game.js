/*
* Default settings - can be adjusted (all at once or individually) when calling 
* the GameManager constructor
*/

import { getRandomArrayElement } from "./helpers.js";

class Terrain {
    constructor(name, classes) {
        this.name = name;
        this.classes = classes;
    }
}

const DEFAULT_SETTINGS = {
    rows: 10,
    columns: 10,
    tileSize: 60,
    terrainOptions: {
        grass: new Terrain('grass', ['grass', 'grass2', 'grass3']),
        water: new Terrain('water', ['water', 'water2']),
        rock: new Terrain('rock', ['rock', 'rock2']),
        lava: new Terrain('lava', ['lava']),
    },
    randomMap: true,
    players: 1,
}

class GameManager {
    /**
     * Create a new game manager for a round of RobotRacing
     * @param {Object} setup Optional setup instructions
     */
    constructor(setup) {

        if (!setup) setup = {};
        console.log(setup === DEFAULT_SETTINGS, setup, DEFAULT_SETTINGS)
        console.log('setting up game')
        this.running = false;
        this.state = null;

        this.rows = setup.rows ? setup.rows : DEFAULT_SETTINGS.rows;
        this.columns = setup.columns ? setup.columns : DEFAULT_SETTINGS.columns;
        this.tileSize = setup.tileSize ? setup.tileSize : DEFAULT_SETTINGS.tileSize;
        this.randomMap = setup.randomMap !== undefined ? setup.randomMap : DEFAULT_SETTINGS.randomMap;
        console.log(this.randomMap, setup.randomMap)
        // starting out with the possibility to change terraign, though actually
        // implementing that will mean additional work in GameBoard class as right now
        // rock, water and grass are hard coded there
        this.terrainOptions = setup.terrainOptions ? setup.terrainOptions : DEFAULT_SETTINGS.terrainOptions;

        this.gameBoard = new GameBoard(this.rows, this.columns, this.terrainOptions);
    }

    run() {
        console.log('running game')

        this.running = true;
        this.generateGrid();

        if (this.randomMap) this.gameBoard.randomMap();
        else this.gameBoard.defaultMap();

        this.gameBoard.drawBoard(this.gameBoard);

        this.state = new InputState();    
        this.state.turn();
    }

    generateGrid() {
        console.log('generating grid')
        const boardContainer = document.getElementById('game-board-container');

        // setting up the CSS variables to adjust the grid to the rows, columns 
        // and tile size chosen in settings
        const root = document.querySelector(':root');
        root.style.setProperty('--columns', this.columns);
        root.style.setProperty('--rows', this.rows);
        root.style.setProperty('--tile-size', `${this.tileSize}px`);
        
        // reset the grid, in case there was already something in there
        boardContainer.innerHTML = '';

        // generate a new grid
        for (let row = 0; row < this.rows; row++) {
            const rowDiv = document.createElement('div');
            rowDiv.classList.add('grid-row');
            rowDiv.style.width = `${this.columns * this.tileSize}px`;
            
            
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
        console.log('setting up board');
        this.rows = rows;
        this.columns = columns;
        this.board = [];
        this.terrain = terrain;
    }

    randomMap() {
        console.log('creating full random map');
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

    defaultMap () {
        // TODO handcraft map!
        // this will load a hand crafted map, as I do not have that ready yet, will start
        // with just a full grass map
        console.log('creating grass only map');
        for (let row = 0; row < this.rows; row++) {
            const currentRow = [];
            this.board.push(currentRow);
            for (let column = 0; column < this.columns; column++) {
                let type = this.terrain.grass;
                currentRow.push(new Tile(row, column, type))
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
        this.terrainClass = getRandomArrayElement(terrain.classes);
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

export default GameManager;