import Booking from '../models/booking.model.js';

export default class BookingServices {
  static async create(data) {
    return await Booking.create(data);
  }

  static async findByIdAndDelete(id) {
    return await Booking.findByIdAndDelete(id);
  }

  static async find(id = null) {
    if (id) return await Booking.find(id);
    return await Booking.find();
  }

  static async findOneAndUpdate(id, update) {
    return await Booking.findOneAndUpdate({ _id: id }, update, { new: true });
  }
}
