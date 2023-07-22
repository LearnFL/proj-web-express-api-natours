import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must contain tour information.'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must contain user information.'],
  },
  price: {
    type: Number,
    require: [true, 'Booking must contain price information.'],
  },
  cretedAt: { type: Date, default: Date.now() },
  paid: { type: Boolean, default: true },
});

bookingSchema.pre(/^find/, function (next) {
  this.populate({ path: 'tour', select: 'name' }).populate('user');
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
