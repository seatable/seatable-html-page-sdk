const POST_MESSAGE_TYPE = {
  HTML_PAGE_REQUEST: 'HTML_PAGE_REQUEST',
  HTML_PAGE_RESPONSE: 'HTML_PAGE_RESPONSE',
  HTML_PAGE_EVENT: 'HTML_PAGE_EVENT',
  WINDOW_EVENT: 'WINDOW_EVENT',
};

export const POST_MESSAGE_REQUEST_TYPE = {
  GET_SERVER: 'get_server',
  GET_ACCESS_TOKEN: 'get_access_token',
  GET_APP_UUID: 'get_app_uuid',
  GET_PAGE_ID: 'get_page_id',
};

const WINDOW_EVENT_SOURCE_TYPE = {
  APP: 'app',
  IFRAME: 'iframe',
};
const SUPPORT_WINDOW_MOUSE_EVENT_TYPES = ['click', 'dblclick', 'mousemove', 'mouseenter', 'mouseleave', 'mousedown', 'mouseup', 'contextmenu'];
const SUPPORT_WINDOW_KEYBOARD_EVENT_TYPES = ['keydown', 'keyup', 'keypress'];
const SUPPORT_WINDOW_DRAG_EVENT_TYPES = ['dragstart', 'dragover', 'drag', 'dragend', 'dragenter', 'dragleave', 'drop'];
const HIGH_FREQUENCY_WINDOW_EVENT_TYPES = ['mousemove', 'dragover'];

const hasOwnProperty = (obj, key) => {
  return Object.prototype.hasOwnProperty.call(obj, key);
};

const generatorBase64Code = (keyLength = 4) => {
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < keyLength; i++) {
    key += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return key;
};

const createWindowEventData = ({ eventType, event }) => {
  if (SUPPORT_WINDOW_MOUSE_EVENT_TYPES.includes(eventType)) {
    return {
      type: eventType,
      x: event.x,
      y: event.y,
      button: event.button,
      buttons: event.buttons,
    };
  }
  if (SUPPORT_WINDOW_KEYBOARD_EVENT_TYPES.includes(eventType)) {
    return {
      type: eventType,
      key: event.key,
      code: event.code,
      keyCode: event.keyCode,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      repeat: event.repeat,
    };
  }
  if (SUPPORT_WINDOW_DRAG_EVENT_TYPES.includes(eventType)) {
    return {
      type: eventType,
      x: event.x,
      y: event.y,
    };
  }
  return null;
};

/**
 * IframeAdapter – enables secure postMessage communication in production environments
 * For HTML page running inside an iframe
 */
export class IframeAdapter {
  constructor(options = {}) {
    this.selfWindow = window.parent === window.self;
    this.targetOrigin = options.targetOrigin || '*';
    this.pendingRequests = {};
    this.eventHandlers = {};
    this.timeout = options.timeout || 10000;
    this.setupMessageListener();
  }

  generatorRequestId() {
    let id = generatorBase64Code();
    while (hasOwnProperty(this.pendingRequests, id)) {
      id = generatorBase64Code();
    }
    return id;
  }

  setupMessageListener() {
    if (this.selfWindow) return;
    window.addEventListener('message', this.handleMessage.bind(this));
    this.setEventsListener();
  }

  postWindowEvent(eventData) {
    if (!eventData) return;
    window.parent.postMessage({
      type: POST_MESSAGE_TYPE.WINDOW_EVENT,
      params: {
        event_data: {
          ...eventData,
          source: WINDOW_EVENT_SOURCE_TYPE.IFRAME,
        }
      }
    }, this.targetOrigin);
  }

  setEventsListener() {
    let rafId = null;
    let pendingEvent = null;
    [
      ...SUPPORT_WINDOW_MOUSE_EVENT_TYPES,
      ...SUPPORT_WINDOW_KEYBOARD_EVENT_TYPES,
      ...SUPPORT_WINDOW_DRAG_EVENT_TYPES,
    ].forEach(eventType => {
      window.addEventListener(eventType, (event) => {
        if (event.source === WINDOW_EVENT_SOURCE_TYPE.APP) return;
        if (HIGH_FREQUENCY_WINDOW_EVENT_TYPES.includes(eventType)) {
          // High-frequency events that need throttling (use RAF to limit to 60fps)
          // Use requestAnimationFrame for throttling high-frequency events
          // Store the latest event with necessary data
          pendingEvent = createWindowEventData({ eventType, event });

          // Only schedule a new frame if one isn't already scheduled
          if (rafId === null) {
            rafId = requestAnimationFrame(() => {
              if (pendingEvent) {
                this.postWindowEvent(pendingEvent);
                pendingEvent = null;
                rafId = null;
              }
            });
          }
          return;
        }

        // Low-frequency events
        this.postWindowEvent(createWindowEventData({ eventType, event }));
      }, true);
    });
  }

