import S from "https://cdn.skypack.dev/s-js";
import {
  Attributes,
  SVGAttributes,
  SVGNamespace,
  NonComposedEvents,
} from "./constants.js";
import reconcile from "./reconcile.js";

const { root, effect } = S;

const eventRegistry = new Set();

export function render(code, element) {
  let disposer;
  root((dispose) => {
    disposer = dispose;
    patch(element, code());
  });
  return disposer;
}

export function delegateEvents(eventNames) {
  for (let i = 0, l = eventNames.length; i < l; i++) {
    const name = eventNames[i];
    if (!eventRegistry.has(name)) {
      eventRegistry.add(name);
      document.addEventListener(name, eventHandler);
    }
  }
}

export function clearDelegatedEvents() {
  for (let name of eventRegistry.keys())
    document.removeEventListener(name, eventHandler);
  eventRegistry.clear();
}

export function setAttribute(node, name, value) {
  if (value === false || value == null) node.removeAttribute(name);
  else node.setAttribute(name, value);
}

export function setAttributeNS(node, namespace, name, value) {
  if (value === false || value == null) node.removeAttributeNS(namespace, name);
  else node.setAttributeNS(namespace, name, value);
}

export function classList(node, value, prev) {
  const classKeys = Object.keys(value);
  for (let i = 0, len = classKeys.length; i < len; i++) {
    const key = classKeys[i],
      classValue = !!value[key],
      classNames = key.split(/\s+/);
    if (!key || (prev && prev[key] === classValue)) continue;
    for (let j = 0, nameLen = classNames.length; j < nameLen; j++)
      node.classList.toggle(classNames[j], classValue);
  }
  return value;
}

export function style(node, value, prev) {
  const nodeStyle = node.style;
  if (typeof value === "string") return (nodeStyle.cssText = value);

  let v, s;
  if (prev != null && typeof prev !== "string") {
    for (s in value) {
      v = value[s];
      v !== prev[s] && nodeStyle.setProperty(s, v);
    }
    for (s in prev) {
      value[s] == null && nodeStyle.removeProperty(s);
    }
  } else {
    for (s in value) nodeStyle.setProperty(s, value[s]);
  }
  return value;
}

export function assign(node, props, isSVG, prevProps = {}) {
  let info;
  for (const prop in props) {
    const value = props[prop];
    if (value === prevProps[prop]) continue;
    if (prop === "style") {
      style(node, value, prevProps[prop]);
    } else if (prop === "classList") {
      classList(node, value, prevProps[prop]);
    } else if (prop === "ref") {
      value(node);
    } else if (prop === "on") {
      for (const eventName in value)
        node.addEventListener(eventName, value[eventName]);
    } else if (prop === "onCapture") {
      for (const eventName in value)
        node.addEventListener(eventName, value[eventName], true);
    } else if (prop.slice(0, 2) === "on") {
      const lc = prop.toLowerCase();
      if (!NonComposedEvents.has(lc.slice(2))) {
        const name = lc.slice(2);
        if (Array.isArray(value)) {
          node[`__${name}`] = value[0];
          node[`__${name}Data`] = value[1];
        } else node[`__${name}`] = value;
        delegateEvents([name]);
      } else node[lc] = value;
    } else if (!isSVG && (info = Attributes[prop])) {
      if (info.type === "attribute") {
        setAttribute(node, prop, value);
      } else node[info.alias] = value;
    } else if (isSVG || prop.indexOf("-") > -1 || prop.indexOf(":") > -1) {
      const ns = prop.indexOf(":") > -1 && SVGNamespace[prop.split(":")[0]];
      if (ns) setAttributeNS(node, ns, prop, value);
      else if ((info = SVGAttributes[prop])) {
        if (info.alias) setAttribute(node, info.alias, value);
        else setAttribute(node, prop, value);
      } else
        setAttribute(
          node,
          prop.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`),
          value
        );
    } else node[prop] = value;
    prevProps[prop] = value;
  }
}

function eventHandler(e) {
  const key = `__${e.type}`;
  let node = (e.composedPath && e.composedPath()[0]) || e.target;
  // reverse Shadow DOM retargetting
  if (e.target !== node) {
    Object.defineProperty(e, "target", {
      configurable: true,
      value: node,
    });
  }
  // simulate currentTarget
  Object.defineProperty(e, "currentTarget", {
    configurable: true,
    get() {
      return node;
    },
  });

  while (node !== null) {
    const handler = node[key];
    if (handler) {
      const data = node[`${key}Data`];
      data ? handler(data, e) : handler(e);
      if (e.cancelBubble) return;
    }
    node = node.host && node.host instanceof Node ? node.host : node.parentNode;
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
    return patch(parent, document.createTextNode(value), current);
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
    return marker;
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
      assign(parent, arg, parent instanceof SVGElement);
    } else {
      parent.appendChild(document.createTextNode(arg.toString()));
    }
  }
  for (let i = 0; i < args.length; i++) {
    assignArg(args[i]);
  }
  return parent;
}
