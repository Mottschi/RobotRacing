/*
* Default settings - can be adjusted (all at once or individually) when calling 
* the GameManager constructor
*/

import { getRandomArrayElement, UIController } from "./helpers.js";

import easyMap from '../assets/maps/easy.js';
import mediumMap from '../assets/maps/medium.js';
import hardMap from '../assets/maps/hard.js';


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
        gameOver: 'game-over.mp3',
        dice: 'dice.mp3',
    },
    icons: {
        MoveOneCommand: '1-solid.svg',
        MoveTwoCommand: '2-solid.svg',
        MoveThreeCommand: '3-solid.svg',
        TurnLeftCommand: 'arrow-rotate-left-solid.svg',
        TurnRightCommand: 'arrow-rotate-right-solid.svg',
        MoveBackwardsCommand: 'arrow-down-long-solid.svg',
    },
    dialogs: {
        enterExecuteState: 'dlg-enter-execute-state',
        enterInputState: 'dlg-enter-input-state',
        enterGameOverState: 'dlg-enter-game-over-state',
        enterMapCompleteState: 'dlg-enter-map-complete-state',
    },
    playerSprites: ['robot_3Dred', 'robot_3Dyellow'],
    startingLife: 3,
    showDev: false,
    diceAmount: 5,
    turnTimeInMS: 300,
}

class GameManager {
    /**
     * Create a new game manager for a round of RobotRacing
     * @param {Object} settings Optional settings instructions
     */
    constructor(settings) {
        this.settings = settings;

        this.intervalID = null;
        this.state = null;
        this.map = 0;

        this.tileSize = settings.tileSize ? settings.tileSize : DEFAULT_SETTINGS.tileSize;

        this.audioController = settings.audioController;
        
        this.uiController = new UIController(this.rows, this.columns);
    }

    init() {
        // setting up assets (audio clips, dialogs, icons)
        for (let clipName in GAME_DATA.soundEffects) {
            this.audioController.addClip(clipName, GAME_DATA.soundEffects[clipName]);
        }

        for (let dialogName in GAME_DATA.dialogs) {
            this.uiController.addDialog(dialogName, GAME_DATA.dialogs[dialogName]);
        }

        for (let iconName in GAME_DATA.icons) {
            this.uiController.addIcon(iconName, GAME_DATA.icons[iconName]);
        }
        this.player = new Player('Player 1', new Location(0, 0));
    }

    setupNextMap() {
        if (this.map > 2) {
            // when we load a random game board, the size depends on settings
            this.rows = this.settings.rows ? this.settings.rows : DEFAULT_SETTINGS.rows;
            this.columns = this.settings.columns ? this.settings.columns : DEFAULT_SETTINGS.columns;
            this.gameBoard = new RandomGameBoard(GAME_DATA.terrainOptions, this.rows, this.columns);
        } else {
            // when we load a default game board, the size will depend on the loaded map
            this.gameBoard = new DefaultGameBoard(GAME_DATA.terrainOptions, this.map);
            this.rows = this.gameBoard.rows;
            this.columns = this.gameBoard.columns;
        }

        this.gameBoard.init();
        const {row, column} = this.gameBoard.startingLocation;
        this.player.location = new Location(row, column);

        this.map++;

        return this.gameBoard;
    }

    startGame() {
        this.state = new SetupState(this.player, this.uiController, this.gameBoard, this.audioController);
        this.state.enter();

        if (GAME_DATA.showDev) {
            this.devControls();
            this.uiController.showDevTools();
        }

        this.intervalID = setInterval(()=>{
            this.update();
        }, GAME_DATA.turnTimeInMS);
    }

