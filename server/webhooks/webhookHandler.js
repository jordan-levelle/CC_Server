const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const router = express.Router();

router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      endpointSecret);
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const customerId = session.customer;

      try {
        const user = await User.findOne({ stripeCustomerId: customerId });
        if (user) {
          user.subscriptionStatus = true;
          user.stripeSubscriptionId = session.subscription;
          await user.save();
        }
      } catch (error) {
        console.error('Error updating user subscription:', error.message);
      }
      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object;
      const customerId = session.customer;

      try {
        const user = await User.findOne({ stripeCustomerId: customerId });
        if (user) {
          user.subscriptionStatus = false;
          user.stripeSubscriptionId = null;
          await user.save();
        }
      } catch (error) {
        console.error('Error updating user subscription:', error.message);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      try {
        const user = await User.findOne({ stripeCustomerId: customerId });
        if (user) {
          user.subscriptionStatus = false;
          user.stripeSubscriptionId = null;
          await user.save();
        }
      } catch (error) {
        console.error('Error updating user subscription:', error.message);
      }
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;
