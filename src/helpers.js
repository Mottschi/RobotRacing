
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