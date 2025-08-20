# Retro Pong Game with Powerups

A modern, feature-rich Pong game built with HTML5 Canvas, CSS3, and vanilla JavaScript. Features multiple paddle control modes, powerups, unlimited gameplay, and authentic retro styling with CRT effects.

## Features

### 🎮 Game Modes

- **Left Paddle Controls**: W/S keys, Mouse, or AI
- **Right Paddle Controls**: Arrow Up/Down, Mouse, or AI
- **Unlimited Gameplay**: No end condition, just increasing difficulty

### ⚡ Powerups System

- **Bigger/Smaller Paddle**: Temporarily changes paddle size
- **Bigger/Smaller Ball**: Temporarily changes ball size
- **Speed Up/Down**: Temporarily changes ball speed
- **Random Direction**: Changes ball direction randomly
- **Clone Ball**: Creates multiple balls
- **Score Bonus/Penalty**: Adds or subtracts points
- **Portal**: Teleports ball to opposite side
- **Random Wall**: Creates temporary obstacles

### 🎯 Gameplay Features

- **Progressive Difficulty**: Ball speed increases with each paddle hit
- **Maximum Speed Cap**: Ball speed capped at 6x
- **Visual Effects**: Glowing effects for active powerups
- **Dynamic Sizing**: Full-screen responsive canvas that adapts to any window size
- **Responsive Design**: Works on different screen sizes and orientations

### 🕹️ Retro Styling

- **CRT Scanlines**: Authentic retro monitor effect
- **Pixel Fonts**: "Press Start 2P" retro gaming font
- **Glowing Elements**: Neon green and cyan color scheme
- **CRT Flicker**: Subtle screen flicker animation
- **Scanline Overlay**: Horizontal scanline effect

## How to Play

### Menu Screen

1. Select control mode for each paddle:
   - **Keyboard**: Use W/S for left paddle, Arrow Up/Down for right paddle
   - **Mouse**: Move mouse to control paddle position
   - **AI**: Computer-controlled paddle with smart ball prediction
2. Click "START GAME" to begin

### Game Screen

- **Left Paddle**: W (up) / S (down) or Mouse
- **Right Paddle**: Arrow Up / Arrow Down or Mouse
- **Pause**: Press ESC or click PAUSE button
- **Return to Menu**: Click MENU button

### Powerups

- **Golden orbs** appear randomly on screen
- **Hit them with the ball** to collect
- **Effects last for 8-10 seconds** (except instant effects)
- **Visual indicators** show active effects

## File Structure

```
Pong/
├── index.html          # Main HTML file with retro styling
├── styles.css          # CSS with CRT effects and retro theme
├── js/
│   ├── config.js       # Game configuration and constants
│   ├── powerups.js     # Powerup management system (self-contained)
│   ├── paddle.js       # Paddle class with control modes
│   ├── ball.js         # Ball class with physics
│   ├── game.js         # Main game logic and loop
│   └── main.js         # Application entry point
└── README.md           # This file
```

## Technical Details

### Architecture

- **ES6 Modules**: Clean import/export system for better maintainability
- **Modular Design**: Each component is a separate class with clear responsibilities
- **Event-Driven**: Uses event listeners for user input
- **Game Loop**: RequestAnimationFrame for smooth 60fps gameplay
- **Collision Detection**: Precise hitbox calculations

### Powerup System

- **Self-Contained**: All powerup logic and configuration in PowerupManager
- **Effect Management**: Timed effects with automatic cleanup
- **Individual Effects**: Most powerups affect only the collecting paddle/ball
- **Global Effects**: Some powerups (walls, portals) affect the entire game
- **No Global Variables**: Clean dependency injection pattern

### Retro Styling Implementation

- **CSS Scanlines**: Pure CSS scanline overlay effect
- **Google Fonts**: "Press Start 2P" for authentic retro look
- **Canvas Effects**: Scanlines and glowing borders in game objects
- **Color Scheme**: Classic green-on-black terminal aesthetic
- **Animations**: Glowing text and CRT flicker effects

### Dynamic Sizing Implementation

- **Window Resize Handling**: Automatic canvas resizing on window resize events
- **Orientation Change Support**: Handles mobile device orientation changes
- **Responsive Layout**: Game header and controls adapt to different screen sizes
- **Media Queries**: CSS responsive design for mobile and tablet devices
- **Automatic Repositioning**: All game elements automatically adjust to new dimensions

### AI Implementation

- **Ball Prediction**: Calculates where ball will be when it reaches paddle
- **Randomness**: Adds unpredictability to make AI beatable
- **Efficiency**: Only tracks relevant balls (moving toward paddle)

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **ES6 Modules**: Required for import/export functionality
- **HTML5 Canvas**: Required for rendering
- **CSS3 Features**: Required for retro effects

## Recent Optimizations

### ✅ **Fixed Issues:**

- **Global Variable Bug**: Removed undefined `game` variable references
- **Module Structure**: Implemented ES6 modules for better code organization
- **Powerup Management**: Consolidated all powerup logic into PowerupManager class

### 🎨 **Retro Styling:**

- **CRT Effects**: Added scanlines, flicker, and retro color scheme
- **Typography**: Implemented "Press Start 2P" retro gaming font
- **Visual Enhancements**: Glowing borders, neon colors, and pixel-perfect rendering

### 🔧 **Code Improvements:**

- **Dependency Injection**: Clean passing of game instances between classes
- **Self-Contained Modules**: Each class manages its own dependencies
- **Better Maintainability**: Modular structure for easier updates and debugging
- **Dynamic Canvas Sizing**: Automatic canvas resizing based on window dimensions
- **Responsive Game Elements**: All game objects automatically adjust to new canvas sizes

## Future Enhancements

- Sound effects and chiptune background music
- Multiplayer over network
- Custom powerup combinations
- Tournament mode
- Powerup shop system
- Achievement system
- Additional retro visual effects

## Credits

Built with vanilla JavaScript, HTML5, and CSS3. Features the "Press Start 2P" font from Google Fonts for authentic retro styling.

---

**Enjoy the retro gaming experience!** 🕹️✨