    // GameManagers update method calls update on whatever is the current state
    // the actions (if any) will then depend on that state
    update() {
        // states update methods will return nothing (undefined) if nothing was done
        // if an action was taken, the state will return information on the action results
        const response = this.state.update(this);
        if (response) {
            // check for and deal with all possible outcomes
            if (response.landedOnTerrain) {
                switch (response.landedOnTerrain) {
                    case 'grass': 
                        this.audioController.playClip('acknowledged');
                        break;
                    case 'water': 
                        this.audioController.playClip('water');
                        break;
                    case 'rock':
                        this.audioController.playClip('explosion');
                        break;
                    case 'lava': 
                        this.audioController.playClip('explosion');
                        break;
                    case 'reset':
                        // TODO reset happens on a special move executed after hitting water
                        // damage is already done, but might want a special sound effect 
                        // for the reset to play here
                        break;
                }

                this.uiController.movePlayerSprite(this.player);
                this.uiController.alignPlayerSprite(this.player);

                this.checkForWin();
            }

            if (response.damage) {
                this.handleDamage(response.damage);
            }

            // check if it is time to move on to the next state
            if (response.stateFinished) {
                this.state = this.state.exit();
                if (!this.state) {
                    // no new state, so game is over, time to stop our update loop
                    clearInterval(this.intervalID);
                }
                this.state.enter();
            }

        }
    }

    handleDamage(damage) {
        this.player.lifes = Math.max(0, this.player.lifes - damage);
        this.uiController.updatePlayerLifes(this.player);
        if (this.player.lifes === 0) {
            // GAME OVER MAN, GAME OVER
            this.state.exit(true);
            this.state = new GameOverState(this.player, this.uiController, this.gameBoard, this.audioController);
            this.state.enter();
        }
    }

    checkForWin() {
        if (this.player.location.equal(this.gameBoard.flagLocation)) {
            this.state.exit(true);
            this.state = new MapCompletedState(this.player, this.uiController, this.gameBoard, this.audioController);
            this.state.enter();
        }

    }

    devControls() {
        // resetting event listeners on the buttons to avoid multiple player characters showing on later games
        // TODO test out if this is still necessary once the actual rolling dice for input is done
        document.getElementById('game-inputs').innerHTML += '';

        // NOTE temp dev code
        const btnLeft = document.querySelector('#btn-turn-left');
        const btnRight = document.querySelector('#btn-turn-right');
        const btnMove1 = document.querySelector('#btn-move-1');
        const btnMove2 = document.querySelector('#btn-move-2');
        const btnMove3 = document.querySelector('#btn-move-3');
        const btnMoveBack = document.querySelector('#btn-move-backwards');

        btnLeft.addEventListener('click', ()=>{
            const command = new TurnLeftCommand(this.player, this.gameBoard);
            command.execute();
            this.uiController.alignPlayerSprite(this.player);
        })

        btnRight.addEventListener('click', ()=>{
            const command = new TurnRightCommand(this.player, this.gameBoard);
            command.execute();
            this.uiController.alignPlayerSprite(this.player);
        })

        btnMove1.addEventListener('click', ()=>{
            const originalPosition = {...this.player.location};
            const command = new MoveOneCommand(this.player, this.gameBoard);
            command.execute();
            this.uiController.movePlayerSprite(this.player, originalPosition);
        })

        btnMove2.addEventListener('click', ()=>{
            const originalPosition = {...this.player.location};
            const command = new MoveTwoCommand(this.player, this.gameBoard);
            command.execute();
            this.uiController.movePlayerSprite(this.player, originalPosition);
        })

        btnMove3.removeEventListener('click', m3);
        btnMove3.addEventListener('click', m3.bind(this))

        function m3() {
            const originalPosition = {...this.player.location};
            const command = new MoveThreeCommand(this.player, this.gameBoard);
            command.execute();
            this.uiController.movePlayerSprite(this.player, originalPosition);
        }

        btnMoveBack.addEventListener('click', ()=> {
            const originalPosition = {...this.player.location};
            const command = new MoveBackwardsCommand(this.player, this.gameBoard);
            command.execute();
            this.uiController.movePlayerSprite(this.player, originalPosition);
        })
    }
}

