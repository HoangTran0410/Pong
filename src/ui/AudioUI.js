import soundSystem from "../systems/SoundSystem.js";
import eventBus from "../core/EventBus.js";

// Audio UI Controller - Manages audio settings in the menu
class AudioUI {
  constructor() {
    this.soundEnabled = true;
    this.musicEnabled = true;
    this.masterVolume = 30;

    this.init();
  }

  // Initialize audio UI
  init() {
    this.loadSettings();
    this.setupControls();
    this.updateDisplays();
  }

  // Setup audio controls
  setupControls() {
    // Setup tab functionality
    this.setupTabs();

    // Sound enabled toggle
    const soundToggle = document.getElementById("soundEnabled");
    if (soundToggle) {
      soundToggle.addEventListener("change", (e) => {
        this.soundEnabled = e.target.checked;
        this.updateSoundSystem();
        this.saveSettings();
        soundSystem.initializeAudio();
        eventBus.emit("menu:select");
      });
    }

    // Music enabled toggle
    const musicToggle = document.getElementById("musicEnabled");
    if (musicToggle) {
      musicToggle.addEventListener("change", (e) => {
        this.musicEnabled = e.target.checked;
        this.updateSoundSystem();
        this.saveSettings();
        soundSystem.initializeAudio();
        eventBus.emit("menu:select");
      });
    }

    // Master volume slider
    const volumeSlider = document.getElementById("masterVolume");
    if (volumeSlider) {
      volumeSlider.addEventListener("input", (e) => {
        this.masterVolume = parseInt(e.target.value);
        this.updateVolumeDisplay();
        this.updateSoundSystem();
        this.saveSettings();
      });

      // Play test sound when releasing slider
      volumeSlider.addEventListener("change", () => {
        soundSystem.initializeAudio();
        soundSystem.testSound();
      });
    }

    // Test sound button
    const testSoundButton = document.getElementById("testSoundButton");
    if (testSoundButton) {
      testSoundButton.addEventListener("click", () => {
        soundSystem.initializeAudio();
        soundSystem.testSound();
      });
    }
  }

  // Setup tab functionality
  setupTabs() {
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabPanels = document.querySelectorAll(".tab-panel");

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        soundSystem.initializeAudio();
        eventBus.emit("menu:select");

        const targetTab = button.getAttribute("data-tab");

        // Remove active class from all buttons and panels
        tabButtons.forEach((btn) => btn.classList.remove("active"));
        tabPanels.forEach((panel) => panel.classList.remove("active"));

        // Add active class to clicked button and corresponding panel
        button.classList.add("active");
        const targetPanel = document.getElementById(targetTab + "-tab");
        if (targetPanel) {
          targetPanel.classList.add("active");
        }
      });
    });
  }

  // Update volume display
  updateVolumeDisplay() {
    const volumeValue = document.getElementById("masterVolumeValue");
    if (volumeValue) {
      volumeValue.textContent = `${this.masterVolume}%`;
    }
  }

  // Update all displays
  updateDisplays() {
    // Update checkboxes
    const soundToggle = document.getElementById("soundEnabled");
    const musicToggle = document.getElementById("musicEnabled");
    const volumeSlider = document.getElementById("masterVolume");

    if (soundToggle) soundToggle.checked = this.soundEnabled;
    if (musicToggle) musicToggle.checked = this.musicEnabled;
    if (volumeSlider) volumeSlider.value = this.masterVolume;

    this.updateVolumeDisplay();
  }

  // Update sound system with current settings
  updateSoundSystem() {
    soundSystem.applySettings({
      enabled: this.soundEnabled,
      musicEnabled: this.musicEnabled,
      masterVolume: this.masterVolume / 100, // Convert percentage to 0-1 range
      musicVolume: 0.2, // Fixed music volume relative to master
      sfxVolume: 0.4, // Fixed SFX volume relative to master
    });
  }

  // Load settings from localStorage
  loadSettings() {
    try {
      const saved = localStorage.getItem("pong-audio-settings");
      if (saved) {
        const settings = JSON.parse(saved);
        this.soundEnabled = settings.soundEnabled !== false; // Default to true
        this.musicEnabled = settings.musicEnabled !== false; // Default to true
        this.masterVolume = settings.masterVolume || 30;
      }
    } catch (error) {
      console.warn("Failed to load audio settings:", error);
      // Use defaults
    }
  }

  // Save settings to localStorage
  saveSettings() {
    try {
      const settings = {
        soundEnabled: this.soundEnabled,
        musicEnabled: this.musicEnabled,
        masterVolume: this.masterVolume,
      };
      localStorage.setItem("pong-audio-settings", JSON.stringify(settings));
    } catch (error) {
      console.warn("Failed to save audio settings:", error);
    }
  }

  // Get current settings
  getSettings() {
    return {
      soundEnabled: this.soundEnabled,
      musicEnabled: this.musicEnabled,
      masterVolume: this.masterVolume,
    };
  }

  // Apply settings and save
  applySettings(settings) {
    if (settings.soundEnabled !== undefined)
      this.soundEnabled = settings.soundEnabled;
    if (settings.musicEnabled !== undefined)
      this.musicEnabled = settings.musicEnabled;
    if (settings.masterVolume !== undefined)
      this.masterVolume = settings.masterVolume;

    this.updateDisplays();
    this.updateSoundSystem();
    this.saveSettings();
  }

  // Initialize sound system with current settings
  initializeSoundSystem() {
    this.updateSoundSystem();
  }
}

export default AudioUI;
