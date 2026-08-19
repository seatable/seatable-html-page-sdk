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
    if (this.options.pageId === 'ai_agent' && !Array.isArray(this.options.previewTableConfigs)) {
      const previewTableConfigs = await this.iframeAdapter.request(POST_MESSAGE_REQUEST_TYPE.GET_PREVIEW_TABLE_CONFIGS);
      this.options.previewTableConfigs = Array.isArray(previewTableConfigs) ? previewTableConfigs : [];
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
    const previewTableConfig = this._getPreviewTableConfig({ tableName });
    return this.htmlPageAPI.listRows(this.options.pageId, tableName, start, limit, previewTableConfig);
  }

  queryRows({ tableName, conditions, start, limit }) {
    const previewTableConfig = this._getPreviewTableConfig({ tableName });
    return this.htmlPageAPI.queryRows(this.options.pageId, tableName, conditions, start, limit, previewTableConfig);
  }

  _getPreviewTableConfig({ tableName }) {
    if (this.options.pageId !== 'ai_agent' || !Array.isArray(this.options.previewTableConfigs)) return undefined;
    const tableConfig = this.options.previewTableConfigs.find(config => tableName && config?.table_name === tableName);
    if (!tableConfig) return undefined;
    return {
      table_id: tableConfig.table_id,
      permissions: { ...(tableConfig.permissions || {}) },
    };
  }

  listCollaborators() {
    return this.htmlPageAPI.listCollaborators();
  }

  resolveUsers({ userIds } = {}) {
    return this.htmlPageAPI.resolveUsers(userIds);
  }

  addRow({ tableName, rowData }) {
    const previewTableConfig = this._getPreviewTableConfig({ tableName });
    return this.htmlPageAPI.addRow(this.options.pageId, tableName, rowData, previewTableConfig);
  }

  updateRow({ tableName, rowId, rowData }) {
    const previewTableConfig = this._getPreviewTableConfig({ tableName });
    return this.htmlPageAPI.updateRow(this.options.pageId, tableName, rowId, rowData, previewTableConfig);
  }

  deleteRow({ tableName, rowId }) {
    const rowsIds = [rowId];
    return this.batchDeleteRows({ tableName, rowsIds });
  }

  batchAddRows({ tableName, rowsData }) {
    const previewTableConfig = this._getPreviewTableConfig({ tableName });
    return this.htmlPageAPI.addRows(this.options.pageId, tableName, rowsData, previewTableConfig);
  }

  batchUpdateRows({ tableName, rowsData }) {
    const previewTableConfig = this._getPreviewTableConfig({ tableName });
    return this.htmlPageAPI.updateRows(this.options.pageId, tableName, rowsData, previewTableConfig);
  }

  batchDeleteRows({ tableName, rowsIds }) {
    const previewTableConfig = this._getPreviewTableConfig({ tableName });
    return this.htmlPageAPI.deleteRows(this.options.pageId, tableName, rowsIds, previewTableConfig);
  }

  uploadFile({ file }) {
    return this.htmlPageAPI.upload(this.options.pageId, file);
  }

  uploadImage({ file }) {
    return this.htmlPageAPI.upload(this.options.pageId, file, 'image');
  }
}
