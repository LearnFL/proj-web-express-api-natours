import {} from 'dotenv/config';
import { app } from './app.js';

// console.log(`Current environment: ${app.get('env')}`);
// console.log('Process env: ', process.env.NODE_ENV);

// Synchronous code error/bugs handling
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION');
  console.log(err.name, err.message);
  process.exit(1);
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Listenong on port ${PORT}`);
});

// asynchronous code error handling
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION');
  console.log(err.name, err.message);
  server.close(() => process.exit(1));
});