class GameBoard {
    constructor(terrain) {
        this.board = [];
        this.terrain = terrain;
        this.startingLocation = null;
        this.flagLocation = null;
    }

    init() {
        this.setStartingLocation();
        this.setFlagLocation();
    }

    getDimension(){
        return {rows: this.rows, columns: this.columns}
    }

    // the player will always start on the bottom row, on the first grass tile found going
    // from the bottom right corner
    setStartingLocation() {
        let startTile = this.board[this.board.length-1].reduce((acc, tile) => {
            if (tile.terrainName === 'grass') return tile;
            return acc;
        })

        // TODO In cases where there was no grass on the bottom row, we force some into bottom right corner
        if (!this.startingLocation) {
            this.board[this.rows-1][this.columns-1] = new Tile(0, 0, GAME_DATA.terrainOptions['grass']);
        }

        this.startingLocation = startTile;
    }

    // similar to starting location, but with top left alignment instead of bottom right
    setFlagLocation() {
        let flagTile = this.board[0].filter(tile => tile.terrainName === 'grass')[0];
        
        if (!flagTile) {
            this.board[0][0] = new Tile(0, 0, GAME_DATA.terrainOptions['grass']);
            flagTile = this.board[0][0];
        }
        this.flagLocation = flagTile;
    }

    
}

