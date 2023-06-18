import mongoose from 'mongoose';
import {} from 'dotenv/config';
import slugify from 'slugify';
// import { ObjectId } from 'mongodb';
// import User from './user.model.js';

// CONNECT DB AND CREATE NEW DB
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DB_PASSWORD);

// Can use .then() and .catch()
mongoose.connect(DB);

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must be less or equal than 40 characters'],
      minlength: [10, 'A tour name must be more or equal than 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration.'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size.'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty.'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be either easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below or equal to 5.0'],
      set: (val) => Math.round(val * 10) / 10, // *10 will give us a decimal instead of int
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, 'A tour must have a price.'] },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price; // returns true -> no error
        },
        message: 'Discount price ({VALUE}) must be less than price.',
      },
    },
    // REMEMBER Removes white space
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description.'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image.'],
    },
    // REMEMBER Array of strings
    images: [String],
    // REMEMBER Timestamp, select: false will make sure this field is never returned to the user
    createdAt: { type: Date, default: Date.now(), select: false },
    startDates: [Date],
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      // Lat Lang
      coordinates: [Number],
      address: String,
      description: String,
    },
    // embedded doc
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  // Option that enables virtual fields
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1, slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); // for geo queries

// Virtual property
tourSchema.virtual('durationWeeks').get(function () {
  return (this.duration / 7).toFixed(1);
});

tourSchema.virtual('reviews', {
  ref: 'Review', // model
  // must specify foreign field and local field
  foreignField: 'tour',
  localField: '_id',
});

// Document middleware
tourSchema.pre('save', function (next) {
  // create new property on a document, must add to schema
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Embed documents
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

tourSchema.pre('aggregate', function (next) {
  if (
    !Object.values(this.pipeline()).some((el) =>
      String(Object.keys(el) === '$geoNear')
    )
  )
    this.pipeline().unshift({
      $match: { secretTour: { $ne: true } },
    });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

export default Tour;
