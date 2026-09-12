import { HTMLPageSDK } from '../src/sdk';

const mockSendNotification = jest.fn();
const mockSendEmail = jest.fn();
const mockGetMessageStatus = jest.fn();
const mockRunScript = jest.fn();
const mockGetScriptResult = jest.fn();

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
    sendNotification: mockSendNotification,
    sendEmail: mockSendEmail,
    getMessageStatus: mockGetMessageStatus,
    runScript: mockRunScript,
    getScriptResult: mockGetScriptResult,
  }));
});

describe('action operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates notification and email requests with public parameter names', () => {
    const sdk = new HTMLPageSDK({ pageId: 'page-1' });
    sdk.htmlPageAPI = {
      sendNotification: mockSendNotification,
      sendEmail: mockSendEmail,
    };
    const notificationResponse = { data: { task_id: 'notification-task-1' } };
    const emailResponse = { data: { task_id: 'email-task-1' } };
    mockSendNotification.mockReturnValue(notificationResponse);
    mockSendEmail.mockReturnValue(emailResponse);

    const notificationResult = sdk.sendNotification({
      tableName: 'Products',
      rowId: 'row-1',
      emails: ['recipient@example.com'],
      msg: 'hello {Name}',
    });
    const emailResult = sdk.sendEmail({
      tableName: 'Products',
      rowId: 'row-1',
      accountName: 'Operations SMTP',
      sendTo: ['recipient@example.com'],
      copyTo: ['audit@example.com'],
      replyTo: ['service@example.com'],
      subject: 'Order {Order number}',
      htmlMessage: '<p>Hello</p>',
      attachmentColumnNames: ['Attachment'],
      attachmentColumnKeys: ['attachment-key'],
    });

    expect(notificationResult).toBe(notificationResponse);
    expect(emailResult).toBe(emailResponse);
    expect(mockSendNotification).toHaveBeenCalledWith(
      'page-1',
      {
        table_name: 'Products',
        row_id: 'row-1',
        emails: ['recipient@example.com'],
        msg: 'hello {Name}',
      },
      undefined,
    );
    expect(mockSendEmail).toHaveBeenCalledWith(
      'page-1',
      {
        table_name: 'Products',
        row_id: 'row-1',
        account_name: 'Operations SMTP',
        send_to: ['recipient@example.com'],
        copy_to: ['audit@example.com'],
        reply_to: ['service@example.com'],
        subject: 'Order {Order number}',
        message: undefined,
        html_message: '<p>Hello</p>',
        attachment_column_names: ['Attachment'],
      },
      undefined,
    );
    expect(mockSendEmail.mock.calls[0][1]).not.toHaveProperty('attachment_column_keys');
  });

  it('passes matching preview permissions for ai_agent table action requests', () => {
    const previewTableConfig = {
      table_id: 'table-1',
      table_name: 'Products',
      permissions: {
        view_rows_permission: { enabled: true, columns_keys: ['name'] },
      },
    };
    const expectedConfig = {
      table_id: 'table-1',
      permissions: previewTableConfig.permissions,
    };
    const sdk = new HTMLPageSDK({ pageId: 'ai_agent', previewTableConfigs: [previewTableConfig] });
    sdk.htmlPageAPI = {
      sendNotification: mockSendNotification,
      sendEmail: mockSendEmail,
      runScript: mockRunScript,
    };

    sdk.sendNotification({
      tableName: 'Products', rowId: 'row-1', emails: ['recipient@example.com'], msg: 'hello',
    });
    sdk.sendEmail({
      tableName: 'Products', rowId: 'row-1', accountName: 'SMTP', sendTo: ['recipient@example.com'], subject: 'Hello', message: 'Hello',
    });
    sdk.runScript({ scriptName: 'Generate report', tableName: 'Products', rowId: 'row-1' });

    expect(mockSendNotification).toHaveBeenCalledWith(
      'ai_agent', expect.any(Object), expectedConfig,
    );
    expect(mockSendEmail).toHaveBeenCalledWith(
      'ai_agent', expect.any(Object), expectedConfig,
    );
    expect(mockRunScript).toHaveBeenCalledWith(
      'Generate report', 'ai_agent', 'Products', 'row-1', expectedConfig,
    );
  });

  it('delegates message-status and script requests with task IDs and the current page ID', () => {
    const sdk = new HTMLPageSDK({ pageId: 'page-1' });
    sdk.htmlPageAPI = {
      getMessageStatus: mockGetMessageStatus,
      runScript: mockRunScript,
      getScriptResult: mockGetScriptResult,
    };
    const statusResponse = { data: { status: 'SUCCESS' } };
    const runResponse = { data: { task_id: 42 } };
    const resultResponse = { data: { state: 'finished' } };
    mockGetMessageStatus.mockReturnValue(statusResponse);
    mockRunScript.mockReturnValue(runResponse);
    mockGetScriptResult.mockReturnValue(resultResponse);

    expect(sdk.getMessageStatus({ taskId: 'message-task-1' })).toBe(statusResponse);
    expect(sdk.runScript({ scriptName: 'Generate report' })).toBe(runResponse);
    expect(sdk.getScriptResult({ scriptName: 'Generate report', taskId: 42 })).toBe(resultResponse);

    expect(mockGetMessageStatus).toHaveBeenCalledWith('message-task-1');
    expect(mockRunScript).toHaveBeenCalledWith('Generate report', 'page-1', undefined, undefined, undefined);
    expect(mockGetScriptResult).toHaveBeenCalledWith('Generate report', 42, 'page-1');
  });
});

