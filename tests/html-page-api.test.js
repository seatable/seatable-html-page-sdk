import axios from 'axios';
import HTMLPageAPI from '../src/apis/html-page-api';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    get: jest.fn(),
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
    server: 'https://example.com',
    accessToken: 'token',
    appUuid: 'app-uuid',
  });

  return { api, get, post, put, del };
}

describe('HTMLPageAPI.listRows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listRows with start and limit', () => {
    const get = jest.fn();
    axios.create.mockReturnValue({ get });

    const api = new HTMLPageAPI();
    api.init({
      server: 'https://example.com',
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
});

describe('HTMLPageAPI.listCollaborators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists collaborators with the current page id and table name', () => {
    const { api, get } = createApi();
    const response = {
      data: {
        collaborator_list: [{ email: 'user@example.com', name: 'User' }],
      },
    };
    get.mockReturnValue(response);

    const result = api.listCollaborators('page-1', 'TableName');

    expect(result).toEqual(response);
    expect(get).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/html-page-collaborators/',
      {
        params: {
          page_id: 'page-1',
          table_name: 'TableName',
        },
      },
    );
  });

});

describe('HTMLPageAPI.resolveUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves users with the current page id and table name', () => {
    const { api, post } = createApi();
    const response = {
      data: {
        user_list: [{ email: 'user@example.com', name: 'User' }],
      },
    };
    post.mockReturnValue(response);

    const result = api.resolveUsers('page-1', 'TableName', ['user@example.com']);

    expect(result).toEqual(response);
    expect(post).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/html-page-users/resolve/',
      {
        page_id: 'page-1',
        table_name: 'TableName',
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
      server: 'https://example.com',
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
      server: 'https://example.com',
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
