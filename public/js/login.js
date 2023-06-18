import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'post',
      url: 'http://localhost:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Successfully logged in.');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'get',
      url: 'http://localhost:3000/api/v1/users/logout',
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Successfully logged out.');

      // reload the page to get rid of cache
      location.reload(true);
    }
  } catch (err) {
    showAlert('error', 'Error logging out.');
  }
};

// document.querySelector('.form').addEventListener('submit', async (e) => {
//   e.preventDefault();
//   const email = document.getElementById('email').value;
//   const password = document.getElementById('password').value;
//   await login(email, password);
// });
