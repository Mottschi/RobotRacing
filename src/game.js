import { getRandomArrayElement, UIController } from "./helpers.js";

import easyMap from '../assets/maps/easy.js';
import mediumMap from '../assets/maps/medium.js';
import hardMap from '../assets/maps/hard.js';


// Each Terrain holds the name(type) of the terrain, as well as an array of the classes available to terrain of this type
class Terrain {
    constructor(name, classes) {
        this.name = name;
        this.classes = classes;
    }
}

/**
 * Default settings for the game. These values can be modified
 * by the application and will effect either
 * - the ongoing game: music, soundEffects
 * - the next new game: rows, columns, randomMap, players (if I get to that point...)
 */
export const DEFAULT_SETTINGS = {
    rows: 20,
    columns: 20,
    randomMap: false,
    music: true,
    soundEffects: true,
    musicVolume: 0.3,
    soundEffectsVolume: 0.7,
}

/**
 * Game data that should not be modified, but may need to be accessed outside 
 * the game logic itself (for example to set up audio controller or for a level
 * editor) 
 * 
 * Eventually it would be nice if we can have all variability in here, so game can be changed
 * (new terrain options, different sound effects/music, maps, different dice) just by changing
 * the game data.
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
        move: 'boingmachine.mp3',
        collision: 'recall.mp3',
        explosion: 'bomb.mp3',
        water: 'smf.mp3',
        gameOver: 'gameover_loud.mp3',
        dice: 'dice.mp3',
        win: 'win_loud.mp3',
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
    maxLife: 5,
    diceAmount: 5,
    turnTimeInMS: 750,
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
        this.mapsCompleted = 0;

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

        this.audioController.addMusic('backgroundMusic', GAME_DATA.backgroundMusic);

        this.player = new Player('Player 1', new Location(0, 0));
        this.uiController.updateCompletedMaps(this.mapsCompleted);
    }

    setupNextMap() {
        if (this.mapsCompleted > 2) {
            // when we load a random game board, the size depends on settings
            this.rows = this.settings.rows ? this.settings.rows : DEFAULT_SETTINGS.rows;
            this.columns = this.settings.columns ? this.settings.columns : DEFAULT_SETTINGS.columns;
            this.gameBoard = new RandomGameBoard(GAME_DATA.terrainOptions, this.rows, this.columns);
        } else {
            // when we load a default game board, the size will depend on the loaded map
            this.gameBoard = new DefaultGameBoard(GAME_DATA.terrainOptions, this.mapsCompleted);
            this.rows = this.gameBoard.rows;
            this.columns = this.gameBoard.columns;
        }

        this.gameBoard.init();

        // Set players starting location and initial heading
        const {row, column} = this.gameBoard.startingLocation;
        this.player.location = new Location(row, column);
        this.player.facingDirection = 0;

        return this.gameBoard;
    }

    startGameEngine() {
        // start by initialiazing necessary assets
        this.init();

        // switch to the TitleSceneState
        this.state = new TitleSceneState(this.player, this.uiController, this.gameBoard, this.audioController);
        this.state.enter();

        // Start the gameloop
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
                        this.audioController.playClip('move');
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

                if (this.state instanceof TitleSceneState) {
                    // back to the title scene new state, so game is over for good
                    // we need to reset some data in case player wants to play again

                    this.map = 0;
                    this.uiController.updateCompletedMaps(this.maps);
                    this.player = new Player('Player 1', new Location(0, 0));
                    this.state.player = this.player;
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
            this.mapsCompleted++;
            this.player.lifes = Math.min(this.player.lifes + 1, GAME_DATA.maxLife);
            this.uiController.updatePlayerLifes(this.player);
            this.uiController.updateCompletedMaps(this.mapsCompleted);
            this.state = new MapCompletedState(this.player, this.uiController, this.gameBoard, this.audioController, this.mapsCompleted);
            this.state.enter();
        }
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

        this.startingLocation = new Location(startTile.row, startTile.column);
    }

    // similar to starting location, but with top left alignment instead of bottom right
    setFlagLocation() {
        let flagTile = this.board[0].filter(tile => tile.terrainName === 'grass')[0];
        
        if (!flagTile) {
            this.board[0][0] = new Tile(0, 0, GAME_DATA.terrainOptions['grass']);
            flagTile = this.board[0][0];
        }
        this.flagLocation = new Location(flagTile.row, flagTile.column);
    }

    
}

/**
 * Pregenerated game boards.
 */
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

