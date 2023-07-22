import Booking from '../models/booking.model.js';

export default class BookingServices {
  static async create(data) {
    return await Booking.create(data);
  }
}
