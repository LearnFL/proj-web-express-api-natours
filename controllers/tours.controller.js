import TourServices from '../DAO/tour.DAO.js';
import multer from 'multer';
import sharp from 'sharp';
import AppError from '../utils/appError.js';

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
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// upload.single('image') ONE IMAGE
// upload.array('images', 5) MULTIPLE IMAGES
export const uploadTourImage = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

export default class ToursController {
  // Middleware
  static aliasTopTours(req, res, next) {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.fields = 'name,price,ratingsAverage,summary,difficultry';
    next();
  }

  static async resizeTourImages(req, res, next) {
    if (!req.files.imageCover || !req.files.images) return next();
    // upload.songle('image') req.file
    // upload.fields('images) req.files;

    // 1) CoverImage
    const imageCoverFileName = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

    // add to req.body as we pass req.body to DAO
    req.body.imageCover = imageCoverFileName;

    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${imageCoverFileName}`);

    // 2) Images
    req.body.images = [];

    /*
    async await inside callback will not prevent code fram calling on next()
    for this reason instead of forEach we will use map() and use await.all()
    to wait untill all promises are resolved and then move to next()
    */
    await Promise.all(
      req.files.images.map(async (file, i) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

        await sharp(req.files.images[i].buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename);
      })
    );

    next();
  }

  static async getAllTours(req, res, next) {
    try {
      const tours = await TourServices.findAllTours(req);

      res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        results: tours.length,
        data: { tours: tours },
      });
    } catch (err) {
      // res.status(404).json({ status: 'fail', message: String(err) });
      next(err);
    }
  }

  static async getOneTour(req, res, next) {
    try {
      const tour = await TourServices.findOneTour(req.params.id);

      if (!tour) {
        return next(
          new AppError(`No tour found with id: ${req.params.id}`, 404)
        );
      }

      res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        data: { tours: tour },
      });
    } catch (err) {
      // res.status(404).json({ status: 'fail', message: err });
      next(err);
    }
  }

  static async updateOneTour(req, res, next) {
    try {
      const tour = await TourServices.updateOneTour(req);

      if (!tour) {
        return next(
          new AppError(`No tour found with id: ${req.params.id}`, 404)
        );
      }

      res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        data: { tour: tour },
      });
    } catch (err) {
      // res.status(404).json({ status: 'fail', message: err });
      next(err);
    }
  }

  static async deleteOneTour(req, res, next) {
    try {
      const tour = await TourServices.deleteOne(req.params.id);

      if (!tour) {
        return next(
          new AppError(`No tour found with id: ${req.params.id}`, 404)
        );
      }

      res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        data: { deleted_tour: tour },
      });
    } catch (err) {
      // res.status(404).json({ status: 'fail', message: err });
      next(err);
    }
  }

  static async createOneTour(req, res, next) {
    try {
      const newTour = await TourServices.createOneTour(req.body);
      res.status(201).json({ result: 'success', data: { tour: newTour } });
    } catch (err) {
      // res.status(400).json({ status: 'fail', message: err });
      next(err);
    }
  }

  static async getTourStats(req, res, next) {
    try {
      const stats = await TourServices.getStats();
      res.status(201).json({ result: 'success', data: { stats: stats } });
    } catch (err) {
      // res.status(400).json({ status: 'fail', message: err });
      next(err);
    }
  }

  static async getMonthlyPlan(req, res, next) {
    try {
      const year = req.params.year * 1;
      const plan = await TourServices.getPlan(year);
      res.status(201).json({ result: 'success', data: { plan } });
    } catch (err) {
      // res.status(400).json({ status: 'fail', message: err });
      next(err);
    }
  }

  static async getToursWithin(req, res, next) {
    try {
      const { distance, latlng, unit } = req.params;
      const [lat, lng] = latlng.split(',');
      if (!lat || !lng) {
        next(
          AppError(
            'Please provide latitude and longitude in the format lat,lng ',
            400
          )
        );
      }

      const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; // distance / radius of planet

      const tours = await TourServices.getToursWithin({
        startLocation: {
          $geoWithin: { $centerSphere: [[lng, lat], radius] },
        },
      });

      res.status(200).json({
        status: 'success',
        results: tours.length,
        data: { data: tours },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getDistances(req, res, next) {
    try {
      const { latlng, unit } = req.params; //eslint-disable-line
      const [lat, lng] = latlng.split(',');
      if (!lat || !lng) {
        next(
          AppError(
            'Please provide latitude and longitude in the format lat,lng ',
            400
          )
        );
      }

      const distances = await TourServices.getDistances([
        {
          // MUST BE FIRST IN PIPELINE, REQUIRES INDEX IN SCHEMA
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [lng * 1, lat * 1],
            },
            distanceField: 'distance',
            distanceMultiplier: unit === 'km' ? 0.001 : 0.000621371, // meters converted to kilometers or miles
          },
        },
        {
          $project: {
            distance: 1,
            name: 1,
          },
        },
      ]);

      res.status(200).json({
        status: 'success',
        data: { data: distances },
      });
    } catch (err) {
      next(err);
    }
  }
}