/**
 * Randomly generated game boards
 */
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
                if (rng > .95) type = this.terrain.lava;
                else if (rng > .85) type = this.terrain.rock
                else if (rng > .70) type = this.terrain.water;
                currentRow.push(new Tile(row, column, type))
            }
        }
    }

    init() {
        super.init();
        this.makeSureMapIsSolvable();
    }

    /**
     * To avoid displaying a map that cannot be solved, this force a path from players location
     * to the flags location.
     */
    makeSureMapIsSolvable(){
        // A* would be nice here, but time is not sufficient for that
        // will need to force a path instead
        let currentLocation = new Location(this.startingLocation.row, this.startingLocation.column);
        let moveCount = 0;
        while (currentLocation.row > 0) {
            moveCount++;
            // switch between moving up and sideways
            const stepSize = Math.floor(Math.random() * 3 + 1)
            if (moveCount % 2) {
                // for even movecounts, we go up
                for (let i = 0; i < stepSize; i++) {
                    if (currentLocation.row > 0) currentLocation.row--;
                    this.board[currentLocation.row][currentLocation.column] = new Tile(currentLocation.row, currentLocation.column, GAME_DATA.terrainOptions['grass']);
                }
            } else {
                // move towards a random side, with a slant to go to the left (as flag tile will start leftish and player rightish)
                if (Math.random() > 0.35) {
                    for (let i = 0; i < stepSize; i++) {
                        if (currentLocation.column > 0) currentLocation.column--;
                        this.board[currentLocation.row][currentLocation.column] = new Tile(currentLocation.row, currentLocation.column, GAME_DATA.terrainOptions['grass']);
                    }
                } else {
                    for (let i = 0; i < stepSize; i++) {
                        if (currentLocation.column < this.columns - 1) currentLocation.column++;
                        this.board[currentLocation.row][currentLocation.column] = new Tile(currentLocation.row, currentLocation.column, GAME_DATA.terrainOptions['grass']);
                    }
                }

            }
        }

        // now that we are at the top row, we just need to move directly straight to the flag tile
        const stepsNeeded = currentLocation.manhattanDistance(this.flagLocation);
        const stepSize = currentLocation.column < this.flagLocation.column ? 1 : -1;
        for (let i = 0; i < stepsNeeded; i++) {
            currentLocation.column += stepSize;
            this.board[currentLocation.row][currentLocation.column] = new Tile(currentLocation.row, currentLocation.column, GAME_DATA.terrainOptions['grass']);
        }
    }
}

/**
 * Holds the information for a single tile (it's location as well as information about it's terrain).
 */
class Tile {
    constructor(row, column, terrain) {
        // TODO refactor to use Location class (simple change here, but will need to make sure that all
        // code that access a tiles location is also adapted)
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

/**
 * The state during which a player is able to select which commands he want to use.
 */
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

    }

    /**
     * Event Handler that will be used when player clicks on a dice result.
     * @param {Command} command 
     */
    chooseCommand(command) {
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

/**
 * The state during which the game executes the chosen commands.
 */
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

/**
 * The state when the game has just ended, before returning to idle/title scene
 */
class GameOverState extends State {
    constructor (player, uiController, gameBoard, audioController) {
        super(player, uiController, gameBoard, audioController);
        this.dialogName = 'enterGameOverState';
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
        if (this.updateCount === 1) this.audioController.playClip('gameOver');
        if (this.updateCount === 4) return {stateFinished: true}
    }

    exit() {
        return new TitleSceneState(this.player, this.uiController, this.gameBoard, this.audioController);
    }
}

/**
 * The state when the player succesfully completes a game, before next map is set up.
 */
class MapCompletedState extends State {
    constructor (player, uiController, gameBoard, audioController, mapsCompleted) {
        super(player, uiController, gameBoard, audioController);
        this.dialogName = 'enterMapCompleteState';
        this.mapsCompleted = mapsCompleted;
    }

    enter() {
        super.enter();
        this.audioController.playClip('win');
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
        this.uiController.hidePlayerLifes();
        return new SetupState(this.player, this.uiController, this.gameBoard, this.audioController);
    }
}

/**
 * The state during which the game sets up the next map.
 */
class SetupState extends State {
    constructor(player, uiController, gameBoard, audioController){
        super(player, uiController, gameBoard, audioController);
        this.dialogName = 'enterSetupState';
    }

    enter() {
        this.uiController.clearUI();
        this.audioController.playMusic('backgroundMusic');
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
 * The State the game is in when the game is "not running"
 * Will display the title scene when it enters this state
 * and hide it when it exits the state.
 */
class TitleSceneState extends State {
    enter(){
        this.spaceHasBeenHit = false;
        this.uiController.displayTitleScene(this.handleSpaceHit.bind(this));
    }

    handleSpaceHit() {
        this.spaceHasBeenHit = true;
    }

    update(){
        super.update();
        if (this.spaceHasBeenHit) return {stateFinished: true}
    }

    exit(){
        // As we are leaving the title scene, we have to toggle display 
        this.uiController.displayGameScene();
        return new SetupState(this.player, this.uiController, this.gameBoard, this.audioController);
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

    /**
     * The Manhattan distance (distance in a system where we can only go orthogonally) between two locations.
     * @param {Location} other 
     * @returns 
     */
    manhattanDistance(other) {
        return Math.abs(other.row - this.row) + Math.abs(other.column - this.column);
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

export default GameManager;