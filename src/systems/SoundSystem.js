import eventBus from "../core/EventBus.js";
import backgroundMusicData from "../../assets/song/i_am_back.js";

// Sound System - Manages all audio effects and background music using zzFX
class SoundSystem {
  constructor() {
    this.enabled = true;
    this.masterVolume = 0.3;
    this.musicVolume = 0.2;
    this.sfxVolume = 0.4;
    this.audioInitialized = false;

    // Background music state
    this.backgroundMusic = null;
    this.musicEnabled = true;
    this.musicPlaying = false;
    this.musicAudioBuffer = null;
    this.musicSourceNode = null;
    this.musicGainNode = null;

    // Sound effect definitions using zzFX parameters
    // prettier-ignore
    this.sounds = {
        // Ball collision sounds
        paddleHit: [1.0, , 160, 0.01, 0.05, 0.05, 0, , , , , , , , , , , 0.5],
        wallHit:   [1.0, , 200, 0.01, 0.05, 0.05, 0, , , , , , , , , , , 0.5],

        // Scoring sounds
        score:     [1.0,,537,.02,.02,.22,1,1.59,-6.98,4.97],
        scoreChange:[1.0, , 440, 0.01, 0.05, 0.1, 1, , , , , , , , , , , 0.6],

        // Powerup sounds
        powerupCollect: [1,,10,.05,,.11,4,.9,,-5,-164,.12,.02,,,,,.55,,,-1272], //[1.2, , 700, 0.01, 0.1, 0.2, 1, , , , , , , , , , , 0.8],
        powerupSpawn:  [1.0, , 330, 0.01, 0.05, 0.15, 0, , , , , , , , , , , 0.5],

        // Special powerups
        shieldActivate:[1,,30,0.2,0.5,0.8,,1,,1,,,0.4,0.05,0.15,0.25,,0.01,0.35,0.02],
        portalOpen:    [1.8,,578,.03,.08,.27,1,3.4,,-156,,,,.3,,,.05,.67,.03],
        portalTeleport:[1,,465,.03,.05,.06,,.9,,191,,,,,,,,.65,.02],
        blackhole:     [1.0, , 100, 0.02, 0.2, 0.3, 2, , , , , , , , , , , 0.5],
        clone:         [1.2,,491,.02,.03,.28,,1.4,2,,119,.1,,.5,18,,.02,.86,.04,,-1053], // [1.2, , 880, 0.01, 0.05, 0.1, 1, , , , , , , , , , , 0.6],

        // UI & special
        swapScore:     [.3,,398,.03,.12,.08,3,.8,-4,22,,,,,,,,.75,.09,,327],
        orientationFlip:[1.0, , 466, 0.01, 0.08, 0.15, 1, , , , , , , , , , , 0.6],

        // Walls
        wallSpawn:     [.9,,346,.01,.09,.2,1,.4,-1,-155,180,.09,,,,.1,.07,.96,.05,,-1048],

        // Menu
        menuSelect:    [0.8, , 587, 0.01, 0.03, 0.05, 1, , , , , , , , , , , 0.4],
        menuClick:     [0.8, , 783, 0.01, 0.02, 0.05, 1, , , , , , , , , , , 0.3],
      };

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Ball events
    eventBus.subscribe("ball:paddleCollision", () => {
      this.playSound("paddleHit");
    });

    eventBus.subscribe("ball:wallCollision", () => {
      this.playSound("wallHit");
    });

    eventBus.subscribe("ball:score", () => {
      this.playSound("score");
    });

    // Powerup events
    eventBus.subscribe("powerup:collected", (data) => {
      this.playPowerupSound(data.powerupType);
    });

    eventBus.subscribe("ball:portalTeleport", () => {
      this.playSound("portalTeleport");
    });

    // Game events
    eventBus.subscribe("game:scoreChange", () => {
      this.playSound("scoreChange");
    });

    eventBus.subscribe("game:swapScores", () => {
      this.playSound("swapScore");
    });

    eventBus.subscribe("game:ballSpawned", () => {
      this.playSound("clone");
    });

    eventBus.subscribe("game:orientationChanged", () => {
      this.playSound("orientationFlip");
    });

    // Paddle events
    eventBus.subscribe("paddle:shieldActivated", () => {
      this.playSound("shieldActivate");
    });

    eventBus.subscribe("paddle:shieldReflection", () => {
      this.playSound("shieldActivate", 0.7); // Slightly quieter for reflection
    });

    // Menu events (for future UI sounds)
    eventBus.subscribe("menu:select", () => {
      this.playSound("menuSelect");
    });

    eventBus.subscribe("menu:click", () => {
      this.playSound("menuClick");
    });
  }

  // Initialize audio context after user gesture
  initializeAudio() {
    if (this.audioInitialized) return;

    try {
      // Initialize audio context if needed
      if (typeof zzfxX !== "undefined" && zzfxX.state === "suspended") {
        zzfxX.resume();
      }
      this.audioInitialized = true;
      console.log("Audio system initialized");
    } catch (error) {
      console.warn("Failed to initialize audio:", error);
    }
  }

  // Play a specific sound effect
  playSound(soundName, volumeMultiplier = 1) {
    if (!this.enabled || !this.sounds[soundName]) return;

    // Initialize audio on first play attempt
    if (!this.audioInitialized) {
      this.initializeAudio();
    }

    try {
      const soundParams = [...this.sounds[soundName]];
      // Adjust volume (first parameter in zzFX)
      soundParams[0] *= this.sfxVolume * this.masterVolume * volumeMultiplier;

      // Play the sound using zzFX
      zzfx(...soundParams);
    } catch (error) {
      console.warn(`Failed to play sound: ${soundName}`, error);
      // Try to initialize audio and retry once
      if (!this.audioInitialized) {
        this.initializeAudio();
      }
    }
  }