  async request(method, params) {
    if (this.selfWindow) {
      return new Promise((resolve) => {
        resolve(null);
      });
    }
    const requestId = this.generatorRequestId();
    return new Promise((resolve, reject) => {
      this.pendingRequests[requestId] = { resolve, reject };
      window.parent.postMessage({
        type: POST_MESSAGE_TYPE.HTML_PAGE_REQUEST,
        requestId,
        method,
        params
      }, this.targetOrigin);

      // request timeout
      // reject and clear the pending request
      const timeoutId = setTimeout(() => {
        if (hasOwnProperty(this.pendingRequests, requestId)) {
          delete this.pendingRequests[requestId];
          reject(new Error(`Request timeout: ${method}`));
        }
      }, this.timeout);

      // save timeoutId for the pending request
      const pending = this.pendingRequests[requestId];
      if (pending) {
        pending.timeoutId = timeoutId;
      }
    });
  }

  handleMessage(event) {
    const { type, requestId, data, error, eventType, payload } = event.data;
    if (type === POST_MESSAGE_TYPE.HTML_PAGE_RESPONSE) {
      const pending = this.pendingRequests[requestId];
      if (pending) {
        clearTimeout(pending.timeoutId);
        delete this.pendingRequests[requestId];
        if (error) {
          pending.reject(new Error(error));
        } else {
          pending.resolve(data ? JSON.parse(data) : null);
        }
      }
    } else if (type === POST_MESSAGE_TYPE.HTML_PAGE_EVENT) {
      this.emitEvent(eventType, payload);
    } else if (type === POST_MESSAGE_TYPE.WINDOW_EVENT) {
      const eventData = data.event_data;
      if (!eventData) return;
      let syntheticEvent;
      let targetElement;
      if (SUPPORT_WINDOW_KEYBOARD_EVENT_TYPES.includes(eventData.type)) {
        syntheticEvent = new KeyboardEvent(eventData.type, {
          bubbles: true,
          cancelable: true,
          key: eventData.key,
          code: eventData.code,
          keyCode: eventData.keyCode,
          ctrlKey: eventData.ctrlKey,
          shiftKey: eventData.shiftKey,
          altKey: eventData.altKey,
          metaKey: eventData.metaKey,
          repeat: eventData.repeat,
          view: window,
        });
        targetElement = document.activeElement || document.body;
      } else if (SUPPORT_WINDOW_MOUSE_EVENT_TYPES.includes(eventData.type)) {
        syntheticEvent = new MouseEvent(eventData.type, {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: eventData.x,
          clientY: eventData.y,
          screenX: eventData.x,
          screenY: eventData.y,
          button: eventData.button,
          buttons: eventData.buttons,
        });
        const elementAtPoint = document.elementFromPoint(eventData.x, eventData.y);
        targetElement = elementAtPoint || document.body;
      } else if (SUPPORT_WINDOW_DRAG_EVENT_TYPES.includes(eventData.type)) {
        syntheticEvent = new DragEvent(eventData.type, {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: eventData.x,
          clientY: eventData.y,
          screenX: eventData.x,
          screenY: eventData.y,
          button: eventData.button,
          buttons: eventData.buttons,
        });
        const elementAtPoint = document.elementFromPoint(eventData.x, eventData.y);
        targetElement = elementAtPoint || document.body;
      }

      if (!targetElement || !syntheticEvent) return;

      // Dispatch once on the target element, it will bubble up naturally
      syntheticEvent.source = eventData.source;
      targetElement.dispatchEvent(syntheticEvent);
    }
  }

  on(eventType, handler) {
    if (!hasOwnProperty(this.eventHandlers, eventType)) {
      this.eventHandlers[eventType] = [];
    }
    this.eventHandlers[eventType].push(handler);
    return () => this.off(eventType, handler);
  }

  off(eventType, handler) {
    const handlers = this.eventHandlers[eventType];
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emitEvent(eventType, payload) {
    const handlers = this.eventHandlers[eventType] || [];
    handlers.forEach(handler => {
      try {
        handler(payload);
      } catch (error) {
        // eslint-disable-next-line
        console.error(`Error in event handler for ${eventType}:`, error);
      }
    });
  }

  destroy() {
    this.pendingRequests.forEach(pending => {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error('Adapter destroyed'));
    });
    this.pendingRequests = {};
    this.eventHandlers = {};
  }
}
