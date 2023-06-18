import Review from '../models/review.model.js';

export default class ReviewServices {
  static async getAllReviews(filter) {
    return await Review.find(filter);
  }

  static async createNewReview(review) {
    return await Review.create(review);
  }

  static async findById(id) {
    return await Review.findById(id).populate({
      path: 'tour',
      select: 'name photo',
    });
  }

  static async findByIdAndDelete(id) {
    return await Review.findByIdAndDelete(id);
  }

  static async findByIdAndUpdate(req) {
    return await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate({
      path: 'tour',
      select: 'name photo',
    });
  }
}
