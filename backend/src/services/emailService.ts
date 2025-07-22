import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { logger } from '../utils/logger';

const mailgun = new Mailgun(formData);

if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
  logger.warn('Mailgun not configured - emails will be logged only');
}

const mg = process.env.MAILGUN_API_KEY ? mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY
}) : null;

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data?: any;
  attachments?: Array<{
    filename: string;
    content: Buffer;
  }>;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    if (!mg) {
      logger.info('Email would be sent:', {
        to: options.to,
        subject: options.subject,
        template: options.template,
        hasAttachments: !!options.attachments?.length
      });
      return;
    }

    const emailData: any = {
      from: process.env.MAILGUN_FROM_EMAIL || 'noreply@interviewace.com',
      to: options.to,
      subject: options.subject,
      html: await getEmailTemplate(options.template, options.data)
    };

    // Add attachments if provided
    if (options.attachments) {
      emailData.attachment = options.attachments.map(att => ({
        filename: att.filename,
        data: att.content
      }));
    }

    const result = await mg.messages.create(process.env.MAILGUN_DOMAIN!, emailData);
    
    logger.info(`Email sent successfully to ${options.to}`, { messageId: result.id });

  } catch (error) {
    logger.error('Email sending failed:', error);
    throw error;
  }
}

async function getEmailTemplate(templateName: string, data: any = {}): Promise<string> {
  const templates: { [key: string]: (data: any) => string } = {
    welcome: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to InterviewAce! 🎉</h1>
        </div>
        <div style="padding: 40px 20px; background: #f8f9fa;">
          <h2 style="color: #333;">Hi ${data.name || 'there'}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Thank you for joining InterviewAce! We're excited to help you ace your next interview.
          </p>
          <p style="color: #666; line-height: 1.6;">
            Here's what you can do with your free account:
          </p>
          <ul style="color: #666; line-height: 1.8;">
            <li>Create 1 comprehensive interview preparation</li>
            <li>Use our 6-step preparation methodology</li>
            <li>Generate a professional PDF report</li>
            <li>Get 1 AI booster to enhance your preparation</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Start Your First Preparation
            </a>
          </div>
          <p style="color: #666; line-height: 1.6;">
            Ready for unlimited preparations and AI assistance? 
            <a href="${process.env.FRONTEND_URL}/premium" style="color: #667eea;">Upgrade to Premium</a>
          </p>
        </div>
        <div style="background: #333; color: #999; padding: 20px; text-align: center; font-size: 12px;">
          <p>© 2025 InterviewAce. All rights reserved.</p>
        </div>
      </div>
    `,
    
    'report-ready': (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Your Report is Ready! 📄</h1>
        </div>
        <div style="padding: 40px 20px; background: #f8f9fa;">
          <h2 style="color: #333;">Great job completing your preparation!</h2>
          <p style="color: #666; line-height: 1.6;">
            Your interview preparation report for <strong>"${data.preparationTitle}"</strong> has been generated and is attached to this email.
          </p>
          <p style="color: #666; line-height: 1.6;">
            This comprehensive report includes all your preparation work:
          </p>
          <ul style="color: #666; line-height: 1.8;">
            <li>Job analysis and requirements breakdown</li>
            <li>Company business model canvas</li>
            <li>SWOT analysis</li>
            <li>Profile and experience matching</li>
            <li>Compelling "why" answers</li>
            <li>Interview questions and responses</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Your Dashboard
            </a>
          </div>
          <p style="color: #666; line-height: 1.6;">
            Good luck with your interview! 🍀
          </p>
        </div>
        <div style="background: #333; color: #999; padding: 20px; text-align: center; font-size: 12px;">
          <p>© 2025 InterviewAce. All rights reserved.</p>
        </div>
      </div>
    `,
    
    'premium-welcome': (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Premium! 👑</h1>
        </div>
        <div style="padding: 40px 20px; background: #f8f9fa;">
          <h2 style="color: #333;">You're now a Premium member!</h2>
          <p style="color: #666; line-height: 1.6;">
            Thank you for upgrading to InterviewAce Premium. You now have access to all our powerful features:
          </p>
          <ul style="color: #666; line-height: 1.8;">
            <li>✅ Unlimited interview preparations</li>
            <li>✅ Unlimited AI booster usage</li>
            <li>✅ Clean, professional PDF reports (no watermarks)</li>
            <li>✅ Priority email support</li>
            <li>✅ Advanced preparation features</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Start Using Premium Features
            </a>
          </div>
          <p style="color: #666; line-height: 1.6;">
            Ready to ace your interviews? Let's get started!
          </p>
        </div>
        <div style="background: #333; color: #999; padding: 20px; text-align: center; font-size: 12px;">
          <p>© 2025 InterviewAce. All rights reserved.</p>
        </div>
      </div>
    `
  };

  return templates[templateName]?.(data) || `<p>Template ${templateName} not found</p>`;
}