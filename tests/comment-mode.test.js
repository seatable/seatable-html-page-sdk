import { CommentModeAdapter } from '../src/comment-mode';
import { POST_MESSAGE_TYPE } from '../src/constants';

const createElement = ({
  tagName = 'DIV',
  classNames = [],
  textContent = '',
  outerHTML,
  parentElement = null,
  previousElementSibling = null,
  rect = { left: 0, top: 0, width: 0, height: 0 },
} = {}) => ({
  tagName,
  classList: classNames,
  textContent,
  outerHTML: outerHTML || `<${tagName.toLowerCase()}>${textContent}</${tagName.toLowerCase()}>`,
  parentElement,
  previousElementSibling,
  getBoundingClientRect: jest.fn(() => rect),
});

describe('CommentModeAdapter', () => {
  const originalWindow = global.window;
  const originalDocument = global.document;
  const originalRequestAnimationFrame = global.requestAnimationFrame;
  const originalCancelAnimationFrame = global.cancelAnimationFrame;

  let addEventListener;
  let removeEventListener;
  let postMessage;
  let requestAnimationFrame;
  let cancelAnimationFrame;
  let frameCallbacks;
  let nextFrameId;
  let body;
  let documentElement;
  let styleElement;

  const flushAnimationFrames = () => {
    const pendingFrames = Array.from(frameCallbacks.entries());
    frameCallbacks.clear();
    pendingFrames.forEach(([, callback]) => callback());
  };

  beforeEach(() => {
    addEventListener = jest.fn();
    removeEventListener = jest.fn();
    postMessage = jest.fn();
    frameCallbacks = new Map();
    nextFrameId = 1;
    requestAnimationFrame = jest.fn((callback) => {
      const frameId = nextFrameId;
      nextFrameId += 1;
      frameCallbacks.set(frameId, callback);
      return frameId;
    });
    cancelAnimationFrame = jest.fn((frameId) => {
      frameCallbacks.delete(frameId);
    });

    body = createElement({ tagName: 'BODY' });
    body.contains = jest.fn(() => true);
    documentElement = createElement({ tagName: 'HTML' });
    styleElement = null;

    global.window = {
      addEventListener,
      removeEventListener,
      parent: { postMessage },
      getComputedStyle: jest.fn(() => ({
        backgroundColor: 'rgb(1, 2, 3)',
        color: 'rgb(4, 5, 6)',
        fontSize: '16px',
        fontWeight: '400',
        fontFamily: 'Arial',
        lineHeight: '24px',
        borderRadius: '4px',
        paddingBottom: '1px',
        paddingLeft: '2px',
        paddingRight: '3px',
        paddingTop: '4px',
        marginBottom: '5px',
        marginLeft: '6px',
        marginRight: '7px',
        marginTop: '8px',
        textAlign: 'left',
        display: 'block',
        width: '100px',
        height: '50px',
      })),
    };
    global.document = {
      body,
      documentElement,
      head: {
        appendChild: jest.fn((element) => {
          styleElement = element;
        }),
      },
      createElement: jest.fn(() => ({ id: '', innerHTML: '', remove: jest.fn(() => { styleElement = null; }) })),
      getElementById: jest.fn((id) => (id === 'ai-comment-cursor-style' ? styleElement : null)),
    };
    global.requestAnimationFrame = requestAnimationFrame;
    global.cancelAnimationFrame = cancelAnimationFrame;
  });

  afterEach(() => {
    global.window = originalWindow;
    global.document = originalDocument;
    global.requestAnimationFrame = originalRequestAnimationFrame;
    global.cancelAnimationFrame = originalCancelAnimationFrame;
    jest.restoreAllMocks();
  });

  it('registers capture listeners once and removes them when disabled', () => {
    const adapter = new CommentModeAdapter();

    adapter.enable();
    adapter.enable();

    expect(addEventListener).toHaveBeenCalledTimes(adapter.mouseEvents.length + 1);
    adapter.mouseEvents.forEach((eventType) => {
      expect(addEventListener).toHaveBeenCalledWith(eventType, adapter._handleEvent, true);
    });
    expect(addEventListener).toHaveBeenCalledWith('scroll', adapter._handleScroll, true);
    expect(document.head.appendChild).toHaveBeenCalledTimes(1);

    adapter._handleScroll();
    adapter._handleEvent({
      type: 'mouseover',
      target: createElement({ parentElement: body }),
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      stopImmediatePropagation: jest.fn(),
    });

    adapter.disable();
    adapter.disable();

    expect(removeEventListener).toHaveBeenCalledTimes(adapter.mouseEvents.length + 1);
    adapter.mouseEvents.forEach((eventType) => {
      expect(removeEventListener).toHaveBeenCalledWith(eventType, adapter._handleEvent, true);
    });
    expect(removeEventListener).toHaveBeenCalledWith('scroll', adapter._handleScroll, true);
    expect(cancelAnimationFrame).toHaveBeenCalledTimes(2);
    expect(adapter.hoverTarget).toBeNull();
    expect(adapter.selectedTarget).toBeNull();
    expect(styleElement).toBeNull();
  });

  it('posts selected and latest hovered element payloads', () => {
    const adapter = new CommentModeAdapter();
    const target = createElement({
      tagName: 'BUTTON',
      classNames: ['primary', 'large'],
      textContent: ' Save changes ',
      outerHTML: '<button class="primary large"> Save changes </button>',
      parentElement: body,
      rect: { left: 12, top: 34, width: 56, height: 78 },
    });
    const clickEvent = {
      type: 'click',
      target,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      stopImmediatePropagation: jest.fn(),
    };
    const hoverEvent = {
      ...clickEvent,
      type: 'mouseover',
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      stopImmediatePropagation: jest.fn(),
    };

    adapter.enable();
    adapter._handleEvent(clickEvent);
    adapter._handleEvent(hoverEvent);
    flushAnimationFrames();

    const expectedData = {
      selector: 'body > button:nth-of-type(1)',
      currentText: 'Save changes',
      htmlHint: '<button class="primary large"> Save changes </button>',
      computedStyle: {
        backgroundColor: 'rgb(1, 2, 3)',
        color: 'rgb(4, 5, 6)',
        fontSize: '16px',
        fontWeight: '400',
        fontFamily: 'Arial',
        lineHeight: '24px',
        borderRadius: '4px',
        paddingBottom: '1px',
        paddingLeft: '2px',
        paddingRight: '3px',
        paddingTop: '4px',
        marginBottom: '5px',
        marginLeft: '6px',
        marginRight: '7px',
        marginTop: '8px',
        textAlign: 'left',
        display: 'block',
        width: '100px',
        height: '50px',
      },
      label: 'button.primary.large',
      elementPosition: { left: 12, top: 34, width: 56, height: 78 },
    };

    expect(clickEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(clickEvent.stopPropagation).toHaveBeenCalledTimes(1);
    expect(clickEvent.stopImmediatePropagation).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenNthCalledWith(1, {
      type: POST_MESSAGE_TYPE.HTML_PAGE_COMMENT_MODE_ELEMENT_SELECTED,
      data: expectedData,
    }, '*');
    expect(postMessage).toHaveBeenNthCalledWith(2, {
      type: POST_MESSAGE_TYPE.HTML_PAGE_COMMENT_MODE_ELEMENT_HOVER,
      data: expectedData,
    }, '*');
  });

  it('clears hover and notifies the parent once when the pointer leaves the iframe', () => {
    const adapter = new CommentModeAdapter();
    const target = createElement({ tagName: 'BUTTON', parentElement: body });

    adapter.enable();
    adapter._handleEvent({
      type: 'mouseover',
      target,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      stopImmediatePropagation: jest.fn(),
    });

    expect(adapter.hoverTarget).toBe(target);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);

    adapter._handleEvent({
      type: 'mouseout',
      target,
      relatedTarget: null,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      stopImmediatePropagation: jest.fn(),
    });
    adapter._handleEvent({
      type: 'mouseleave',
      target,
      relatedTarget: null,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      stopImmediatePropagation: jest.fn(),
    });
    flushAnimationFrames();

    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
    expect(adapter.hoverTarget).toBeNull();
    expect(adapter._hoverRAF).toBeNull();
    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith({
      type: POST_MESSAGE_TYPE.HTML_PAGE_COMMENT_MODE_ELEMENT_HOVER,
      data: null,
    }, '*');
  });

  it('throttles scroll updates and posts the latest selected position', () => {
    const adapter = new CommentModeAdapter();
    const rect = { left: 10, top: 20, width: 30, height: 40 };
    const target = createElement({ tagName: 'SECTION', parentElement: body, rect });

    adapter.enable();
    adapter.selectedTarget = target;
    adapter._handleScroll();

    rect.left = 100;
    rect.top = 200;
    adapter._handleScroll();
    adapter._handleScroll();

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    flushAnimationFrames();

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith({
      type: POST_MESSAGE_TYPE.HTML_PAGE_COMMENT_MODE_ELEMENT_POSITION_UPDATE,
      data: expect.objectContaining({
        elementPosition: { left: 100, top: 200, width: 30, height: 40 },
      }),
      targetType: 'selected',
    }, '*');
  });
});
