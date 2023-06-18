import TourServices from '../DAO/tour.DAO.js';
import AppError from '../utils/appError.js';

export default class ToursController {
  // Middleware
  static aliasTopTours(req, res, next) {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.fields = 'name,price,ratingsAverage,summary,difficultry';
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
