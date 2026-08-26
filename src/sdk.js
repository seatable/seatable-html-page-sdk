import HTMLPageAPI from './apis/html-page-api';
import { IframeAdapter, POST_MESSAGE_REQUEST_TYPE } from './iframe-adapter';

const AI_AGENT_PAGE_ID = 'ai_agent';

export class HTMLPageSDK {
  constructor(options) {
    const sdkOptions = { ...(options || {}) };
    delete sdkOptions.accessToken;
    this.options = sdkOptions;
    this.iframeAdapter = new IframeAdapter(sdkOptions);
  }

  async init() {
    this.htmlPageAPI = new HTMLPageAPI();
    if (Object.prototype.hasOwnProperty.call(this.options, 'accountToken')) {
      await this._initDevelopment();
      return;
    }
    await this._initProduction();
  }

  async _initDevelopment() {
    const server = this._normalizeServer(this.options.server);
    if (!server) {
      throw new Error('Missing server configuration');
    }

    this.options.server = server;
    const { accountToken, appUuid } = this.options;
    await this.htmlPageAPI.initWithAccountToken({ server, accountToken, appUuid });

    const accessToken = this.htmlPageAPI.accessToken;
    this.htmlPageAPI.init({ server, accessToken, appUuid });
  }

  async _initProduction() {
    const server = this._normalizeServer(
      await this.iframeAdapter.bootstrapRequest(POST_MESSAGE_REQUEST_TYPE.GET_SERVER)
    );
    if (!server) {
      throw new Error('Missing server configuration');
    }
    this.options.server = server;

    const accessToken = await this.iframeAdapter.bootstrapRequest(POST_MESSAGE_REQUEST_TYPE.GET_ACCESS_TOKEN);
    const appUuid = await this.iframeAdapter.bootstrapRequest(POST_MESSAGE_REQUEST_TYPE.GET_APP_UUID);
    this.options.appUuid = appUuid;
    await this._configureTrustedOrigin({ server, accessToken, appUuid });

    this.options.pageId = await this.iframeAdapter.request(POST_MESSAGE_REQUEST_TYPE.GET_PAGE_ID);
    if (this.options.pageId === AI_AGENT_PAGE_ID) {
      const previewTableConfigs = await this.iframeAdapter.request(POST_MESSAGE_REQUEST_TYPE.GET_PREVIEW_TABLE_CONFIGS);
      this.options.previewTableConfigs = Array.isArray(previewTableConfigs) ? previewTableConfigs : [];
    }

    this.htmlPageAPI.init({ server, accessToken, appUuid: this.options.appUuid });
  }

  async _configureTrustedOrigin({ server, accessToken, appUuid }) {
    const parentOrigin = await this.htmlPageAPI.getParentOrigin({ server, accessToken, appUuid });
    this.iframeAdapter.setTargetOrigin(parentOrigin);
  }

  _normalizeServer(server) {
    if (!server) return '';
    return server.endsWith('/') ? server : `${server}/`;
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
    if (this.options.pageId !== AI_AGENT_PAGE_ID || !Array.isArray(this.options.previewTableConfigs)) return undefined;
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
