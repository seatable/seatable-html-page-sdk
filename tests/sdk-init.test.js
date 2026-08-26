import { HTMLPageSDK } from '../src/sdk';

const mockRequest = jest.fn();
const mockBootstrapRequest = jest.fn();
const mockSetTargetOrigin = jest.fn();
const mockGetParentOrigin = jest.fn();
const mockInitWithAccountToken = jest.fn(function initWithAccountToken() {
  this.accessToken = 'access-token';
  this.req = {};
  return Promise.resolve();
});
const mockInit = jest.fn();

jest.mock('../src/apis/html-page-api', () => {
  return jest.fn().mockImplementation(() => ({
    getParentOrigin: mockGetParentOrigin,
    initWithAccountToken: mockInitWithAccountToken,
    init: mockInit,
  }));
});

jest.mock('../src/iframe-adapter', () => ({
  IframeAdapter: jest.fn().mockImplementation(() => ({
    bootstrapRequest: mockBootstrapRequest,
    request: mockRequest,
    setTargetOrigin: mockSetTargetOrigin,
  })),
  POST_MESSAGE_REQUEST_TYPE: {
    GET_SERVER: 'get_server',
    GET_ACCESS_TOKEN: 'get_access_token',
    GET_APP_UUID: 'get_app_uuid',
    GET_PAGE_ID: 'get_page_id',
    GET_PREVIEW_TABLE_CONFIGS: 'get_preview_table_configs',
  },
}));

