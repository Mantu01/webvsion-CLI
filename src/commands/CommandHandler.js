import inquirer from 'inquirer';

export class CommandHandler {
  constructor(configManager, themeManager) {
    this.config = configManager;
    this.theme = themeManager;
    this.ui = null; // Will be set by CLI
    
    this.commands = {
      '/help': this.showHelp.bind(this),
      '/clear': this.clearScreen.bind(this),
      '/apikey': this.updateApiKey.bind(this),
      '/theme': this.changeTheme.bind(this),
      '/status': this.showStatus.bind(this),
      '/exit': this.exit.bind(this)
    };
  }

  setUIRenderer(uiRenderer) {
    this.ui = uiRenderer;
  }

  async execute(command) {
    const cmd = command.toLowerCase();
    
    if (this.commands[cmd]) {
      return await this.commands[cmd]();
    } else {
      console.log('');
      console.log(this.theme.error('❌ Unknown command: ') + this.theme.text(command));
      console.log(this.theme.dim('Type /help to see available commands'));
      console.log('');
      return null;
    }
  }

  async showHelp() {
    const uiRenderer = new (await import('../ui/UIRenderer.js')).UIRenderer(this.theme);
    uiRenderer.showHelp();
    return null;
  }

  async clearScreen() {
    console.clear();
    return null;
  }

  async updateApiKey() {
    console.log('');
    const { apiKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter new OpenAI API key:',
        mask: '*',
        validate: (input) => {
          if (!input || input.length < 10) {
            return 'Please enter a valid API key';
          }
          return true;
        }
      }
    ]);

    this.config.setApiKey(apiKey);
    console.log(this.theme.success('✅ API key updated successfully!'));
    console.log('');
    return null;
  }

  async changeTheme() {
    console.log('');
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

    this.config.setTheme(theme);
    this.theme.setTheme(theme);
    console.log(this.theme.success('✅ Theme changed successfully!'));
    console.log('');
    return null;
  }

  async showStatus() {
    const uiRenderer = new (await import('../ui/UIRenderer.js')).UIRenderer(this.theme);
    uiRenderer.showStatus({
      apiKey: this.config.getApiKey(),
      theme: this.config.getTheme()
    });
    return null;
  }

  async exit() {
    return 'exit';
  }
}