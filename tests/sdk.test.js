import { HTMLPageSDK } from '../src/sdk';

const mockListRows = jest.fn();
const mockListCollaborators = jest.fn();
const mockResolveUsers = jest.fn();
const mockAddRow = jest.fn();
const mockUpdateRow = jest.fn();
const mockDeleteRows = jest.fn();
const mockAddRows = jest.fn();
const mockUpdateRows = jest.fn();
const mockUpload = jest.fn();

jest.mock('../src/iframe-adapter', () => ({
  IframeAdapter: jest.fn().mockImplementation(() => ({
    request: jest.fn(),
  })),
  POST_MESSAGE_REQUEST_TYPE: {
    GET_SERVER: 'get_server',
    GET_ACCESS_TOKEN: 'get_access_token',
    GET_APP_UUID: 'get_app_uuid',
    GET_PAGE_ID: 'get_page_id',
  },
}));

jest.mock('../src/apis/html-page-api', () => {
  return jest.fn().mockImplementation(() => ({
    listRows: mockListRows,
    listCollaborators: mockListCollaborators,
    resolveUsers: mockResolveUsers,
    addRow: mockAddRow,
    updateRow: mockUpdateRow,
    deleteRows: mockDeleteRows,
    addRows: mockAddRows,
    updateRows: mockUpdateRows,
    upload: mockUpload,
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
    expect(mockListRows).toHaveBeenCalledWith('page-1', 'TableName', 0, 100);
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

  it('resolve users', () => {
    const sdk = new HTMLPageSDK({ pageId: 'page-1' });
    sdk.htmlPageAPI = { resolveUsers: mockResolveUsers };

    const response = { data: { user_list: [{ email: 'user@example.com', name: 'User' }] } };
    mockResolveUsers.mockReturnValue(response);

    const result = sdk.resolveUsers({ userIds: ['user@example.com'] });

    expect(result).toBe(response);
    expect(mockResolveUsers).toHaveBeenCalledWith(['user@example.com']);
  });

  it('add/batchAdd/update/batchUpdate/delete/batchDelete rows', () => {
    const sdk = new HTMLPageSDK({ pageId: 'page-1' });
    sdk.htmlPageAPI = {
      addRow: mockAddRow,
      updateRow: mockUpdateRow,
      deleteRows: mockDeleteRows,
      addRows: mockAddRows,
      updateRows: mockUpdateRows,
      upload: mockUpload,
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
      data: { success: true },
      rows: [{ row_id: 'row-1', '0000': 'Jane' }],
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
    expect(sdk.batchUpdateRows({ tableName: 'TableName', rowsData: [{ row_id: 'row-1', Name: 'Jane' }] })).toEqual(updateRowsResponse);
    expect(sdk.batchDeleteRows({ tableName: 'TableName', rowsIds: ['row-1'] })).toEqual(deleteRowsResponse);

    expect(mockAddRow).toHaveBeenCalledWith('page-1', 'TableName', { Name: 'John' });
    expect(mockUpdateRow).toHaveBeenCalledWith('page-1', 'TableName', 'row-1', { Name: 'Jane' });
    expect(mockDeleteRows).toHaveBeenCalledWith('page-1', 'TableName', ['row-1']);
    expect(mockAddRows).toHaveBeenCalledWith('page-1', 'TableName', [{ Name: 'John' }]);
    expect(mockUpdateRows).toHaveBeenCalledWith('page-1', 'TableName', [{ row_id: 'row-1', Name: 'Jane' }]);
    expect(mockDeleteRows).toHaveBeenCalledTimes(2);
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