describe('HTMLPageSDK.init', () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockBootstrapRequest.mockReset();
    mockSetTargetOrigin.mockReset();
    mockGetParentOrigin.mockReset();
    mockInit.mockReset();
    mockInitWithAccountToken.mockReset().mockImplementation(function initWithAccountToken() {
      this.accessToken = 'access-token';
      this.req = {};
      return Promise.resolve();
    });
  });

  it('production: gets and normalizes server before the other initialization data', async () => {
    mockBootstrapRequest
      .mockResolvedValueOnce('https://custom-app-server.example.com')
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('app-uuid');
    mockGetParentOrigin.mockResolvedValue('https://app.example.com');
    mockRequest.mockResolvedValueOnce('page-1');

    const sdk = new HTMLPageSDK();
    await sdk.init();

    expect(mockBootstrapRequest).toHaveBeenNthCalledWith(1, 'get_server');
    expect(mockBootstrapRequest).toHaveBeenNthCalledWith(2, 'get_access_token');
    expect(mockBootstrapRequest).toHaveBeenNthCalledWith(3, 'get_app_uuid');
    expect(mockGetParentOrigin).toHaveBeenCalledWith({
      server: 'https://custom-app-server.example.com/',
      accessToken: 'access-token',
      appUuid: 'app-uuid',
    });
    expect(mockSetTargetOrigin).toHaveBeenCalledWith('https://app.example.com');
    expect(mockRequest).toHaveBeenNthCalledWith(1, 'get_page_id');
    expect(mockSetTargetOrigin.mock.invocationCallOrder[0]).toBeLessThan(mockRequest.mock.invocationCallOrder[0]);
    expect(mockInit).toHaveBeenCalledWith({
      server: 'https://custom-app-server.example.com/',
      accessToken: 'access-token',
      appUuid: 'app-uuid',
    });
    expect(sdk.options).toMatchObject({
      server: 'https://custom-app-server.example.com/',
      appUuid: 'app-uuid',
      pageId: 'page-1',
    });
    expect(sdk.options.accessToken).toBeUndefined();
  });

  it('production: gets initialization data from iframeAdapter instead of SDK options', async () => {
    mockBootstrapRequest
      .mockResolvedValueOnce('https://iframe-server.example.com')
      .mockResolvedValueOnce('bootstrapped-access-token')
      .mockResolvedValueOnce('iframe-app-uuid');
    mockGetParentOrigin.mockResolvedValue('https://app.example.com');
    mockRequest.mockResolvedValueOnce('iframe-page-id');

    const sdk = new HTMLPageSDK({
      server: 'https://options-server.example.com',
      appUuid: 'options-app-uuid',
      pageId: 'options-page-id',
      accessToken: 'options-access-token',
    });
    await sdk.init();

    expect(mockBootstrapRequest).toHaveBeenNthCalledWith(1, 'get_server');
    expect(mockBootstrapRequest).toHaveBeenNthCalledWith(2, 'get_access_token');
    expect(mockBootstrapRequest).toHaveBeenNthCalledWith(3, 'get_app_uuid');
    expect(mockGetParentOrigin).toHaveBeenCalledWith({
      server: 'https://iframe-server.example.com/',
      accessToken: 'bootstrapped-access-token',
      appUuid: 'iframe-app-uuid',
    });
    expect(mockInit).toHaveBeenCalledWith({
      server: 'https://iframe-server.example.com/',
      accessToken: 'bootstrapped-access-token',
      appUuid: 'iframe-app-uuid',
    });
    expect(sdk.options).toMatchObject({
      server: 'https://iframe-server.example.com/',
      appUuid: 'iframe-app-uuid',
      pageId: 'iframe-page-id',
    });
    expect(sdk.options.accessToken).toBeUndefined();
  });

  it('production: stops initialization when GET_SERVER returns no server', async () => {
    mockBootstrapRequest.mockResolvedValueOnce('');

    const sdk = new HTMLPageSDK();

    await expect(sdk.init()).rejects.toThrow('Missing server configuration');
    expect(mockBootstrapRequest).toHaveBeenCalledTimes(1);
    expect(mockBootstrapRequest).toHaveBeenCalledWith('get_server');
    expect(mockGetParentOrigin).not.toHaveBeenCalled();
    expect(mockSetTargetOrigin).not.toHaveBeenCalled();
    expect(mockRequest).not.toHaveBeenCalled();
    expect(mockInit).not.toHaveBeenCalled();
  });

  it('production: does not request trusted app data when parent-origin bootstrap fails', async () => {
    mockBootstrapRequest
      .mockResolvedValueOnce('https://custom-app-server.example.com')
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('app-uuid');
    mockGetParentOrigin.mockRejectedValue(new Error('Permission denied.'));

    const sdk = new HTMLPageSDK();

    await expect(sdk.init()).rejects.toThrow('Permission denied.');
    expect(mockSetTargetOrigin).not.toHaveBeenCalled();
    expect(mockRequest).not.toHaveBeenCalled();
    expect(mockInit).not.toHaveBeenCalled();
  });

  it('development: initializes from options and APIs without iframe requests', async () => {
    mockGetParentOrigin.mockResolvedValue('https://app.example.com');
    const sdk = new HTMLPageSDK({
      server: 'https://example.com',
      appUuid: 'app-uuid',
      pageId: 'page-1',
      accountToken: 'account-token',
    });
    await sdk.init();

    expect(mockBootstrapRequest).not.toHaveBeenCalled();
    expect(mockRequest).not.toHaveBeenCalled();
    expect(mockInitWithAccountToken).toHaveBeenCalledWith({
      server: 'https://example.com/',
      accountToken: 'account-token',
      appUuid: 'app-uuid',
    });
    expect(mockGetParentOrigin).not.toHaveBeenCalled();
    expect(mockSetTargetOrigin).not.toHaveBeenCalled();
    expect(mockInit).toHaveBeenCalledWith({
      server: 'https://example.com/',
      accessToken: 'access-token',
      appUuid: 'app-uuid',
    });
    expect(sdk.options.server).toBe('https://example.com/');
    expect(sdk.htmlPageAPI.accessToken).toBe('access-token');
  });

  it('development: uses development initialization when accountToken option exists but is empty', async () => {
    const sdk = new HTMLPageSDK({
      server: 'https://example.com',
      appUuid: 'app-uuid',
      accountToken: '',
    });
    await sdk.init();

    expect(mockBootstrapRequest).not.toHaveBeenCalled();
    expect(mockRequest).not.toHaveBeenCalled();
    expect(mockInitWithAccountToken).toHaveBeenCalledWith({
      server: 'https://example.com/',
      accountToken: '',
      appUuid: 'app-uuid',
    });
  });

  it('production: loads ai_agent preview configs after configuring the trusted origin', async () => {
    const previewTableConfigs = [{ table_id: 'REW7', permissions: {} }];
    mockBootstrapRequest
      .mockResolvedValueOnce('https://example.com')
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('app-uuid');
    mockGetParentOrigin.mockResolvedValue('https://app.example.com');
    mockRequest
      .mockResolvedValueOnce('ai_agent')
      .mockResolvedValueOnce(previewTableConfigs);

    const sdk = new HTMLPageSDK();
    await sdk.init();

    expect(mockBootstrapRequest).toHaveBeenNthCalledWith(1, 'get_server');
    expect(mockBootstrapRequest).toHaveBeenNthCalledWith(2, 'get_access_token');
    expect(mockBootstrapRequest).toHaveBeenNthCalledWith(3, 'get_app_uuid');
    expect(mockSetTargetOrigin).toHaveBeenCalledWith('https://app.example.com');
    expect(mockRequest).toHaveBeenNthCalledWith(2, 'get_preview_table_configs');
    expect(sdk.options.previewTableConfigs).toEqual(previewTableConfigs);
  });
});
