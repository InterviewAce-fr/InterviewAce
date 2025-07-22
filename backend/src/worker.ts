import dotenv from 'dotenv';
import Queue from 'bull';
import { logger } from './utils/logger';
import { initializeRedis } from './utils/redis';
import { generatePDFReport } from './services/pdfService';
import { sendEmail } from './services/emailService';

// Load environment variables
dotenv.config();

// Initialize job queues
const pdfQueue = new Queue('pdf generation', process.env.REDIS_URL || 'redis://localhost:6379');
const emailQueue = new Queue('email sending', process.env.REDIS_URL || 'redis://localhost:6379');

// PDF generation job processor
pdfQueue.process('generate-report', async (job) => {
  const { preparationData, userId, isPremium } = job.data;
  
  try {
    logger.info(`Processing PDF generation for user ${userId}`);
    
    const pdfBuffer = await generatePDFReport(preparationData, isPremium);
    
    // If premium user, email the PDF
    if (isPremium) {
      await emailQueue.add('send-report', {
        userId,
        pdfBuffer,
        preparationTitle: preparationData.title
      });
    }
    
    logger.info(`PDF generation completed for user ${userId}`);
    return { success: true, size: pdfBuffer.length };
  } catch (error) {
    logger.error(`PDF generation failed for user ${userId}:`, error);
    throw error;
  }
});

// Email sending job processor
emailQueue.process('send-report', async (job) => {
  const { userId, pdfBuffer, preparationTitle } = job.data;
  
  try {
    logger.info(`Sending PDF report email for user ${userId}`);
    
    await sendEmail({
      to: userId, // This should be email, you might need to fetch user email
      subject: `Your Interview Preparation Report: ${preparationTitle}`,
      template: 'report-ready',
      data: { preparationTitle },
      attachments: [{
        filename: `${preparationTitle.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
        content: pdfBuffer
      }]
    });
    
    logger.info(`PDF report email sent for user ${userId}`);
    return { success: true };
  } catch (error) {
    logger.error(`Email sending failed for user ${userId}:`, error);
    throw error;
  }
});

// Welcome email processor
emailQueue.process('send-welcome', async (job) => {
  const { email, name } = job.data;
  
  try {
    logger.info(`Sending welcome email to ${email}`);
    
    await sendEmail({
      to: email,
      subject: 'Welcome to InterviewAce! 🎉',
      template: 'welcome',
      data: { name: name || 'there' }
    });
    
    logger.info(`Welcome email sent to ${email}`);
    return { success: true };
  } catch (error) {
    logger.error(`Welcome email failed for ${email}:`, error);
    throw error;
  }
});

// Error handling
pdfQueue.on('failed', (job, err) => {
  logger.error(`PDF job ${job.id} failed:`, err);
});

emailQueue.on('failed', (job, err) => {
  logger.error(`Email job ${job.id} failed:`, err);
});

// Initialize worker
async function startWorker() {
  try {
    await initializeRedis();
    logger.info('🔄 Worker started successfully');
    logger.info('📧 Email queue ready');
    logger.info('📄 PDF queue ready');
  } catch (error) {
    logger.error('Failed to start worker:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing queues...');
  await pdfQueue.close();
  await emailQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing queues...');
  await pdfQueue.close();
  await emailQueue.close();
  process.exit(0);
});

startWorker();

export { pdfQueue, emailQueue };