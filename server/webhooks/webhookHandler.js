const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const router = express.Router();

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer;

        const user = await User.findOne({ stripeCustomerId: customerId });
        if (user) {
          user.subscriptionStatus = true;
          user.stripeSubscriptionId = session.subscription;
          await user.save();
        } else {
          console.warn(`No user found for Stripe customer ID: ${customerId}`);
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        const customerId = session.customer;

        const user = await User.findOne({ stripeCustomerId: customerId });
        if (user) {
          user.subscriptionStatus = false;
          user.stripeSubscriptionId = null;
          await user.save();
        } else {
          console.warn(`No user found for Stripe customer ID: ${customerId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const user = await User.findOne({ stripeCustomerId: customerId });
        if (user) {
          user.subscriptionStatus = false;
          user.stripeSubscriptionId = null;
          await user.save();
        } else {
          console.warn(`No user found for Stripe customer ID: ${customerId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling webhook event:', error.message);
  }

  res.status(200).json({ received: true });
});

module.exports = router;