class DefaultGameBoard extends GameBoard {
    constructor(terrain, map) {
        super(terrain);

        const currentMap = [easyMap, mediumMap, hardMap][map];

        this.rows = currentMap.length;
        this.columns = currentMap[0].length;
        
        for (let row = 0; row < this.rows; row++) {
            const currentRow = [];
            this.board.push(currentRow);
            for (let column = 0; column < this.columns; column++) {
                const terrainName = currentMap[row][column];
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

        this.setStartingLocation();
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
 *  the class methods with an actual implementation (they can do nothing in them if they don't
 *  need to, but they do need to implement them)
 */
class State {
    /**
     * Abstract State
     * @param {Player} player 
     * @param {UIController} uiController
     * @param {GameBoard} gameBoard
     * @param {AudioController} audioController
     */
    constructor (player, uiController, gameBoard, audioController) {
        this.player = player;
        this.uiController = uiController;
        this.gameBoard = gameBoard;
        this.audioController = audioController;

        this.updateCount = 0;
        this.dialogName = '';
    }

    /**
     * Base functionality when entering a new state is to introduce the state via
     * that states dialog.
     */
    enter () {
        this.uiController.showDialog(this.dialogName);
    }

    /**
     * Base functionality for states update function is to increment the updateCount and hide
     * the corresponding dialog after 3 update ticks.
     */
    update() {
        this.updateCount++;
        if (this.updateCount === 3) this.uiController.hideDialog(this.dialogName);
    }

    exit () {
        throw Error('Each subclass of State must implement the exit method themselves!');
    }
}

class InputState extends State {
    /**
     * Create a new input state.
     * @param {Player} player 
     * @param {UIController} uiController
     * @param {GameBoard} gameBoard
     * @param {AudioController} audioController
     */
    constructor (player, uiController, gameBoard, audioController) {
        super(player, uiController, gameBoard, audioController);
        this.commandQueue = [];
        this.dialogName = 'enterInputState';
    }
    enter () {
        // When entering input state, we have to:
        // 1. show user we are entering input state - the dialog will be hidden after 3 update tickets
        super.enter();

        // 2. roll the players dice
        const commandOptions = this.player.rollDice();
        this.audioController.playClip('dice');

        // 3. display dice results
        this.uiController.showDiceResults(commandOptions, this.chooseCommand.bind(this));

        // 4. set up the event handlers so that player can pick order of execution for his commands


        // 5. set up event handler that will allow player to confirm his moves after order is picked. 
        //    this will then call the states exit() method
    }

    chooseCommand(index, command) {
        this.commandQueue.push(command);
        this.uiController.updateChosenDiceResults(this.commandQueue);
    }

    update() {
        super.update();
        if (this.commandQueue.length === 3) return {stateFinished: true};
    }

    exit () {
        return new ExecuteCommandQueueState(this.player, this.uiController, this.gameBoard, this.audioController, this.commandQueue);
    }
}

class ExecuteCommandQueueState extends State {
    /**
     * Create a new state to execute all commands of a command queue
     * @param {Player} player 
     * @param {UIController} uiController
     * @param {gameBoard} gameBoard
     * @param {AudioController} audioController
     * @param {Array} commandQueue 
     */
    constructor(player, uiController, gameBoard, audioController, commandQueue) {
        super(player, uiController, gameBoard, audioController);
        this.commandQueue = commandQueue.map(command => new command(player, gameBoard));
        this.dialogName = 'enterExecuteState';  
    }

    // When entering input state, we have to:
    // 1. Show the enter state dialog for 3 update calls
    enter () {
        super.enter();
        const {row, column} = this.player.location;
        this.player.turnStartLocation = new Location(row, column);
    }

    // The remaining execution steps are handled in update:
    // 2. start working off the commands one by one, returning the return value of the command to game manager
    update() {
        super.update();
        if (this.updateCount > 3) {
            // each update tick after intro is closed, execute one command until we reach end of command queue
            const command = this.commandQueue.shift();
            
            // once commands run out (command is undefined), we need to let the game manager know it's time to move on
            if (!command) {
                return {stateFinished: true};
            }

            const result = command.execute();

            if (result.landedOnTerrain === 'water') this.commandQueue = [new ReturnToOriginCommand(this.player, this.gameBoard)];
            else if (result.landedOnTerrain === 'lava') this.commandQueue = [];

            return result;
        }  
    }

    exit () {
        return new InputState(this.player, this.uiController, this.gameBoard, this.audioController);
    }
}

class GameOverState extends State {
    constructor (player, uiController, gameBoard, audioController) {
        super(player, uiController, gameBoard, audioController);
        this.dialogName = 'enterGameOverState'
    }

    enter() {
        super.enter();
    }

    /**
     * When the game is over, we do NOT want to remove the game over dialog
     * based on a timer, only when the player clicks on a confirmation button
     */ 
    update() {
        super.update();
        if (this.updateCount === 3) this.audioController.playClip('gameOver');
        if (this.updateCount === 8) return {stateFinished: true}
    }

    exit() {
        this.uiController.stopGame();
        return null;
    }
}

class MapCompletedState extends State {
    constructor (player, uiController, gameBoard, audioController) {
        super(player, uiController, gameBoard, audioController);
        this.dialogName = 'enterMapCompleteState'
    }

    update() {
        super.update();
        // This state will automatically end after a couple of seconds
        // (just shows the dialog and then moves on);
        if (this.updateCount > 3) {
            return {stateFinished: true};
        }

    }

    exit() {
        // time to move on to next map
        return new SetupState(this.player, this.uiController, this.gameBoard, this.audioController);
    }
}

class SetupState extends State {
    constructor(player, uiController, gameBoard, audioController){
        super(player, uiController, gameBoard, audioController);
        this.dialogName = 'enterSetupState';
    }
    enter() {
        this.uiController.resetUI();
    }

    /**
     * 
     * @param {GameManager} gameManager 
     * @returns 
     */
    update(gameManager) {
        super.update();
        
        this.gameBoard = gameManager.setupNextMap();
        this.uiController.setupNewMap(this.gameBoard, this.player);
        return {stateFinished: true}
    }

    exit() {
        return new InputState(this.player, this.uiController, this.gameBoard, this.audioController);
    }
}


/**
 * Basically a 2d Vector datastructure, but for clarity the values are called 
 * row and column instead of x and y
 */
class Location {
    /**
    * @param {Number} row
    * @param {Number} column
    */
    constructor(row, column) {
        this.row = row;
        this.column = column;
    }


    equal(other) {
        return this.row === other.row && this.column === other.column;
    }
}

class Player {
    constructor(name, location) {
        this.name = name;
        this.location = location;
        this.sprite = getRandomArrayElement(GAME_DATA.playerSprites);
        this.lifes = GAME_DATA.startingLife;

        // for now, we only have one type of die so this could be simplified
        // but one of the addon ideas for the game is to variants, so we keep that option
        // open right now
        this.dice = []
        for (let i = 0; i < GAME_DATA.diceAmount; i++) {
            this.dice.push(new Die());
        }

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
    constructor(options) {
        if (options) this.options = options;
        else this.options = [
            TurnLeftCommand,
            TurnRightCommand,
            MoveOneCommand,
            MoveTwoCommand,
            MoveThreeCommand,
            MoveBackwardsCommand,
        ];
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
    static sprite = '';

    constructor(player, gameBoard) {
        this.player = player;
        this.gameBoard = gameBoard;
    }

    execute() {
        throw Error('Each subclass of Command must implement the execute method themselves!');
    }
}

/**
 * 'Abstract' class/interface (neither of which exists properly in JS unfortunately)
 *  Not to be used directly, only for inheritance purpose. 
 * 
 *  MoveCommand contains the logic for making one step forward, as well as reverting 
 *  a forward step by making a step back. All subclasses must override the Commands 
 *  execute method with an actual implementation that can then use these step methods.
 */
class MoveCommand extends Command {
    constructor(player, gameBoard) {
        super(player, gameBoard);
        this.rows = gameBoard.rows;
        this.columns = gameBoard.columns;
    }

    /**
     * Used to revert the last step from within a move command, if we hit a tile we cannot
     * be on. As player will always be coming from a legal tile (otherwise, he would have been
     * moved back previously), we do not need to check whether the landing tile from this step
     * back is a legal spot for the player.
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

    stepForward() {
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
            continueCurrentMoveCommand: false,
            landedOnTerrain: this.gameBoard.board[this.player.location.row][this.player.location.column].terrainName
        }

        switch (commandResult.landedOnTerrain) {
            case 'grass':
                commandResult.continueCurrentMoveCommand = true;
                break;
            case 'lava':
                commandResult.damage = 99;
                break;
            case 'rock':
                commandResult.damage = 1;
                this.stepBack();
                break;
            case 'water':
                commandResult.damage = 1;
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
        return this.stepForward();
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
            commandResult = this.stepForward();
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
            commandResult = this.stepForward();
            if (!commandResult.continueCurrentMoveCommand) return commandResult;
        }
        return commandResult;
    }  
}

class ReturnToOriginCommand extends MoveCommand {
    execute() {
        this.player.location = this.player.turnStartLocation;
        return {
            damage: 0, 
            landedOnTerrain: 'reset',
        }
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
        return {
            damage: 0,
            landedOnTerrain: this.gameBoard.board[this.player.location.row][this.player.location.column].terrainName,
        };
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
        return {
            damage: 0, 
            landedOnTerrain: this.gameBoard.board[this.player.location.row][this.player.location.column].terrainName,
        };
    }
}

class MoveBackwardsCommand extends MoveCommand {
    // to move backwards, we quickly turn around, make one step forward, then turn around again before returning
    execute() {
        this.player.facingDirection = (this.player.facingDirection + 2) % 4;
        const result = this.stepForward();
        this.player.facingDirection = (this.player.facingDirection + 2) % 4;
        return result;
    }
}

/**
 * Level Editor - used for handcrafting levels, Dev tool that will not be visible in final game
 * but is still part of the "game engine"
 */
export class LevelEditor extends GameManager{
    startGame() {
        // initialize all tiles with grass
        this.gameBoard = new LevelEditorBoard(GAME_DATA.terrainOptions, this.rows, this.columns);

        // set up the level editor in the browser
        this.uiController.setupNewMap(this.gameBoard, this.player);

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