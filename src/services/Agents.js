import 'dotenv/config'
import { Agent, run } from '@openai/agents';
import { chromium } from 'playwright';
import { Tools } from './Tools.js';

export class AgentService {
  constructor(ui) {
    this.ui = ui;
    this.browser = null;
    this.page = null;
    this.tools = null;
    this.agent = null;
  }

  async initBrowser() {
    if (this.browser) return;
    this.browser = await chromium.launch({
      headless: false,
      env: {},
      chromiumSandbox: true,
      args: ['--disable-extensions', '--disable-file-system']
    });
    this.page = await this.browser.newPage();
    this.tools = new Tools(this.page, this.browser);
    this.agent = new Agent({
      name: 'WebSite Automation Agent',
      instructions: `
        You are this and that agent

        Rules:
        - When the user provides a domain like "mantukumar.tech", "google.com", or "wikipedia.org", you must normalize it into a valid full URL that starts with "https://". 
        - Use tools to open URL, click, type, scroll, etc.
        - Never ask the user for clarification, always try to complete the task.
        - If the user request is not clear, use your best judgement to complete the task.
        - use fake data for any form filling like name, email, phone, etc.
        - Call 'take_screenshot' ONLY when you need to analyze what's visible.
        - Visit all the pages you need to in order to complete the task, Use the tools to navigate to all the pages you need to in order to complete the task.

        Example : 
         user may say "Go to google.com and search for cats and give the top five facts about cat", you must convert it to "https://google.com" and then use the tools to open the URL, type "cats" in the search box, and click the search button.
        `,
      tools: Object.values(this.tools.getTools()),
    });
  }

  async runAgent(task) {
    await this.initBrowser();
    if (!this.agent) {
      throw new Error('Agent not initialized');
    }
    this.ui.showAgentStart(task);
    const response = await run(this.agent, task);
    this.ui.showAgentEnd(response.finalOutput);
  }

}