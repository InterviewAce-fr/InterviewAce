// src/services/pdfService.ts
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import dayjs from 'dayjs';
import { createPDFBufferFromHTML } from './pdfEngine';

Handlebars.registerHelper('hasContent', (obj: any) => {
  if (!obj) return false;
  if (Array.isArray(obj)) return obj.length > 0;
  if (typeof obj === 'object') return Object.keys(obj).length > 0;
  return !!obj;
});

let compiledTemplate: Handlebars.TemplateDelegate | null = null;

function resolveTemplatePath(): string {
  // 1) chemin dans dist (prod)
  const distPath = path.join(__dirname, '../templates/report-template.html');
  if (fs.existsSync(distPath)) return distPath;

  // 2) chemin dans src (dev)
  const srcPath = path.join(process.cwd(), 'src/templates/report-template.html');
  if (fs.existsSync(srcPath)) return srcPath;

  // 3) fallback relatif (rare)
  return path.resolve(__dirname, '../../src/templates/report-template.html');
}

function getCompiledTemplate() {
  if (!compiledTemplate) {
    const tpl = fs.readFileSync(resolveTemplatePath(), 'utf8');
    compiledTemplate = Handlebars.compile(tpl, { noEscape: true });
  }
  return compiledTemplate!;
}

export const generateReportHTML = async (
  preparationData: any,
  isPremium: boolean,
  opts?: { showGenerateButton?: boolean; frontendUrl?: string }
) => {
  const compiled = getCompiledTemplate();

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
    isPremium: !!isPremium,
    generatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
    FRONTEND_URL: opts?.frontendUrl || process.env.FRONTEND_URL,
    showGenerateButton: !!opts?.showGenerateButton,
  });

  return html;
};

export const generatePDFReport = async (preparationData: any, isPremium: boolean) => {
  const html = await generateReportHTML(preparationData, !!isPremium, {
    showGenerateButton: false,
    frontendUrl: process.env.FRONTEND_URL,
  });
  return createPDFBufferFromHTML(html);
};
