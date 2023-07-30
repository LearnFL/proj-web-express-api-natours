import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import { viewRoute } from './routes/view.route.js';
import { toursRoute } from './routes/tours.route.js';
import { usersRoute } from './routes/users.route.js';
import { reviewsRoute } from './routes/reviews.route.js';
import { bookingsRoute } from './routes/bookings.route.js';
import BookingsController from './controllers/bookings.controller.js';
import { currDir } from './helper.js';
import {} from 'dotenv/config';
import AppError from './utils/appError.js';
import globalErrorHandler from './controllers/error.controller.js';

export const app = express();

app.enable('trust proxy');

///////////////// STATIC FOLDER ////////////////

const __dirname = currDir();
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

////////////////// VIEWS ////////////////////////

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

///////////////// MIDDLEWARE ////////////////

// FORCE HTTPS
app.enable('trust proxy');
app.use(function (request, response, next) {
  if (process.env.NODE_ENV != 'development' && !request.secure) {
    return response.redirect('https://' + request.headers.host + request.url);
  }

  next();
});

// Cross Origin Resource Sharing
app.use(cors());

// Options req method on all routes
app.options('*', cors());

/*
 app.use(cors()); is good for simple requests (get, post). For other request browser issues preflight phase,
 to figure out if req is safe to send (Options request) and we need to handle it and send allow origin.

 app.options('*', cors());

 May add in middleware stack app.use('/api/v1/users', cors(), usersRoute);

 Or specify url
 
 app.use(cors({origin: 'https://www.natours.com}))
 */

// Stripe web hook must be defined here as body that stripe needs to be RAW, so it should be before parsing JSON
app.post(
  '/webhook-checkout',
  bodyParser.raw({ type: 'application/json' }),
  BookingsController.webhookCheckout
);

app.use(bodyParser.urlencoded({ extended: true, limit: '10kb' }));

// Middleware to modify request, enables server to read amnnd accept JSON in request's body
app.use(express.json({ limit: '10kb' }));

// Cookie Parser
app.use(cookieParser());

app.use(helmet());
// app.use(
//   helmet({
//     crossOriginEmbedderPolicy: false,
//   })
// );

// app.use(
//   helmet({
//     hsts: process.env.NODE_ENV !== 'production' ? true : false,
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'], //
//         'worker-src': ['blob:'],
//         'child-src': ['blob:', 'https://js.stripe.com/'],
//         // 'img-src': ["'self'", 'data: image/webp'],
//         'script-src': [
//           "'self'",
//           'https://api.mapbox.com',
//           'https://cdnjs.cloudflare.com',
//           'https://js.stripe.com/v3/',
//           "'unsafe-inline'",
//           'https://unpkg.com/axios/dist/axios.min.js',
//           'https://*.stripe.com/',
//         ],
//         'connect-src': [
//           "'self'",
//           'data:', //
//           'blob:', //
//           'ws://localhost:*',
//           'ws://127.0.0.1:*',
//           'http://127.0.0.1:*',
//           'http://localhost:*',
//           'https://*.tiles.mapbox.com',
//           'https://api.mapbox.com',
//           'https://events.mapbox.com',
//           'https://bundle.js:*',
//           'https://*.cloudflare.com/',
//           'https://*.stripe.com/',
//           'wss://shielded-crag-27226-bc9f4c57d930.herokuapp.com:*',
//           'ws://shielded-crag-27226-bc9f4c57d930.herokuapp.com:*',
//           'ws://shielded-crag-27226-bc9f4c57d930.herokuapp.com:1234',
//           '*/shielded-crag-27226-bc9f4c57d930.herokuapp.com:*',
//           // 'https://cdnjs.cloudflare.com/ajax/libs/axios/1.4.0/axios.min.js',
//         ],
//         imgSrc: ["'self'", 'blob:', 'data:', 'https:'], //
//       },
//     },
//     crossOriginEmbedderPolicy: false,
//   })
// );

// app.use(helmet({ contentSecurityPolicy: false })); // set security HTTP headers
// Rate limiting, 100 request per 1 hour from the same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in 1 hour',
});

app.use('/api', limiter); // apply to api root

// Data sanitization against NoSQL query injection (filters out dots and $ signs)
app.use(mongoSanitize());

// Data sanitization against XSS (cleans user input from malicious HTML and JS code)
app.use(xss());

// Prevent parameter polution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev')); // Logging middleware
}

// Custom middleware, create property on requestr
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use(compression());

///////////////// ROUTES ////////////////

app.use('/', viewRoute);
app.use('/api/v1/tours', toursRoute);
app.use('/api/v1/users', usersRoute);
app.use('/api/v1/reviews', reviewsRoute);
app.use('/api/v1/bookings', bookingsRoute);

app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// by specifing 4 options express knows it is error handling middleware
app.use(globalErrorHandler);
