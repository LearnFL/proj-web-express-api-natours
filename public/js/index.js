// import User from '../../models/user.model.js';
import 'core-js/actual';
import 'regenerator-runtime/runtime';
import { displayMap } from './mapbox.js';
import { login, logout } from './login.js';
import { signup } from './signup.js';
import { updateSettings } from './updateSettings.js';
import { resetPassword } from './resetPassword.js';
import { bookTour } from './stripe.js';
import { showAlert } from './alerts.js';

const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const signupForm = document.querySelector('.form--signup');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const resetPasswordForm = document.querySelector('.form--reset-password');
const bookBtn = document.getElementById('book-tour');
const alertMessage = document.querySelector('body').dataset.alert;

if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await login(email, password);
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    const name = document.getElementById('name').value;
    await signup(name, email, password, passwordConfirm);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', async () => {
    await logout();
  });
}

if (userDataForm) {
  userDataForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    document.querySelector('.btn--save-settings').textContent = 'Saving...';
    // const email = document.getElementById('email').value;
    const name = document.getElementById('name').value;
    await updateSettings(form, 'data');
    // document.querySelector('.nav__user-name').textContent = name.split(' ')[0];
    document.querySelector('.btn--save-settings').textContent = 'SAVE SETTINGS';
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    document.querySelector('.btn--save-password').textContent =
      'Updating password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (resetPasswordForm) {
  resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--reset-password').textContent = 'Updating...';
    const password = document.getElementById('email').value;
    const passwordConfirm = document.getElementById('password').value;

    await resetPassword({ password, passwordConfirm });

    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
  });
}

if (bookBtn) {
  bookBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.target.textContent = 'Processing...';
    const tourId = e.target.dataset.tourId; // converted to camelCase
    /*
    OR USE DESTRUCTURING
    const {tourId} = e.target.dataset
    */
    await bookTour(tourId);
  });
}

if (alertMessage) {
  showAlert('success', alertMessage, 15000);
}
