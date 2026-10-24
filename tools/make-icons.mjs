// Erzeugt App-Icons und iPhone/iPad-Startbildschirme aus Elma (braucht Playwright): `npm run icons`
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const port = 8099;
const server = spawn(process.execPath, ['tools/serve.mjs'], { cwd: root, env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));

const ICONS = [
  ['assets/icons/apple-touch-icon.png', 180, 'icon'],
  ['assets/icons/icon-192.png', 192, 'icon'],
  ['assets/icons/icon-512.png', 512, 'icon'],
  ['assets/icons/icon-maskable-512.png', 512, 'maskable'],
];
// [Breite, Höhe] in Pixeln, passend zu den <link rel="apple-touch-startup-image"> in index.html
const SPLASH = [[1320, 2868, 3], [1260, 2736, 3], [1206, 2622, 3], [1290, 2796, 3], [1179, 2556, 3], [1284, 2778, 3], [1170, 2532, 3], [1125, 2436, 3], [1242, 2688, 3], [828, 1792, 2], [750, 1334, 2], [2048, 2732, 2], [1668, 2388, 2], [1640, 2360, 2], [1620, 2160, 2], [1488, 2266, 2]];

try {
  await mkdir(root + 'assets/icons', { recursive: true });
  await mkdir(root + 'assets/splash', { recursive: true });
  const browser = await chromium.launch();
  for (const [file, size, mode] of ICONS) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.goto(`http://localhost:${port}/tools/icon.html?mode=${mode}`);
    await page.waitForSelector('body[data-ready]');
    await page.screenshot({ path: root + file });
    await page.close();
    console.log('✓', file);
  }
  for (const [w, h, dpr] of SPLASH) {
    const page = await browser.newPage({ viewport: { width: w / dpr, height: h / dpr }, deviceScaleFactor: dpr });
    await page.goto(`http://localhost:${port}/tools/icon.html?mode=splash`);
    await page.waitForSelector('body[data-ready]');
    await page.screenshot({ path: `${root}assets/splash/splash-${w}x${h}.png` });
    await page.close();
  }
  console.log(`✓ ${SPLASH.length} Startbildschirme`);
  await browser.close();
} finally {
  server.kill();
}
