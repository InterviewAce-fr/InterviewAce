import puppeteer from "puppeteer";

/**
 * Rend un HTML en PDF (Buffer).
 * Compatible Heroku (Chrome pour testing + buildpack puppeteer).
 */
export async function renderPdf(html: string): Promise<Buffer> {
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.CHROME_PATH ||
    undefined;

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--single-process",
      "--font-render-hinting=none",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "12mm", bottom: "14mm", left: "12mm" },
    });
    return pdf;
  } finally {
    await browser.close();
  }
}
