# webVision-CLI

**webVision-CLI** is a Website Automation Agent designed to interact with websites via the command line. It leverages modern automation and AI tools to perform tasks such as browsing, data extraction, and automated interactions, making it useful for developers, testers, and automation enthusiasts.

## Features

- **Website Automation**: Automate browser actions using [Playwright](https://playwright.dev/).
- **AI Integration**: Utilize OpenAI's agent APIs for intelligent automation and decision-making.
- **Interactive CLI**: User-friendly command-line interface powered by [Inquirer](https://www.npmjs.com/package/inquirer).
- **Configurable**: Supports environment variables via `.env` files.
- **Validation**: Input validation using [Zod](https://zod.dev/).
- **Colorful Output**: Enhanced CLI output with [Chalk](https://www.npmjs.com/package/chalk).

## Installation

1. Clone the repository or download the source code.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory for environment-specific configuration.
```bash
   OPENAI_API_KEY=your_openai_api_key_here
```

## Usage

You can run the CLI using:

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

Alternatively, after installing globally (or linking), you can use:

```bash
webvision
```

## Project Structure

```
webVision-CLI/
├── src/
│   └── index.js         # Main entry point for the CLI
├── package.json         # Project metadata and dependencies
├── package-lock.json    # Dependency lock file
└── README.md            # Project documentation
```

## Dependencies

- [@openai/agents](https://www.npmjs.com/package/@openai/agents)
- [chalk](https://www.npmjs.com/package/chalk)
- [dotenv](https://www.npmjs.com/package/dotenv)
- [inquirer](https://www.npmjs.com/package/inquirer)
- [playwright](https://www.npmjs.com/package/playwright)
- [zod](https://www.npmjs.com/package/zod)

## Author

Mantu Kumar

## License

ISC

---

*This project is actively maintained and open for contributions and suggestions.*