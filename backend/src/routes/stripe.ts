import express from 'express';
import Stripe from 'stripe';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { supabase } from '../utils/supabase';
import { emailQueue } from '../worker';
import { logger } from '../utils/logger';

const router = express.Router();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Create checkout session for premium upgrade
router.post('/create-checkout-session', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment
      success_url: `${process.env.FRONTEND_URL}/premium?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/premium?canceled=true`,
      customer_email: userEmail,
      metadata: {
        userId: userId
      }
    });

    res.json({ sessionId: session.id, url: session.url });

  } catch (error) {
    logger.error('Stripe checkout session creation error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      await handleSuccessfulPayment(session);
      break;
    
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      logger.info(`Payment succeeded: ${paymentIntent.id}`);
      break;
    
    default:
      logger.info(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  try {
    const userId = session.metadata?.userId;
    
    if (!userId) {
      logger.error('No userId found in session metadata');
      return;
    }

    // Update user to premium
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        is_premium: true,
        premium_activated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      logger.error('Failed to update user to premium:', error);
      return;
    }

    // Send premium welcome email
    await emailQueue.add('send-premium-welcome', {
      email: session.customer_email,
      userId: userId
    });

    logger.info(`User ${userId} upgraded to premium successfully`);

  } catch (error) {
    logger.error('Error handling successful payment:', error);
  }
}

// Get customer portal session (for managing subscription)
router.post('/create-portal-session', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userEmail = req.user!.email;

    // Find customer by email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });

    if (customers.data.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${process.env.FRONTEND_URL}/premium`,
    });

    res.json({ url: session.url });

  } catch (error) {
    logger.error('Portal session creation error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

export default router;