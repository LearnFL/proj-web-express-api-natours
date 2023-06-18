import User from '../models/user.model.js';

export default class UserServices {
  static async createNewUser(req) {
    return await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      //prettier-ignore
      ...(req.body.passwordChangedAt && { passwordChangedAt: req.body.passwordChangedAt }), //eslint-disable-line
      ...(req.body.role && { role: req.body.role }), //eslint-disable-line
    });
  }

  static async findOneUser(email) {
    // must add password to output since by default it is not selected
    return await User.findOne({
      email: email,
    }).select('+password');
  }

  static async findOneUserById(id) {
    // must add password to output since by default it is not selected
    return await User.findOne({
      _id: id,
    });
  }

  static async findUserById(id) {
    // must add password to output since by default it is not selected
    return await User.findOne({
      _id: id,
    });
  }

  static async findUserByToken(token) {
    // must add password to output since by default it is not selected
    return await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });
  }

  static async findAndUpdate(id, data) {
    return await User.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  static async findUserByPasswords(password) {
    return await User.findOne({ password: password });
  }

  static async findAllUsers() {
    return await User.find();
  }

  static async findByIdAndDelete(id) {
    return await User.findByIdAndDelete(id);
  }

  static async findByIdAndUpdate(req) {
    return await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
  }
}
