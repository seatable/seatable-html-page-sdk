import axios from 'axios';
import HTMLPageAPI from '../src/apis/html-page-api';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
  },
}));

function createApi() {
  const get = jest.fn();
  const post = jest.fn();
  const put = jest.fn();
  const del = jest.fn();
  axios.create.mockReturnValue({
    get,
    post,
    put,
    delete: del,
  });

  const api = new HTMLPageAPI();
  api.init({
    server: 'https://example.com/',
    accessToken: 'token',
    appUuid: 'app-uuid',
  });

  return { api, get, post, put, del };
}

describe('HTMLPageAPI.listCollaborators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists collaborators', () => {
    const { api, get } = createApi();
    const response = {
      data: {
        collaborator_list: [{ email: 'user@example.com', name: 'User' }],
      },
    };
    get.mockReturnValue(response);

    const result = api.listCollaborators();

    expect(result).toEqual(response);
    expect(get).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/html-page-collaborators/',
    );
  });

});

describe('HTMLPageAPI.getCurrentUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets the current user', () => {
    const { api, get } = createApi();
    const response = {
      data: {
        username: 'user@example.com',
        name: 'User',
        user_id: 'EMP-001',
        avatar_url: 'https://example.com/avatar.png',
        role_id: 7,
      },
    };
    get.mockReturnValue(response);

    const result = api.getCurrentUser();

    expect(result).toEqual(response);
    expect(get).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/current-user/',
    );
  });
});

describe('HTMLPageAPI.resolveUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves users', () => {
    const { api, post } = createApi();
    const response = {
      data: {
        user_list: [{ email: 'user@example.com', name: 'User' }],
      },
    };
    post.mockReturnValue(response);

    const result = api.resolveUsers(['user@example.com']);

    expect(result).toEqual(response);
    expect(post).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/html-page-users/resolve/',
      {
        user_ids: ['user@example.com'],
      },
    );
  });
});

describe('HTMLPageAPI.upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.FormData = class {
      constructor() {
        this.fields = [];
      }

      append(key, value, filename) {
        this.fields.push([key, value, filename]);
      }
    };
  });

  it('gets an upload link and uploads a file', async () => {
    const get = jest.fn();
    axios.create.mockReturnValue({ get });

    const api = new HTMLPageAPI();
    api.init({
      server: 'https://example.com/',
      accessToken: 'token',
      appUuid: 'app-uuid',
    });

    api.getUploadLink = jest.fn().mockResolvedValue({
      data: {
        upload_link: 'https://upload.example.com/upload',
        parent_path: '/parent',
        file_relative_path: 'files',
        img_relative_path: 'images',
        asset_parent_url: 'https://assets.example.com',
      },
    });
    api.uploadAsset = jest.fn().mockResolvedValue({
      data: [{ name: 'file.txt', size: 12 }],
    });

    const file = { name: 'file.txt' };
    const result = await api.upload('page-1', file);

    expect(api.getUploadLink).toHaveBeenCalledWith('page-1', 'file');
    expect(api.uploadAsset).toHaveBeenCalledWith(
      'https://upload.example.com/upload',
      expect.any(FormData),
    );
    expect(result).toEqual({
      name: 'file.txt',
      size: 12,
      type: 'file',
      url: 'https://assets.example.com/files/file.txt',
    });
  });

  it('uses image relative path when uploading an image', async () => {
    const get = jest.fn();
    axios.create.mockReturnValue({ get });

    const api = new HTMLPageAPI();
    api.init({
      server: 'https://example.com/',
      accessToken: 'token',
      appUuid: 'app-uuid',
    });

    api.getUploadLink = jest.fn().mockResolvedValue({
      data: {
        upload_link: 'https://upload.example.com/upload',
        parent_path: '/parent',
        file_relative_path: 'files',
        img_relative_path: 'images',
        asset_parent_url: 'https://assets.example.com',
      },
    });
    api.uploadAsset = jest.fn().mockResolvedValue({
      data: [{ name: 'image.png', size: 34 }],
    });

    const file = { name: 'image.png' };
    const result = await api.upload('page-1', file, 'image');

    expect(api.getUploadLink).toHaveBeenCalledWith('page-1', 'image');
    expect(result).toEqual({
      name: 'image.png',
      size: 34,
      type: 'image',
      url: 'https://assets.example.com/images/image.png',
    });
  });
});

describe('HTMLPageAPI.initWithAccountToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects with the access-token request error', async () => {
    axios.get.mockRejectedValue(new Error('Request failed with status code 401'));
    const api = new HTMLPageAPI();

    await expect(api.initWithAccountToken({
      server: 'https://custom-app-server.example.com/',
      accountToken: 'invalid-account-token',
      appUuid: 'app-uuid',
    })).rejects.toThrow('Failed to get access token: Request failed with status code 401');
  });

  it('requires development access-token configuration', async () => {
    const api = new HTMLPageAPI();

    await expect(api.initWithAccountToken({
      server: 'https://custom-app-server.example.com/',
      accountToken: 'account-token',
      appUuid: '',
    })).rejects.toThrow('Failed to get access token: missing server, accountToken, or appUuid');
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('rejects when the access-token response does not contain an access token', async () => {
    axios.get.mockResolvedValue({ data: {} });
    const api = new HTMLPageAPI();

    const error = await api.initWithAccountToken({
      server: 'https://custom-app-server.example.com/',
      accountToken: 'account-token',
      appUuid: 'app-uuid',
    }).catch(error => error);

    expect(error.message).toBe('Failed to get access token: access_token missing');
  });
});

describe('HTMLPageAPI.getParentOrigin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the custom-app-server bootstrap endpoint with the app access token', async () => {
    axios.post.mockResolvedValue({ data: { parentOrigin: 'https://app.example.com' } });
    const api = new HTMLPageAPI();

    await expect(api.getParentOrigin({
      server: 'https://custom-app-server.example.com/',
      accessToken: 'access-token',
      appUuid: 'app-uuid',
    })).resolves.toBe('https://app.example.com');

    expect(axios.post).toHaveBeenCalledWith(
      'https://custom-app-server.example.com/api/v2.1/universal-apps/bootstrap/',
      { app_uuid: 'app-uuid' },
      { headers: { Authorization: 'Token access-token' } },
    );
  });

  it('adds parentOrigin context when the bootstrap request fails', async () => {
    axios.post.mockRejectedValue(new Error('Request failed with status code 401'));
    const api = new HTMLPageAPI();

    await expect(api.getParentOrigin({
      server: 'https://custom-app-server.example.com/',
      accessToken: 'invalid-access-token',
      appUuid: 'app-uuid',
    })).rejects.toThrow('Failed to get parentOrigin: Request failed with status code 401');
  });

  it('requires bootstrap configuration', async () => {
    const api = new HTMLPageAPI();

    await expect(api.getParentOrigin({
      server: 'https://custom-app-server.example.com/',
      accessToken: 'access-token',
      appUuid: '',
    })).rejects.toThrow('Failed to get parentOrigin: missing server, accessToken, or appUuid');
    expect(axios.post).not.toHaveBeenCalled();
  });
});
