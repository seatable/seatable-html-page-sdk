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
        // eslint-disable-next-line
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
    return this.req.put(url, data, { headers: { 'Content-Type': 'application/json' } });
  }

  listRows(page_id, table_name, start, limit, view_name, view_config) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-rows/`;
    const params = { page_id, table_name, start, limit };
    if (view_name) {
      params.view_name = view_name;
    }
    if (view_config && typeof view_config === 'object') {
      params.view_config = JSON.stringify(view_config);
    }
    return this.req.get(url, { params });
  }

  listCollaborators() {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-collaborators/`;
    return this.req.get(url);
  }

  resolveUsers(user_ids) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-users/resolve/`;
    const data = { user_ids };
    return this.req.post(url, data);
  }

  addRow(page_id, table_name, row_data) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-rows/`;
    const data = { page_id, table_name, row_data };
    return this.req.post(url, data);
  }

  addRows(page_id, table_name, rows_data) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-rows/batch/`;
    const data = { page_id, table_name, rows_data };
    return this.req.post(url, data);
  }

  updateRow(page_id, table_name, row_id, row_data) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-rows/`;
    const data = { page_id, table_name, row_id, row_data };
    return this._sendPut(url, data);
  }

  updateRows(page_id, table_name, rows_data) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-rows/batch/`;
    const data = { page_id, table_name, rows_data };
    return this._sendPut(url, data);
  }

  deleteRows(page_id, table_name, rows_ids) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-rows/`;
    const data = { page_id, table_name, rows_ids };
    return this._sendDelete(url, data);
  }

  getUploadLink(page_id, upload_type = 'file') {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-upload-link/`;
    return this.req.get(url, { params: { page_id, upload_type } });
  }

  uploadAsset(upload_link, form_data) {
    return axios.create()({
      method: 'post',
      url: `${upload_link}?ret-json=1`,
      data: form_data,
    });
  }

  async upload(pageId, file, upload_type = 'file') {
    let uploadLinkRes = null;
    try {
      uploadLinkRes = await this.getUploadLink(pageId, upload_type);
    } catch (error) {
      throw new Error(`Failed to get upload link: ${error.message}`);
    }
    if (!uploadLinkRes || !uploadLinkRes.data) {
      throw new Error('Failed to get upload link: empty response');
    }
    const { upload_link, parent_path, img_relative_path, file_relative_path, asset_parent_url } = uploadLinkRes.data;
    const relativePath = upload_type === 'image' ? img_relative_path : file_relative_path;
    const formData = new FormData();
    formData.append('parent_dir', parent_path);
    formData.append('relative_path', relativePath);
    formData.append('file', file, file.name);

    let uploadRes = null;
    try {
      uploadRes = await this.uploadAsset(upload_link, formData);
    } catch (error) {
      throw new Error(`Failed to get upload link: ${error.message}`);
    }
    const uploadedFile = uploadRes?.data?.[0];
    if (!uploadedFile) {
      throw new Error('Failed to upload file: empty response');
    }
    const url = `${asset_parent_url}/${relativePath}/${encodeURIComponent(uploadedFile.name)}`;
    return {
      name: uploadedFile.name,
      size: uploadedFile.size,
      type: upload_type,
      url,
    };
  }
}

export default HTMLPageAPI;
