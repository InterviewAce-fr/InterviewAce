import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import dayjs from 'dayjs';
// importe ta fonction qui convertit de l'HTML vers un buffer PDF (Puppeteer/wkhtmltopdf)
import { createPDFBufferFromHTML } from './pdfEngine';

// --- Helpers Handlebars partagés entre HTML preview et PDF ---
Handlebars.registerHelper('hasContent', (obj: any) => {
  if (!obj) return false;
  if (Array.isArray(obj)) return obj.length > 0;
  if (typeof obj === 'object') return Object.keys(obj).length > 0;
  return !!obj;
});

type CompileCtx = {
  compiled?: HandlebarsTemplateDelegate<any>;
};
const templateCache: CompileCtx = {};

const getTemplate = () => {
  if (!templateCache.compiled) {
    const tplPath = path.join(__dirname, '../templates/report-template.html');
    const source = fs.readFileSync(tplPath, 'utf8');
    templateCache.compiled = Handlebars.compile(source, { noEscape: true });
  }
  return templateCache.compiled!;
};

export const generateReportHTML = async (
  preparationData: any,
  isPremium: boolean,
  opts?: { showGenerateButton?: boolean; frontendUrl?: string }
) => {
  const compiled = getTemplate();

  // Valeurs sûres
  const safeData = {
    ...preparationData,
    title: preparationData?.title || 'Interview Preparation',
    job_url: preparationData?.job_url || '',
    step_1_data: preparationData?.step_1_data || {},
    step_2_data: preparationData?.step_2_data || {},
    step_3_data: preparationData?.step_3_data || {},
    step_4_data: preparationData?.step_4_data || {},
    step_5_data: preparationData?.step_5_data || {},
    step_6_data: preparationData?.step_6_data || {},
  };

  const html = compiled({
    ...safeData,
    isPremium,
    generatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
    FRONTEND_URL: opts?.frontendUrl || process.env.FRONTEND_URL,
    showGenerateButton: !!opts?.showGenerateButton,
  });

  return html;
};

export const generatePDFReport = async (preparationData: any, isPremium: boolean) => {
  const html = await generateReportHTML(preparationData, isPremium, {
    showGenerateButton: false, // bouton masqué dans la version PDF
    frontendUrl: process.env.FRONTEND_URL,
  });
  const pdfBuffer = await createPDFBufferFromHTML(html);
  return pdfBuffer;
};
