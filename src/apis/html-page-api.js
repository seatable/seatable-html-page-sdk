import axios from 'axios';

class HTMLPageAPI {
  async initWithAccountToken({ server, accountToken, appUuid }) {
    this.initServer(server);
    this.appUuid = appUuid;
    if (this.server && this.appUuid) {
      try {
        const res = await axios.get(`${this.server}api/v2.1/universal-apps/${this.appUuid}/access-token/`, {
          headers: { Authorization: 'Token ' + accountToken }
        });
        this.accessToken = res.data?.access_token || '';
        this.createReq();
      } catch (error) {
        console.log('Authorization failed');
      }
    }
  }

  init({ server, accessToken, appUuid }) {
    this.initServer(server);
    this.accessToken = accessToken || '';
    this.appUuid = appUuid;
    if (this.accessToken && this.server && this.appUuid) {
      this.createReq();
    }
  }

  initServer(server) {
    if (!server) return;
    this.server = server.endsWith('/') ? server : `${server}/`;
  }

  createReq() {
    this.req = axios.create({
      baseURL: this.server,
      headers: {
        Authorization: 'Token ' + this.accessToken,
      },
    });
  }

  _sendDelete(url, data) {
    return this.req.delete(url, {
      headers: { 'Content-Type': 'application/json' },
      data,
    });
  }

  _sendPut(url, data) {
    return this.req.put(url, {
      headers: { 'Content-Type': 'application/json' },
      data,
    });
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

  addRows(page_id, table_name, rows_data, rows_links_data) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-rows/batch/`;
    const data = { page_id, table_name, rows_data, rows_links_data };
    return this.req.post(url, data);
  }

  updateRows(page_id, table_name, rows_data) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-rows/`;
    const data = { page_id, table_name, rows_data };
    return this.req._sendPut(url, data);
  }

  deleteRows(page_id, table_name, rows_ids) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-rows/`;
    const data = { page_id, table_name, rows_ids };
    return this._sendDelete(url, data);
  }
}

export default HTMLPageAPI;
