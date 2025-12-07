import UniversalAppAPI from '../apis/universal-app-api';
import DTableWebAPI from '../apis/dtable-web-api';
import { REQUEST_TYPE } from '../constants';

export class MockAdapter {
  constructor(options) {
    this.options = options || {};
    this.metadata = null;
    this.init();
  }

  init() {
    this.initApi();
  }

  initApi() {
    this.dtableWebAPI = new DTableWebAPI();
    this.universalAppAPI = new UniversalAppAPI();
    const { server, username, password, accessToken, appUuid } = this.options;
    this.appUuid = appUuid;
    this.dtableWebAPI.init({ server, username, password, token: accessToken });
    this.dtableWebAPI.login();
    this.universalAppAPI.init({ server, accessToken });
  }

  getAppConfig(key) {
    if (!key) {
      return this.options.appConfig || {};
    }
    return this.options.appConfig?.[key];
  }

  async getMetadata() {
    const res = await this.universalAppAPI.getMetadata(this.appUuid);
    return res?.data;
  }

  async getTables() {
    const metadata = await this.getMetadata();
    return metadata?.tables;
  }

  getRows(tableName, start, limit) {
    return this.universalAppAPI.getRows(this.appUuid, tableName, start, limit);
  }

  addRow(tableName, rowData, linkRows) {
    return this.universalAppAPI.addRow(this.appUuid, tableName, rowData, linkRows);
  }

  request(method, params) {
    switch (method) {
      case REQUEST_TYPE.GET_APP_SETTINGS: {
        return this.options;
      }
      case REQUEST_TYPE.GET_APP_CONFIG: {
        const { key } = params || {};
        return this.getAppConfig(key);
      }
      case REQUEST_TYPE.GET_TABLES: {
        return this.getTables();
      }
      case REQUEST_TYPE.GET_ROWS: {
        const { tableName, start, limit } = params || {};
        return this.getRows(tableName, start, limit);
      }
      case REQUEST_TYPE.ADD_ROW: {
        const { tableName, rowData, linkRows } = params || {};
        return this.addRow(tableName, rowData, linkRows);
      }
      default: {
        return null;
      }
    }
  }

  on() {
    // not support in mock adapter
    return () => {};
  }
}
