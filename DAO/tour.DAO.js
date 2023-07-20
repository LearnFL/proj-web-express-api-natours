import Tour from '../models/tour.model.js';
import APIFeatures from '../utils/apiFeatures.js';

export default class TourServices {
  static async findAllTours(req) {
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    return await features.query;
  }

  static async findOneTour(id) {
    return await Tour.findById(id).populate('reviews');
  }

  // For checkout session
  static async findOneTourById(id) {
    return await Tour.findById(id);
  }

  static async createOneTour(req) {
    return await Tour.create(req);
  }

  static async updateOneTour(req) {
    // { new: true } will return updated tour instead of an old.
    // { runValidators: true } update validators validate the update operation against the model's schema.
    return await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
  }

  static async deleteOne(id) {
    return await Tour.findByIdAndDelete(id);
  }

  static async getStats() {
    return await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        //group by id = null mens we want all of them
        // avgRating is a new field to calculate average for ratingsAverage
        // num counts number of docuemnts, it adds 1 for each doc
        $group: {
          _id: '$difficulty',
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        // ascending
        $sort: { avgPrice: -1 },
      },
      {
        // not equal
        $match: { _id: { $ne: 'easy' } },
      },
    ]);
  }

  static async getPlan(year) {
    // Creates a separate entry for each date in an array of dates associated with the entry
    return await Tour.aggregate([
      { $unwind: '$startDates' },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        // how many tours in each month
        $group: {
          // group by start dates and return month,
          _id: { $month: '$startDates' },
          // create a field numTourStarts that counts tours
          numTourStarts: { $sum: 1 },
          // add name field to an array
          tours: { $push: '$name' },
        },
      },
      {
        // add a new field that has name of month and value of _id field
        $addFields: { month: '$_id' },
      },
      {
        // hides _id field if set to 0, or shows if set to 1
        $project: {
          _id: 0,
        },
      },
      {
        // sort in descending order
        $sort: { numberTourStarts: -1 },
      },
      {
        // limit output
        $limit: 12,
      },
    ]);
  }

  static async getToursWithin(location) {
    return await Tour.find(location);
  }

  static async getDistances(params) {
    return await Tour.aggregate(params);
  }

  static async getTour(params) {
    return await Tour.findOne(params).populate({
      path: 'reviews',
      fields: 'review rating user',
    });
  }
}
