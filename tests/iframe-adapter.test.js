import { IframeAdapter } from '../src/iframe-adapter';

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

  it('uses a wildcard only for server and access-token bootstrap requests', async () => {
    jest.useFakeTimers();

    const addEventListener = jest.fn();
    const postMessage = jest.fn();
    const parent = { postMessage };
    const target = { dispatchEvent: jest.fn() };

    global.document = {
      activeElement: null,
      body: target,
      elementFromPoint: jest.fn().mockReturnValue(target),
    };
    global.window = {
      self: {},
      parent,
      addEventListener,
    };

    const adapter = new IframeAdapter({
      timeout: 1000,
      targetOrigin: 'https://unverified-parent.example.com',
    });
    expect(adapter.targetOrigin).toBeNull();

    const serverPromise = adapter.bootstrapRequest('get_server');
    const serverRequestId = postMessage.mock.calls[0][0].requestId;
    expect(postMessage).toHaveBeenNthCalledWith(1, {
      type: 'HTML_PAGE_REQUEST',
      requestId: expect.any(String),
      method: 'get_server',
      params: undefined,
    }, '*');

    adapter.handleMessage({
      source: parent,
      origin: 'https://unverified-parent.example.com',
      data: {
        type: 'HTML_PAGE_RESPONSE',
        requestId: serverRequestId,
        data: JSON.stringify('https://custom-app-server.example.com'),
      },
    });
    await expect(serverPromise).resolves.toBe('https://custom-app-server.example.com');

    const accessTokenPromise = adapter.bootstrapRequest('get_access_token');
    const accessTokenRequestId = postMessage.mock.calls[1][0].requestId;
    expect(postMessage).toHaveBeenNthCalledWith(2, {
      type: 'HTML_PAGE_REQUEST',
      requestId: expect.any(String),
      method: 'get_access_token',
      params: undefined,
    }, '*');

    adapter.handleMessage({
      source: parent,
      origin: 'https://unverified-parent.example.com',
      data: {
        type: 'HTML_PAGE_RESPONSE',
        requestId: accessTokenRequestId,
        data: JSON.stringify('access-token'),
      },
    });
    await expect(accessTokenPromise).resolves.toBe('access-token');

    const appUuidPromise = adapter.bootstrapRequest('get_app_uuid');
    const appUuidRequestId = postMessage.mock.calls[2][0].requestId;
    expect(postMessage).toHaveBeenNthCalledWith(3, {
      type: 'HTML_PAGE_REQUEST',
      requestId: expect.any(String),
      method: 'get_app_uuid',
      params: undefined,
    }, '*');

    adapter.handleMessage({
      source: parent,
      origin: 'https://unverified-parent.example.com',
      data: {
        type: 'HTML_PAGE_RESPONSE',
        requestId: appUuidRequestId,
        data: JSON.stringify('app-uuid'),
      },
    });
    await expect(appUuidPromise).resolves.toBe('app-uuid');

    adapter.setTargetOrigin('https://app.example.com/path-that-is-not-part-of-an-origin');
    expect(adapter.targetOrigin).toBe('https://app.example.com');

    const requestPromise = adapter.request('get_page_id');
    const requestId = postMessage.mock.calls[3][0].requestId;
    expect(postMessage).toHaveBeenNthCalledWith(4, {
      type: 'HTML_PAGE_REQUEST',
      requestId: expect.any(String),
      method: 'get_page_id',
      params: undefined,
    }, 'https://app.example.com');

    adapter.handleMessage({
      source: parent,
      origin: 'https://unverified-parent.example.com',
      data: {
        type: 'HTML_PAGE_RESPONSE',
        requestId,
        data: JSON.stringify('page-1'),
      },
    });
    expect(adapter.pendingRequests[requestId]).toBeDefined();

    adapter.handleMessage({
      source: {},
      origin: 'https://app.example.com',
      data: {
        type: 'HTML_PAGE_RESPONSE',
        requestId,
        data: JSON.stringify('page-1'),
      },
    });
    expect(adapter.pendingRequests[requestId]).toBeDefined();

    adapter.handleMessage({
      source: parent,
      origin: 'https://app.example.com',
      data: {
        type: 'HTML_PAGE_RESPONSE',
        requestId,
        data: JSON.stringify('page-1'),
      },
    });
    await expect(requestPromise).resolves.toBe('page-1');
  });


  it('rejects non-bootstrap request types before the trusted origin is configured', async () => {
    const postMessage = jest.fn();
    global.window = {
      self: {},
      parent: { postMessage },
      addEventListener: jest.fn(),
    };

    const adapter = new IframeAdapter({ timeout: 1 });

    await expect(adapter.bootstrapRequest('get_page_id')).rejects.toThrow(
      'Unsupported bootstrap request: get_page_id'
    );
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('does not send events or accept non-bootstrap messages before a target origin is configured', async () => {
    const addEventListener = jest.fn();
    const postMessage = jest.fn();
    const parent = { postMessage };
    const target = { dispatchEvent: jest.fn() };

    global.document = {
      activeElement: null,
      body: target,
      elementFromPoint: jest.fn().mockReturnValue(target),
    };
    global.window = {
      self: {},
      parent,
      addEventListener,
    };

    const adapter = new IframeAdapter();
    const handler = jest.fn();
    adapter.on('event', handler);
    adapter.postWindowEvent({ type: 'click' });
    adapter.handleMessage({
      source: parent,
      origin: 'https://unverified-parent.example.com',
      data: {
        type: 'HTML_PAGE_EVENT',
        eventType: 'event',
        payload: { value: 1 },
      },
    });

    expect(postMessage).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
    await expect(adapter.request('get_server')).rejects.toThrow('Trusted target origin has not been configured');
  });

  it('rejects and clears pending requests when destroyed', async () => {
    jest.useFakeTimers();

    global.window = {
      self: {},
      parent: { postMessage: jest.fn() },
      addEventListener: jest.fn(),
    };

    const adapter = new IframeAdapter({ timeout: 1000 });
    adapter.setTargetOrigin('https://app.example.com');
    const requestPromise = adapter.request('get_page_id');

    adapter.destroy();

    await expect(requestPromise).rejects.toThrow('Adapter destroyed');
    expect(adapter.pendingRequests).toEqual({});
    expect(adapter.eventHandlers).toEqual({});
  });

  it('rejects invalid target origins', () => {
    global.window = {
      self: {},
      parent: { postMessage: jest.fn() },
      addEventListener: jest.fn(),
    };

    const adapter = new IframeAdapter();
    expect(() => adapter.setTargetOrigin('*')).toThrow('Invalid trusted target origin');
    expect(() => adapter.setTargetOrigin('javascript:alert(1)')).toThrow('Invalid trusted target origin');
  });
});
