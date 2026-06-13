import { CommentModeAdapter } from './comment-mode';
import { POST_MESSAGE_TYPE } from './constants';

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
const INTERACTIVE_TAGS = ['SELECT', 'INPUT', 'TEXTAREA', 'BUTTON'];

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
  constructor(options) {
    this.options = options || {};
    this.selfWindow = window.parent === window.self;
    this.targetOrigin = this.options.targetOrigin || '*';
    this.pendingRequests = {};
    this.eventHandlers = {};
    this.timeout = this.options.timeout || 10000;
    this.isCommentMode = false;
    this.commentModeAdapter = new CommentModeAdapter();
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
    this._windowEventHandler = this._windowEventHandler.bind(this);
    this.interactiveEventTypes = [
      ...SUPPORT_WINDOW_MOUSE_EVENT_TYPES,
      ...SUPPORT_WINDOW_KEYBOARD_EVENT_TYPES,
      ...SUPPORT_WINDOW_DRAG_EVENT_TYPES,
    ];
    this.rafId = null;
    this.pendingEvent = null;

    this.bindInteractiveEvents();
  }

  bindInteractiveEvents() {
    this.interactiveEventTypes.forEach(eventType => {
      window.addEventListener(eventType, this._windowEventHandler, true);
    });
  }

  unbindInteractiveEvents() {
    this.interactiveEventTypes.forEach(eventType => {
      window.removeEventListener(eventType, this._windowEventHandler, true);
    });
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pendingEvent = null;
  }

  _windowEventHandler(event) {
    if (event.source === WINDOW_EVENT_SOURCE_TYPE.APP) return;
    const target = event.target;
    if (target && INTERACTIVE_TAGS.includes(target.tagName)) return;

    const eventType = event.type;
    if (SUPPORT_WINDOW_KEYBOARD_EVENT_TYPES.includes(eventType)) {
      const active = document.activeElement;
      if (active && INTERACTIVE_TAGS.includes(active.tagName)) return;
    }
    if (HIGH_FREQUENCY_WINDOW_EVENT_TYPES.includes(eventType)) {
      this.pendingEvent = createWindowEventData({ eventType, event });
      if (this.rafId === null) {
        this.rafId = requestAnimationFrame(() => {
          if (this.pendingEvent) {
            this.postWindowEvent(this.pendingEvent);
            this.pendingEvent = null;
            this.rafId = null;
          }
        });
      }
      return;
    }
    this.postWindowEvent(createWindowEventData({ eventType, event }));
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
    if (type && type.includes('COMMENT')) {
      console.log('--- SDK handleMessage ---', type);
    }
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
    } else if (type === POST_MESSAGE_TYPE.HTML_PAGE_ENABLE_COMMENT_MODE) {
      this.isCommentMode = true;
      this.unbindInteractiveEvents();
      if (this.commentModeAdapter) this.commentModeAdapter.enable();
    } else if (type === POST_MESSAGE_TYPE.HTML_PAGE_DISABLE_COMMENT_MODE) {
      this.isCommentMode = false;
      if (this.commentModeAdapter) this.commentModeAdapter.disable();
      this.bindInteractiveEvents();
    } else if (type === POST_MESSAGE_TYPE.WINDOW_EVENT) {
      this.handleWindowEvent(data);
    }
  }

  handleWindowEvent(data) {
    const eventData = data.event_data;
    if (!eventData || this.isCommentMode) return;
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
    if (this.commentModeAdapter) {
      this.commentModeAdapter.destroy();
    }
  }
}
