import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';


function resolveChromePath(): string | undefined {
  // On collecte TOUTES les variables d'env potentiellement posées par les buildpacks
  const envKeys = Object.keys(process.env).filter(k =>
    /(chrome|chromium).*(bin|path)/i.test(k)
  );

  // candidates explicites d'env
  const envCandidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.GOOGLE_CHROME_FOR_TESTING_BIN, // heroku-buildpack-chrome-for-testing
    process.env.GOOGLE_CHROME_FOR_TESTING_PATH,
    process.env.GOOGLE_CHROME_BIN,             // anciens buildpacks
    process.env.CHROME_PATH,
    process.env.CHROME_BIN,
  ].filter(Boolean) as string[];

  // chemins “classiques” sur Heroku/Linux
  const staticCandidates = [
    '/app/.apt/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    // quelques emplacements CfT usuels
    '/app/.cache/chrome-for-testing/chrome-linux64/chrome',
    '/app/.chrome-for-testing/chrome-linux64/chrome',
  ];

  const candidates = [...envCandidates, ...staticCandidates];

  // debug utile
  try {
    logger.info(`Chrome env keys: ${envKeys.map(k => `${k}=${process.env[k]}`).join(' | ')}`);
    logger.info(`Chrome path candidates: ${candidates.join(' , ')}`);
  } catch {}

  for (const p of candidates) {
    try {
      if (p && fs.existsSync(p)) return p;
    } catch {}
  }
  return undefined;
}

export async function generatePDFReport(preparationData: any, isPremium = false): Promise<Buffer> {
  let browser;
  try {
    const templatePath = path.join(__dirname, '../templates/report-template.html');
    const templateHtml = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateHtml);

    const html = template({
      ...preparationData,
      isPremium,
      generatedAt: new Date().toLocaleDateString(),
      watermark: !isPremium,
      hasData: (d: any) => d && Object.keys(d).length > 0,
      formatArray: (arr: string[]) => arr?.filter(i => i?.trim()).join(', ') || 'Not specified',
    });

    const executablePath = resolveChromePath();
    logger.info(`Puppeteer resolved chrome path: ${executablePath || 'NONE'}`);

    browser = await puppeteer.launch({
      headless: true,
      ...(executablePath ? { executablePath } : {}), // très important
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:10px;width:100%;text-align:center;color:#666;">InterviewAce - Interview Preparation Report</div>`,
      footerTemplate: `<div style="font-size:10px;width:100%;color:#666;display:flex;justify-content:space-between;padding:0 15mm;">
        <span>Generated on ${new Date().toLocaleDateString()}</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        ${!isPremium ? '<span style="color:#999;">Generated with InterviewAce Free</span>' : ''}
      </div>`,
    });

    logger.info(`PDF generated successfully (${pdfBuffer.length} bytes)`);
    return pdfBuffer;
  } catch (error) {
    logger.error('PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (browser) await browser.close();
  }
}

// Register Handlebars helpers
handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

handlebars.registerHelper('or', function(a, b) {
  return a || b;
});

handlebars.registerHelper('and', function(a, b) {
  return a && b;
});

handlebars.registerHelper('json', function(context) {
  return JSON.stringify(context, null, 2);
});

handlebars.registerHelper('formatList', function(items: string[]) {
  if (!items || !Array.isArray(items)) return '';
  return items.filter(item => item?.trim()).map(item => `• ${item}`).join('\n');
});

handlebars.registerHelper('hasContent', function(obj) {
  return obj && typeof obj === 'object' && Object.keys(obj).length > 0;
});