import fs from 'fs';
import User from '../../../models/user.model.js';
// import Review from '../../../models/reviews.model.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export function currDir() {
  const __filename = fileURLToPath(import.meta.url);
  return dirname(__filename);
}

// READ JSON
const tours = JSON.parse(fs.readFileSync(`${currDir()}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${currDir()}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${currDir()}/reviews.json`, 'utf-8')
);

// IMPORT, ID FIELD WILL BE DROPPED AS IT IS NOT IN SCHEMA
const importData = async () => {
  try {
    // await User.deleteMany();
    await User.create(users, { validateBeforeSave: false });

    console.log('Data has been loaded');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE ALL
const deleteData = async () => {
  try {
    await User.deleteMany();
    console.log('Data has been deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') importData();
if (process.argv[2] === '--delete') deleteData();

// console.log(process.argv);

// node public/dev-data/data/import-dev-data.js
// importData();
