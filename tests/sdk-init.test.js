import { HTMLPageSDK } from '../src/sdk';

const mockRequest = jest.fn();
const mockInitWithAccountToken = jest.fn(function initWithAccountToken() {
  this.accessToken = 'access-token';
  this.req = {};
  return Promise.resolve();
});
const mockInit = jest.fn();

jest.mock('../src/apis/html-page-api', () => {
  return jest.fn().mockImplementation(() => ({
    initWithAccountToken: mockInitWithAccountToken,
    init: mockInit,
  }));
});

jest.mock('../src/iframe-adapter', () => ({
  IframeAdapter: jest.fn().mockImplementation(() => ({
    request: mockRequest,
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
    jest.clearAllMocks();
  });

  it('production: initializes with access token', async () => {
    mockRequest
      .mockResolvedValueOnce('https://example.com')
      .mockResolvedValueOnce('app-uuid')
      .mockResolvedValueOnce('page-1')
      .mockResolvedValueOnce('access-token');

    const sdk = new HTMLPageSDK();
    await sdk.init();

    expect(mockRequest).toHaveBeenNthCalledWith(1, 'get_server');
    expect(mockRequest).toHaveBeenNthCalledWith(2, 'get_app_uuid');
    expect(mockRequest).toHaveBeenNthCalledWith(3, 'get_page_id');
    expect(mockRequest).toHaveBeenNthCalledWith(4, 'get_access_token');
    expect(mockInit).toHaveBeenCalledWith({
      server: 'https://example.com',
      accessToken: 'access-token',
      appUuid: 'app-uuid',
    });
    expect(sdk.options.server).toBe('https://example.com');
    expect(sdk.options.appUuid).toBe('app-uuid');
    expect(sdk.options.pageId).toBe('page-1');
    expect(sdk.options.accessToken).toBe('access-token');
  });

  it('development: exchanges accountToken for accessToken', async () => {
    const sdk = new HTMLPageSDK({
      server: 'https://example.com',
      appUuid: 'app-uuid',
      pageId: 'page-1',
      accountToken: 'account-token',
    });
    await sdk.init();

    expect(mockRequest).not.toHaveBeenCalled();
    expect(mockInitWithAccountToken).toHaveBeenCalledWith({
      server: 'https://example.com',
      accountToken: 'account-token',
      appUuid: 'app-uuid',
    });
    expect(sdk.htmlPageAPI.accessToken).toBe('access-token');
    expect(sdk.options.server).toBe('https://example.com');
    expect(sdk.options.appUuid).toBe('app-uuid');
    expect(sdk.options.pageId).toBe('page-1');
    expect(sdk.options.accountToken).toBe('account-token');
  });

  it('loads table permission configs for ai_agent preview', async () => {
    const previewTableConfigs = [{ table_id: 'REW7', permissions: {} }];
    mockRequest
      .mockResolvedValueOnce('https://example.com')
      .mockResolvedValueOnce('app-uuid')
      .mockResolvedValueOnce('ai_agent')
      .mockResolvedValueOnce(previewTableConfigs)
      .mockResolvedValueOnce('access-token');

    const sdk = new HTMLPageSDK();
    await sdk.init();

    expect(mockRequest).toHaveBeenNthCalledWith(4, 'get_preview_table_configs');
    expect(mockRequest).toHaveBeenNthCalledWith(5, 'get_access_token');
    expect(sdk.options.previewTableConfigs).toEqual(previewTableConfigs);
  });
});
