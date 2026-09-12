import { HTMLPageSDK } from '../src/sdk';

const mockUpload = jest.fn();
const mockListCollaborators = jest.fn();
const mockGetCurrentUser = jest.fn();
const mockResolveUsers = jest.fn();

jest.mock('../src/iframe-adapter', () => ({
  IframeAdapter: jest.fn().mockImplementation(() => ({
    request: jest.fn(),
  })),
  POST_MESSAGE_REQUEST_TYPE: {
    GET_SERVER: 'get_server',
    GET_ACCESS_TOKEN: 'get_access_token',
    GET_APP_UUID: 'get_app_uuid',
    GET_PAGE_ID: 'get_page_id',
    GET_PREVIEW_TABLE_CONFIGS: 'get_preview_table_configs',
  },
}));

jest.mock('../src/apis/html-page-api', () => {
  return jest.fn().mockImplementation(() => ({
    upload: mockUpload,
    listCollaborators: mockListCollaborators,
    getCurrentUser: mockGetCurrentUser,
    resolveUsers: mockResolveUsers,
  }));
});

describe('collaborators and users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('list collaborators', () => {
    const sdk = new HTMLPageSDK({ pageId: 'page-1' });
    sdk.htmlPageAPI = { listCollaborators: mockListCollaborators };

    const response = { data: { collaborator_list: [{ email: 'user@example.com', name: 'User' }] } };
    mockListCollaborators.mockReturnValue(response);

    const result = sdk.listCollaborators();

    expect(result).toBe(response);
    expect(mockListCollaborators).toHaveBeenCalledWith();
  });

  it('gets the current user', () => {
    const sdk = new HTMLPageSDK({ pageId: 'page-1' });
    sdk.htmlPageAPI = { getCurrentUser: mockGetCurrentUser };

    const response = {
      data: {
        username: 'user@example.com',
        name: 'User',
        user_id: 'EMP-001',
        avatar_url: 'https://example.com/avatar.png',
        role_id: 7,
      },
    };
    mockGetCurrentUser.mockReturnValue(response);

    const result = sdk.getCurrentUser();

    expect(result).toBe(response);
    expect(mockGetCurrentUser).toHaveBeenCalledWith();
  });

  it('resolve users', () => {
    const sdk = new HTMLPageSDK({ pageId: 'page-1' });
    sdk.htmlPageAPI = { resolveUsers: mockResolveUsers };

    const response = { data: { user_list: [{ email: 'user@example.com', name: 'User' }] } };
    mockResolveUsers.mockReturnValue(response);

    const result = sdk.resolveUsers({ userIds: ['user@example.com'] });

    expect(result).toBe(response);
    expect(mockResolveUsers).toHaveBeenCalledWith(['user@example.com']);
  });

});

describe('upload', () => {
  it('delegates upload calls to HTMLPageAPI with the current pageId', () => {
    const sdk = new HTMLPageSDK({ pageId: 'page-1' });
    sdk.htmlPageAPI = { upload: mockUpload };

    mockUpload.mockReturnValue('uploaded');

    expect(sdk.uploadFile({ file: { name: 'file.txt' } })).toBe('uploaded');
    expect(sdk.uploadImage({ file: { name: 'image.png' } })).toBe('uploaded');

    expect(mockUpload).toHaveBeenCalledWith('page-1', { name: 'file.txt' });
    expect(mockUpload).toHaveBeenCalledWith('page-1', { name: 'image.png' }, 'image');
  });
});
