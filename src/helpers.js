
/**
 * 
 * @param {Array} arr Array of Elements
 * @returns any random Array Element
 */
export let getRandomArrayElement = function getRandomArrayElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
};


/**
 * AudioController has access to the current settings and will play clips only when current
 * settings allows it to do so.
 * 
 * Allows adding clips via addClip(), removing Clips via removeClip()
 * and playing clips via playClip
 * playClip will play the corresponding sound clip if and only if the current setting
 * for sound effects is enabled AND the sound effect was set up previously via addClip
 */
export class AudioController {
    constructor(settings) {
        this.settings = settings;
        this.clips = {}
        this.musicTracks = {}
        this.musicVolume = 1;
        this.soundEffectsVolume = 1;
        this.soundPath = './assets/sound';
        this.musicPath = './assets/music';
    }

    addClip(name, filename) {
        if (this.clips[name]) this.removeClip(name);
        const audioElement = new Audio(`${this.soundPath}/${filename}`);
        this.clips[name] = audioElement;
    }

    removeClip(name) {
        delete this.clips[name];
    }

    playClip(name) {
        if (this.settings.soundEffects && this.clips[name]) {
            this.clips[name].play();
            this.clips[name].volume = this.soundEffectsVolume;
        }
        console.log(this.clips[name].volume)
    }

    addMusic(name, filename) {
        if (this.musicTracks[name]) this.removeMusic(name);
        const audioElement = new Audio(`${this.musicPath}/${filename}`);
        this.musicTracks[name] = audioElement;
    }

    removeMusic(name) {
        delete this.musicTracks[name];
    }

    playMusic(name) {
        if (this.settings.music && this.musicTracks[name]) this.musicTracks[name].play();
    }

    pauseMusic(name) {
        if (this.musicTracks[name]) this.musicTracks[name].pause();
    }

    setMusicVolume(volume) {
        // for music, the volume is adjusted on change of the setting
        if (volume) {
            this.musicVolume = volume;
            Object.values(this.musicTracks).forEach((audio)=>audio.volume = volume);
        }
    }

    setSoundEffectVolume(volume) {
        // for sound effects, the volume is adjusted directly on playing them
        if (volume) this.soundEffectsVolume = volume;
    }
}

export const DIRECTIONS = ['up', 'right', 'down', 'left'];

export class UIController {
    constructor(rows, columns) {
        this.rows = rows;
        this.columns = columns;
        this.root = document.querySelector(':root');
    }

    setupNewGame(gameBoard, player) {
        this.root.style.setProperty('--visibleWhileGameIsRunning', 'visible');
        this.generateGrid();
        this.drawBoard(gameBoard);
        this.initializePlayer(player);
    }

    stopGame() {
        this.root.style.setProperty('--visibleWhileGameIsRunning', 'hidden');
    }

    generateGrid() {
        console.log('generating grid')
        const boardContainer = document.getElementById('game-board-container');

        // setting up the CSS variables to adjust the grid to the rows, columns 
        // and tile size chosen in settings
        this.root.style.setProperty('--columns', this.columns);
        this.root.style.setProperty('--rows', this.rows);
                
        // reset the grid container, in case there was already something in there from a previous round
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


    drawBoard(gameBoard) {
        if (document.querySelectorAll('#game-board-container > .grid-row > .tile').length !== this.columns * this.rows) {
            console.log('error')
            console.log(this.columns, this.rows, document.querySelectorAll('#game-board-container > .grid-row > .tile').length);
            console.log(gameBoard)
            throw Error('[GameBoard]: Unable to draw map on this game board');
        }

        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                document.querySelector(`[row='${row}'][column='${column}'`).classList.add(gameBoard.board[row][column].terrainClass);
            }
        }
    }

    initializePlayer(player) {
        const sprite = `../assets/images/robot/${player.sprite}-up.png`
        const root = document.querySelector(':root');
        root.style.setProperty('--player-original-sprite', `url('${sprite}')`);
        this.alignPlayerSprite(player);
        this.movePlayerSprite(player);
        this.updatePlayerLifes(player);
    }

    updatePlayerLifes(player) {
        const lifesElement = document.querySelector('#lifes');
        lifesElement.innerHTML = '';
        for (let i = 0; i < player.lifes; i++) {
            const newDiv = document.createElement('div');
            lifesElement.appendChild(newDiv);
        }
    }

    /**
     * Draws the player sprite at his current location.
     * @param {Player} player 
     */
    movePlayerSprite(player, oldLocation) {
        const {row, column} = player.location;
        if (oldLocation) document.querySelector(`[row='${oldLocation.row}'][column='${oldLocation.column}'`).removeAttribute('id', 'player');
        document.querySelector(`[row='${row}'][column='${column}'`).setAttribute('id', 'player');
    }

    /**
     * Allows to exchange the player sprite
     * To be used when player turns and faces a new direction
     * @param {Player} player 
     */
    alignPlayerSprite(player) {
        const sprite = `../assets/images/robot/${player.sprite}-${DIRECTIONS[player.facingDirection]}.png`
        this.root.style.setProperty('--player-sprite', `url('${sprite}')`);
    }
}