import S from "https://cdn.skypack.dev/s-js";

export const syntheticEventNames = new Set([
  "keydown",
  "keypress",
  "keyup",
  "click",
  "contextmenu",
  "doubleclick",
  "drag",
  "dragend",
  "dragenter",
  "dragexit",
  "dragleave",
  "dragover",
  "dragstart",
  "drop",
  "mousedown",
  "mouseenter",
  "mouseleave",
  "mousemove",
  "mouseout",
  "mouseover",
  "mouseup",
  "pointerdown",
  "pointermove",
  "pointerup",
  "pointercancel",
  "pointerenter",
  "pointerleave",
  "pointerover",
  "pointerout",
  "touchcancel",
  "touchend",
  "touchmove",
  "touchstart",
]);

export const namespaces = {
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
};

const eventRegistry = new Set();

function syntheticEventListener(event) {
  const key = `__${event.type}`;
  let node = event.target;
  while (node !== null) {
    const handler = node[key];
    if (handler) {
      handler(event);
      if (event.cancelBubble) return;
    }
    node = node.parentNode;
  }
}

export function initSyntheticEvent(key) {
  if (!eventRegistry.has(key)) {
    eventRegistry.add(key);
    document.addEventListener(key, syntheticEventListener);
  }
}

export function clearSyntheticEvents() {
  for (let key of eventRegistry.keys()) {
    document.removeEventListener(key, syntheticEventListener);
  }
  eventRegistry.clear();
}

export function setAttribute(node, name, value) {
  if (typeof value === "function") {
    S(() => setAttribute(node, name, value()));
  } else if (value === false || value == null) {
    node.removeAttribute(name);
  } else {
    node.setAttribute(name, value);
  }
}

export function setAttributeNS(node, namespace, name, value) {
  if (typeof value === "function") {
    S(() => setAttributeNS(node, namespace, name, value()));
  } else if (value === false || value == null) {
    node.removeAttributeNS(namespace, name);
  } else {
    node.setAttributeNS(namespace, name, value);
  }
}

export function setProperty(node, key, value) {
  if (typeof value === "function") {
    S(() => (node[key] = value()));
  } else {
    node[key] = value;
  }
}

export function setClassList(node, value) {
  if (typeof value === "function") {
    S(() => setClassList(node, value()));
  } else if (Array.isArray(value)) {
    node.className = value.join(" ");
  } else {
    node.className = value;
  }
}

export function setStyle(node, key, value) {
  if (typeof value === "function") {
    S(() => setStyle(node, key, value()));
  } else {
    node.style[key] = value;
  }
}

export function assign(node, props) {
  let key, value;
  for (key in props) {
    value = props[key];
    if (key === "children") {
      patch(node, value, node.childNodes);
    } else if (key === "style") {
      if (typeof value === "object") {
        let styleKey;
        for (styleKey in value) {
          setStyle(node, styleKey, value[styleKey]);
        }
      } else {
        setAttribute(node, key, value);
      }
    } else if (key === "classList") {
      setClassList(node, value);
    } else if (key === "ref") {
      value(node);
    } else if (key.startsWith("on")) {
      key = key.toLowerCase();
      const eventName = key.slice(2);
      if (syntheticEventNames.has(eventName)) {
        node[`__${eventName}`] = value;
        initSyntheticEvent(eventName);
      } else {
        node[key] = value;
      }
    } else if (key.includes(":")) {
      const namespace = namespaces[key.split(":")[0]];
      if (namespace) {
        setAttributeNS(node, namespace, key, value);
      } else {
        setAttribute(node, key, value);
      }
    } else if (!(node instanceof SVGElement) && key in node) {
      setProperty(node, key, value);
    } else {
      setAttribute(node, key, value);
    }
  }
}

