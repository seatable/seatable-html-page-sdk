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

describe('HTMLPageAPI.queryRows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queryRows posts table name and conditions to the query endpoint', () => {
    const { api, post } = createApi();

    const response = { data: { metadata: [], results: [] } };
    post.mockReturnValue(response);

    const conditions = [{ columnName: 'Phone', value: '13800138000' }];
    const result = api.queryRows('page-1', 'Orders', conditions, 0, 100);

    expect(result).toEqual(response);
    expect(post).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/html-page-rows/query/',
      {
        page_id: 'page-1',
        table_name: 'Orders',
        conditions,
        start: 0,
        limit: 100,
      },
    );
  });

  it('queryRows sends preview_table_config for ai_agent preview', () => {
    const { api, post } = createApi();
    const previewTableConfig = {
      table_id: 'tbl-1',
      permissions: {
        query_rows_permission: {
          enabled: true,
          columns_keys: ['phone'],
          query_columns: [{ column_key: 'phone', enable_fuzzy_query: true }],
        },
      },
    };

    api.queryRows('ai_agent', 'Orders', [{ columnName: 'Phone', value: '138' }], 0, 20, previewTableConfig);

    expect(post).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/html-page-rows/query/',
      {
        page_id: 'ai_agent',
        table_name: 'Orders',
        conditions: [{ columnName: 'Phone', value: '138' }],
        start: 0,
        limit: 20,
        preview_table_config: previewTableConfig,
      },
    );
  });
});

describe('HTMLPageAPI.listRows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listRows with start and limit', () => {
    const get = jest.fn();
    axios.create.mockReturnValue({ get });

    const api = new HTMLPageAPI();
    api.init({
      server: 'https://example.com/',
      accessToken: 'token',
      appUuid: 'app-uuid',
    });

    const response = { data: { rows: [{ _id: 'row-1', '0000': 'John' }] } };
    get.mockReturnValue(response);

    const result = api.listRows('page-1', 'TableName', 0, 100);

    expect(result).toEqual(response);
    expect(get).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/html-page-rows/',
      {
        params: {
          page_id: 'page-1',
          table_name: 'TableName',
          start: 0,
          limit: 100,
        },
      },
    );
  });

  it('listRows without start and limit', () => {
    const get = jest.fn();
    axios.create.mockReturnValue({ get });

    const api = new HTMLPageAPI();
    api.init({
      server: 'https://example.com/',
      accessToken: 'token',
      appUuid: 'app-uuid',
    });

    const response = { data: { rows: [{ _id: 'row-1', '0000': 'John' }] } };
    get.mockReturnValue(response);

    const result = api.listRows('page-1', 'TableName');

    expect(result).toEqual(response);
    expect(get).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/html-page-rows/',
      {
        params: {
          page_id: 'page-1',
          table_name: 'TableName',
          start: undefined,
          limit: undefined,
        },
      },
    );
  });

  it('listRows serializes preview_table_config', () => {
    const { api, get } = createApi();
    const previewTableConfig = { table_id: 'tbl-1', permissions: {} };

    api.listRows('ai_agent', 'TableName', 0, 100, previewTableConfig);

    expect(get).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/html-page-rows/',
      {
        params: {
          page_id: 'ai_agent',
          table_name: 'TableName',
          start: 0,
          limit: 100,
          preview_table_config: JSON.stringify(previewTableConfig),
        },
      },
    );
  });
});

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

describe('HTMLPageAPI.addRow(s)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('addRow', () => {
    const { api, post } = createApi();
    const rowData = { Name: 'John' };
    const newRow = { '0000': 'John', _id: 'row-1' };
    const response = { data: { success: true, row: newRow } };
    post.mockReturnValue(response);

    const result = api.addRow('page-1', 'TableName', rowData);
    expect(result).toEqual(response);
    expect(post).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/html-page-rows/',
      {
        page_id: 'page-1',
        table_name: 'TableName',
        row_data: rowData,
      },
    );
  });

  it('addRows', () => {
    const { api, post } = createApi();
    const rowsData = [{ Name: 'John' }, { Name: 'Jane' }];
    const newRows = [{ '0000': 'John', _id: 'row-1' }, { '0000': 'Jane', _id: 'row-2' }];
    const response = { data: { success: true }, rows: newRows, inserted_row_count: 2 };
    post.mockReturnValue(response);

    const result = api.addRows('page-1', 'TableName', rowsData);

    expect(result).toEqual(response);
    expect(post).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/html-page-rows/batch/',
      {
        page_id: 'page-1',
        table_name: 'TableName',
        rows_data: rowsData,
      },
    );
  });
});

