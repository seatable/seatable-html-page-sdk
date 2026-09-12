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
  axios.create.mockReturnValue({ get, post });

  const api = new HTMLPageAPI();
  api.init({
    server: 'https://example.com/',
    accessToken: 'token',
    appUuid: 'app-uuid',
  });

  return { api, get, post };
}

describe('HTMLPageAPI action operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends notification and email requests with public action parameters', () => {
    const { api, post } = createApi();
    const notificationResponse = { data: { task_id: 'notification-task-1' } };
    const emailResponse = { data: { task_id: 'email-task-1' } };
    post.mockReturnValueOnce(notificationResponse).mockReturnValueOnce(emailResponse);

    const notificationResult = api.sendNotification('page-1', {
      table_name: 'Products',
      row_id: 'row-1',
      emails: ['recipient@example.com'],
      msg: 'hello {Name}',
    });
    const emailResult = api.sendEmail('page-1', {
      table_name: 'Products',
      row_id: 'row-1',
      account_name: 'Operations SMTP',
      send_to: ['recipient@example.com'],
      copy_to: ['audit@example.com'],
      reply_to: ['service@example.com'],
      subject: 'Order {Order number}',
      html_message: '<p>Hello</p>',
      attachment_column_names: ['Attachment'],
    });

    expect(notificationResult).toBe(notificationResponse);
    expect(emailResult).toBe(emailResponse);
    expect(post).toHaveBeenNthCalledWith(
      1,
      'https://example.com/api/v2.1/universal-apps/app-uuid/notification/',
      {
        page_id: 'page-1',
        table_name: 'Products',
        row_id: 'row-1',
        emails: ['recipient@example.com'],
        msg: 'hello {Name}',
      },
    );
    expect(post).toHaveBeenNthCalledWith(
      2,
      'https://example.com/api/v2.1/universal-apps/app-uuid/email/',
      {
        page_id: 'page-1',
        table_name: 'Products',
        row_id: 'row-1',
        account_name: 'Operations SMTP',
        send_to: ['recipient@example.com'],
        copy_to: ['audit@example.com'],
        reply_to: ['service@example.com'],
        subject: 'Order {Order number}',
        html_message: '<p>Hello</p>',
        attachment_column_names: ['Attachment'],
      },
    );
  });

  it('sends preview_table_config with table-scoped action requests', () => {
    const { api, post } = createApi();
    const previewTableConfig = { table_id: 'table-1', permissions: {} };

    api.sendNotification('ai_agent', {
      table_name: 'Products',
      row_id: 'row-1',
      emails: ['recipient@example.com'],
      msg: 'hello',
    }, previewTableConfig);
    api.sendEmail('ai_agent', {
      table_name: 'Products',
      row_id: 'row-1',
      account_name: 'Operations SMTP',
      send_to: ['recipient@example.com'],
      subject: 'Hello',
      message: 'Hello',
    }, previewTableConfig);
    api.runScript('Generate report', 'ai_agent', 'Products', 'row-1', previewTableConfig);

    expect(post).toHaveBeenNthCalledWith(1, expect.any(String), expect.objectContaining({
      page_id: 'ai_agent',
      preview_table_config: previewTableConfig,
    }));
    expect(post).toHaveBeenNthCalledWith(2, expect.any(String), expect.objectContaining({
      page_id: 'ai_agent',
      preview_table_config: previewTableConfig,
    }));
    expect(post).toHaveBeenNthCalledWith(3, expect.any(String), expect.objectContaining({
      page_id: 'ai_agent',
      preview_table_config: previewTableConfig,
    }));
  });

  it('gets message status by task ID', () => {
    const { api, get } = createApi();
    const response = { data: { status: 'SUCCESS' } };
    get.mockReturnValue(response);

    const result = api.getMessageStatus('message-task-1');

    expect(result).toBe(response);
    expect(get).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/dtable-message-status/',
      { params: { task_id: 'message-task-1' } },
    );
  });

  it('runs and gets a script by its display name', () => {
    const { api, get, post } = createApi();
    const runResponse = { data: { task_id: 42 } };
    const resultResponse = {
      data: {
        script: {
          state: 'finished',
          success: false,
          output: 'Script execution failed',
          return_code: 125,
        },
      },
    };
    post.mockReturnValue(runResponse);
    get.mockReturnValue(resultResponse);

    const runResult = api.runScript('Generate / report', 'page-1');
    const result = api.getScriptResult('Generate / report', 42, 'page-1');

    expect(runResult).toBe(runResponse);
    expect(result).toBe(resultResponse);
    expect(result.data.script).toEqual({
      state: 'finished',
      success: false,
      output: 'Script execution failed',
      return_code: 125,
    });
    expect(post).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/run-script/Generate%20%2F%20report/',
      { page_id: 'page-1', table_name: undefined, row_id: undefined },
    );
    expect(get).toHaveBeenCalledWith(
      'https://example.com/api/v2.1/universal-apps/app-uuid/run-script/Generate%20%2F%20report/result/42/',
      { params: { page_id: 'page-1' } },
    );
  });
});

