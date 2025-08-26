// src/cli/WebVisionCLI.js
import inquirer from 'inquirer';
import { ConfigManager } from '../config/ConfigManager.js';
import { ThemeManager } from '../ui/ThemeManager.js';
import { CommandHandler } from '../commands/CommandHandler.js';
import { UIRenderer } from '../ui/UIRenderer.js';
import { AgentService } from '../services/Agents.js';

export class WebVisionCLI {
  constructor() {
    this.configManager = new ConfigManager();
    this.themeManager = new ThemeManager();
    this.commandHandler = new CommandHandler(this.configManager, this.themeManager);
    this.uiRenderer = new UIRenderer(this.themeManager);
    this.agent= new AgentService(this.uiRenderer);
    this.running = false;
  }

  async start() {
    this.running = true;
    
    // Clear screen and show welcome
    console.clear();
    this.uiRenderer.showWelcome();

    // Check if first time setup is needed
    if (this.configManager.isFirstTime()) {
      await this.firstTimeSetup();
    }

    // Start main loop
    await this.mainLoop();
  }

  async firstTimeSetup() {
    this.uiRenderer.showFirstTimeSetup();

    // Get API key
    const { apiKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your OpenAI API key:',
        mask: '*',
        validate: (input) => {
          if (!input || input.length < 10) {
            return 'Please enter a valid API key';
          }
          return true;
        }
      }
    ]);

    // Choose theme
    const { theme } = await inquirer.prompt([
      {
        type: 'list',
        name: 'theme',
        message: 'Choose your preferred color theme:',
        choices: [
          { name: '🌟 Default (Blue)', value: 'default' },
          { name: '🌙 Dark (Purple)', value: 'dark' },
          { name: '🌊 Ocean (Cyan)', value: 'ocean' },
          { name: '🌸 Sakura (Pink)', value: 'sakura' },
          { name: '🍃 Forest (Green)', value: 'forest' }
        ]
      }
    ]);

    // Save configuration
    this.configManager.setApiKey(apiKey);
    this.configManager.setTheme(theme);
    this.configManager.setFirstTime(false);
    
    this.themeManager.setTheme(theme);
    
    this.uiRenderer.showSetupComplete();
    await this.pause();
  }

  async mainLoop() {
    while (this.running) {
      const { input } = await inquirer.prompt([
        {
          type: 'input',
          name: 'input',
          message: this.themeManager.prompt('webvision>'),
          prefix: ''
        }
      ]);

      if (input.trim()) {
        await this.processInput(input.trim());
      }
    }
  }

  async processInput(input) {
    if (input.startsWith('/')) {
      const result = await this.commandHandler.execute(input);
      if (result === 'exit') {
        this.running = false;
        this.uiRenderer.showGoodbye();
        return;
      }
    } else {
      this.agent.runAgent(input);
    }
  }

  async pause() {
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Press Enter to continue...',
        prefix: ''
      }
    ]);
  }
}