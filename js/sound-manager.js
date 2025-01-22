// Sound manager module
export const soundManager = {
    sounds: new Map(),
    muted: false,
    volume: 1.0,

    init() {
        this.loadSounds();
        this.setupVolumeControl();
        this.setupMuteToggle();
    },

    loadSounds() {
        // Define sound effects
        const soundEffects = {
            click: '/assets/sounds/click.mp3',
            success: '/assets/sounds/success.mp3',
            error: '/assets/sounds/error.mp3',
            achievement: '/assets/sounds/achievement.mp3'
        };

        // Preload sounds
        Object.entries(soundEffects).forEach(([name, path]) => {
            const audio = new Audio();
            audio.src = path;
            audio.preload = 'auto';
            this.sounds.set(name, audio);
        });
    },

    play(soundName) {
        if (this.muted) return;

        const sound = this.sounds.get(soundName);
        if (sound) {
            sound.volume = this.volume;
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.warn(`Failed to play sound "${soundName}":`, error);
            });
        } else {
            console.warn(`Sound "${soundName}" not found`);
        }
    },

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        this.sounds.forEach(sound => {
            sound.volume = this.volume;
        });
    },

    toggleMute() {
        this.muted = !this.muted;
        this.sounds.forEach(sound => {
            sound.muted = this.muted;
        });
    },

    setupVolumeControl() {
        // Add volume control if it doesn't exist
        let volumeControl = document.getElementById('volume-control');
        if (!volumeControl) {
            volumeControl = document.createElement('input');
            volumeControl.id = 'volume-control';
            volumeControl.type = 'range';
            volumeControl.min = '0';
            volumeControl.max = '1';
            volumeControl.step = '0.1';
            volumeControl.value = this.volume.toString();
            volumeControl.className = 'volume-control';
            document.body.appendChild(volumeControl);
        }

        // Handle volume changes
        volumeControl.addEventListener('input', (e) => {
            this.setVolume(parseFloat(e.target.value));
        });
    },

    setupMuteToggle() {
        // Add mute toggle if it doesn't exist
        let muteBtn = document.getElementById('mute-toggle');
        if (!muteBtn) {
            muteBtn = document.createElement('button');
            muteBtn.id = 'mute-toggle';
            muteBtn.className = 'mute-toggle';
            muteBtn.setAttribute('aria-label', 'Toggle sound');
            document.body.appendChild(muteBtn);
        }

        // Handle mute toggle
        muteBtn.addEventListener('click', () => {
            this.toggleMute();
            muteBtn.setAttribute('aria-pressed', this.muted.toString());
        });
    }
}; 
