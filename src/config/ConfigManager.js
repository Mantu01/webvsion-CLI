import fs from 'fs';
import path from 'path';
import os from 'os';

export class ConfigManager {
  constructor() {
    this.configDir = path.join(os.homedir(), '.webvision');
    this.configFile = path.join(this.configDir, 'config.json');
    this.ensureConfigDir();
    this.loadConfig();
  }

  ensureConfigDir() {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = fs.readFileSync(this.configFile, 'utf8');
        this.config = JSON.parse(data);
      } else {
        this.config = this.getDefaultConfig();
      }
    } catch (error) {
      this.config = this.getDefaultConfig();
    }
  }

  saveConfig() {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save configuration:', error.message);
    }
  }

  getDefaultConfig() {
    return {
      apiKey: null,
      theme: 'default',
      firstTime: true
    };
  }

  isFirstTime() {
    return this.config.firstTime === true;
  }

  setFirstTime(value) {
    this.config.firstTime = value;
    this.saveConfig();
  }

  getApiKey() {
    return this.config.apiKey;
  }

  setApiKey(apiKey) {
    this.config.apiKey = apiKey;
    this.saveConfig();
  }

  getTheme() {
    return this.config.theme || 'default';
  }

  setTheme(theme) {
    this.config.theme = theme;
    this.saveConfig();
  }
}