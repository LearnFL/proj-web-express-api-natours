import AppError from '../utils/appError.js';

export const deleteOne = (Services) =>
  async function (req, res, next) {
    try {
      const doc = await Services.deleteOne(req.params.id);

      if (!doc) {
        return next(
          new AppError(`No document found with id: ${req.params.id}`, 404)
        );
      }

      res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        data: { deleted_tour: doc },
      });
    } catch (err) {
      next(err);
    }
  };
