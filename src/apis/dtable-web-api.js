import axios from 'axios';

class DTableWebAPI {

  init({ server, username, password, token }) {
    this.server = server;
    this.username = username;
    this.password = password;
    this.token = token;
    if (this.token && this.server) {
      this.req = axios.create({
        baseURL: this.server,
        headers: { 'Authorization': `Token ${this.token}` }
      });
    }
  }

  login() {
    const url = `${this.server}/api2/auth-token/`;
    return axios.post(url, {
      username: this.username,
      password: this.password
    }).then((response) => {
      this.token = response.data.token;
      this.req = axios.create({
        baseURL: this.server,
        headers: { 'Authorization': `Token ${this.token}` }
      });
    });
  }
}

export default DTableWebAPI;
