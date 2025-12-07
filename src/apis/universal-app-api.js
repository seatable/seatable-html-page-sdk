import axios from 'axios';

class UniversalAppAPI {

  init({ server, accessToken, csrfToken }) {
    this.server = server;
    this.accessToken = accessToken;
    let headers = {
      'Authorization': 'Token ' + this.accessToken,
    };
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
    if (this.accessToken && this.server) {
      this.req = axios.create({
        baseURL: this.server,
        headers,
      });
    }
    return this;
  }

  getMetadata(appUuid) {
    const url = `${this.server}/api/v2.1/universal-apps/${appUuid}/metadata/`;
    return this.req.get(url);
  }

  getRows(appUuid, table_name, start, limit) {
    const url = `${this.server}/api/v2.1/universal-apps/${appUuid}/html-page-rows/`;
    const params = { table_name, start, limit };
    return this.req.get(url, { params });
  }

  addRow(appUuid, table_name, row_data, link_rows) {
    const url = `${this.server}/api/v2.1/universal-apps/${appUuid}/html-page-rows/`;
    const data = { table_name, row_data, link_rows };
    return this.req.post(url, data);
  }
}

export default UniversalAppAPI;
