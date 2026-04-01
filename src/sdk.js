import HTMLPageAPI from './apis/html-page-api';
import { IframeAdapter, POST_MESSAGE_REQUEST_TYPE } from './iframe-adapter';

export class HTMLPageSDK {
  constructor(options) {
    this.options = options || {};
    this.iframeAdapter = new IframeAdapter(options);
  }

  async init() {
    if (!this.options) {
      this.options = {};
    }
    this.htmlPageAPI = new HTMLPageAPI();
    if (!this.options.server) {
      this.options.server = await this.iframeAdapter.request(POST_MESSAGE_REQUEST_TYPE.GET_SERVER);
    }
    if (!this.options.appUuid) {
      this.options.appUuid = await this.iframeAdapter.request(POST_MESSAGE_REQUEST_TYPE.GET_APP_UUID);
    }
    if (!this.options.pageId) {
      this.options.pageId = await this.iframeAdapter.request(POST_MESSAGE_REQUEST_TYPE.GET_PAGE_ID);
    }
    if (this.options.accountToken) {
      // dev: try to get access-token via accountToken
      const { server, accountToken, appUuid } = this.options;
      await this.htmlPageAPI.initWithAccountToken({ server, accountToken, appUuid });
    } else {
      if (!this.options.accessToken) {
        this.options.accessToken = await this.iframeAdapter.request(POST_MESSAGE_REQUEST_TYPE.GET_ACCESS_TOKEN);
      }
      const { server, accessToken, appUuid } = this.options;
      this.htmlPageAPI.init({ server, accessToken, appUuid });
    }
  }

  listRows({ tableName, start, limit }) {
    return this.htmlPageAPI.listRows(this.options.pageId, tableName, start, limit);
  }

  addRow({ tableName, rowData }) {
    return this.htmlPageAPI.addRow(this.options.pageId, tableName, rowData);
  }

  updateRow({ tableName, rowId, rowData }) {
    const rowsData = [{ row_id: rowId, row: rowData }];
    this.batchUpdateRows({ tableName, rowsData });
  }

  deleteRow({ tableName, rowId }) {
    const rowsIds = [rowId];
    return this.batchDeleteRows({ tableName, rowsIds });
  }

  batchAddRows({ tableName, rowsData }) {
    return this.htmlPageAPI.addRows(this.options.pageId, tableName, rowsData);
  }

  batchUpdateRows({ tableName, rowsData }) {
    return this.htmlPageAPI.updateRows(this.options.pageId, tableName, rowsData);
  }

  batchDeleteRows({ tableName, rowsIds }) {
    return this.htmlPageAPI.deleteRows(this.options.pageId, tableName, rowsIds);
  }

  async _upload({ file, uploadType = 'file' }) {
    let uploadLinkRes = null;
    try {
      uploadLinkRes = await this.htmlPageAPI.getUploadLink(this.options.pageId, uploadType);
    } catch (error) {
      throw new Error(`Failed to get upload link: ${error.message}`);
    }
    if (!uploadLinkRes || !uploadLinkRes.data) {
      throw new Error('Failed to get upload link: empty response');
    }
    const { upload_link, parent_path, img_relative_path, file_relative_path, asset_parent_url } = uploadLinkRes.data;
    const relativePath = uploadType === 'image' ? img_relative_path : file_relative_path;
    const formData = new FormData();
    formData.append('parent_dir', parent_path);
    formData.append('relative_path', relativePath);
    formData.append('file', file, file.name);

    let uploadRes = null;
    try {
      uploadRes = await this.htmlPageAPI.uploadAsset(upload_link, formData);
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
      type: uploadType,
      url,
    };
  }

  uploadFile({ file }) {
    return this._upload({ file });
  }

  uploadImage({ file }) {
    return this._upload({ file, uploadType: 'image' });
  }
}
