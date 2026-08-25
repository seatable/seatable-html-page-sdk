import { POST_MESSAGE_TYPE } from './constants';

const countSameTagSiblingsBefore = (element) => {
  let count = 0;
  let sibling = element.previousElementSibling;
  while (sibling) {
    if (sibling.tagName === element.tagName) count += 1;
    sibling = sibling.previousElementSibling;
  }
  return count;
};

const generateSelector = (element) => {
  if (!element || element === document.body) return null;

  const parts = [];
  let current = element;

  while (current && current !== document.body) {
    const tag = current.tagName.toLowerCase();
    const index = countSameTagSiblingsBefore(current) + 1;
    parts.unshift(`${tag}:nth-of-type(${index})`);
    current = current.parentElement;
  }

  return 'body > ' + parts.join(' > ');
};

const getHtmlHint = (element, maxLen = 180) => {
  const html = element.outerHTML || '';
  return html.length > maxLen ? html.slice(0, maxLen) : html;
};

const getCurrentText = (element, maxLen = 160) => {
  const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
  return text.length > maxLen ? text.slice(0, maxLen) : text;
};

const computeStyle = (element) => {
  const style = window.getComputedStyle(element);
  return {
    backgroundColor: style.backgroundColor,
    color: style.color,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontFamily: style.fontFamily,
    lineHeight: style.lineHeight,
    borderRadius: style.borderRadius,
    paddingBottom: style.paddingBottom,
    paddingLeft: style.paddingLeft,
    paddingRight: style.paddingRight,
    paddingTop: style.paddingTop,
    marginBottom: style.marginBottom,
    marginLeft: style.marginLeft,
    marginRight: style.marginRight,
    marginTop: style.marginTop,
    textAlign: style.textAlign,
    display: style.display,
    width: style.width,
    height: style.height,
  };
};

const generateLabel = (element) => {
  const tag = element.tagName.toLowerCase();
  const classes = element.classList.length > 0
    ? '.' + Array.from(element.classList).join('.')
    : '';
  return `${tag}${classes}`;
};

export class CommentModeAdapter {
  constructor() {
    this.isActive = false;
    this._handleEvent = this._handleEvent.bind(this);
    this._handleScroll = this._handleScroll.bind(this);
    this.mouseEvents = ['click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave', 'contextmenu'];
    this.hoverTarget = null;
    this.selectedTarget = null;
    this._scrollRAF = null;
    this._hoverRAF = null;
  }

  enable() {
    if (this.isActive) return;
    this.isActive = true;
    this.mouseEvents.forEach(eventType => {
      window.addEventListener(eventType, this._handleEvent, true);
    });
    window.addEventListener('scroll', this._handleScroll, true);
    this.addCommentModeStyle();
  }

  disable() {
    if (!this.isActive) return;
    this.isActive = false;
    this.mouseEvents.forEach(eventType => {
      window.removeEventListener(eventType, this._handleEvent, true);
    });
    window.removeEventListener('scroll', this._handleScroll, true);
    this.hoverTarget = null;
    this.selectedTarget = null;
    if (this._scrollRAF !== null) cancelAnimationFrame(this._scrollRAF);
    if (this._hoverRAF !== null) cancelAnimationFrame(this._hoverRAF);
    this._scrollRAF = null;
    this._hoverRAF = null;
    this.removeCommentStyle();
  }

  _handleScroll() {
    if (!this.isActive) return;

    if (this._scrollRAF !== null) return;
    this._scrollRAF = requestAnimationFrame(() => {
      this._scrollRAF = null;

      if (this.selectedTarget && document.body.contains(this.selectedTarget)) {
        const data = this.buildElementData(this.selectedTarget);
        window.parent.postMessage({ type: POST_MESSAGE_TYPE.HTML_PAGE_COMMENT_MODE_ELEMENT_POSITION_UPDATE, data, targetType: 'selected' }, '*');
      }

      if (this.hoverTarget && document.body.contains(this.hoverTarget)) {
        const data = this.buildElementData(this.hoverTarget);
        window.parent.postMessage({ type: POST_MESSAGE_TYPE.HTML_PAGE_COMMENT_MODE_ELEMENT_POSITION_UPDATE, data, targetType: 'hover' }, '*');
      }
    });
  }

  addCommentModeStyle() {
    let style = document.getElementById('ai-comment-cursor-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'ai-comment-cursor-style';
      style.innerHTML = '* { cursor: crosshair !important; }';
      document.head.appendChild(style);
    }
  }

  removeCommentStyle() {
    const style = document.getElementById('ai-comment-cursor-style');
    if (style) style.remove();
  }

  _handleEvent(event) {
    if (!this.isActive) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const target = event.target;
    const isBodyOrHtml = target === document.body || target === document.documentElement;

    if ((event.type === 'mouseout' || event.type === 'mouseleave') && event.relatedTarget === null) {
      const hadHoverTarget = this.hoverTarget !== null;
      const hadPendingHover = this._hoverRAF !== null;
      this.hoverTarget = null;

      if (hadPendingHover) {
        cancelAnimationFrame(this._hoverRAF);
        this._hoverRAF = null;
      }

      if (hadHoverTarget || hadPendingHover) {
        window.parent.postMessage({ type: POST_MESSAGE_TYPE.HTML_PAGE_COMMENT_MODE_ELEMENT_HOVER, data: null }, '*');
      }
    } else if (event.type === 'mouseover') {
      this.hoverTarget = isBodyOrHtml ? null : target;

      if (this._hoverRAF !== null) return;
      this._hoverRAF = requestAnimationFrame(() => {
        this._hoverRAF = null;
        const currentTarget = this.hoverTarget;
        const data = currentTarget ? this.buildElementData(currentTarget) : null;
        window.parent.postMessage({ type: POST_MESSAGE_TYPE.HTML_PAGE_COMMENT_MODE_ELEMENT_HOVER, data }, '*');
      });
    } else if (event.type === 'click') {
      this.selectedTarget = isBodyOrHtml ? null : target;
      const data = isBodyOrHtml ? null : this.buildElementData(target);
      window.parent.postMessage({ type: POST_MESSAGE_TYPE.HTML_PAGE_COMMENT_MODE_ELEMENT_SELECTED, data }, '*');
    }
  }

  buildElementData(target) {
    const rect = target.getBoundingClientRect();
    const selector = generateSelector(target) || null;
    return {
      selector,
      currentText: getCurrentText(target),
      htmlHint: getHtmlHint(target),
      computedStyle: computeStyle(target),
      label: generateLabel(target),
      elementPosition: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }
    };
  }

  destroy() {
    this.disable();
  }
}
