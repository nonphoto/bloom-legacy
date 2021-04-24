import S from "https://cdn.skypack.dev/s-js";
import { paramCase } from "https://cdn.skypack.dev/param-case";

const htmlVoidElements = [
  "area",
  "base",
  "basefont",
  "bgsound",
  "br",
  "col",
  "command",
  "embed",
  "frame",
  "hr",
  "image",
  "img",
  "input",
  "isindex",
  "keygen",
  "link",
  "menuitem",
  "meta",
  "nextid",
  "param",
  "source",
  "track",
  "wbr",
];

const namespaces = {
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
};

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
  for (const key in props) {
    const value = props[key];
    if (["tagName"].includes(key)) {
      continue;
    }
    if (key === "children") {
      patch(node, value, node.childNodes);
    } else if (key === "style") {
      if (typeof value === "object") {
        for (let styleKey in value) {
          setStyle(node, styleKey, value[styleKey]);
        }
      } else {
        setAttribute(node, key, value);
      }
    } else if (key === "classList") {
      setClassList(node, value);
    } else if (key === "ref") {
      value(node);
    } else if (key === "assignedElements" && key in node) {
      const callback = () => value(node.assignedElements());
      node.addEventListener("slotchange", callback);
      S.cleanup(() => {
        node.removeEventListener("slotchange", callback);
      });
      callback();
    } else if (key.startsWith("on")) {
      const eventKey = key.slice(2).toLowerCase();
      node.addEventListener(eventKey, value);
      S.cleanup(() => {
        node.removeEventListener(eventKey, value);
      });
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
    const node = current[i - 1];
    parent.removeChild(node);
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
  if (!current) {
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
  } else if (Array.isArray(value)) {
    const array = value.flat(Infinity);
    if (Array.isArray(current)) {
      return reconcile(parent, array, current);
    } else if (current instanceof Node) {
      return reconcile(parent, array, [current]);
    } else {
      throw new Error("Not possible");
    }
  } else if (value instanceof Node) {
    if (Array.isArray(current)) {
      reconcile(parent, [value], current);
    } else if (current instanceof Node) {
      parent.replaceChild(value, current);
    } else {
      throw new Error("Not possible");
    }
    return value;
  } else if (valueType === "object") {
    const { tagName = "div", ...props } = value;
    if (
      current instanceof Element &&
      tagName.toLowerCase() === current.tagName.toLowerCase()
    ) {
      assign(current, props);
      return current;
    } else {
      const element = document.createElement(tagName);
      const result = patch(parent, element, current);
      assign(element, props);
      return result;
    }
  } else {
    return current;
  }
}

export function serialize(data) {
  if (typeof data === "string") {
    return data;
  } else if (typeof data === "function") {
    return serialize(data());
  } else if (Array.isArray(data)) {
    return data.map(serialize).join("");
  } else if (typeof data === "object") {
    const { tagName = "div", children, ...rest } = data;
    const attributes = Object.entries(rest)
      .filter(([, value]) => typeof value !== "function")
      .map(([key, value]) => {
        if (key === "style") {
          value = Object.entries(value)
            .filter(([, value2]) => typeof value2 !== "function")
            .map(([key2, value2]) => `${paramCase(key2)}:${value2.toString()};`)
            .join("");
        }
        return `${paramCase(key)}='${value}'`;
      });
    const tagString = [tagName, ...attributes].join(" ");
    if (htmlVoidElements.includes(tagName)) {
      return `<${tagString}/>`;
    } else {
      return `<${tagString}>${serialize(children)}</${tagName}>`;
    }
  } else if (data == null) {
    return "";
  } else {
    return data.toString();
  }
}
