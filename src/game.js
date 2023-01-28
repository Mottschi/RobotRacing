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

export const DEFAULT_SETTINGS = {
    rows: 10,
    columns: 10,
    tileSize: 60,
    terrainOptions: {
        grass: new Terrain('grass', ['grass', 'grass2', 'grass3']),
        water: new Terrain('water', ['water', 'water2']),
        rock: new Terrain('rock', ['rock', 'rock2']),
        lava: new Terrain('lava', ['lava']),
    },
    randomMap: false,
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

        return (this.gameBoard.board)
    }

    generateGrid() {
        console.log('generating grid')
        const boardContainer = document.getElementById('game-board-container');

        // setting up the CSS variables to adjust the grid to the rows, columns 
        // and tile size chosen in settings
        const root = document.querySelector(':root');
        root.style.setProperty('--columns', this.columns);
        root.style.setProperty('--rows', this.rows);
        
        
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
        // TODO change saved map from hard coded in the .js file to being imported from json
        // this will load a hand crafted map, as I do not have that ready yet, will start
        // with just a full grass map
        console.log('creating grass only map');

        const savedMap = [[{"row":0,"column":0,"terrainClass":"grass3"},{"row":0,"column":1,"terrainClass":"grass2"},{"row":0,"column":2,"terrainClass":"rock"},{"row":0,"column":3,"terrainClass":"grass3"},{"row":0,"column":4,"terrainClass":"grass"},{"row":0,"column":5,"terrainClass":"grass3"},{"row":0,"column":6,"terrainClass":"grass2"},{"row":0,"column":7,"terrainClass":"grass3"},{"row":0,"column":8,"terrainClass":"grass2"},{"row":0,"column":9,"terrainClass":"grass"},{"row":0,"column":10,"terrainClass":"grass"},{"row":0,"column":11,"terrainClass":"grass2"},{"row":0,"column":12,"terrainClass":"grass"},{"row":0,"column":13,"terrainClass":"grass3"},{"row":0,"column":14,"terrainClass":"grass2"},{"row":0,"column":15,"terrainClass":"grass"},{"row":0,"column":16,"terrainClass":"grass3"},{"row":0,"column":17,"terrainClass":"grass"},{"row":0,"column":18,"terrainClass":"grass2"},{"row":0,"column":19,"terrainClass":"grass3"}],[{"row":1,"column":0,"terrainClass":"grass2"},{"row":1,"column":1,"terrainClass":"water"},{"row":1,"column":2,"terrainClass":"grass"},{"row":1,"column":3,"terrainClass":"grass3"},{"row":1,"column":4,"terrainClass":"grass3"},{"row":1,"column":5,"terrainClass":"grass"},{"row":1,"column":6,"terrainClass":"grass"},{"row":1,"column":7,"terrainClass":"rock"},{"row":1,"column":8,"terrainClass":"water2"},{"row":1,"column":9,"terrainClass":"grass3"},{"row":1,"column":10,"terrainClass":"grass3"},{"row":1,"column":11,"terrainClass":"rock2"},{"row":1,"column":12,"terrainClass":"grass3"},{"row":1,"column":13,"terrainClass":"grass2"},{"row":1,"column":14,"terrainClass":"grass"},{"row":1,"column":15,"terrainClass":"lava"},{"row":1,"column":16,"terrainClass":"grass"},{"row":1,"column":17,"terrainClass":"rock2"},{"row":1,"column":18,"terrainClass":"rock"},{"row":1,"column":19,"terrainClass":"water"}],[{"row":2,"column":0,"terrainClass":"grass2"},{"row":2,"column":1,"terrainClass":"grass2"},{"row":2,"column":2,"terrainClass":"water"},{"row":2,"column":3,"terrainClass":"grass"},{"row":2,"column":4,"terrainClass":"grass"},{"row":2,"column":5,"terrainClass":"water2"},{"row":2,"column":6,"terrainClass":"water"},{"row":2,"column":7,"terrainClass":"grass"},{"row":2,"column":8,"terrainClass":"grass3"},{"row":2,"column":9,"terrainClass":"grass2"},{"row":2,"column":10,"terrainClass":"grass3"},{"row":2,"column":11,"terrainClass":"grass"},{"row":2,"column":12,"terrainClass":"grass2"},{"row":2,"column":13,"terrainClass":"grass2"},{"row":2,"column":14,"terrainClass":"grass"},{"row":2,"column":15,"terrainClass":"grass3"},{"row":2,"column":16,"terrainClass":"grass3"},{"row":2,"column":17,"terrainClass":"grass3"},{"row":2,"column":18,"terrainClass":"grass3"},{"row":2,"column":19,"terrainClass":"grass"}],[{"row":3,"column":0,"terrainClass":"grass3"},{"row":3,"column":1,"terrainClass":"grass"},{"row":3,"column":2,"terrainClass":"water2"},{"row":3,"column":3,"terrainClass":"grass3"},{"row":3,"column":4,"terrainClass":"grass"},{"row":3,"column":5,"terrainClass":"water"},{"row":3,"column":6,"terrainClass":"grass3"},{"row":3,"column":7,"terrainClass":"grass2"},{"row":3,"column":8,"terrainClass":"water2"},{"row":3,"column":9,"terrainClass":"grass"},{"row":3,"column":10,"terrainClass":"grass"},{"row":3,"column":11,"terrainClass":"grass3"},{"row":3,"column":12,"terrainClass":"grass3"},{"row":3,"column":13,"terrainClass":"grass2"},{"row":3,"column":14,"terrainClass":"grass3"},{"row":3,"column":15,"terrainClass":"grass2"},{"row":3,"column":16,"terrainClass":"water"},{"row":3,"column":17,"terrainClass":"grass2"},{"row":3,"column":18,"terrainClass":"grass"},{"row":3,"column":19,"terrainClass":"grass3"}],[{"row":4,"column":0,"terrainClass":"grass3"},{"row":4,"column":1,"terrainClass":"grass2"},{"row":4,"column":2,"terrainClass":"grass3"},{"row":4,"column":3,"terrainClass":"grass2"},{"row":4,"column":4,"terrainClass":"water2"},{"row":4,"column":5,"terrainClass":"grass3"},{"row":4,"column":6,"terrainClass":"grass3"},{"row":4,"column":7,"terrainClass":"water"},{"row":4,"column":8,"terrainClass":"water"},{"row":4,"column":9,"terrainClass":"grass3"},{"row":4,"column":10,"terrainClass":"rock"},{"row":4,"column":11,"terrainClass":"grass3"},{"row":4,"column":12,"terrainClass":"grass"},{"row":4,"column":13,"terrainClass":"grass2"},{"row":4,"column":14,"terrainClass":"water"},{"row":4,"column":15,"terrainClass":"grass3"},{"row":4,"column":16,"terrainClass":"grass2"},{"row":4,"column":17,"terrainClass":"rock"},{"row":4,"column":18,"terrainClass":"grass3"},{"row":4,"column":19,"terrainClass":"grass3"}],[{"row":5,"column":0,"terrainClass":"grass"},{"row":5,"column":1,"terrainClass":"grass3"},{"row":5,"column":2,"terrainClass":"grass"},{"row":5,"column":3,"terrainClass":"grass2"},{"row":5,"column":4,"terrainClass":"grass2"},{"row":5,"column":5,"terrainClass":"grass"},{"row":5,"column":6,"terrainClass":"grass"},{"row":5,"column":7,"terrainClass":"grass2"},{"row":5,"column":8,"terrainClass":"grass3"},{"row":5,"column":9,"terrainClass":"grass"},{"row":5,"column":10,"terrainClass":"grass2"},{"row":5,"column":11,"terrainClass":"grass2"},{"row":5,"column":12,"terrainClass":"grass"},{"row":5,"column":13,"terrainClass":"grass2"},{"row":5,"column":14,"terrainClass":"grass3"},{"row":5,"column":15,"terrainClass":"grass2"},{"row":5,"column":16,"terrainClass":"grass2"},{"row":5,"column":17,"terrainClass":"grass3"},{"row":5,"column":18,"terrainClass":"grass2"},{"row":5,"column":19,"terrainClass":"grass3"}],[{"row":6,"column":0,"terrainClass":"grass"},{"row":6,"column":1,"terrainClass":"grass2"},{"row":6,"column":2,"terrainClass":"grass3"},{"row":6,"column":3,"terrainClass":"grass2"},{"row":6,"column":4,"terrainClass":"grass"},{"row":6,"column":5,"terrainClass":"grass"},{"row":6,"column":6,"terrainClass":"water2"},{"row":6,"column":7,"terrainClass":"grass3"},{"row":6,"column":8,"terrainClass":"grass"},{"row":6,"column":9,"terrainClass":"grass3"},{"row":6,"column":10,"terrainClass":"grass3"},{"row":6,"column":11,"terrainClass":"grass3"},{"row":6,"column":12,"terrainClass":"grass3"},{"row":6,"column":13,"terrainClass":"grass"},{"row":6,"column":14,"terrainClass":"grass3"},{"row":6,"column":15,"terrainClass":"grass3"},{"row":6,"column":16,"terrainClass":"grass"},{"row":6,"column":17,"terrainClass":"grass2"},{"row":6,"column":18,"terrainClass":"water2"},{"row":6,"column":19,"terrainClass":"grass"}],[{"row":7,"column":0,"terrainClass":"grass"},{"row":7,"column":1,"terrainClass":"water2"},{"row":7,"column":2,"terrainClass":"grass"},{"row":7,"column":3,"terrainClass":"grass3"},{"row":7,"column":4,"terrainClass":"grass3"},{"row":7,"column":5,"terrainClass":"grass3"},{"row":7,"column":6,"terrainClass":"grass2"},{"row":7,"column":7,"terrainClass":"grass2"},{"row":7,"column":8,"terrainClass":"grass2"},{"row":7,"column":9,"terrainClass":"grass2"},{"row":7,"column":10,"terrainClass":"grass2"},{"row":7,"column":11,"terrainClass":"grass3"},{"row":7,"column":12,"terrainClass":"grass3"},{"row":7,"column":13,"terrainClass":"grass2"},{"row":7,"column":14,"terrainClass":"grass3"},{"row":7,"column":15,"terrainClass":"water"},{"row":7,"column":16,"terrainClass":"rock"},{"row":7,"column":17,"terrainClass":"water2"},{"row":7,"column":18,"terrainClass":"water2"},{"row":7,"column":19,"terrainClass":"water"}],[{"row":8,"column":0,"terrainClass":"grass2"},{"row":8,"column":1,"terrainClass":"grass2"},{"row":8,"column":2,"terrainClass":"grass"},{"row":8,"column":3,"terrainClass":"grass3"},{"row":8,"column":4,"terrainClass":"grass"},{"row":8,"column":5,"terrainClass":"grass3"},{"row":8,"column":6,"terrainClass":"rock2"},{"row":8,"column":7,"terrainClass":"grass2"},{"row":8,"column":8,"terrainClass":"grass2"},{"row":8,"column":9,"terrainClass":"grass2"},{"row":8,"column":10,"terrainClass":"water"},{"row":8,"column":11,"terrainClass":"grass2"},{"row":8,"column":12,"terrainClass":"grass2"},{"row":8,"column":13,"terrainClass":"grass"},{"row":8,"column":14,"terrainClass":"grass"},{"row":8,"column":15,"terrainClass":"grass"},{"row":8,"column":16,"terrainClass":"grass3"},{"row":8,"column":17,"terrainClass":"grass"},{"row":8,"column":18,"terrainClass":"grass"},{"row":8,"column":19,"terrainClass":"water"}],[{"row":9,"column":0,"terrainClass":"grass3"},{"row":9,"column":1,"terrainClass":"grass"},{"row":9,"column":2,"terrainClass":"grass"},{"row":9,"column":3,"terrainClass":"water2"},{"row":9,"column":4,"terrainClass":"grass3"},{"row":9,"column":5,"terrainClass":"water2"},{"row":9,"column":6,"terrainClass":"water2"},{"row":9,"column":7,"terrainClass":"grass"},{"row":9,"column":8,"terrainClass":"grass"},{"row":9,"column":9,"terrainClass":"grass2"},{"row":9,"column":10,"terrainClass":"grass3"},{"row":9,"column":11,"terrainClass":"grass"},{"row":9,"column":12,"terrainClass":"grass3"},{"row":9,"column":13,"terrainClass":"grass3"},{"row":9,"column":14,"terrainClass":"grass3"},{"row":9,"column":15,"terrainClass":"grass"},{"row":9,"column":16,"terrainClass":"grass2"},{"row":9,"column":17,"terrainClass":"grass2"},{"row":9,"column":18,"terrainClass":"grass"},{"row":9,"column":19,"terrainClass":"grass3"}],[{"row":10,"column":0,"terrainClass":"lava"},{"row":10,"column":1,"terrainClass":"grass3"},{"row":10,"column":2,"terrainClass":"grass2"},{"row":10,"column":3,"terrainClass":"water2"},{"row":10,"column":4,"terrainClass":"water"},{"row":10,"column":5,"terrainClass":"grass"},{"row":10,"column":6,"terrainClass":"grass2"},{"row":10,"column":7,"terrainClass":"grass"},{"row":10,"column":8,"terrainClass":"grass2"},{"row":10,"column":9,"terrainClass":"grass3"},{"row":10,"column":10,"terrainClass":"grass"},{"row":10,"column":11,"terrainClass":"grass"},{"row":10,"column":12,"terrainClass":"grass2"},{"row":10,"column":13,"terrainClass":"grass3"},{"row":10,"column":14,"terrainClass":"grass3"},{"row":10,"column":15,"terrainClass":"grass2"},{"row":10,"column":16,"terrainClass":"grass2"},{"row":10,"column":17,"terrainClass":"rock2"},{"row":10,"column":18,"terrainClass":"grass"},{"row":10,"column":19,"terrainClass":"grass3"}],[{"row":11,"column":0,"terrainClass":"grass3"},{"row":11,"column":1,"terrainClass":"grass"},{"row":11,"column":2,"terrainClass":"grass"},{"row":11,"column":3,"terrainClass":"grass3"},{"row":11,"column":4,"terrainClass":"grass3"},{"row":11,"column":5,"terrainClass":"rock"},{"row":11,"column":6,"terrainClass":"grass"},{"row":11,"column":7,"terrainClass":"grass3"},{"row":11,"column":8,"terrainClass":"grass2"},{"row":11,"column":9,"terrainClass":"grass2"},{"row":11,"column":10,"terrainClass":"grass"},{"row":11,"column":11,"terrainClass":"water2"},{"row":11,"column":12,"terrainClass":"grass2"},{"row":11,"column":13,"terrainClass":"grass"},{"row":11,"column":14,"terrainClass":"grass"},{"row":11,"column":15,"terrainClass":"grass2"},{"row":11,"column":16,"terrainClass":"grass2"},{"row":11,"column":17,"terrainClass":"grass2"},{"row":11,"column":18,"terrainClass":"rock"},{"row":11,"column":19,"terrainClass":"water2"}],[{"row":12,"column":0,"terrainClass":"grass"},{"row":12,"column":1,"terrainClass":"grass3"},{"row":12,"column":2,"terrainClass":"grass2"},{"row":12,"column":3,"terrainClass":"rock"},{"row":12,"column":4,"terrainClass":"grass"},{"row":12,"column":5,"terrainClass":"water"},{"row":12,"column":6,"terrainClass":"grass"},{"row":12,"column":7,"terrainClass":"grass3"},{"row":12,"column":8,"terrainClass":"grass"},{"row":12,"column":9,"terrainClass":"water"},{"row":12,"column":10,"terrainClass":"grass3"},{"row":12,"column":11,"terrainClass":"water"},{"row":12,"column":12,"terrainClass":"grass"},{"row":12,"column":13,"terrainClass":"water"},{"row":12,"column":14,"terrainClass":"grass2"},{"row":12,"column":15,"terrainClass":"grass2"},{"row":12,"column":16,"terrainClass":"grass"},{"row":12,"column":17,"terrainClass":"grass3"},{"row":12,"column":18,"terrainClass":"grass"},{"row":12,"column":19,"terrainClass":"grass"}],[{"row":13,"column":0,"terrainClass":"water2"},{"row":13,"column":1,"terrainClass":"grass3"},{"row":13,"column":2,"terrainClass":"grass"},{"row":13,"column":3,"terrainClass":"grass3"},{"row":13,"column":4,"terrainClass":"water2"},{"row":13,"column":5,"terrainClass":"grass"},{"row":13,"column":6,"terrainClass":"grass"},{"row":13,"column":7,"terrainClass":"grass3"},{"row":13,"column":8,"terrainClass":"grass"},{"row":13,"column":9,"terrainClass":"rock2"},{"row":13,"column":10,"terrainClass":"grass3"},{"row":13,"column":11,"terrainClass":"grass3"},{"row":13,"column":12,"terrainClass":"grass"},{"row":13,"column":13,"terrainClass":"grass2"},{"row":13,"column":14,"terrainClass":"grass"},{"row":13,"column":15,"terrainClass":"grass3"},{"row":13,"column":16,"terrainClass":"grass2"},{"row":13,"column":17,"terrainClass":"grass2"},{"row":13,"column":18,"terrainClass":"grass"},{"row":13,"column":19,"terrainClass":"grass2"}],[{"row":14,"column":0,"terrainClass":"water"},{"row":14,"column":1,"terrainClass":"grass2"},{"row":14,"column":2,"terrainClass":"grass3"},{"row":14,"column":3,"terrainClass":"grass3"},{"row":14,"column":4,"terrainClass":"grass"},{"row":14,"column":5,"terrainClass":"grass2"},{"row":14,"column":6,"terrainClass":"rock"},{"row":14,"column":7,"terrainClass":"grass"},{"row":14,"column":8,"terrainClass":"grass3"},{"row":14,"column":9,"terrainClass":"grass2"},{"row":14,"column":10,"terrainClass":"grass2"},{"row":14,"column":11,"terrainClass":"water2"},{"row":14,"column":12,"terrainClass":"grass2"},{"row":14,"column":13,"terrainClass":"rock2"},{"row":14,"column":14,"terrainClass":"grass2"},{"row":14,"column":15,"terrainClass":"grass3"},{"row":14,"column":16,"terrainClass":"grass2"},{"row":14,"column":17,"terrainClass":"grass"},{"row":14,"column":18,"terrainClass":"grass3"},{"row":14,"column":19,"terrainClass":"grass3"}],[{"row":15,"column":0,"terrainClass":"grass2"},{"row":15,"column":1,"terrainClass":"grass"},{"row":15,"column":2,"terrainClass":"grass"},{"row":15,"column":3,"terrainClass":"grass3"},{"row":15,"column":4,"terrainClass":"water2"},{"row":15,"column":5,"terrainClass":"rock"},{"row":15,"column":6,"terrainClass":"grass2"},{"row":15,"column":7,"terrainClass":"grass3"},{"row":15,"column":8,"terrainClass":"grass3"},{"row":15,"column":9,"terrainClass":"grass3"},{"row":15,"column":10,"terrainClass":"grass"},{"row":15,"column":11,"terrainClass":"grass"},{"row":15,"column":12,"terrainClass":"water2"},{"row":15,"column":13,"terrainClass":"grass"},{"row":15,"column":14,"terrainClass":"grass2"},{"row":15,"column":15,"terrainClass":"grass2"},{"row":15,"column":16,"terrainClass":"grass2"},{"row":15,"column":17,"terrainClass":"grass"},{"row":15,"column":18,"terrainClass":"grass"},{"row":15,"column":19,"terrainClass":"grass"}],[{"row":16,"column":0,"terrainClass":"grass"},{"row":16,"column":1,"terrainClass":"grass3"},{"row":16,"column":2,"terrainClass":"grass2"},{"row":16,"column":3,"terrainClass":"grass"},{"row":16,"column":4,"terrainClass":"grass3"},{"row":16,"column":5,"terrainClass":"grass"},{"row":16,"column":6,"terrainClass":"grass2"},{"row":16,"column":7,"terrainClass":"grass2"},{"row":16,"column":8,"terrainClass":"grass2"},{"row":16,"column":9,"terrainClass":"grass3"},{"row":16,"column":10,"terrainClass":"grass3"},{"row":16,"column":11,"terrainClass":"water"},{"row":16,"column":12,"terrainClass":"grass3"},{"row":16,"column":13,"terrainClass":"grass"},{"row":16,"column":14,"terrainClass":"water"},{"row":16,"column":15,"terrainClass":"grass3"},{"row":16,"column":16,"terrainClass":"water2"},{"row":16,"column":17,"terrainClass":"grass"},{"row":16,"column":18,"terrainClass":"grass3"},{"row":16,"column":19,"terrainClass":"grass"}],[{"row":17,"column":0,"terrainClass":"water"},{"row":17,"column":1,"terrainClass":"grass3"},{"row":17,"column":2,"terrainClass":"grass"},{"row":17,"column":3,"terrainClass":"grass"},{"row":17,"column":4,"terrainClass":"rock"},{"row":17,"column":5,"terrainClass":"grass2"},{"row":17,"column":6,"terrainClass":"grass2"},{"row":17,"column":7,"terrainClass":"grass"},{"row":17,"column":8,"terrainClass":"grass"},{"row":17,"column":9,"terrainClass":"grass2"},{"row":17,"column":10,"terrainClass":"grass"},{"row":17,"column":11,"terrainClass":"rock"},{"row":17,"column":12,"terrainClass":"rock"},{"row":17,"column":13,"terrainClass":"lava"},{"row":17,"column":14,"terrainClass":"water2"},{"row":17,"column":15,"terrainClass":"grass3"},{"row":17,"column":16,"terrainClass":"grass2"},{"row":17,"column":17,"terrainClass":"grass3"},{"row":17,"column":18,"terrainClass":"grass"},{"row":17,"column":19,"terrainClass":"grass2"}],[{"row":18,"column":0,"terrainClass":"water"},{"row":18,"column":1,"terrainClass":"grass2"},{"row":18,"column":2,"terrainClass":"grass3"},{"row":18,"column":3,"terrainClass":"grass2"},{"row":18,"column":4,"terrainClass":"water"},{"row":18,"column":5,"terrainClass":"rock"},{"row":18,"column":6,"terrainClass":"grass"},{"row":18,"column":7,"terrainClass":"grass"},{"row":18,"column":8,"terrainClass":"grass2"},{"row":18,"column":9,"terrainClass":"grass3"},{"row":18,"column":10,"terrainClass":"grass3"},{"row":18,"column":11,"terrainClass":"grass"},{"row":18,"column":12,"terrainClass":"grass"},{"row":18,"column":13,"terrainClass":"grass2"},{"row":18,"column":14,"terrainClass":"grass2"},{"row":18,"column":15,"terrainClass":"grass"},{"row":18,"column":16,"terrainClass":"water2"},{"row":18,"column":17,"terrainClass":"grass3"},{"row":18,"column":18,"terrainClass":"grass3"},{"row":18,"column":19,"terrainClass":"grass2"}],[{"row":19,"column":0,"terrainClass":"rock"},{"row":19,"column":1,"terrainClass":"grass"},{"row":19,"column":2,"terrainClass":"grass"},{"row":19,"column":3,"terrainClass":"grass"},{"row":19,"column":4,"terrainClass":"water"},{"row":19,"column":5,"terrainClass":"grass3"},{"row":19,"column":6,"terrainClass":"grass3"},{"row":19,"column":7,"terrainClass":"grass3"},{"row":19,"column":8,"terrainClass":"grass"},{"row":19,"column":9,"terrainClass":"grass"},{"row":19,"column":10,"terrainClass":"water2"},{"row":19,"column":11,"terrainClass":"grass2"},{"row":19,"column":12,"terrainClass":"grass3"},{"row":19,"column":13,"terrainClass":"grass3"},{"row":19,"column":14,"terrainClass":"grass2"},{"row":19,"column":15,"terrainClass":"grass3"},{"row":19,"column":16,"terrainClass":"grass2"},{"row":19,"column":17,"terrainClass":"grass3"},{"row":19,"column":18,"terrainClass":"grass"},{"row":19,"column":19,"terrainClass":"grass3"}]];
        
        for (let row = 0; row < this.rows; row++) {
            const currentRow = [];
            this.board.push(currentRow);
            for (let column = 0; column < this.columns; column++) {
                let tile = new Tile(row, column);
                tile.terrainClass = savedMap[row][column].terrainClass;
                console.log(tile)
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