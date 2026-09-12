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

describe('HTMLPageAPI link operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds a link and returns the updated row', () => {
    const { api, post } = createApi();
    const updatedRow = {
      _id: 'task-row-1',
      'Related projects': [
        { row_id: 'project-row-1', display_value: 'Project 1' },
      ],
    };
    const response = { data: { success: true, row: updatedRow } };
    post.mockReturnValue(response);

    const result = api.addLink(
      'page-1',
      'Tasks',
      'task-row-1',
      'Related projects',
      'project-row-1',
    );

    expect(result).toBe(response);
    expect(result.data.row).toEqual(updatedRow);
    expect(post).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/html-page-links/',
      {
        page_id: 'page-1',
        table_name: 'Tasks',
        row_id: 'task-row-1',
        link_column_name: 'Related projects',
        other_row_id: 'project-row-1',
      },
    );
  });

  it('deletes a link and returns the updated row', () => {
    const { api, del } = createApi();
    const updatedRow = { _id: 'task-row-1', 'Related projects': [] };
    const response = { data: { success: true, row: updatedRow } };
    del.mockReturnValue(response);

    const result = api.deleteLink(
      'page-1',
      'Tasks',
      'task-row-1',
      'Related projects',
      'project-row-1',
    );

    expect(result).toBe(response);
    expect(result.data.row).toEqual(updatedRow);
    expect(del).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/html-page-links/',
      {
        headers: { 'Content-Type': 'application/json' },
        data: {
          page_id: 'page-1',
          table_name: 'Tasks',
          row_id: 'task-row-1',
          link_column_name: 'Related projects',
          other_row_id: 'project-row-1',
        },
      },
    );
  });

  it('adds and deletes links in batch and returns the updated rows', () => {
    const { api, post, del } = createApi();
    const linksData = [
      {
        row_id: 'task-row-1',
        links: {
          'Related projects': ['project-row-1', 'project-row-2'],
        },
      },
    ];
    const addedRows = [{
      _id: 'task-row-1',
      'Related projects': [
        { row_id: 'project-row-1', display_value: 'Project 1' },
        { row_id: 'project-row-2', display_value: 'Project 2' },
      ],
    }];
    const deletedRows = [{ _id: 'task-row-1', 'Related projects': [] }];
    const addResponse = { data: { success: true, rows: addedRows } };
    const deleteResponse = { data: { success: true, rows: deletedRows } };
    post.mockReturnValue(addResponse);
    del.mockReturnValue(deleteResponse);

    const addResult = api.addLinks('page-1', 'Tasks', linksData);
    const deleteResult = api.deleteLinks('page-1', 'Tasks', linksData);

    expect(addResult).toBe(addResponse);
    expect(addResult.data.rows).toEqual(addedRows);
    expect(deleteResult).toBe(deleteResponse);
    expect(deleteResult.data.rows).toEqual(deletedRows);
    expect(post).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/html-page-links/batch/',
      {
        page_id: 'page-1',
        table_name: 'Tasks',
        links_data: linksData,
      },
    );
    expect(del).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/html-page-links/batch/',
      {
        headers: { 'Content-Type': 'application/json' },
        data: {
          page_id: 'page-1',
          table_name: 'Tasks',
          links_data: linksData,
        },
      },
    );
  });

  it('includes preview_table_config in link requests for ai_agent preview', () => {
    const { api, post, del } = createApi();
    const previewTableConfig = { table_id: 'table-1', permissions: {} };
    const linksData = [{ row_id: 'task-row-1', links: { related: ['project-row-1'] } }];

    api.addLink('ai_agent', 'Tasks', 'task-row-1', 'related', 'project-row-1', previewTableConfig);
    api.deleteLink('ai_agent', 'Tasks', 'task-row-1', 'related', 'project-row-1', previewTableConfig);
    api.addLinks('ai_agent', 'Tasks', linksData, previewTableConfig);
    api.deleteLinks('ai_agent', 'Tasks', linksData, previewTableConfig);

    expect(post).toHaveBeenNthCalledWith(1, expect.any(String), {
      page_id: 'ai_agent',
      table_name: 'Tasks',
      row_id: 'task-row-1',
      link_column_name: 'related',
      other_row_id: 'project-row-1',
      preview_table_config: previewTableConfig,
    });
    expect(del).toHaveBeenNthCalledWith(1, expect.any(String), {
      headers: { 'Content-Type': 'application/json' },
      data: {
        page_id: 'ai_agent',
        table_name: 'Tasks',
        row_id: 'task-row-1',
        link_column_name: 'related',
        other_row_id: 'project-row-1',
        preview_table_config: previewTableConfig,
      },
    });
    expect(post).toHaveBeenNthCalledWith(2, expect.any(String), {
      page_id: 'ai_agent',
      table_name: 'Tasks',
      links_data: linksData,
      preview_table_config: previewTableConfig,
    });
    expect(del).toHaveBeenNthCalledWith(2, expect.any(String), {
      headers: { 'Content-Type': 'application/json' },
      data: {
        page_id: 'ai_agent',
        table_name: 'Tasks',
        links_data: linksData,
        preview_table_config: previewTableConfig,
      },
    });
  });
});

