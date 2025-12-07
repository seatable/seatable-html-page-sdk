import { Bridge } from './bridge';
import { IframeAdapter } from './adapter/iframe';
import { MockAdapter } from './adapter/mock';
import { REQUEST_TYPE } from './constants';

const NOTIFY_EVENT_TYPE = {
  APP_CHANGED: 'app_changed',
};

export class HTMLPageSDK {
  constructor(options) {
    this.options = options;
    this.isMock = options.isMock || window.parent === window.self;
    this.adapter = this.isMock ? new MockAdapter(options) : new IframeAdapter(options);
    this.bridge = new Bridge(this.adapter);
  }

  getAppSettings() {
    return this.bridge.request(REQUEST_TYPE.GET_APP_SETTINGS);
  }

  async getAppSetting(key) {
    const settings = await this.getAppSettings();
    return settings?.[key];
  }

  getAppConfig(key) {
    return this.bridge.request(REQUEST_TYPE.GET_APP_CONFIG, { key });
  }

  getTables() {
    return this.bridge.request(REQUEST_TYPE.GET_TABLES);
  }

  getRows(tableName, start, limit) {
    return this.bridge.request(REQUEST_TYPE.GET_ROWS, { tableName, start, limit });
  }

  addRow(tableName, rowData, linkRows) {
    return this.bridge.request(REQUEST_TYPE.ADD_ROW, { tableName, rowData, linkRows });
  }

  /**
   * listen app data changed
   * @param {function} callback(type: APP_CHANGED_EVENT_TYPE, updates)
   * @returns
   */
  subscribeAppChanged(callback) {
    return this.bridge.on(NOTIFY_EVENT_TYPE.APP_CHANGED, callback);
  }
}
