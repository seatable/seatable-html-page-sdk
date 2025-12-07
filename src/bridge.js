export class Bridge {
  constructor(adapter) {
    this.adapter = adapter;
  }

  /** request data from app
   * @param {string} method - one of REQUEST_TYPE
   * @param {object} params
   * @returns {Promise}
   */
  async request(method, params = {}) {
    return this.adapter.request(method, params);
  }

  /**
   * listen app event
   * @param {string} eventType - one of NOTIFY_EVENT_TYPE
   * @param {function} handler
   * @returns {function}
   */
  on(eventType, handler) {
    return this.adapter.on(eventType, handler);
  }

  /**
   * cancel app event
   * @param {string} eventType
   * @param {function} handler
   */
  off(eventType, handler) {
    this.adapter.off(eventType, handler);
  }

  /**
   * destroy adapter
   */
  destroy() {
    if (this.adapter.destroy) {
      this.adapter.destroy();
    }
  }
}
