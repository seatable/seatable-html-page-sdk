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

  async uploadFile({ file, uploadType = 'file' }) {
    const res = await this.htmlPageAPI.getUploadLink(this.options.pageId, uploadType);
    const { upload_link, parent_path, img_relative_path, file_relative_path, asset_parent_url } = res.data;
    const relativePath = uploadType === 'image' ? img_relative_path : file_relative_path;
    const formData = new FormData();
    formData.append('parent_dir', parent_path);
    formData.append('relative_path', relativePath);
    formData.append('file', file, file.name);
    const uploadRes = await this.htmlPageAPI.uploadAsset(upload_link, formData);
    const uploadedFile = uploadRes.data[0];
    const url = `${asset_parent_url}/${relativePath}/${encodeURIComponent(uploadedFile.name)}`;
    if (uploadType === 'image') {
      return url;
    }
    return {
      name: uploadedFile.name,
      size: uploadedFile.size,
      type: 'file',
      url,
    };
  }

  uploadImage({ file }) {
    return this.uploadFile({ file, uploadType: 'image' });
  }
}
