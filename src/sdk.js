import UniversalAppAPI from './apis/universal-app-api';
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
    if (!this.options.server) {
      this.options.server = await this.iframeAdapter.request(POST_MESSAGE_REQUEST_TYPE.GET_SERVER);
    }
    if (!this.options.accessToken) {
      this.options.accessToken = await this.iframeAdapter.request(POST_MESSAGE_REQUEST_TYPE.GET_ACCESS_TOKEN);
    }
    if (!this.options.appUuid) {
      this.options.appUuid = await this.iframeAdapter.request(POST_MESSAGE_REQUEST_TYPE.GET_APP_UUID);
    }
    if (!this.options.pageId) {
      this.options.pageId = await this.iframeAdapter.request(POST_MESSAGE_REQUEST_TYPE.GET_PAGE_ID);
    }
    const { server, accessToken, appUuid } = this.options;
    this.universalAppAPI = new UniversalAppAPI({ server, accessToken, appUuid });
  }

  listRows({ tableName, start, limit }) {
    return this.universalAppAPI.listRows(this.options.pageId, tableName, start, limit);
  }

  addRow({ tableName, rowData, rowLinksData }) {
    return this.universalAppAPI.addRow(this.options.pageId, tableName, rowData, rowLinksData);
  }

  updateRow({ tableName, rowId, rowData }) {
    const rowsData = [{ id: rowId, row: rowData }];
    this.batchUpdateRows({ tableName, rowsData });
  }

  deleteRow({ tableName, rowId }) {
    const rowsIds = [rowId];
    return this.batchDeleteRows({ tableName, rowsIds });
  }

  batchAddRows({ tableName, rowsData, rowsLinksData }) {
    return this.universalAppAPI.addRows(this.options.pageId, tableName, rowsData, rowsLinksData);
  }

  batchUpdateRows({ tableName, rowsData }) {
    return this.universalAppAPI.updateRows(this.options.pageId, tableName, rowsData);
  }

  batchDeleteRows({ tableName, rowsIds }) {
    return this.universalAppAPI.deleteRows(this.options.pageId, tableName, rowsIds);
  }
}
