import chalk from 'chalk';

export class ThemeManager {
  constructor() {
    this.themes = {
      default: {
        primary: chalk.blue,
        secondary: chalk.cyan,
        success: chalk.green,
        warning: chalk.yellow,
        error: chalk.red,
        text: chalk.white,
        dim: chalk.gray,
        highlight: chalk.bgBlue.white
      },
      dark: {
        primary: chalk.magenta,
        secondary: chalk.purple,
        success: chalk.green,
        warning: chalk.yellow,
        error: chalk.red,
        text: chalk.white,
        dim: chalk.gray,
        highlight: chalk.bgMagenta.white
      },
      ocean: {
        primary: chalk.cyan,
        secondary: chalk.blue,
        success: chalk.green,
        warning: chalk.yellow,
        error: chalk.red,
        text: chalk.white,
        dim: chalk.gray,
        highlight: chalk.bgCyan.black
      },
      sakura: {
        primary: chalk.magenta,
        secondary: chalk.pink,
        success: chalk.green,
        warning: chalk.yellow,
        error: chalk.red,
        text: chalk.white,
        dim: chalk.gray,
        highlight: chalk.bgMagenta.white
      },
      forest: {
        primary: chalk.green,
        secondary: chalk.greenBright,
        success: chalk.green,
        warning: chalk.yellow,
        error: chalk.red,
        text: chalk.white,
        dim: chalk.gray,
        highlight: chalk.bgGreen.black
      }
    };
    
    this.currentTheme = 'default';
  }

  setTheme(themeName) {
    if (this.themes[themeName]) {
      this.currentTheme = themeName;
    }
  }

  getTheme() {
    return this.themes[this.currentTheme];
  }

  primary(text) {
    return this.themes[this.currentTheme].primary(text);
  }

  secondary(text) {
    return this.themes[this.currentTheme].secondary(text);
  }

  success(text) {
    return this.themes[this.currentTheme].success(text);
  }

  warning(text) {
    return this.themes[this.currentTheme].warning(text);
  }

  error(text) {
    return this.themes[this.currentTheme].error(text);
  }

  text(text) {
    return this.themes[this.currentTheme].text(text);
  }

  dim(text) {
    return this.themes[this.currentTheme].dim(text);
  }

  highlight(text) {
    return this.themes[this.currentTheme].highlight(text);
  }

  prompt(text) {
    return this.primary(text);
  }
}