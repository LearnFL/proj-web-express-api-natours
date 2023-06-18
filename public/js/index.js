import 'core-js/actual';
import 'regenerator-runtime/runtime';
import { displayMap } from './mapbox.js';
import { login, logout } from './login.js';

const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form');
const logOutBtn = document.querySelector('.nav__el--logout');

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

if (logOutBtn) {
  logOutBtn.addEventListener('click', async () => {
    await logout();
  });
}
