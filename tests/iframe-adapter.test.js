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