describe('HTMLPageAPI.updateRow(s)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updateRow', () => {
    const { api, put } = createApi();
    const rowId = 'row-1';
    const rowData = { Name: 'Jane' };
    const newRow = { '0000': 'Jane', _id: 'row-1' };
    const response = { data: { success: true, row: newRow } };
    put.mockReturnValue(response);
    const result = api.updateRow('page-1', 'TableName', rowId, rowData);

    expect(result).toEqual(response);
    expect(put).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/html-page-rows/',
      {
        page_id: 'page-1',
        table_name: 'TableName',
        row_id: rowId,
        row_data: rowData,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );
  });

  it('updateRows', () => {
    const { api, put } = createApi();
    const rowsData = [{ row_id: 'row-1', Name: 'Jane' }];
    const response = {
      data: { success: true },
      rows: [{ row_id: 'row-1', '0000': 'Jane' }],
    };
    put.mockReturnValue(response);

    const result = api.updateRows('page-1', 'TableName', rowsData);

    expect(result).toEqual(response);

    expect(put).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/html-page-rows/batch/',
      {
        page_id: 'page-1',
        table_name: 'TableName',
        rows_data: rowsData,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );
  });
});

describe('HTMLPageAPI.deleteRows(s)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends deleteRows requests with row ids', () => {
    const { api, del } = createApi();
    del.mockReturnValue({ data: { success: true } });

    api.deleteRows('page-1', 'TableName', ['row-1']);

    expect(del).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/html-page-rows/',
      {
        headers: { 'Content-Type': 'application/json' },
        data: {
          page_id: 'page-1',
          table_name: 'TableName',
          rows_ids: ['row-1'],
        },
      },
    );
  });

  it('write APIs send preview_table_config', () => {
    const { api, post, put, del } = createApi();
    const previewTableConfig = { table_id: 'tbl-1', permissions: {} };

    api.addRow('ai_agent', 'TableName', { Name: 'A' }, previewTableConfig);
    api.addRows('ai_agent', 'TableName', [{ Name: 'B' }], previewTableConfig);
    api.updateRow('ai_agent', 'TableName', 'row-1', { Name: 'C' }, previewTableConfig);
    api.updateRows('ai_agent', 'TableName', [{ row_id: 'row-1', row: { Name: 'D' } }], previewTableConfig);
    api.deleteRows('ai_agent', 'TableName', ['row-1'], previewTableConfig);

    expect(post).toHaveBeenNthCalledWith(1, expect.any(String), {
      page_id: 'ai_agent',
      table_name: 'TableName',
      row_data: { Name: 'A' },
      preview_table_config: previewTableConfig,
    });
    expect(post).toHaveBeenNthCalledWith(2, expect.any(String), {
      page_id: 'ai_agent',
      table_name: 'TableName',
      rows_data: [{ Name: 'B' }],
      preview_table_config: previewTableConfig,
    });
    expect(put).toHaveBeenNthCalledWith(1, expect.any(String), {
      page_id: 'ai_agent',
      table_name: 'TableName',
      row_id: 'row-1',
      row_data: { Name: 'C' },
      preview_table_config: previewTableConfig,
    }, expect.any(Object));
    expect(put).toHaveBeenNthCalledWith(2, expect.any(String), {
      page_id: 'ai_agent',
      table_name: 'TableName',
      rows_data: [{ row_id: 'row-1', row: { Name: 'D' } }],
      preview_table_config: previewTableConfig,
    }, expect.any(Object));
    expect(del).toHaveBeenCalledWith(expect.any(String), {
      headers: { 'Content-Type': 'application/json' },
      data: {
        page_id: 'ai_agent',
        table_name: 'TableName',
        rows_ids: ['row-1'],
        preview_table_config: previewTableConfig,
      },
    });
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
