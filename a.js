import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: false,
  chromiumSandbox: true,
  env: {},
  args: ['--disable-extensions', '--disable-file-system'],
});

const page = await browser.newPage();

async function abc(url) {
  await page.goto(url);
  const buffer = await page.screenshot({ fullPage: false });
  return buffer;
}

const buffer = await abc("https://qgenius-sigma.vercel.app");
console.log(`data:image/png;base64,${buffer.toString("base64")}`)