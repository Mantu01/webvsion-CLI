import { tool } from "@openai/agents";
import { z } from "zod";
import fs from "fs";
import path from "path";

export class Tools {
  constructor(page, browser) {
    this.page = page;
    this.browser = browser;
    this.maxRetries = 5;
    this.defaultTimeout = 30000;

    this.screenshotDir = path.resolve("./screenshots");
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }

    // Initialize tools immediately after construction
    this.initializeTools();
    
    // Configure page for better compatibility
    this.configurePage();
  }

  async configurePage() {
    try {
      // Set a realistic user agent
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Set viewport
      await this.page.setViewportSize({ width: 1920, height: 1080 });
      
      // Set extra HTTP headers
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      });
    } catch (error) {
      console.warn("Page configuration warning:", error.message);
    }
  }

  // Robust page loading with multiple strategies
  async loadPageRobustly(url, maxAttempts = 3) {
    const strategies = [
      { waitUntil: 'domcontentloaded', timeout: 30000 },
      { waitUntil: 'load', timeout: 45000 },
      { waitUntil: 'networkidle', timeout: 60000 }
    ];

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      for (let strategy of strategies) {
        try {
          console.log(`Attempt ${attempt + 1}: Loading ${url} with strategy:`, strategy);
          
          // Navigate with current strategy
          const response = await this.page.goto(url, strategy);
          
          if (!response) {
            throw new Error("No response received");
          }

          // Check if we got a valid response
          const status = response.status();
          if (status >= 400) {
            throw new Error(`HTTP ${status} error`);
          }

          // Wait for basic DOM structure
          await this.page.waitForTimeout(2000);
          
          // Try to ensure content is loaded
          await this.waitForContentLoaded();
          
          console.log(`✅ Page loaded successfully with strategy:`, strategy);
          return { success: true, status, url: this.page.url() };
          
        } catch (error) {
          console.log(`❌ Strategy failed:`, strategy, error.message);
          continue;
        }
      }
      
      // If all strategies failed, wait before next attempt
      if (attempt < maxAttempts - 1) {
        console.log("All strategies failed, waiting before retry...");
        await this.page.waitForTimeout(3000);
      }
    }
    
    throw new Error(`Failed to load page after ${maxAttempts} attempts with all strategies`);
  }

  // Wait for content to be actually loaded
  async waitForContentLoaded(timeout = 15000) {
    try {
      // Wait for basic HTML structure
      await this.page.waitForFunction(() => {
        return document.readyState === 'complete' || 
               document.readyState === 'interactive';
      }, { timeout: timeout / 3 });

      // Wait for some content to appear
      await this.page.waitForFunction(() => {
        return document.body && 
               (document.body.children.length > 0 || 
                document.body.textContent.trim().length > 0);
      }, { timeout: timeout / 3 });

      // Additional wait for dynamic content
      await this.page.waitForTimeout(2000);

    } catch (error) {
      console.warn("Content loading timeout, continuing anyway");
    }
  }

  // Universal retry wrapper
  async executeWithRetry(operation, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) {
          throw error;
        }
        console.log(`Attempt ${i + 1} failed: ${error.message}. Retrying...`);
        await this.page.waitForTimeout(delay * (i + 1));
      }
    }
  }

  // Smart element finder with multiple strategies
  async findElement(selector, timeout = 10000) {
    const strategies = [
      async () => {
        await this.page.waitForSelector(selector, { state: 'visible', timeout });
        return true;
      },
      async () => {
        await this.page.waitForSelector(selector, { state: 'attached', timeout });
        return true;
      },
      async () => {
        await this.page.locator(selector).first().waitFor({ timeout });
        return true;
      },
    ];

    for (let strategy of strategies) {
      try {
        await strategy();
        return true;
      } catch (error) {
        continue;
      }
    }
    return false;
  }

  // Helper: save screenshot to file
  async captureImageFile() {
    try {
      const fileName = `screenshot-${Date.now()}.png`;
      const filePath = path.join(this.screenshotDir, fileName);

      // Try multiple screenshot strategies
      const strategies = [
        async () => await this.page.screenshot({ fullPage: true, path: filePath }),
        async () => await this.page.screenshot({ fullPage: false, path: filePath }),
        async () => await this.page.screenshot({ path: filePath }),
      ];

      for (let strategy of strategies) {
        try {
          await strategy();
          return {
            type: "image_url",
            image_url: { url: `file://${filePath}` },
          };
        } catch (error) {
          console.warn("Screenshot strategy failed:", error.message);
          continue;
        }
      }

      throw new Error("All screenshot strategies failed");
    } catch (error) {
      throw new Error(`Screenshot failed: ${error.message}`);
    }
  }

  // Initialize all tools
  initializeTools() {
    // Screenshot tool
    this.takeScreenShot = tool({
      name: "take_screenshot",
      description: "Capture a screenshot and return local file path.",
      parameters: z.object({}),
      execute: async () => {
        try {
          return await this.captureImageFile();
        } catch (error) {
          return { error: `❌ Screenshot failed: ${error.message}` };
        }
      },
    });

    // Browser management
    this.openBrowser = tool({
      name: "open_browser", 
      description: "Open a new browser tab with optimal settings.",
      parameters: z.object({}),
      execute: async () => {
        try {
          this.page = await this.browser.newPage();
          await this.configurePage();
          return { message: "✅ New browser tab opened with optimal configuration" };
        } catch (error) {
          return { error: `❌ Failed to open new tab: ${error.message}` };
        }
      },
    });

    // URL navigation
    this.openURL = tool({
      name: "open_url",
      description: "Navigate to a URL with multiple fallback strategies for maximum reliability.",
      parameters: z.object({
        url: z.string().describe("URL to navigate to"),
        forceReload: z.boolean().describe("Force reload if already on this URL"),
      }),
      execute: async ({ url, forceReload = false }) => {
        try {
          // Normalize URL
          if (!/^https?:\/\//i.test(url)) {
            url = "https://" + url;
          }

          // Check if we're already on this URL
          const currentUrl = this.page.url();
          if (currentUrl === url && !forceReload) {
            return { message: `🌍 Already on ${url}` };
          }

          console.log(`🌍 Attempting to load: ${url}`);
          
          const result = await this.loadPageRobustly(url); 
          
          // Verify we actually loaded content
          const title = await this.page.title().catch(() => "Unknown");
          const finalUrl = this.page.url();
          
          return { 
            message: `🌍 Successfully loaded: ${finalUrl}\n📄 Title: ${title}\n✅ Status: ${result.status}` 
          };

        } catch (error) {
          console.error("URL loading failed:", error);
          
          // Try one last fallback attempt
          try {
            console.log("🔄 Attempting fallback load...");
            await this.page.goto(url, { waitUntil: 'commit', timeout: 15000 });
            await this.page.waitForTimeout(3000); 
            
            const title = await this.page.title().catch(() => "Partially loaded");
            return { 
              message: `🌍 Fallback load completed for: ${url}\n📄 Title: ${title}\n⚠️  Content may be partially loaded` 
            };
          } catch (fallbackError) {
            return { 
              error: `❌ Failed to load ${url} after all attempts.\nOriginal error: ${error.message}\nFallback error: ${fallbackError.message}` 
            };
          }
        }
      },
    });

    // Click interactions
    this.clickOnScreen = tool({
      name: "click_screen",
      description: "Click at screen coordinates with retry logic.",
      parameters: z.object({
        x: z.number(),
        y: z.number(),
      }),
      execute: async ({ x, y }) => {
        try {
          return await this.executeWithRetry(async () => {
            // Ensure coordinates are within viewport
            const viewport = this.page.viewportSize();
            if (x < 0 || y < 0 || x > viewport.width || y > viewport.height) {
              throw new Error(`Coordinates (${x},${y}) are outside viewport ${viewport.width}x${viewport.height}`);
            }

            await this.page.mouse.click(x, y);
            await this.page.waitForTimeout(500);
            return { message: `🖱️ Successfully clicked at coordinates (${x},${y})` };
          });
        } catch (error) {
          return { error: `❌ Failed to click at (${x},${y}): ${error.message}` };
        }
      },
    });

    this.clickElement = tool({
      name: "click_element",
      description: "Click an element using multiple selection strategies.",
      parameters: z.object({
        selector: z.string().describe("CSS selector, text content, or aria-label"),
      }),
      execute: async ({ selector }) => {
        try {
          return await this.executeWithRetry(async () => {
            let clicked = false;
            let lastError = null;

            // Strategy 1: Direct CSS selector
            try {
              if (await this.findElement(selector, 3000)) {
                await this.page.click(selector, { timeout: 5000 });
                clicked = true;
              }
            } catch (e) {
              lastError = e;
            }

            // Strategy 2: Text content (exact match)
            if (!clicked && !selector.startsWith('[') && !selector.includes('#') && !selector.includes('.')) {
              try {
                const textSelector = `text="${selector}"`;
                await this.page.click(textSelector, { timeout: 5000 });
                clicked = true;
              } catch (e) {
                lastError = e;
              }
            }

            // Strategy 3: Partial text match
            if (!clicked) {
              try {
                const partialTextSelector = `text=${selector}`;
                await this.page.click(partialTextSelector, { timeout: 5000 });
                clicked = true;
              } catch (e) {
                lastError = e;
              }
            }

            // Strategy 4: Aria-label
            if (!clicked) {
              try {
                const ariaSelector = `[aria-label*="${selector}"]`;
                if (await this.findElement(ariaSelector, 3000)) {
                  await this.page.click(ariaSelector, { timeout: 5000 });
                  clicked = true;
                }
              } catch (e) {
                lastError = e;
              }
            }

            // Strategy 5: Title attribute
            if (!clicked) {
              try {
                const titleSelector = `[title*="${selector}"]`;
                if (await this.findElement(titleSelector, 3000)) {
                  await this.page.click(titleSelector, { timeout: 5000 });
                  clicked = true;
                }
              } catch (e) {
                lastError = e;
              }
            }

            // Strategy 6: XPath with text
            if (!clicked) {
              try {
                const xpath = `//button[contains(text(), '${selector}')] | //a[contains(text(), '${selector}')] | //span[contains(text(), '${selector}')] | //div[contains(text(), '${selector}')]`;
                const element = await this.page.locator(`xpath=${xpath}`).first();
                if (await element.isVisible()) {
                  await element.click({ timeout: 5000 });
                  clicked = true;
                }
              } catch (e) {
                lastError = e;
              }
            }

            if (!clicked) {
              throw new Error(`Element not found or not clickable: ${selector}. Last error: ${lastError?.message}`);
            }

            await this.page.waitForTimeout(500);
            return { message: `🖱️ Successfully clicked element: ${selector}` };
          });
        } catch (error) {
          return { error: `❌ Failed to click element "${selector}": ${error.message}` };
        }
      },
    });

    // Text input
    this.sendKeys = tool({
      name: "send_keys",
      description: "Type text with human-like timing.",
      parameters: z.object({
        text: z.string(),
        delay: z.number().describe("Delay between keystrokes in ms (default: 50)"),
      }),
      execute: async ({ text, delay = 50 }) => {
        try {
          return await this.executeWithRetry(async () => {
            await this.page.keyboard.type(text, { delay });
            return { message: `⌨️ Successfully typed: "${text.length > 50 ? text.substring(0, 50) + '...' : text}"` };
          });
        } catch (error) {
          return { error: `❌ Failed to type text: ${error.message}` };
        }
      },
    });

    // Form filling
    this.fillForm = tool({
      name: "fill_form",
      description: "Fill form fields with comprehensive error handling and validation.",
      parameters: z.object({
        selector: z.string(),
        text: z.string(),
        clear: z.boolean().describe("Clear field first (default: true)"),
      }),
      execute: async ({ selector, text, clear = true }) => {
        try {
          return await this.executeWithRetry(async () => {
            // Find the element using multiple strategies
            const found = await this.findElement(selector);
            if (!found) {
              throw new Error(`Element not found: ${selector}`);
            }

            // Check if element is a form field
            const elementInfo = await this.page.evaluate((sel) => {
              const el = document.querySelector(sel);
              if (!el) return null;
              return {
                tagName: el.tagName.toLowerCase(),
                type: el.type || 'unknown',
                disabled: el.disabled,
                readonly: el.readOnly
              };
            }, selector);

            if (!elementInfo) {
              throw new Error(`Element not found: ${selector}`);
            }

            if (!['input', 'textarea', 'select'].includes(elementInfo.tagName)) {
              throw new Error(`Element is not a form field: ${elementInfo.tagName}`);
            }

            if (elementInfo.disabled || elementInfo.readonly) {
              throw new Error(`Element is disabled or readonly`);
            }

            // Clear and fill
            if (clear) {
              await this.page.fill(selector, '');
            }
            await this.page.fill(selector, text);

            // Trigger events to ensure proper form handling
            await this.page.dispatchEvent(selector, 'input');
            await this.page.dispatchEvent(selector, 'change');
            await this.page.dispatchEvent(selector, 'blur');

            // Verify the value was set (if it's an input field)
            if (elementInfo.tagName === 'input' || elementInfo.tagName === 'textarea') {
              try {
                const setValue = await this.page.inputValue(selector);
                if (setValue !== text) {
                  console.warn(`Warning: Expected "${text}" but got "${setValue}"`);
                }
              } catch (e) {
                // Some elements might not support inputValue, that's okay
              }
            }

            return { message: `📝 Successfully filled "${selector}" with "${text}"` };
          });
        } catch (error) {
          return { error: `❌ Failed to fill form field "${selector}": ${error.message}` };
        }
      },
    });

    // Page scrolling
    this.scrollPage = tool({
      name: "scroll_page", 
      description: "Scroll the page with smooth animation and position tracking.",
      parameters: z.object({
        pixels: z.number(),
        behavior: z.enum(['auto', 'smooth']).describe("Scroll behavior (default: smooth)"),
      }),
      execute: async ({ pixels, behavior = 'smooth' }) => {
        try {
          const beforeScroll = await this.page.evaluate(() => window.pageYOffset);
          
          await this.page.evaluate(({ y, scrollBehavior }) => {
            window.scrollBy({ top: y, behavior: scrollBehavior });
          }, { y: pixels, scrollBehavior: behavior });
          
          // Wait for scroll to complete
          await this.page.waitForTimeout(1000);
          
          const afterScroll = await this.page.evaluate(() => window.pageYOffset);
          const actualMovement = afterScroll - beforeScroll;
          
          return { 
            message: `📜 Scrolled ${actualMovement}px (requested: ${pixels}px). Position: ${afterScroll}px` 
          };
        } catch (error) {
          return { error: `❌ Failed to scroll: ${error.message}` };
        }
      },
    });

    // Keyboard actions
    this.pressKey = tool({
      name: "press_key",
      description: "Press keyboard keys with retry logic.",
      parameters: z.object({
        key: z.string().describe("Key to press (Enter, Tab, Escape, etc.)"),
      }),
      execute: async ({ key }) => {
        try {
          return await this.executeWithRetry(async () => {
            await this.page.keyboard.press(key);
            await this.page.waitForTimeout(200);
            return { message: `⌨️ Successfully pressed: ${key}` };
          });
        } catch (error) {
          return { error: `❌ Failed to press key "${key}": ${error.message}` };
        }
      },
    });

    // Page status checking
    this.waitAndCheck = tool({
      name: "wait_and_check",
      description: "Wait for page to be ready and check if content loaded properly.",
      parameters: z.object({
        timeout: z.number().describe("Timeout in ms (default: 10000)"),
      }),
      execute: async ({ timeout = 10000 }) => {
        try {
          await this.waitForContentLoaded(timeout);
          
          const url = this.page.url();
          const title = await this.page.title();
          const bodyText = await this.page.evaluate(() => 
            document.body ? document.body.textContent.trim().substring(0, 100) : ''
          );
          
          return { 
            message: `✅ Page ready!\n🌍 URL: ${url}\n📄 Title: ${title}\n📝 Content preview: ${bodyText}${bodyText.length >= 100 ? '...' : ''}` 
          };
        } catch (error) {
          return { error: `❌ Page check failed: ${error.message}` };
        }
      },
    });

    // Page refresh
    this.refreshPage = tool({
      name: "refresh_page",
      description: "Refresh the current page with robust loading.",
      parameters: z.object({}),
      execute: async () => {
        try {
          const currentUrl = this.page.url();
          console.log("🔄 Refreshing page:", currentUrl);
          
          const result = await this.loadPageRobustly(currentUrl);
          const title = await this.page.title();
          
          return { 
            message: `🔄 Page refreshed successfully!\n📄 Title: ${title}\n✅ Status: ${result.status}` 
          };
        } catch (error) {
          return { error: `❌ Failed to refresh page: ${error.message}` };
        }
      },
    });

    // Element existence check
    this.checkElement = tool({
      name: "check_element",
      description: "Check if an element exists and is visible on the page.",
      parameters: z.object({
        selector: z.string().describe("CSS selector or text to find"),
      }),
      execute: async ({ selector }) => {
        try {
          const exists = await this.findElement(selector, 3000);
          if (exists) {
            const isVisible = await this.page.isVisible(selector).catch(() => false);
            const isEnabled = await this.page.isEnabled(selector).catch(() => false);
            
            return { 
              message: `✅ Element found: ${selector}\n👁️ Visible: ${isVisible}\n🖱️ Enabled: ${isEnabled}` 
            };
          } else {
            return { message: `❌ Element not found: ${selector}` };
          }
        } catch (error) {
          return { error: `❌ Failed to check element "${selector}": ${error.message}` };
        }
      },
    });

    // Get page content
    this.getPageContent = tool({
      name: "get_page_content",
      description: "Extract text content from the current page.",
      parameters: z.object({
        selector: z.string().describe("CSS selector to extract content from (default: body)"),
        maxLength: z.number().describe("Maximum length of content (default: 1000)"),
      }),
      execute: async ({ selector = 'body', maxLength = 1000 }) => {
        try {
          const content = await this.page.evaluate(({ sel, max }) => {
            const element = document.querySelector(sel);
            if (!element) return null;
            const text = element.textContent || element.innerText || '';
            return text.trim().substring(0, max);
          }, { sel: selector, max: maxLength });

          if (content === null) {
            return { error: `❌ Element not found: ${selector}` };
          }

          return { 
            message: `📄 Content extracted from ${selector}:\n${content}${content.length >= maxLength ? '...' : ''}` 
          };
        } catch (error) {
          return { error: `❌ Failed to get content from "${selector}": ${error.message}` };
        }
      },
    });
  }

  // Return all tools as an object
  getTools() {
    return {
      takeScreenShot: this.takeScreenShot,
      openBrowser: this.openBrowser,
      openURL: this.openURL,
      clickOnScreen: this.clickOnScreen,
      clickElement: this.clickElement,
      sendKeys: this.sendKeys,
      fillForm: this.fillForm,
      scrollPage: this.scrollPage,
      pressKey: this.pressKey,
      waitAndCheck: this.waitAndCheck,
      refreshPage: this.refreshPage,
      checkElement: this.checkElement,
      getPageContent: this.getPageContent,
    };
  }
}