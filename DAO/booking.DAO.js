import Booking from '../models/booking.model.js';

export default class BookingServices {
  static async create(data) {
    return await Booking.create(data);
  }
  static async find(data) {
    return await Booking.find(data);
  }
}
