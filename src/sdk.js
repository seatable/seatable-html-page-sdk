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
    // Pull preview-mode view configs (only meaningful for the ai_agent preview page).
    // For real pages the server resolves views from app_config; the inline map is ignored server-side.
    if (!this.options.views) {
      try {
        this.options.views = await this.iframeAdapter.request(POST_MESSAGE_REQUEST_TYPE.GET_VIEWS);
      } catch (e) {
        this.options.views = null;
      }
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

  listRows({ tableName, viewName, start, limit }) {
    let viewConfig = null;
    if (viewName && this.options.views && typeof this.options.views === 'object') {
      const cfg = this.options.views[viewName];
      if (cfg && typeof cfg === 'object') viewConfig = cfg;
    }
    return this.htmlPageAPI.listRows(this.options.pageId, tableName, start, limit, viewName, viewConfig);
  }

  listCollaborators() {
    return this.htmlPageAPI.listCollaborators();
  }

  resolveUsers({ userIds } = {}) {
    return this.htmlPageAPI.resolveUsers(userIds);
  }

  addRow({ tableName, rowData }) {
    return this.htmlPageAPI.addRow(this.options.pageId, tableName, rowData);
  }

  updateRow({ tableName, rowId, rowData }) {
    return this.htmlPageAPI.updateRow(this.options.pageId, tableName, rowId, rowData);
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

  uploadFile({ file }) {
    return this.htmlPageAPI.upload(this.options.pageId, file);
  }

  uploadImage({ file }) {
    return this.htmlPageAPI.upload(this.options.pageId, file, 'image');
  }
}
