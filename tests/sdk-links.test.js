import { HTMLPageSDK } from '../src/sdk';

const mockAddLink = jest.fn();
const mockDeleteLink = jest.fn();
const mockAddLinks = jest.fn();
const mockDeleteLinks = jest.fn();

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
    addLink: mockAddLink,
    deleteLink: mockDeleteLink,
    addLinks: mockAddLinks,
    deleteLinks: mockDeleteLinks,
  }));
});

describe('links', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates single and batch link operations', () => {
    const sdk = new HTMLPageSDK({ pageId: 'page-1' });
    sdk.htmlPageAPI = {
      addLink: mockAddLink,
      deleteLink: mockDeleteLink,
      addLinks: mockAddLinks,
      deleteLinks: mockDeleteLinks,
    };
    const linksData = [
      {
        row_id: 'task-row-1',
        links: { 'Related projects': ['project-row-1', 'project-row-2'] },
      },
    ];
    const addedRow = {
      _id: 'task-row-1',
      'Related projects': [{ row_id: 'project-row-1', display_value: 'Project 1' }],
    };
    const deletedRow = { _id: 'task-row-1', 'Related projects': [] };
    const addedRows = [{
      _id: 'task-row-1',
      'Related projects': [
        { row_id: 'project-row-1', display_value: 'Project 1' },
        { row_id: 'project-row-2', display_value: 'Project 2' },
      ],
    }];
    const deletedRows = [{ _id: 'task-row-1', 'Related projects': [] }];
    const addResponse = { data: { success: true, row: addedRow } };
    const deleteResponse = { data: { success: true, row: deletedRow } };
    const batchAddResponse = { data: { success: true, rows: addedRows } };
    const batchDeleteResponse = { data: { success: true, rows: deletedRows } };
    mockAddLink.mockReturnValue(addResponse);
    mockDeleteLink.mockReturnValue(deleteResponse);
    mockAddLinks.mockReturnValue(batchAddResponse);
    mockDeleteLinks.mockReturnValue(batchDeleteResponse);

    const addResult = sdk.addLink({
      tableName: 'Tasks',
      rowId: 'task-row-1',
      linkColumnName: 'Related projects',
      otherRowId: 'project-row-1',
    });
    const deleteResult = sdk.deleteLink({
      tableName: 'Tasks',
      rowId: 'task-row-1',
      linkColumnName: 'Related projects',
      otherRowId: 'project-row-1',
    });
    const batchAddResult = sdk.batchAddLinks({ tableName: 'Tasks', linksData });
    const batchDeleteResult = sdk.batchDeleteLinks({ tableName: 'Tasks', linksData });

    expect(addResult).toBe(addResponse);
    expect(addResult.data.row).toEqual(addedRow);
    expect(deleteResult).toBe(deleteResponse);
    expect(deleteResult.data.row).toEqual(deletedRow);
    expect(batchAddResult).toBe(batchAddResponse);
    expect(batchAddResult.data.rows).toEqual(addedRows);
    expect(batchDeleteResult).toBe(batchDeleteResponse);
    expect(batchDeleteResult.data.rows).toEqual(deletedRows);
    expect(mockAddLink).toHaveBeenCalledWith(
      'page-1',
      'Tasks',
      'task-row-1',
      'Related projects',
      'project-row-1',
      undefined,
    );
    expect(mockDeleteLink).toHaveBeenCalledWith(
      'page-1',
      'Tasks',
      'task-row-1',
      'Related projects',
      'project-row-1',
      undefined,
    );
    expect(mockAddLinks).toHaveBeenCalledWith('page-1', 'Tasks', linksData, undefined);
    expect(mockDeleteLinks).toHaveBeenCalledWith('page-1', 'Tasks', linksData, undefined);
  });

  it('includes the matching table permissions for ai_agent preview', () => {
    const previewTableConfig = {
      table_id: 'table-1',
      table_name: 'Tasks',
      permissions: {
        edit_rows_permission: { enabled: true, columns_keys: ['related'] },
      },
    };
    const expectedConfig = {
      table_id: 'table-1',
      permissions: previewTableConfig.permissions,
    };
    const sdk = new HTMLPageSDK({ pageId: 'ai_agent', previewTableConfigs: [previewTableConfig] });
    sdk.htmlPageAPI = {
      addLink: mockAddLink,
      deleteLink: mockDeleteLink,
      addLinks: mockAddLinks,
      deleteLinks: mockDeleteLinks,
    };
    const linksData = [{ row_id: 'task-row-1', links: { related: ['project-row-1'] } }];

    sdk.addLink({
      tableName: 'Tasks',
      rowId: 'task-row-1',
      linkColumnName: 'related',
      otherRowId: 'project-row-1',
    });
    sdk.deleteLink({
      tableName: 'Tasks',
      rowId: 'task-row-1',
      linkColumnName: 'related',
      otherRowId: 'project-row-1',
    });
    sdk.batchAddLinks({ tableName: 'Tasks', linksData });
    sdk.batchDeleteLinks({ tableName: 'Tasks', linksData });

    expect(mockAddLink).toHaveBeenCalledWith(
      'ai_agent', 'Tasks', 'task-row-1', 'related', 'project-row-1', expectedConfig,
    );
    expect(mockDeleteLink).toHaveBeenCalledWith(
      'ai_agent', 'Tasks', 'task-row-1', 'related', 'project-row-1', expectedConfig,
    );
    expect(mockAddLinks).toHaveBeenCalledWith('ai_agent', 'Tasks', linksData, expectedConfig);
    expect(mockDeleteLinks).toHaveBeenCalledWith('ai_agent', 'Tasks', linksData, expectedConfig);
  });
});