  // Play powerup-specific sounds
  playPowerupSound(powerupType) {
    // Play the collect sound first
    this.playSound("powerupCollect");

    // Then play type-specific sound if available
    const specificSounds = {
      shield: "shieldActivate",
      portal: "portalOpen",
      blackhole: "blackhole",
      clone_ball: "clone",
      random_wall: "wallSpawn",
    };

    if (specificSounds[powerupType]) {
      // Delay the specific sound slightly
      setTimeout(() => {
        this.playSound(specificSounds[powerupType], 0.8);
      }, 100);
    }
  }

  // Background music using ZzFXM with imported music data
  startBackgroundMusic() {
    if (!this.musicEnabled || this.musicPlaying) return;

    this.musicPlaying = true;
    this.playZzFXMMusic();
  }

  stopBackgroundMusic() {
    this.musicPlaying = false;

    // Stop any currently playing music
    if (this.musicSourceNode) {
      try {
        this.musicSourceNode.stop();
      } catch (error) {
        // Ignore errors when stopping already stopped sources
      }
      this.musicSourceNode = null;
    }

    if (this.musicGainNode) {
      this.musicGainNode = null;
    }

    if (this.backgroundMusic) {
      clearTimeout(this.backgroundMusic);
      this.backgroundMusic = null;
    }
  }

  // Play background music using ZzFXM
  async playZzFXMMusic() {
    if (!this.musicPlaying) return;

    try {
      // Initialize audio context if needed
      if (!this.audioInitialized) {
        this.initializeAudio();
      }

      // Generate music using ZzFXM
      const musicBuffer = this.generateZzFXMMusic();

      if (musicBuffer && musicBuffer.length > 0) {
        // Create audio buffer
        const audioBuffer = zzfxX.createBuffer(2, musicBuffer[0].length, 44100);

        // Set left and right channel data
        audioBuffer.getChannelData(0).set(musicBuffer[0]);
        audioBuffer.getChannelData(1).set(musicBuffer[1]);

        // Create and configure source node
        this.musicSourceNode = zzfxX.createBufferSource();
        this.musicSourceNode.buffer = audioBuffer;

        // Create gain node for volume control
        this.musicGainNode = zzfxX.createGain();
        this.musicGainNode.gain.value = this.musicVolume * this.masterVolume;

        // Connect audio graph
        this.musicSourceNode.connect(this.musicGainNode);
        this.musicGainNode.connect(zzfxX.destination);

        // Set up looping
        this.musicSourceNode.loop = true;

        // Handle when music ends (shouldn't happen with loop=true, but just in case)
        this.musicSourceNode.onended = () => {
          if (this.musicPlaying) {
            // Restart music after a short delay
            this.backgroundMusic = setTimeout(
              () => this.playZzFXMMusic(),
              1000
            );
          }
        };

        // Start playing
        this.musicSourceNode.start();

        console.log("Background music started");
      }
    } catch (error) {
      console.warn("Failed to play ZzFXM background music:", error);
      // Retry after a delay
      if (this.musicPlaying) {
        this.backgroundMusic = setTimeout(() => this.playZzFXMMusic(), 5000);
      }
    }
  }

  // Generate music using ZzFXM and imported music data
  generateZzFXMMusic() {
    try {
      // Use ZzFXM to generate music from the imported data
      // backgroundMusicData contains [instruments, patterns, sequence, BPM]
      const [instruments, patterns, sequence, bpm] = backgroundMusicData;

      // Generate the music using ZzFXM
      const musicBuffer = zzfxM(instruments, patterns, sequence, bpm || 125);

      return musicBuffer;
    } catch (error) {
      console.warn("Failed to generate ZzFXM music:", error);
      return null;
    }
  }

  // Volume controls
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateMusicVolume();
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateMusicVolume();
  }

  // Update the volume of currently playing music
  updateMusicVolume() {
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = this.musicVolume * this.masterVolume;
    }
  }

  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  // Enable/disable audio
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopBackgroundMusic();
    }
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopBackgroundMusic();
    } else if (this.enabled) {
      this.startBackgroundMusic();
    }
  }

  // Get current settings
  getSettings() {
    return {
      enabled: this.enabled,
      musicEnabled: this.musicEnabled,
      masterVolume: this.masterVolume,
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
    };
  }

  // Apply settings
  applySettings(settings) {
    if (settings.enabled !== undefined) this.setEnabled(settings.enabled);
    if (settings.musicEnabled !== undefined)
      this.setMusicEnabled(settings.musicEnabled);
    if (settings.masterVolume !== undefined)
      this.setMasterVolume(settings.masterVolume);
    if (settings.musicVolume !== undefined)
      this.setMusicVolume(settings.musicVolume);
    if (settings.sfxVolume !== undefined) this.setSfxVolume(settings.sfxVolume);
  }

  // Test sound for volume adjustment
  testSound() {
    this.playSound("menuSelect");
  }

  // Cleanup
  destroy() {
    this.stopBackgroundMusic();
    // Remove all event listeners
    eventBus.clear();
  }
}

// Create singleton instance
const soundSystem = new SoundSystem();

export { SoundSystem, soundSystem };
export default soundSystem;
