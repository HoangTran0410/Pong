import { POWERUP_CONFIG } from "../config/powerups.js";

// PowerupUI - Manages powerup configuration interface
class PowerupUI {
  constructor() {
    this.settings = {
      powerupsEnabled: true,
      enabledPowerups: new Set(),
    };

    this.elements = {
      powerupsEnabled: document.getElementById("powerupsEnabled"),
      toggleAllPowerups: document.getElementById("toggleAllPowerups"),
      powerupList: document.getElementById("powerupList"),
      powerupConfig: document.getElementById("powerupConfig"),
    };

    this.init();
  }

  init() {
    // Load settings from localStorage
    this.loadSettings();

    // Generate powerup list
    this.generatePowerupList();

    // Setup event listeners
    this.setupEventListeners();

    // Update UI to reflect current settings
    this.updateUI();
  }

  loadSettings() {
    // Load from localStorage or use defaults
    const savedSettings = localStorage.getItem("powerupSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        this.settings.powerupsEnabled = parsed.powerupsEnabled !== false;
        this.settings.enabledPowerups = new Set(parsed.enabledPowerups || []);
      } catch (e) {
        console.warn("Failed to load powerup settings:", e);
      }
    }

    // If no saved settings or empty set, enable all powerups by default
    if (this.settings.enabledPowerups.size === 0) {
      this.settings.enabledPowerups = new Set(Object.keys(POWERUP_CONFIG));
    }
    // Remove powerups that are not in the POWERUP_CONFIG
    else {
      for (const powerup of this.settings.enabledPowerups) {
        if (!POWERUP_CONFIG[powerup]) {
          this.settings.enabledPowerups.delete(powerup);
        }
      }
    }
  }

  saveSettings() {
    const settingsToSave = {
      powerupsEnabled: this.settings.powerupsEnabled,
      enabledPowerups: Array.from(this.settings.enabledPowerups),
    };
    localStorage.setItem("powerupSettings", JSON.stringify(settingsToSave));
  }

  generatePowerupList() {
    if (!this.elements.powerupList) {
      console.warn("PowerupList element not found");
      return;
    }

    this.elements.powerupList.innerHTML = "";

    Object.entries(POWERUP_CONFIG).forEach(([type, config]) => {
      const powerupItem = document.createElement("div");
      powerupItem.className = "powerup-item";
      powerupItem.dataset.powerupType = type;

      const isEnabled = this.settings.enabledPowerups.has(type);
      if (!isEnabled) {
        powerupItem.classList.add("disabled");
      }

      powerupItem.innerHTML = `
        <div class="powerup-info">
          <div class="powerup-emoji">${config.emoji}</div>
          <div class="powerup-details">
            <div class="powerup-name">${config.label}</div>
            <div class="powerup-category ${
              config.category
            }">${config.category.toUpperCase()}</div>
          </div>
        </div>
        <div class="powerup-small-toggle ${
          isEnabled ? "enabled" : ""
        }" data-type="${type}"></div>
      `;

      this.elements.powerupList.appendChild(powerupItem);
    });
  }

  setupEventListeners() {
    // Master powerup toggle
    if (this.elements.powerupsEnabled) {
      this.elements.powerupsEnabled.addEventListener("change", (e) => {
        this.settings.powerupsEnabled = e.target.checked;
        this.updateUI();
        this.saveSettings();
      });
    }

    // Toggle all powerups button
    if (this.elements.toggleAllPowerups) {
      this.elements.toggleAllPowerups.addEventListener("click", () => {
        const allEnabled =
          this.settings.enabledPowerups.size ===
          Object.keys(POWERUP_CONFIG).length;

        if (allEnabled) {
          // Disable all
          this.settings.enabledPowerups.clear();
          this.elements.toggleAllPowerups.textContent = "All";
        } else {
          // Enable all
          this.settings.enabledPowerups = new Set(Object.keys(POWERUP_CONFIG));
          this.elements.toggleAllPowerups.textContent = "None";
        }

        this.updateUI();
        this.saveSettings();
      });
    }

    // Individual powerup toggles
    if (this.elements.powerupList) {
      this.elements.powerupList.addEventListener("click", (e) => {
        const toggle = e.target.closest(".powerup-small-toggle");
        const item = e.target.closest(".powerup-item");

        if (toggle || item) {
          const powerupType = toggle?.dataset.type || item?.dataset.powerupType;
          if (powerupType) {
            this.togglePowerup(powerupType);
          }
        }
      });
    }
  }

  togglePowerup(powerupType) {
    if (this.settings.enabledPowerups.has(powerupType)) {
      this.settings.enabledPowerups.delete(powerupType);
    } else {
      this.settings.enabledPowerups.add(powerupType);
    }

    this.updateUI();
    this.saveSettings();
  }

  updateUI() {
    // Update master toggle
    if (this.elements.powerupsEnabled) {
      this.elements.powerupsEnabled.checked = this.settings.powerupsEnabled;
    }

    // Update toggle all button
    if (this.elements.toggleAllPowerups) {
      const allEnabled =
        this.settings.enabledPowerups.size ===
        Object.keys(POWERUP_CONFIG).length;
      this.elements.toggleAllPowerups.textContent = allEnabled ? "None" : "All";
    }

    // Update individual powerup items
    if (this.elements.powerupList) {
      this.elements.powerupList
        .querySelectorAll(".powerup-item")
        .forEach((item) => {
          const powerupType = item.dataset.powerupType;
          const toggle = item.querySelector(".powerup-small-toggle");
          const isEnabled = this.settings.enabledPowerups.has(powerupType);

          // Update item appearance
          if (isEnabled) {
            item.classList.remove("disabled");
            toggle.classList.add("enabled");
          } else {
            item.classList.add("disabled");
            toggle.classList.remove("enabled");
          }

          // Disable all items if master toggle is off
          if (!this.settings.powerupsEnabled) {
            item.style.opacity = "0.3";
            item.style.pointerEvents = "none";
          } else {
            item.style.opacity = "";
            item.style.pointerEvents = "";
          }
        });
    }

    // Update powerup controls container
    const powerupControls = document.querySelector(".powerup-controls");
    if (powerupControls) {
      if (!this.settings.powerupsEnabled) {
        powerupControls.style.opacity = "0.6";
      } else {
        powerupControls.style.opacity = "";
      }
    }
  }

  // Get current settings for game use
  getSettings() {
    return {
      powerupsEnabled: this.settings.powerupsEnabled,
      enabledPowerups: Array.from(this.settings.enabledPowerups),
    };
  }

  // Check if a specific powerup type is enabled
  isPowerupEnabled(powerupType) {
    return (
      this.settings.powerupsEnabled &&
      this.settings.enabledPowerups.has(powerupType)
    );
  }

  // Get list of enabled powerup types
  getEnabledPowerupTypes() {
    if (!this.settings.powerupsEnabled) {
      return [];
    }
    return Array.from(this.settings.enabledPowerups);
  }
}

export default PowerupUI;
