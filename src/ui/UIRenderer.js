export class UIRenderer {
  constructor(themeManager) {
    this.theme = themeManager;
  }

  showWelcome() {
    console.log(this.theme.primary('╭─────────────────────────────────────────╮'));
    console.log(this.theme.primary('│') + '           ' + this.theme.highlight(' WebVision AI ') + '              ' + this.theme.primary('│'));
    console.log(this.theme.primary('│') + '        ' + this.theme.secondary('Your AI Agent CLI') + '            ' + this.theme.primary('│'));
    console.log(this.theme.primary('╰─────────────────────────────────────────╯'));
    console.log('');
  }

  showFirstTimeSetup() {
    console.log(this.theme.warning('🚀 Welcome to WebVision AI!'));
    console.log(this.theme.text('Let\'s get you set up for the first time.'));
    console.log('');
  }

  showSetupComplete() {
    console.log('');
    console.log(this.theme.success('✅ Setup completed successfully!'));
    console.log(this.theme.text('You can now start using WebVision AI.'));
    console.log('');
  }

  showHeader() {
    console.log(this.theme.primary('╭─────────────────────────────────────────╮'));
    console.log(this.theme.primary('│') + '           ' + this.theme.highlight(' WebVision AI ') + '              ' + this.theme.primary('│'));
    console.log(this.theme.primary('╰─────────────────────────────────────────╯'));
    console.log('');
    console.log(this.theme.dim('Type your message or use /help for commands'));
    console.log('');
  }

  showHelp() {
    console.log('');
    console.log(this.theme.primary('📋 Available Commands:'));
    console.log('');
    console.log(this.theme.secondary('/help') + '     - Show this help message');
    console.log(this.theme.secondary('/clear') + '    - Clear the screen');
    console.log(this.theme.secondary('/apikey') + '   - Update OpenAI API key');
    console.log(this.theme.secondary('/theme') + '    - Change color theme');
    console.log(this.theme.secondary('/status') + '   - Show current configuration');
    console.log(this.theme.secondary('/exit') + '     - Exit the application');
    console.log('');
    console.log(this.theme.dim('Type any other text to chat with AI'));
    console.log('');
  }

  showStatus(config) {
    console.log('');
    console.log(this.theme.primary('📊 Current Status:'));
    console.log('');
    console.log(this.theme.text('API Key: ') + (config.apiKey ? this.theme.success('✅ Configured') : this.theme.error('❌ Not set')));
    console.log(this.theme.text('Theme: ') + this.theme.secondary(config.theme));
    console.log('');
  }

  showText(text) {
    console.log(this.theme.text(text));
    console.log('');
  }

  showGoodbye() {
    console.log('');
    console.log(this.theme.success('👋 Thank you for using WebVision AI!'));
    console.log(this.theme.dim('Goodbye!'));
    console.log('');
  }

  showError(message) {
    console.log('');
    console.log(this.theme.error('❌ Error: ') + this.theme.text(message));
    console.log('');
  }

  showSuccess(message) {
    console.log('');
    console.log(this.theme.success('✅ ') + this.theme.text(message));
    console.log('');
  }

  showAgentStart(task) {
    console.log('');
    console.log(this.theme.primary('🤖 Agent started with task:'));
    console.log(this.theme.text(task));
    console.log('');
  }
  showAgentEnd(response) {
    console.log('');
    console.log(this.theme.success('✅ Agent completed the task!'));
    console.log(this.theme.text('Response:'));
    console.log(this.theme.text(response));
    console.log('');
  }
}