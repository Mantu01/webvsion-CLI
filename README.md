# WebVision AI Agent CLI

A professional command-line interface for AI interactions with customizable themes and easy extensibility.

## Installation

1. Clone or create the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. Make the CLI globally accessible:
   ```bash
   npm link
   ```

## Usage

Start the CLI by typing:
```bash
webvision
```

### First Time Setup
- Enter your OpenAI API key
- Choose your preferred color theme

### Available Commands
- `/help` - Show help information
- `/clear` - Clear the screen
- `/apikey` - Update OpenAI API key
- `/theme` - Change color theme
- `/status` - Show current configuration
- `/exit` - Exit the application

### Features
- 🎨 5 beautiful color themes
- 🔐 Secure API key storage
- 📁 Clean project architecture
- ⌨️ Arrow key navigation for selections
- 🚀 Easy to extend

### Project Structure
```
webvision-cli/
├── src/
│   ├── index.js              # Entry point
│   ├── cli/
│   │   └── WebVisionCLI.js   # Main CLI class
│   ├── config/
│   │   └── ConfigManager.js  # Configuration management
│   ├── ui/
│   │   ├── ThemeManager.js   # Theme system
│   │   └── UIRenderer.js     # UI rendering
│   └── commands/
│       └── CommandHandler.js # Command processing
├── package.json
└── README.md
```

## Development

Run in development mode:
```bash
npm run dev
```

## Extending the CLI

To add new features:
1. Add new commands in `CommandHandler.js`
2. Create new UI components in the `ui/` directory
3. Add configuration options in `ConfigManager.js`

The architecture is designed to be modular and easy to extend with new AI features.