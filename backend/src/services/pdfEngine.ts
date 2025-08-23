import puppeteer from "puppeteer";

/**
 * Convertit un HTML en PDF via Puppeteer (compatible Heroku).
 * Les buildpacks Chrome/puppeteer configurent généralement CHROME_PATH / CHROME_BIN.
 */
export async function htmlToPDF(
  html: string,
  opts?: { landscape?: boolean }
): Promise<Buffer> {
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.CHROME_PATH ||
    process.env.CHROME_BIN ||
    "google-chrome";

  const browser = await puppeteer.launch({
    executablePath,
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
    ],
  });

  try {
    const page = await browser.newPage();

    // Charge le HTML directement
    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    // Optionnel : force un viewport raisonnable
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
