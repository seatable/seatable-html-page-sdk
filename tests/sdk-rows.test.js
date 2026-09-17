import { HTMLPageSDK } from '../src/sdk';

const mockListRows = jest.fn();
const mockQueryRows = jest.fn();
const mockAddRow = jest.fn();
const mockUpdateRow = jest.fn();
const mockDeleteRows = jest.fn();
const mockAddRows = jest.fn();
const mockUpdateRows = jest.fn();

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
    listRows: mockListRows,
    queryRows: mockQueryRows,
    addRow: mockAddRow,
    updateRow: mockUpdateRow,
    deleteRows: mockDeleteRows,
    addRows: mockAddRows,
    updateRows: mockUpdateRows,
  }));
});

describe('rows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('list rows', () => {
    const sdk = new HTMLPageSDK({ pageId: 'page-1' });
    sdk.htmlPageAPI = { listRows: mockListRows };

    const response = { data: { rows: [{ _id: 'row-1', '0000': 'John' }] } };
    mockListRows.mockReturnValue(response);

    const result = sdk.listRows({
      tableName: 'TableName',
      start: 0,
      limit: 100,
    });

    expect(result).toBe(response);
    expect(mockListRows).toHaveBeenCalledWith('page-1', 'TableName', 0, 100, undefined);
  });

  it('query rows by table and column names', () => {
    const sdk = new HTMLPageSDK({ pageId: 'page-1' });
    sdk.htmlPageAPI = { queryRows: mockQueryRows };

    const conditions = [{ columnName: 'Order Number', value: 'TEST2026070001' }];
    sdk.queryRows({ tableName: 'Order', conditions });

    expect(mockQueryRows).toHaveBeenCalledWith('page-1', 'Order', conditions, undefined, undefined, undefined);
  });

  it('query rows includes the configured table permissions for ai_agent preview', () => {
    const previewTableConfig = {
      table_id: 'REW7',
      table_name: 'Order',
      permissions: {
        query_rows_permission: {
          enabled: true,
          columns_keys: ['0000', 'wbyd'],
          query_columns: [{ column_key: '0000', enable_fuzzy_query: true, case_sensitive: false }],
        },
      },
    };
    const sdk = new HTMLPageSDK({ pageId: 'ai_agent', previewTableConfigs: [previewTableConfig] });
    sdk.htmlPageAPI = { queryRows: mockQueryRows };

    const conditions = [{ columnName: 'Order Number', value: '202607' }];
    sdk.queryRows({ tableName: 'Order', conditions });

    expect(mockQueryRows).toHaveBeenCalledWith(
      'ai_agent',
      'Order',
      conditions,
      undefined,
      undefined,
      {
        table_id: 'REW7',
        permissions: previewTableConfig.permissions,
      },
    );
  });

  it('row APIs include the matching table permissions for ai_agent preview', () => {
    const previewTableConfig = {
      table_id: 'REW7',
      table_name: 'Order',
      permissions: {
        view_rows_permission: { enabled: true, columns_keys: ['0000'] },
        add_rows_permission: { enabled: true, columns_keys: ['0000'] },
        edit_rows_permission: { enabled: true, columns_keys: ['0000'] },
        delete_rows_permission: { enabled: true },
      },
    };
    const expectedConfig = {
      table_id: 'REW7',
      permissions: previewTableConfig.permissions,
    };
    const sdk = new HTMLPageSDK({ pageId: 'ai_agent', previewTableConfigs: [previewTableConfig] });
    sdk.htmlPageAPI = {
      listRows: mockListRows,
      addRow: mockAddRow,
      updateRow: mockUpdateRow,
      deleteRows: mockDeleteRows,
      addRows: mockAddRows,
      updateRows: mockUpdateRows,
    };

    sdk.listRows({ tableName: 'Order' });
    sdk.addRow({ tableName: 'Order', rowData: { OrderNumber: '001' } });
    sdk.updateRow({ tableName: 'Order', rowId: 'row-1', rowData: { OrderNumber: '002' } });
    sdk.batchAddRows({ tableName: 'Order', rowsData: [{ OrderNumber: '003' }] });
    sdk.batchUpdateRows({ tableName: 'Order', rowsData: [{ row_id: 'row-1', row: { OrderNumber: '004' } }] });
    sdk.batchDeleteRows({ tableName: 'Order', rowsIds: ['row-1'] });

    expect(mockListRows).toHaveBeenCalledWith('ai_agent', 'Order', undefined, undefined, expectedConfig);
    expect(mockAddRow).toHaveBeenCalledWith('ai_agent', 'Order', { OrderNumber: '001' }, expectedConfig);
    expect(mockUpdateRow).toHaveBeenCalledWith('ai_agent', 'Order', 'row-1', { OrderNumber: '002' }, expectedConfig);
    expect(mockAddRows).toHaveBeenCalledWith('ai_agent', 'Order', [{ OrderNumber: '003' }], expectedConfig);
    expect(mockUpdateRows).toHaveBeenCalledWith(
      'ai_agent',
      'Order',
      [{ row_id: 'row-1', row: { OrderNumber: '004' } }],
      expectedConfig,
    );
    expect(mockDeleteRows).toHaveBeenCalledWith('ai_agent', 'Order', ['row-1'], expectedConfig);
  });

  it('add/batchAdd/update/batchUpdate/delete/batchDelete rows', () => {
    const sdk = new HTMLPageSDK({ pageId: 'page-1' });
    sdk.htmlPageAPI = {
      addRow: mockAddRow,
      updateRow: mockUpdateRow,
      deleteRows: mockDeleteRows,
      addRows: mockAddRows,
      updateRows: mockUpdateRows,
    };

    const addRowResponse = { data: { success: true, row: { _id: 'row-1', '0000': 'John' } } };
    const updateRowResponse = { data: { success: true, row: { _id: 'row-1', '0000': 'Jane' } } };
    const deleteRowsResponse = { data: { success: true } };
    const addRowsResponse = {
      data: { success: true },
      rows: [{ _id: 'row-1', '0000': 'John' }],
      inserted_row_count: 1,
    };
    const updateRowsResponse = {
      data: {
        success: true,
        rows: [{ _id: 'row-1', '0000': 'Jane' }],
      },
    };

    mockAddRow.mockReturnValue(addRowResponse);
    mockUpdateRow.mockReturnValue(updateRowResponse);
    mockDeleteRows.mockReturnValue(deleteRowsResponse);
    mockAddRows.mockReturnValue(addRowsResponse);
    mockUpdateRows.mockReturnValue(updateRowsResponse);

    expect(sdk.addRow({ tableName: 'TableName', rowData: { Name: 'John' } })).toEqual(addRowResponse);
    expect(sdk.updateRow({ tableName: 'TableName', rowId: 'row-1', rowData: { Name: 'Jane' } })).toEqual(updateRowResponse);
    expect(sdk.deleteRow({ tableName: 'TableName', rowId: 'row-1' })).toEqual(deleteRowsResponse);
    expect(sdk.batchAddRows({ tableName: 'TableName', rowsData: [{ Name: 'John' }] })).toEqual(addRowsResponse);
    expect(sdk.batchUpdateRows({
      tableName: 'TableName',
      rowsData: [{ row_id: 'row-1', row: { Name: 'Jane' } }],
    })).toEqual(updateRowsResponse);
    expect(sdk.batchDeleteRows({ tableName: 'TableName', rowsIds: ['row-1'] })).toEqual(deleteRowsResponse);

    expect(mockAddRow).toHaveBeenCalledWith('page-1', 'TableName', { Name: 'John' }, undefined);
    expect(mockUpdateRow).toHaveBeenCalledWith('page-1', 'TableName', 'row-1', { Name: 'Jane' }, undefined);
    expect(mockDeleteRows).toHaveBeenCalledWith('page-1', 'TableName', ['row-1'], undefined);
    expect(mockAddRows).toHaveBeenCalledWith('page-1', 'TableName', [{ Name: 'John' }], undefined);
    expect(mockUpdateRows).toHaveBeenCalledWith(
      'page-1',
      'TableName',
      [{ row_id: 'row-1', row: { Name: 'Jane' } }],
      undefined,
    );
    expect(mockDeleteRows).toHaveBeenCalledTimes(2);
  });

  it('updateRow and batchUpdateRows support link-column replacements', () => {
    const sdk = new HTMLPageSDK({ pageId: 'page-1' });
    sdk.htmlPageAPI = {
      updateRow: mockUpdateRow,
      updateRows: mockUpdateRows,
    };
    const rowData = {
      Name: 'Updated task',
      'Related projects': ['project-row-1', 'project-row-2'],
    };
    const rowsData = [
      {
        row_id: 'task-row-1',
        row: rowData,
      },
      {
        row_id: 'task-row-2',
        row: { 'Related projects': [] },
      },
    ];
    const updatedRow = {
      _id: 'task-row-1',
      Name: 'Updated task',
      'Related projects': [
        { row_id: 'project-row-1', display_value: 'Project 1' },
        { row_id: 'project-row-2', display_value: 'Project 2' },
      ],
    };
    const updatedRows = [
      updatedRow,
      { _id: 'task-row-2', 'Related projects': [] },
    ];
    const updateResponse = { data: { success: true, row: updatedRow } };
    const batchUpdateResponse = { data: { success: true, rows: updatedRows } };
    mockUpdateRow.mockReturnValue(updateResponse);
    mockUpdateRows.mockReturnValue(batchUpdateResponse);

    const result = sdk.updateRow({ tableName: 'Tasks', rowId: 'task-row-1', rowData });
    const batchResult = sdk.batchUpdateRows({ tableName: 'Tasks', rowsData });

    expect(result.data.row).toEqual(updatedRow);
    expect(batchResult.data.rows).toEqual(updatedRows);
    expect(mockUpdateRow).toHaveBeenCalledWith(
      'page-1',
      'Tasks',
      'task-row-1',
      rowData,
      undefined,
    );
    expect(mockUpdateRows).toHaveBeenCalledWith('page-1', 'Tasks', rowsData, undefined);
  });
});

