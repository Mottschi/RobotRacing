/*
* Default settings - can be adjusted (all at once or individually) when calling 
* the GameManager constructor
*/

import { getRandomArrayElement, DIRECTIONS, UIController } from "./helpers.js";

import easyMap from '../assets/maps/easy.js';
import mediumMap from '../assets/maps/medium.js';
import hardMap from '../assets/maps/hard.js';
import mountainMap from '../assets/maps/mountains.js';
import startinglocationtest from "../assets/maps/startinglocationtest.js";

class Terrain {
    constructor(name, classes) {
        this.name = name;
        this.classes = classes;
    }
}

/**
 * Default settings for the game. These values can be modified
 * by the application and will effect either
 * - the ongoing game: music, soundEffects, tileSize
 * - the next new game: rows, columns, randomMap, players (if I get to that point...)
 */
export const DEFAULT_SETTINGS = {
    rows: 10,
    columns: 10,
    tileSize: 50,
    randomMap: false,
    players: 1,
    music: false,
    soundEffects: false,
}

/**
 * Game data that should not be modified, but may need to be accessed outside 
 * the game logic itself (for example to set up audio controller or for a level
 * editor) 
 * 
 * Eventually it would be nice if we can have all variability in here, so game can be changed
 * (new terrain options, different sound effects/music, maps, different dice) just by changing
 * the game data
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
    playerSprites: ['robot_3Dred', 'robot_3Dyellow'],
    startingLife: 5,
}

class GameManager {
    /**
     * Create a new game manager for a round of RobotRacing
     * @param {Object} setup Optional setup instructions
     */
    constructor(setup) {
        this.running = false;
        this.state = null;

        this.tileSize = setup.tileSize ? setup.tileSize : DEFAULT_SETTINGS.tileSize;
        this.randomMap = setup.randomMap !== undefined ? setup.randomMap : DEFAULT_SETTINGS.randomMap;

        this.audioController = setup.audioController;
        for (let clipName in GAME_DATA.soundEffects) {
            this.audioController.addClip(clipName, GAME_DATA.soundEffects[clipName]);
        }
        
        this.terrainOptions = GAME_DATA.terrainOptions;
        let startingLocation;
        if (this.randomMap) {
            // when we load a random game board, the size depends on settings
            this.rows = setup.rows ? setup.rows : DEFAULT_SETTINGS.rows;
            this.columns = setup.columns ? setup.columns : DEFAULT_SETTINGS.columns;
            this.gameBoard = new RandomGameBoard(this.terrainOptions, this.rows, this.columns);
            startingLocation = this.gameBoard.getRandomStartingLocation()
        } else {
            // when we load a default game board, the size will depend on the loaded map
            this.gameBoard = new DefaultGameBoard(this.terrainOptions);
            this.rows = this.gameBoard.rows;
            this.columns = this.gameBoard.columns;
            startingLocation = this.gameBoard.getDefaultStartingLocation()
        }

        // later on, it might be nice to add multiplayer, but for now, playercount is hardset to 1
        this.playerCount = 1;
        this.player = new Player('Player 1', new Location(startingLocation.row, startingLocation.column));

        this.uiController = new UIController(this.rows, this.columns);
    }

    startGame() {
        this.running = true;        
        this.uiController.setupNewGame(this.gameBoard, this.player);

        this.state = new InputState(caller);
        this.state.exit();

        // // resetting event listeners on the buttons to avoid multiple player characters showing on later games
        // // TODO test out if this is still necessary once the actual rolling dice for input is done
        // document.getElementById('game-inputs').innerHTML += '';

        // // NOTE temp dev code
        // const btnLeft = document.querySelector('#btn-turn-left');
        // const btnRight = document.querySelector('#btn-turn-right');
        // const btnMove1 = document.querySelector('#btn-move-1');
        // const btnMove2 = document.querySelector('#btn-move-2');
        // const btnMove3 = document.querySelector('#btn-move-3');

        // btnLeft.addEventListener('click', ()=>{
        //     const command = new TurnLeftCommand(this.player, this.gameBoard);
        //     command.execute();
        //     this.uiController.alignPlayerSprite(this.player);
        // })

        // btnRight.addEventListener('click', ()=>{
        //     const command = new TurnRightCommand(this.player, this.gameBoard);
        //     command.execute();
        //     this.uiController.alignPlayerSprite(this.player);
        // })

        // btnMove1.addEventListener('click', ()=>{
        //     const originalPosition = {...this.player.location};
        //     const command = new MoveOneCommand(this.player, this.gameBoard);
        //     command.execute();
        //     this.uiController.movePlayerSprite(this.player, originalPosition);
        // })

        // btnMove2.addEventListener('click', ()=>{
        //     const originalPosition = {...this.player.location};
        //     const command = new MoveTwoCommand(this.player, this.gameBoard);
        //     command.execute();
        //     this.uiController.movePlayerSprite(this.player, originalPosition);
        // })

        // btnMove3.removeEventListener('click', m3);
        // btnMove3.addEventListener('click', m3.bind(this))

        // function m3() {
        //     const originalPosition = {...this.player.location};
        //     const command = new MoveThreeCommand(this.player, this.gameBoard);
        //     command.execute();
        //     this.uiController.movePlayerSprite(this.player, originalPosition);
        // }
    }
}

