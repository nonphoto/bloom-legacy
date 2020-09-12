import S from "https://cdn.skypack.dev/s-js";
import { namespaces, syntheticEventNames } from "./constants.js";
import reconcile from "./reconcile.js";

const eventRegistry = new Set();

export function render(renderer, element) {
  let disposer;
  S.root((dispose) => {
    disposer = dispose;
    patch(element, renderer());
  });
  return disposer;
}

function eventListener(event) {
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

export function addSyntheticEvent(key) {
  if (!eventRegistry.has(key)) {
    eventRegistry.add(key);
    document.addEventListener(key, eventListener);
  }
}

export function clearSyntheticEvents() {
  for (let key of eventRegistry.keys()) {
    document.removeEventListener(key, eventListener);
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
  } else if (value == null) {
    node.style.removeProperty(key);
  } else {
    node.style.setProperty(key, value);
  }
}

export function assign(node, props) {
  let key, value;
  for (key in props) {
    value = props[key];
    if (key === "style") {
      let styleKey;
      for (styleKey in value) {
        setStyle(node, styleKey, value[styleKey]);
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
        addSyntheticEvent(eventName);
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

function patch(parent, value, current) {
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
    const array = normalize(value);
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
  } else {
    return current;
  }
}

function normalize(array, normalized = []) {
  for (let i = 0, item, itemType; i < array.length; i++) {
    item = array[i];
    itemType = typeof item;
    if (item instanceof Node) {
      normalized.push(item);
    } else if (item == null || itemType === "boolean") {
    } else if (Array.isArray(item)) {
      normalizeIncomingArray(array, normalized);
    } else if (itemType === "function") {
      item = item();
      normalizeIncomingArray(Array.isArray(item) ? item : [item], normalized);
    } else if (itemType === "string") {
      normalized.push(document.createTextNode(item));
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

export function element(tagName, ...args) {
  const parent = document.createElement(tagName);
  let argType;
  function assignArg(arg) {
    argType = typeof arg;
    if (arg == null || argType === "boolean") {
    } else if (argType === "string") {
      parent.appendChild(document.createTextNode(arg));
    } else if (Array.isArray(arg)) {
      for (let i = 0; i < arg.length; i++) {
        assignArg(arg[i]);
      }
    } else if (arg instanceof Element || argType === "function") {
      patch(parent, arg);
    } else if (argType === "object") {
      assign(parent, arg);
    } else {
      parent.appendChild(document.createTextNode(arg.toString()));
    }
  }
  for (let i = 0; i < args.length; i++) {
    assignArg(args[i]);
  }
  return parent;
}
