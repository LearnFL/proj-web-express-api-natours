import multer from 'multer';
import sharp from 'sharp';
import UserServices from '../DAO/user.DAO.js';
import AppError from '../utils/appError.js';

// const multerStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'public/img/users');
//   },
//   filename: function (req, file, cb) {
//     // user-id-timeStamp.jpg
//     cb(
//       null,
//       `user-${req.user.id}-${Date.now()}.${file.mimetype.split('/')[1]}`
//     );
//   },
// });

const multerStorage = multer.memoryStorage(); // save as buffer for sharp()

// TO make sure only images are uploaded
const multerFilter = (req, file, cb) => {
  if (
    // file.mimetype.startsWith('image')
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg'
  ) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// const upload = multer({ dest: 'public/img/users' });
export const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

export default class UsersController {
  // TO get user's data (/me end point)
  static getMe(req, res, next) {
    req.params.id = req.user.id;
    next();
  }

  static async getUser(req, res, next) {
    try {
      const user = await UserServices.findOneUserById(req.params.id);

      if (!user) {
        return next(new AppError('No user found with that ID', 404));
      }

      res.status(200).json({
        status: 'success',
        data: {
          data: user,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAllUsers(req, res, next) {
    try {
      const users = await UserServices.findAllUsers();
      res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        data: { users },
      });
    } catch (err) {
      next(err);
    }
  }

  static async resizeUserPhoto(req, res, next) {
    if (!req.file) return next();

    /* 
    Put filename on request since it is not done automatically after switched to memoryStorage from diskStorage.
    No need to specify ext as sharp()
    */
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    // Resize avatar
    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.file.filename}`);

    next();
  }

  static async updateMe(req, res, next) {
    // 1) Create Error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          'This route cannot update user password. Please use /updateMyPassword',
          400
        )
      );
    }

    // 2) Update user document
    req.user.name = req.body.name || req.user.name;
    req.user.email = req.body.email || req.user.email;

    // must specify fields as someone may change role to admin
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) filteredBody.photo = req.file.filename;

    try {
      const updatedUser = await UserServices.findAndUpdate(
        req.user.id,
        filteredBody
      );
      // const token = signToken(req.user.id);

      res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        // token: req.token,
        data: { user: updatedUser },
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteMe(req, res, next) {
    try {
      await UserServices.findAndUpdate(req.user.id, { active: false });
      res.status(204).json({
        status: 'success',
        requestedAt: req.requestTime,
        data: null,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const doc = await UserServices.findByIdAndDelete(req.params.id);

      if (!doc) {
        return next(new AppError('No user found with that ID', 404));
      }

      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateUser(req, res, next) {
    try {
      // 1) Create Error if user POSTs password data
      if (req.body.password || req.body.passwordConfirm) {
        return next(
          new AppError(
            'This route cannot update user password. Please use /updateMyPassword',
            400
          )
        );
      }

      const doc = await UserServices.findByIdAndUpdate(req);

      if (!doc) {
        return next(new AppError('No user found with that ID', 404));
      }

      res.status(200).json({
        status: 'success',
        data: {
          data: doc,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
