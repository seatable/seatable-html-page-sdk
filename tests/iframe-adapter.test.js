import { IframeAdapter } from '../src/iframe-adapter';
import { POST_MESSAGE_TYPE } from '../src/constants';

describe('IframeAdapter', () => {
  const originalWindow = global.window;
  const originalDocument = global.document;

  afterEach(() => {
    global.window = originalWindow;
    global.document = originalDocument;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('resolves request to null when running in the top window', async () => {
    global.window = {
      self: {},
      addEventListener: jest.fn(),
      parent: {
        postMessage: jest.fn(),
      },
    };

    global.window.parent = global.window.self;

    const adapter = new IframeAdapter();
    await expect(adapter.request('get_server')).resolves.toBeNull();
    expect(global.window.addEventListener).not.toHaveBeenCalled();
  });

  it('cleans up enabled comment mode and all window listeners when destroyed', () => {
    const listeners = new Map();
    const addEventListener = jest.fn((eventType, handler) => {
      if (!listeners.has(eventType)) {
        listeners.set(eventType, new Set());
      }
      listeners.get(eventType).add(handler);
    });
    const removeEventListener = jest.fn((eventType, handler) => {
      const handlers = listeners.get(eventType);
      if (handlers) handlers.delete(handler);
    });
    const dispatchMessage = (data) => {
      const handlers = listeners.get('message') || new Set();
      handlers.forEach((handler) => handler({ data }));
    };
    const postMessage = jest.fn();
    const styles = new Map();
    const rejected = jest.fn();

    global.document = {
      activeElement: null,
      body: {},
      documentElement: {},
      head: {
        appendChild: jest.fn((style) => styles.set(style.id, style)),
      },
      createElement: jest.fn(() => ({
        remove: jest.fn(function remove() {
          styles.delete(this.id);
        }),
      })),
      getElementById: jest.fn((id) => styles.get(id) || null),
    };
    global.window = {
      self: {},
      parent: { postMessage },
      addEventListener,
      removeEventListener,
    };

    const adapter = new IframeAdapter();
    const styleId = 'ai-comment-cursor-style';
    dispatchMessage({ type: POST_MESSAGE_TYPE.HTML_PAGE_ENABLE_COMMENT_MODE });
    adapter.pendingRequests = {
      request: { timeoutId: 1, reject: rejected },
    };

    expect(adapter.commentModeAdapter.isActive).toBe(true);
    expect(styles.get(styleId)).toBeDefined();

    adapter.destroy();

    expect(rejected).toHaveBeenCalledWith(new Error('Adapter destroyed'));
    expect(adapter.pendingRequests).toEqual({});
    expect(adapter.commentModeAdapter.isActive).toBe(false);
    expect(styles.get(styleId)).toBeUndefined();
    expect(removeEventListener).toHaveBeenCalledWith('message', adapter._handleMessage);
    adapter.interactiveEventTypes.forEach((eventType) => {
      expect(removeEventListener).toHaveBeenCalledWith(eventType, adapter._windowEventHandler, true);
    });
    expect(removeEventListener).toHaveBeenCalledWith('click', adapter.commentModeAdapter._handleEvent, true);
    expect(removeEventListener).toHaveBeenCalledWith('scroll', adapter.commentModeAdapter._handleScroll, true);

    dispatchMessage({ type: POST_MESSAGE_TYPE.HTML_PAGE_ENABLE_COMMENT_MODE });
    expect(adapter.commentModeAdapter.isActive).toBe(false);
  });

  it('ignores malformed messages and rejects invalid response payloads', async () => {
    jest.useFakeTimers();

    const addEventListener = jest.fn();
    const removeEventListener = jest.fn();
    const postMessage = jest.fn();
    const target = { dispatchEvent: jest.fn() };

    global.document = {
      activeElement: null,
      body: target,
      elementFromPoint: jest.fn().mockReturnValue(target),
    };
    global.window = {
      self: {},
      parent: { postMessage },
      addEventListener,
      removeEventListener,
    };

    const adapter = new IframeAdapter({ timeout: 1000 });

    expect(() => adapter.handleMessage({ data: null })).not.toThrow();
    expect(() => adapter.handleMessage({ data: 'invalid' })).not.toThrow();
    expect(() => adapter.handleMessage({ data: [] })).not.toThrow();
    expect(() => adapter.handleMessage({
      data: { type: POST_MESSAGE_TYPE.WINDOW_EVENT },
    })).not.toThrow();

    const requestPromise = adapter.request('get_server');
    const requestId = postMessage.mock.calls[0][0].requestId;

    adapter.handleMessage({
      data: {
        type: POST_MESSAGE_TYPE.HTML_PAGE_RESPONSE,
        requestId,
        data: '{invalid-json',
      },
    });

    await expect(requestPromise).rejects.toThrow('Invalid response payload');
    expect(adapter.pendingRequests).toEqual({});
  });

  it('posts requests and resolves responses in iframe mode', async () => {
    jest.useFakeTimers();

    const addEventListener = jest.fn();
    const postMessage = jest.fn();
    const target = { dispatchEvent: jest.fn() };

    global.document = {
      activeElement: null,
      body: target,
      elementFromPoint: jest.fn().mockReturnValue(target),
    };

    global.window = {
      self: {},
      parent: {
        postMessage,
      },
      addEventListener,
    };

    const adapter = new IframeAdapter({ targetOrigin: 'https://example.com', timeout: 1000 });
    const requestPromise = adapter.request('get_server', { foo: 'bar' });

    expect(addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    expect(postMessage).toHaveBeenCalledWith(
      {
        type: 'HTML_PAGE_REQUEST',
        requestId: expect.any(String),
        method: 'get_server',
        params: { foo: 'bar' },
      },
      'https://example.com',
    );

    const requestId = postMessage.mock.calls[0][0].requestId;
    adapter.handleMessage({
      data: {
        type: 'HTML_PAGE_RESPONSE',
        requestId,
        data: JSON.stringify({ server: 'https://example.com' }),
      },
    });

    await expect(requestPromise).resolves.toEqual({ server: 'https://example.com' });
  });
});
