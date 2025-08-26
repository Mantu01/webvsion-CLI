#!/usr/bin/env node
import { WebVisionCLI } from './cli/WebVisionCLI.js';

async function main() {
  const cli = new WebVisionCLI();
  await cli.start();
}

main().catch(console.error);