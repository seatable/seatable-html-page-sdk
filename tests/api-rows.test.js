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
      data: {
        success: true,
        rows: [{ _id: 'row-1', '0000': 'Jane' }],
      },
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

  it('updateRow sends link-column row ids and returns expanded link values', () => {
    const { api, put } = createApi();
    const rowData = {
      Name: 'Updated task',
      'Related projects': ['project-row-1', 'project-row-2'],
    };
    const updatedRow = {
      _id: 'task-row-1',
      Name: 'Updated task',
      'Related projects': [
        { row_id: 'project-row-1', display_value: 'Project 1' },
        { row_id: 'project-row-2', display_value: 'Project 2' },
      ],
    };
    const response = { data: { success: true, row: updatedRow } };
    put.mockReturnValue(response);

    const result = api.updateRow('page-1', 'Tasks', 'task-row-1', rowData);

    expect(result.data.row).toEqual(updatedRow);
    expect(put).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/html-page-rows/',
      {
        page_id: 'page-1',
        table_name: 'Tasks',
        row_id: 'task-row-1',
        row_data: rowData,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );
  });

  it('updateRows sends link-column row ids and returns expanded link values', () => {
    const { api, put } = createApi();
    const rowsData = [
      {
        row_id: 'task-row-1',
        row: {
          Name: 'Updated task 1',
          'Related projects': ['project-row-1', 'project-row-2'],
        },
      },
      {
        row_id: 'task-row-2',
        row: {
          'Related projects': [],
        },
      },
    ];
    const updatedRows = [
      {
        _id: 'task-row-1',
        Name: 'Updated task 1',
        'Related projects': [
          { row_id: 'project-row-1', display_value: 'Project 1' },
          { row_id: 'project-row-2', display_value: 'Project 2' },
        ],
      },
      {
        _id: 'task-row-2',
        'Related projects': [],
      },
    ];
    const response = { data: { success: true, rows: updatedRows } };
    put.mockReturnValue(response);

    const result = api.updateRows('page-1', 'Tasks', rowsData);

    expect(result.data.rows).toEqual(updatedRows);
    expect(put).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/html-page-rows/batch/',
      {
        page_id: 'page-1',
        table_name: 'Tasks',
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

