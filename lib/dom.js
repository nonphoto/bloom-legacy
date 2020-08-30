import S from "https://cdn.skypack.dev/s-js";

function setAttribute(node, key, value) {
  if (value == null || value === false) {
    node.removeAttribute(key);
  } else {
    node.setAttribute(key, value);
  }
}

function patchProperty(node, key, oldValue, newValue, isSvg) {
  if (newValue === oldValue) {
  } else if (key === "key") {
  } else if (key === "style") {
    for (var styleKey in { ...oldValue, ...newValue }) {
      oldValue =
        newValue == null || newValue[styleKey] == null
          ? ""
          : newValue[styleKey];
      if (styleKey[0] === "-") {
        if (typeof oldValue === "function") {
          S(() => {
            node[key].setProperty(styleKey, oldValue());
          });
        } else {
          node[key].setProperty(styleKey, oldValue);
        }
      } else {
        if (typeof oldValue === "function") {
          S(() => {
            node[key][styleKey] = oldValue();
          });
        } else {
          node[key][styleKey] = oldValue;
        }
      }
    }
  } else {
    if (!isSvg && key !== "list" && key !== "form" && key in node) {
      if (typeof newValue === "function" && !key.startsWith("on")) {
        S(() => {
          node[key] = newValue();
        });
      } else {
        node[key] = newValue;
      }
    } else {
      if (typeof newValue === "function") {
        S(() => {
          setAttribute(node, key, newValue());
        });
      } else {
        setAttribute(node, key, newValue);
      }
    }
  }
}

function VElement(tagName, props, content, node) {
  this.tagName = tagName.toLowerCase();
  this.props = props;
  this.content = content;
  this.node = node;
}

export function h(tagName, props, content) {
  return new VElement(tagName, props, content);
}

function createNode(vnode) {
  if (vnode instanceof VElement) {
    var node = document.createElement(vnode.tagName, { is: vnode.props.is });
    for (var k in vnode.props) {
      patchProperty(node, k, null, vnode.props[k]);
    }

    patch(node, null, vnode.content);

    return (vnode.node = node);
  } else {
    return document.createTextNode(vnode.toString());
  }
}

function recycle(node) {
  if (node.nodeType === 3) {
    return node.nodeValue;
  } else {
    return new VElement(
      node.nodeName,
      {},
      Array.prototype.map.call(node.childNodes, recycle),
      node
    );
  }
}

export function init(parentNode, vNode) {
  patch(parentNode, recycle(parentNode).content, vNode);
}

function patch(parentNode, oldVNode, newVNode) {
  var t = typeof newVNode;
  if (t === "number") {
    oldVNode = patch(parentNode, oldVNode, newVNode.toString());
  } else if (t === "string") {
    if (typeof oldVNode === "string") {
      oldVNode = parentNode.firstChild.data = newVNode;
    } else {
      oldVNode = parentNode.textContent = newVNode;
    }
  } else if (newVNode == null || t === "boolean") {
    clear(parentNode);
    oldVNode = null;
  } else if (t === "function") {
    S(function () {
      oldVNode = patch(parentNode, oldVNode, newVNode());
    });
  } else if (newVNode instanceof VElement) {
    if (oldVNode === newVNode && oldVNode.node instanceof Node) {
      for (let k in newVNode.props) {
        patchProperty(oldVNode.node, k, oldVNode.props[k], newVNode.props[k]);
      }
      patch(oldVNode.node, oldVNode.content, newVNode.content);
      newVNode.node = oldVNode.node;
    } else if (Array.isArray(oldVNode)) {
      if (oldVNode.length === 0) {
        parentNode.appendChild(createNode(newVNode));
      } else if (oldVNode.length === 1) {
        patch(parentNode, oldVNode[0], newVNode);
      } else {
        reconcile(parentNode, oldVNode, [newVNode]);
      }
    } else {
      clear(parentNode);
      parentNode.appendChild(createNode(newVNode));
    }
    oldVNode = newVNode;
  } else if (Array.isArray(newVNode)) {
    const array = normalizeArray([], newVNode);
    if (Array.isArray(oldVNode)) {
      reconcile(parentNode, oldVNode, newVNode);
    } else if (oldVNode === "") {
      for (let i = 0; i < newVNodes.length; i++) {
        parentNode.appendChild(createNode(newVNodes[i]));
      }
    } else {
      reconcile(parentNode, [oldVNode], newVNode);
    }
    oldVNode = array;
  } else {
    throw new Error("content must be of type VNode, () => VNode, or VNode[].");
  }
  return oldVNode;
}

function normalizeArray(normalized, array) {
  for (var i = 0, len = array.length; i < len; i++) {
    var item = array[i];
    if (item instanceof VElement) {
      normalized.push(item);
    } else if (item == null || item === true || item === false) {
    } else if (Array.isArray(item)) {
      normalizeArray(normalized, item);
    } else if (typeof item === "string") {
      normalized.push(item);
    } else {
      normalized.push(item.toString());
    }
  }

  return normalized;
}

function clear(node) {
  while (node.firstChild) {
    node.removeChild(node.lastChild);
  }
}

function reconcile(parentNode, oldVNodes, newVNodes) {
  console.log("reconcile");
  clear(parentNode);
  for (let i = 0; i < newVNodes.length; i++) {
    parentNode.appendChild(createNode(newVNodes[i]));
  }
}
