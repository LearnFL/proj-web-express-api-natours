import axios from 'axios';
import { showAlert } from './alerts';

export const updateUserData = async (name, email) => {
  try {
    const res = await axios({
      url: 'http://localhost:3000/api/v1/users/updateMe',
      method: 'patch',
      data: { name: name, email: email },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'User successfully updated.');
      window.setTimeout(() => {
        location.reload(true);
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