class GameBoard {
    constructor(terrain) {
        this.board = [];
        this.terrain = terrain;
    }

    // picks any location on the bottom row that has grass, if there is none, creates one
    getRandomStartingLocation() {
        return getRandomArrayElement(this.board[this.board.length-1].filter(tile => tile.terrainName === 'grass'));
    }

    getDefaultStartingLocation() {
        return this.board[this.board.length-1].reduce((acc, tile) => {
            if (tile.terrainName === 'grass') return tile;
            return acc;
        })
    }
}

class DefaultGameBoard extends GameBoard {
    constructor(terrain) {
        super(terrain);

        let savedMap
        savedMap = easyMap;
        // savedMap = mediumMap;
        // savedMap = hardMap;
        // savedMap = mountainMap;
        savedMap = startinglocationtest;

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
    }
}

class RandomGameBoard extends GameBoard {
    constructor(terrain, rows, columns) {
        super(terrain);
        this.rows = rows;
        this.columns = columns;

        for (let row = 0; row < this.rows; row++) {
            const currentRow = [];
            this.board.push(currentRow);
            for (let column = 0; column < this.columns; column++) {
                const rng = Math.random();
                let type = this.terrain.grass;

                // TODO Find a way to move the terrain rarity to game data (terrain options)
                // instead of hardcoding it
                if (rng > .98) type = this.terrain.lava;
                else if (rng > .93) type = this.terrain.rock
                else if (rng > .78) type = this.terrain.water;
                currentRow.push(new Tile(row, column, type))
            }
        }
    }
}

