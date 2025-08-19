import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export async function generatePDFReport(preparationData: any, isPremium: boolean = false): Promise<Buffer> {
  let browser;
  try {
    const templatePath = path.join(__dirname, '../templates/report-template.html');
    const templateHtml = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateHtml);

    const templateData = {
      ...preparationData,
      isPremium,
      generatedAt: new Date().toLocaleDateString(),
      watermark: !isPremium,
      hasData: (data: any) => data && Object.keys(data).length > 0,
      formatArray: (arr: string[]) => arr?.filter(item => item?.trim()).join(', ') || 'Not specified'
    };

    const html = template(templateData);


    const executablePath =
      process.env.PUPPETEER_EXECUTABLE_PATH || // jontewks/puppeteer-heroku-buildpack
      process.env.GOOGLE_CHROME_BIN ||         // heroku-buildpack-google-chrome
      undefined;                               // local/dev

    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
          <span>InterviewAce - Interview Preparation Report</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; color: #666; display: flex; justify-content: space-between; padding: 0 15mm;">
          <span>Generated on ${new Date().toLocaleDateString()}</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          ${!isPremium ? '<span style="color: #999;">Generated with InterviewAce Free</span>' : ''}
        </div>
      `
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