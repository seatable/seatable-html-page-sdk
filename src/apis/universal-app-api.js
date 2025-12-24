import axios from 'axios';

class UniversalAppAPI {
  constructor({ server, accessToken, appUuid }) {
    this.server = server;
    this.accessToken = accessToken;
    this.appUuid = appUuid;
    this.init();
  }

  init() {
    if (this.accessToken && this.server) {
      this.server = this.server.endsWith('/') ? this.server : `${this.server}/`;
      this.req = axios.create({
        baseURL: this.server,
        headers: {
          Authorization: 'Token ' + this.accessToken,
        },
      });
    }
  }

  listRows(page_id, table_name, start, limit) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-rows/`;
    const params = { page_id, table_name, start, limit };
    return this.req.get(url, { params });
  }

  addRow(page_id, table_name, row_data, row_links_data) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-rows/`;
    const data = { page_id, table_name, row_data, row_links_data };
    return this.req.post(url, data);
  }

  updateRows(page_id, table_name, rows_data) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-rows/`;
    const data = { page_id, table_name, rows_data };
    return this.req.put(url, data);
  }

  deleteRows(page_id, table_name, rows_ids) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-rows/`;
    const data = { page_id, table_name, rows_ids };
    return this.req.delete(url, data);
  }
}

export default UniversalAppAPI;
