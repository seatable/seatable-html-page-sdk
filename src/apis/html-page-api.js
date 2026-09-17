import axios from 'axios';

class HTMLPageAPI {
  async initWithAccountToken({ server, accountToken, appUuid }) {
    if (!server || !accountToken || !appUuid) {
      throw new Error('Failed to get access token: missing server, accountToken, or appUuid');
    }

    let res;
    try {
      res = await axios.get(`${server}api/v2.1/universal-apps/${appUuid}/access-token/`, {
        headers: { Authorization: 'Token ' + accountToken }
      });
    } catch (error) {
      throw new Error(`Failed to get access token: ${error.message}`);
    }

    const accessToken = res.data?.access_token;
    if (!accessToken) {
      throw new Error('Failed to get access token: access_token missing');
    }
    this.accessToken = accessToken;
  }

  init({ server, accessToken, appUuid }) {
    this.server = server;
    this.accessToken = accessToken || '';
    this.appUuid = appUuid;
    if (this.accessToken && this.server && this.appUuid) {
      this.createReq();
    }
  }

  async getParentOrigin({ server, accessToken, appUuid }) {
    if (!server || !accessToken || !appUuid) {
      throw new Error('Failed to get parentOrigin: missing server, accessToken, or appUuid');
    }

    try {
      const response = await axios.post(
        `${server}api/v2.1/universal-apps/bootstrap/`,
        { app_uuid: appUuid },
        { headers: { Authorization: 'Token ' + accessToken } },
      );
      return response.data?.parentOrigin || '';
    } catch (error) {
      throw new Error(`Failed to get parentOrigin: ${error.message}`);
    }
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

  listRows(page_id, table_name, start, limit, preview_table_config) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-rows/`;
    const params = { page_id, table_name, start, limit };
    if (preview_table_config && typeof preview_table_config === 'object') {
      params.preview_table_config = JSON.stringify(preview_table_config);
    }
    return this.req.get(url, { params });
  }

  queryRows(page_id, table_name, conditions, start, limit, preview_table_config) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-rows/query/`;
    const data = { page_id, table_name, conditions, start, limit };
    if (preview_table_config && typeof preview_table_config === 'object') {
      data.preview_table_config = preview_table_config;
    }
    return this.req.post(url, data);
  }

  listCollaborators() {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-collaborators/`;
    return this.req.get(url);
  }

  getCurrentUser() {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/current-user/`;
    return this.req.get(url);
  }

  resolveUsers(user_ids) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-users/resolve/`;
    const data = { user_ids };
    return this.req.post(url, data);
  }

  addRow(page_id, table_name, row_data, preview_table_config) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-rows/`;
    const data = { page_id, table_name, row_data };
    if (preview_table_config && typeof preview_table_config === 'object') {
      data.preview_table_config = preview_table_config;
    }
    return this.req.post(url, data);
  }

  addRows(page_id, table_name, rows_data, preview_table_config) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-rows/batch/`;
    const data = { page_id, table_name, rows_data };
    if (preview_table_config && typeof preview_table_config === 'object') {
      data.preview_table_config = preview_table_config;
    }
    return this.req.post(url, data);
  }

  updateRow(page_id, table_name, row_id, row_data, preview_table_config) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-rows/`;
    const data = { page_id, table_name, row_id, row_data };
    if (preview_table_config && typeof preview_table_config === 'object') {
      data.preview_table_config = preview_table_config;
    }
    return this._sendPut(url, data);
  }

  updateRows(page_id, table_name, rows_data, preview_table_config) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-rows/batch/`;
    const data = { page_id, table_name, rows_data };
    if (preview_table_config && typeof preview_table_config === 'object') {
      data.preview_table_config = preview_table_config;
    }
    return this._sendPut(url, data);
  }

  deleteRows(page_id, table_name, rows_ids, preview_table_config) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-rows/`;
    const data = { page_id, table_name, rows_ids };
    if (preview_table_config && typeof preview_table_config === 'object') {
      data.preview_table_config = preview_table_config;
    }
    return this._sendDelete(url, data);
  }

  addLink(page_id, table_name, row_id, link_column_name, other_row_id, preview_table_config) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-links/`;
    const data = { page_id, table_name, row_id, link_column_name, other_row_id };
    if (preview_table_config && typeof preview_table_config === 'object') {
      data.preview_table_config = preview_table_config;
    }
    return this.req.post(url, data);
  }

  deleteLink(page_id, table_name, row_id, link_column_name, other_row_id, preview_table_config) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-links/`;
    const data = { page_id, table_name, row_id, link_column_name, other_row_id };
    if (preview_table_config && typeof preview_table_config === 'object') {
      data.preview_table_config = preview_table_config;
    }
    return this._sendDelete(url, data);
  }

  addLinks(page_id, table_name, links_data, preview_table_config) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-links/batch/`;
    const data = { page_id, table_name, links_data };
    if (preview_table_config && typeof preview_table_config === 'object') {
      data.preview_table_config = preview_table_config;
    }
    return this.req.post(url, data);
  }

  deleteLinks(page_id, table_name, links_data, preview_table_config) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/html-page-links/batch/`;
    const data = { page_id, table_name, links_data };
    if (preview_table_config && typeof preview_table_config === 'object') {
      data.preview_table_config = preview_table_config;
    }
    return this._sendDelete(url, data);
  }

  sendNotification(page_id, notification_data, preview_table_config) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/notification/`;
    const data = { ...notification_data, page_id };
    if (preview_table_config && typeof preview_table_config === 'object') {
      data.preview_table_config = preview_table_config;
    }
    return this.req.post(url, data);
  }

  sendEmail(page_id, email_data, preview_table_config) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/email/`;
    const data = { ...email_data, page_id };
    if (preview_table_config && typeof preview_table_config === 'object') {
      data.preview_table_config = preview_table_config;
    }
    return this.req.post(url, data);
  }

  getMessageStatus(task_id) {
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/dtable-message-status/`;
    return this.req.get(url, { params: { task_id } });
  }

  runScript(script_name, page_id, table_name, row_id, preview_table_config) {
    const encodedScriptName = encodeURIComponent(script_name);
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/run-script/${encodedScriptName}/`;
    const data = { page_id, table_name, row_id };
    if (preview_table_config && typeof preview_table_config === 'object') {
      data.preview_table_config = preview_table_config;
    }
    return this.req.post(url, data);
  }

  getScriptResult(script_name, task_id, page_id) {
    const encodedScriptName = encodeURIComponent(script_name);
    const url = `${this.server}api/v2.1/universal-apps/${this.appUuid}/run-script/${encodedScriptName}/result/${task_id}/`;
    return this.req.get(url, { params: { page_id } });
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
