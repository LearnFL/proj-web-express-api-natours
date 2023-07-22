import mongoose from 'mongoose';
import {} from 'dotenv/config';

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB);

const bookingSchema = new mongoose.Schema({
  tour: {
    tupe: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must contain tour information.'],
  },
  user: {
    tupe: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must contain user information.'],
  },
  price: {
    typeof: Number,
    required: [true, 'Booking must contain price information.'],
  },
  cretedAt: { Date, default: Date.now() },
  paid: { type: Boolean, default: true },
});

bookingSchema.pre(/^find/, function (next) {
  this.populate({ path: 'tour', select: 'name' }).populate('user');
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
