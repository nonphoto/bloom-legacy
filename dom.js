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
  } else if (isArrayLike(value)) {
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
    if (key === "tag") {
      continue;
    }
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
  return node;
}

export function reconcile(parent, array, current) {
  if (array.length <= 0) {
    array = [document.createComment("[]")];
  }
  for (let i = current.length; i > array.length; i--) {
    parent.removeChild(current[i - 1]);
  }
  let head = current[0];
  let result = [];
  for (let i = 0; i < array.length; i++) {
    if (i < current.length) {
      head = patch(parent, array[i], current[i]);
    } else {
      head = insertAfter(parent, array[i], head);
    }
    result.push(head);
  }
  return result;
}

export function insertAfter(parent, value, marker) {
  const comment = document.createComment("");
  if (marker instanceof Node && !marker.isSameNode(parent.lastChild)) {
    parent.insertBefore(comment, marker.nextSibling);
  } else {
    parent.appendChild(comment);
  }
  return patch(parent, value, comment);
}

export function insertBefore(parent, value, marker) {
  const comment = document.createComment("");
  if (marker instanceof Node) {
    parent.insertBefore(comment, marker);
  } else {
    parent.insertBefore(comment, parent.firstChild);
  }
  return patch(parent, value, comment);
}

export function patch(parent, value, current) {
  while (typeof current === "function") {
    current = current();
  }
  if (!(isArrayLike(current) || current instanceof Node)) {
    current = parent.childNodes;
  }
  if (current instanceof NodeList) {
    current = Array.from(current);
  }
  if (value === current) {
    return current;
  }
  const valueType = typeof value;
  if (valueType === "string" || valueType === "number") {
    value = value.toString();
    if (current instanceof Text) {
      current.nodeValue = value;
      return current;
    } else {
      return patch(parent, document.createTextNode(value), current);
    }
  } else if (value == null || valueType === "boolean") {
    if (current instanceof Comment) {
      current.nodeValue = value;
      return current;
    } else {
      return patch(parent, document.createComment(value), current);
    }
  } else if (valueType === "function") {
    return S((acc) => patch(parent, value(), acc), current);
  } else if (isArrayLike(value)) {
    const array = value.flat(Infinity);
    if (isArrayLike(current)) {
      return reconcile(parent, array, current);
    } else if (current instanceof Node) {
      return reconcile(parent, array, [current]);
    } else {
      throw new Error("Not possible");
    }
  } else if (value instanceof Node) {
    if (isArrayLike(current)) {
      reconcile(parent, [value], current);
    } else if (current instanceof Node) {
      parent.replaceChild(value, current);
    } else {
      parent.appendChild(value);
    }
    return value;
  } else if (valueType === "object") {
    const tag = value.tag || "div";
    if (
      current instanceof Element &&
      tag.toLowerCase() === current.tagName.toLowerCase()
    ) {
      assign(current, value);
      return current;
    } else {
      return patch(parent, create(value), current);
    }
  } else {
    return current;
  }
}

export function create(data) {
  if (data instanceof Node) {
    return data;
  } else if (isArrayLike(data)) {
    return document.createComment("[]");
  } else if (typeof data === "object") {
    const { tag = "div", ...props } = data;
    const element = document.createElement(tag);
    assign(element, props);
    return element;
  } else if (typeof data === "string") {
    return document.createTextNode(data);
  } else if (typeof data === "number") {
    return document.createTextNode(data.toString());
  } else if (typeof data === "function") {
    return S(() => create(data()));
  } else {
    return document.createComment(data);
  }
}

function isArrayLike(object) {
  return Array.isArray(object) || object instanceof NodeList;
}
