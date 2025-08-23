import fs from "fs";
import puppeteer from "puppeteer";

/**
 * Résout le binaire Chrome pour Heroku (chrome-for-testing) ou local.
 */
function resolveChromePath(): string | null {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH || "",
    process.env.CHROME_PATH || "",
    process.env.CHROME_BIN || "",
    // Heroku buildpack chrome-for-testing
    "/app/.chrome-for-testing/chrome-linux64/chrome",
    // Puppeteer Heroku buildpack classique
    "/app/.apt/usr/bin/google-chrome",
    // Linux commun
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ].filter(Boolean);

  for (const p of candidates) {
    try {
      if (p && fs.existsSync(p)) return p;
    } catch {}
  }
  return null;
}

/**
 * Convertit un HTML en PDF via Puppeteer (compatible Heroku).
 */
export async function htmlToPDF(
  html: string,
  opts?: { landscape?: boolean }
): Promise<Buffer> {
  const executablePath = resolveChromePath();

  const browser = await puppeteer.launch({
    executablePath: executablePath || undefined, // si null, Puppeteer tentera son Chrome local
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--font-render-hinting=none",
      "--disable-features=IsolateOrigins,site-per-process",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      landscape: !!opts?.landscape,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}
