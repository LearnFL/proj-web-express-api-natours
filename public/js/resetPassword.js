import axios from 'axios';
import { showAlert } from './alerts';

export const resetPassword = async (data) => {
  try {
    const token = window.location.hash.slice(1);
    const url = `http://localhost:3000/api/v1/users/resetPassword/${token}`;
    // const url = `${req.protocol}://${req.get(
    //   'host'
    // )}/api/v1/users/resetPassword/${token}`;

    const res = await axios({
      method: 'patch',
      url,
      data,
    });

    console.log(res.data);

    if (res.data.status === 'success') {
      showAlert('success', `PASSWORD updated successfully`);
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
