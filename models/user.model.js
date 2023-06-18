import mongoose from 'mongoose';
import {} from 'dotenv/config';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// CONNECT DB AND CREATE NEW DB
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DB_PASSWORD);

// Can use .then() and .catch()
mongoose.connect(DB);

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide user name.'],
    trim: true,
    minlength: [5, 'A user name must be more or equal to 8 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide user name.'],
    unique: true,
    trim: true,
    // match: [
    //   /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
    //   'Please fill a valid email address',
    // ],
    validate: [validator.isEmail, 'Please provide valid email.'],
    lowerCase: true,
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide user password.'],
    trim: true,
    minlength: [8, 'A user password should be more or equal to 8 characters'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please provide user password.'],
    trim: true,
    minlength: [8, 'A user password should be more or equal to 8 characters'],
    validate: {
      // Works only on create and save
      validator: function (val) {
        return val === this.password; // returns true -> no error
      },
      message: 'Passwords did not match. Please confirm password.',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  // Problem: Sometimes timestamp is set after token was issued, that is why we subtrack 1 second
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  //   this.find({ active: { $ne: false } });
  this.find({ active: true });
  next();
});

// Instance methods.
userSchema.methods.checkPassword = async function (
  candidatePassword,
  userPassword
) {
  return bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    // devide by 1000 miliseconds, base 10
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimeStamp < changedTimeStamp;
  }
  // False means not changed, if chaged then make user relogin after password change
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // minutes

  //   console.log({ resetToken }, this.passwordResetToken);
  return resetToken;
};

const User = mongoose.model('User', userSchema);

export default User;
