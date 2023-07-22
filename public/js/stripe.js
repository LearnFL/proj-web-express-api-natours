// REMEMBER Must add Stripe script ot tour.pug
import axios from 'axios';
import { showAlert } from './alerts';
// import Stripe from 'stripe';

const stripe = Stripe(process.env.STRIPE_PUBLIC_KEY);

export const bookTour = async (tourId) => {
  try {
    // 1) Get session from the server
    const session = await axios(
      `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`
    );

    // 2) Create checkout form and charge credit card
    await stripe.redirectToCheckout({ sessionId: session.data.session.id });
  } catch (err) {
    showAlert('error', err);
  }
};