// Slightly modified version of: https://github.com/WebReflection/udomdiff/blob/master/index.js
export default function reconcile(parentNode, a, b) {
  let bLength = b.length,
    aEnd = a.length,
    bEnd = bLength,
    aStart = 0,
    bStart = 0,
    after = a[aEnd - 1].nextSibling,
    map = null;

  while (aStart < aEnd || bStart < bEnd) {
    // append
    if (aEnd === aStart) {
      const node =
        bEnd < bLength
          ? bStart
            ? b[bStart - 1].nextSibling
            : b[bEnd - bStart]
          : after;

      while (bStart < bEnd) parentNode.insertBefore(b[bStart++], node);
      // remove
    } else if (bEnd === bStart) {
      while (aStart < aEnd) {
        if (!map || !map.has(a[aStart])) parentNode.removeChild(a[aStart]);
        aStart++;
      }
      // common prefix
    } else if (a[aStart] === b[bStart]) {
      aStart++;
      bStart++;
      // common suffix
    } else if (a[aEnd - 1] === b[bEnd - 1]) {
      aEnd--;
      bEnd--;
      // swap forward
    } else if (aEnd - aStart === 1 && bEnd - bStart === 1) {
      if ((map && map.has(a[aStart])) || a[aStart].parentNode !== parentNode) {
        parentNode.insertBefore(b[bStart], bEnd < bLength ? b[bEnd] : after);
      } else parentNode.replaceChild(b[bStart], a[aStart]);
      break;
      // swap backward
    } else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
      const node = a[--aEnd].nextSibling;
      parentNode.insertBefore(b[bStart++], a[aStart++].nextSibling);
      parentNode.insertBefore(b[--bEnd], node);

      a[aEnd] = b[bEnd];
      // fallback to map
    } else {
      if (!map) {
        map = new Map();
        let i = bStart;

        while (i < bEnd) map.set(b[i], i++);
      }

      if (map.has(a[aStart])) {
        const index = map.get(a[aStart]);

        if (bStart < index && index < bEnd) {
          let i = aStart,
            sequence = 1;

          while (++i < aEnd && i < bEnd) {
            if (!map.has(a[i]) || map.get(a[i]) !== index + sequence) break;
            sequence++;
          }

          if (sequence > index - bStart) {
            const node = a[aStart];
            while (bStart < index) parentNode.insertBefore(b[bStart++], node);
          } else parentNode.replaceChild(b[bStart++], a[aStart++]);
        } else aStart++;
      } else parentNode.removeChild(a[aStart++]);
    }
  }
}

export function patch(parent, value, current) {
  while (typeof current === "function") {
    current = current();
  }
  if (value === current) {
    return current;
  }
  const valueType = typeof value;
  if (valueType === "string" || valueType === "number") {
    if (valueType === "number") {
      value = value.toString();
    }
    if (current instanceof Comment) {
      parent.removeChild(current);
    } else if (current instanceof Node) {
      current.nodeValue = value;
      return current;
    } else if (Array.isArray(current)) {
      clear(parent, current);
    }
    value = document.createTextNode(value);
    parent.appendChild(value);
    return value;
  } else if (value == null || valueType === "boolean") {
    return clear(parent, current, value);
  } else if (valueType === "function") {
    return S((acc) => patch(parent, value(), acc), current);
  } else if (Array.isArray(value)) {
    const array = normalizeArray(value);
    if (array.length === 0) {
      return clear(parent, current, "[]");
    } else {
      if (Array.isArray(current)) {
        reconcile(parent, current, array);
      } else if (current instanceof Node) {
        reconcile(parent, [current], array);
      } else {
        for (let i = 0; i < array.length; i++) {
          parent.appendChild(array[i]);
        }
      }
      return array;
    }
  } else if (value instanceof Node) {
    if (Array.isArray(current)) {
      reconcile(parent, current, [value]);
    } else if (current instanceof Node) {
      parent.replaceChild(value, current);
    } else {
      parent.appendChild(value);
    }
    return value;
  } else if (valueType === "object") {
    value.tag ||= "div";
    if (
      current instanceof Element &&
      value.tag.toLowerCase() === current.tagName.toLowerCase()
    ) {
      const { tag, children, ...props } = value;
      assign(current, props);
      return patch(current, children, current.childNodes);
    } else {
      value = createElement(value);
      return patch(parent, value, current);
    }
  } else {
    return current;
  }
}

export function createElement(data) {
  const { tag = "div", ...other } = data;
  const element = document.createElement(tag);
  assign(element, other);
  return element;
}

function normalizeArray(array, normalized = []) {
  for (let i = 0, item, itemType; i < array.length; i++) {
    item = array[i];
    itemType = typeof item;
    if (item instanceof Node) {
      normalized.push(item);
    } else if (item == null || itemType === "boolean") {
    } else if (Array.isArray(item)) {
      normalizeArray(array, normalized);
    } else if (itemType === "function") {
      item = item();
      normalizeArray(Array.isArray(item) ? item : [item], normalized);
    } else if (itemType === "string") {
      normalized.push(document.createTextNode(item));
    } else if (itemType === "object") {
      console.log(item);
      normalized.push(createElement(item));
    } else {
      normalized.push(document.createTextNode(item.toString()));
    }
  }
  return normalized;
}

function clear(parent, current, marker) {
  if (current instanceof Comment) {
    current.nodeValue = "" + marker;
    return current;
  } else if (current instanceof Node) {
    marker = document.createComment(marker);
    parent.replaceChild(marker, current);
  } else if (Array.isArray(current)) {
    for (let i = 0; i < current.length; i++) {
      parent.removeChild(current[i]);
    }
    marker = document.createComment(marker);
    parent.appendChild(marker);
  } else {
    marker = document.createComment(marker);
    parent.appendChild(marker);
  }
  return marker;
}