class LevelEditorBoard extends GameBoard {
    constructor(terrain, rows, columns) {
        super(terrain);
        this.rows = rows;
        this.columns = columns;

        for (let row = 0; row < this.rows; row++) {
            const currentRow = [];
            this.board.push(currentRow);
            for (let column = 0; column < this.columns; column++) {
                let tile = new Tile(row, column, GAME_DATA.terrainOptions['grass']);
                currentRow.push(tile)
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

/**
 * 'Abstract' class/interface (neither of which exists properly in JS unfortunately)
 *  Not to be used directly, only for inheritance purpose. All subclasses must override 
 *  the turn and enter methods with an actual implementation.
 * 
 * Because of the asynchrounus nature of JS, trying out a way for the state to be the one to 
 * call the gamemanager back once it's time to move onto next state, so we need the game manager
 * to add itself as argument to the constructor of a state
 */
class State {
    constructor (owner, player) {
        this.owner = owner;
        this.player = player;
    }

    enter () {
        throw Error('Each subclass of State must implement the enter method themselves!');
    }

    exit () {
        throw Error('Each subclass of State must implement the exit method themselves!');
    }
}

class InputState extends State {
    /**
     * Create a new input state.
     * @param {GameManager} owner 
     * @param {Player} player 
     */
    constructor(owner, player) {
        super(owner, player);
        this.commandQueue = [];
    }
    enter () {
        // When entering input state, we have to:

        // 0. (show user we are entering input state)


        // 1. roll the players dice


        // 2. display dice results


        // 3. set up the event handlers so that player can pick order of execution for his commands


        // 4. set up event handler that will allow player to confirm his moves after order is picked. 
        //    this will then call the states exit() method
    }

    exit () {
        this.owner.state = new ExecuteCommandQueueState(this.owner, this.player, this.commandQueue);
        this.owner.onStateChange();
    }
}

class ExecuteCommandQueueState extends State {
    /**
     * Create a new state to execute all commands of a command queue
     * @param {GameManager} owner 
     * @param {Player} player 
     * @param {Array} commandQueue 
     */
    constructor(owner, player, commandQueue) {
        super(owner, player);
        this.commandQueue = commandQueue;
        this.currentCommand = 0;
    }

    enter () {
        // on entering this state, we
        // 1. start working off the commands one by one
        // 2. check after each command whether the player is still alive and has not found the flag
        // 3. once either all commands are over or game is over, call the states exit method
    }

    executeCommand() {
        const command = this.commandQueue[this.currentCommand++];
        command.execute()

    }

    exit () {
        this.owner.state = new InputState(this.owner, this.player);
        this.owner.onStateChange();
    }
}

/**
 * Basically a 2d Vector datastructure, but for clarity the values are called 
 * row and column instead of x and y
 */
class Location {
    constructor(row, column) {
        this.row = row;
        this.column = column;
    }
}

class Player {
    constructor(name, location) {
        console.log(location)

        this.name = name;
        this.location = location;
        this.sprite = getRandomArrayElement(GAME_DATA.playerSprites);
        this.lifes = GAME_DATA.startingLife;

        // for now, we only have one type of die so this could be simplified
        // but one of the addon ideas for the game is to variants, so we keep that option
        // open right now
        this.dice = [new Die(), new Die(), new Die()];

        // for now, players always start facing upwards, could be changed later
        this.facingDirection = 0;
    }

    /**
     * Rolls all of the players dice and returns an Array of the resulting commands
     */
    rollDice() {
        return this.dice.map(die => die.roll());
    }
}

/**
 * Die that contains a number of options. Can be rolled to receive a command class (that can then be used to receive a command)
 */
class Die {
    constructor() {
        this.options = [
            TurnLeftCommand,
            TurnRightCommand,
            MoveOneCommand,
            MoveTwoCommand,
            MoveThreeCommand,
        ]
    }

    roll () {
        return getRandomArrayElement(this.options);
    }
}

/**
 * 'Abstract' class/interface (neither of which exists properly in JS unfortunately)
 *  Not to be used directly, only for inheritance purpose. All subclasses must override 
 *  the execute method with an actual implementation.
 * 
 * Executing a command will return an object with the properties
 * damage - the amount of damage taken when performing this command
 * conntinue - whether execution of the CommandQueue can continue (player stops for good 
 *              when hitting water)
 */
class Command {
    constructor(player) {
        this.player = player;
    }

    execute() {
        throw Error('Each subclass of Command must implement the execute method themselves!');
    }
}

class MoveCommand extends Command {
    constructor(player, gameBoard) {
        super(player);
        this.gameBoard = gameBoard;
        this.rows = gameBoard.rows;
        this.columns = gameBoard.columns;
    }

    /**
     * Used to revert the last step from within a move command
     */
    stepBack() {
        switch (this.player.facingDirection) {
            case 0:
                this.player.location.row++;
                break;
            case 1:
                this.player.location.column--;
                break;
            case 2:
                this.player.location.row--;
                break;
            case 3:
                this.player.location.column++;
                break;
        }
    }

    oneStep() {
        // check for map boundaries before adjuisting location
        // hitting boundaries does not cause damage or interrupt execution of further commands
        switch (this.player.facingDirection) {
            case 0:
                if (this.player.location.row > 0) this.player.location.row--;
                break;
            case 1:
                if (this.player.location.column < this.columns - 1) this.player.location.column++;
                break;
            case 2:
                if (this.player.location.row < this.rows - 1) this.player.location.row++;
                break;
            case 3:
                if (this.player.location.column > 0) this.player.location.column--;
                break;
        }

        // Prepare the result to return, then check the terrain we landed on and act accordingly
        let commandResult = {
            damage: 0, 
            continue: true,
            continueCurrentMoveCommand: false,
            landedOnTerrain: this.gameBoard.board[this.player.location.row][this.player.location.column].terrainName
        }

        switch (commandResult.landedOnTerrain) {
            case 'grass':
                commandResult.continueCurrentMoveCommand = true;
                break;
            case 'lava':
                commandResult.damage = 99;
                commandResult.continue = false;
                break;
            case 'rock':
                commandResult.damage = 1;
                this.stepBack();
                break;
            case 'water':
                commandResult.damage = 1;
                commandResult.continue = false;
                this.stepBack();
                break;
        }

        return commandResult;
    }
}

/**
 * Executing a MoveOneCommand moves the oplayer one step forward, if possible
 * 
 * Executing a command will return an object with the properties
 * damage - the amount of damage taken when performing this command
 * conntinue - whether execution of the CommandQueue can continue (player stops for good 
 *              when hitting water)
 */
class MoveOneCommand extends MoveCommand {
    execute() {
        return this.oneStep();
    }
}

/**
 * Executing a MoveTwoCommand moves the oplayer two step forward, if possible
 * 
 * Executing a command will return an object with the properties
 * damage - the amount of damage taken when performing this command
 * conntinue - whether execution of the CommandQueue can continue (player stops for good 
 *              when hitting water)
 */
class MoveTwoCommand extends MoveCommand {
    execute() {
        let commandResult;
        for (let i = 0; i < 2; i++) {
            commandResult = this.oneStep();
            if (!commandResult.continueCurrentMoveCommand) return commandResult;
        }
        return commandResult;
    }   
}


/**
 * Executing a MoveThreeCommand moves the oplayer three steps forward, if possible
 * 
 * Executing a command will return an object with the properties
 * damage - the amount of damage taken when performing this command
 * conntinue - whether execution of the CommandQueue can continue (player stops for good 
 *              when hitting water)
 */
class MoveThreeCommand extends MoveCommand {
    execute() {
        let commandResult;
        for (let i = 0; i < 3; i++) {
            commandResult = this.oneStep();
            if (!commandResult.continueCurrentMoveCommand) return commandResult;
        }
        return commandResult;
    }  
}

/**
 * Executing a TurnLeftCommand adjusts the direction the player is facing 90 degrees left
 * 
 * Executing a command will return an object with the properties
 * damage - the amount of damage taken when performing this command
 * conntinue - whether execution of the CommandQueue can continue (player stops for good 
 *              when hitting water)
 */
class TurnLeftCommand extends Command {
    execute() {
        this.player.facingDirection = (this.player.facingDirection - 1);
        // As in JS, modulo of a negative number returns a negative value, 
        // we cannot use the modulo to access the corrected index here, have to check directly for negative value
        if (this.player.facingDirection < 0) this.player.facingDirection += 4;
        return {damage: 0, continue: true};
    }
}

/**
 * Executing a TurnRightCommand adjusts the direction the player is facing 90 degrees right
 * 
 * Executing a command will return an object with the properties
 * damage - the amount of damage taken when performing this command
 * conntinue - whether execution of the CommandQueue can continue (player stops for good 
 *              when hitting water)
 */
class TurnRightCommand extends Command {
    execute() {
        this.player.facingDirection = (this.player.facingDirection + 1) % 4;
        return {damage: 0, continue: true};
    }
}

/**
 * Level Editor - used for handcrafting levels, Dev tool that will not be visible in final game
 * but is still part of the "game engine"
 */
export class LevelEditor extends GameManager{
    startGame() {
        // initialize all tiles with grass
        this.gameBoard = new LevelEditorBoard(this.terrainOptions, this.rows, this.columns);

        // set up the level editor in the browser
        this.uiController.setupNewGame(this.gameBoard, this.player);

        // TODO consider moving html interaction to uiController 
        // (worth it considering level editor is not part of final game?)

        // attach event handlers to all tiles that cycle through the terrain options on click
        document.querySelectorAll('.tile').forEach(tile => tile.addEventListener('click', this.changeTerrain.bind(this)));
        return this.gameBoard.board;
    }

    changeTerrain(event) {
        const tileDiv = event.target;
        const row = tileDiv.getAttribute('row');
        const column = tileDiv.getAttribute('column');
        const tile = this.gameBoard.board[row][column];
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