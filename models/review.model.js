import mongoose from 'mongoose';
import {} from 'dotenv/config';
import Tour from './tour.model.js';

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DB_PASSWORD);
mongoose.connect(DB);

const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, 'Review cannot be empty.'],
    trim: true,
    minlength: [10, 'A tour name must be more or equal than 10 characters'],
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  createdAt: { type: Date, default: Date.now() },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Revie must belong to a tour.'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Revie must belong to a user.'],
  },
});

// Combination of user and tour is unique, preventing one user from posting multiple reviews for a single tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'user',
  //   select: 'name',
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // Use aggregation pipeline
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 0,
    });
  }
};

reviewSchema.post('save', function () {
  // this points to current review, so must use constructor = Review.calcAverageRatings
  this.constructor.calcAverageRatings(this.tour);
  // await this.schema.statics.calcAverageRatings(this.tour);
});

// findByIdAndUpdate (no doc access only query)
// findByIdAndDelete (no doc access only query)
// Cannot use post hook, will not have access to query
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // this.r = await this.model.findOne(this.getQuery()); // get document and save it to r property to pass to POST middleware
  this.r = await this.clone().findOne(); // get document and save it to r property to pass to POST middleware
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // this.r = await this.findOne(); does not work here as query has been already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
