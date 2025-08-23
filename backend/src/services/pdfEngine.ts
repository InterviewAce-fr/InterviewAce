import puppeteer from "puppeteer";

/** Convertit un HTML en PDF via Puppeteer (compat Heroku). */
export async function htmlToPDF(
  html: string,
  opts?: { landscape?: boolean }
): Promise<Buffer> {
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.CHROME_PATH ||
    process.env.GOOGLE_CHROME_BIN || // souvent défini par certains buildpacks
    process.env.CHROME_BIN ||
    puppeteer.executablePath(); // dernier recours

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
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      landscape: !!opts?.landscape,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
    });
    return pdf;
  } finally {
    await browser.close();
  }
}
