import S from "https://cdn.skypack.dev/s-js";
import {
  Attributes,
  SVGAttributes,
  SVGNamespace,
  NonComposedEvents,
} from "./constants.js";
import reconcileArrays from "./reconcile.js";

const { root, effect } = S;

function createComponent(Comp, props) {
  return sample(() => Comp(props));
}

const eventRegistry = new Set();

export function render(code, element) {
  let disposer;
  root((dispose) => {
    disposer = dispose;
    insert(element, code(), element.firstChild ? null : undefined);
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

export function spread(node, accessor, isSVG, skipChildren) {
  if (typeof accessor === "function") {
    effect((current) =>
      spreadExpression(node, accessor(), current, isSVG, skipChildren)
    );
  } else spreadExpression(node, accessor, undefined, isSVG, skipChildren);
}

export function insert(parent, accessor, marker, initial) {
  if (marker !== undefined && !initial) initial = [];
  if (typeof accessor !== "function")
    return insertExpression(parent, accessor, initial, marker);
  effect(
    (current) => insertExpression(parent, accessor(), current, marker),
    initial
  );
}

export function assign(node, props, isSVG, skipChildren, prevProps = {}) {
  let info;
  for (const prop in props) {
    if (prop === "children") {
      if (!skipChildren) insertExpression(node, props.children);
      continue;
    }
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

export function dynamicProperty(props, key) {
  const src = props[key];
  Object.defineProperty(props, key, {
    get() {
      return src();
    },
    enumerable: true,
  });
  return props;
}

export function assignProps(target, ...sources) {
  for (let i = 0; i < sources.length; i++) {
    const descriptors = Object.getOwnPropertyDescriptors(sources[i]);
    Object.defineProperties(target, descriptors);
  }
  return target;
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

function spreadExpression(node, props, prevProps = {}, isSVG, skipChildren) {
  if (!skipChildren && "children" in props) {
    effect(
      () =>
        (prevProps.children = insertExpression(
          node,
          props.children,
          prevProps.children
        ))
    );
  }
  effect(() => assign(node, props, isSVG, true, prevProps));
  return prevProps;
}

function insertExpression(parent, value, current, marker, unwrapArray) {
  while (typeof current === "function") current = current();
  if (value === current) return current;
  const t = typeof value,
    multi = marker !== undefined;
  parent = (multi && current[0] && current[0].parentNode) || parent;

  if (t === "string" || t === "number") {
    if (t === "number") value = value.toString();
    if (multi) {
      let node = current[0];
      if (node && node.nodeType === 3) {
        node.data = value;
      } else node = document.createTextNode(value);
      current = cleanChildren(parent, current, marker, node);
    } else {
      if (current !== "" && typeof current === "string") {
        current = parent.firstChild.data = value;
      } else current = parent.textContent = value;
    }
  } else if (value == null || t === "boolean") {
    current = cleanChildren(parent, current, marker);
  } else if (t === "function") {
    effect(
      () => (current = insertExpression(parent, value(), current, marker))
    );
    return () => current;
  } else if (Array.isArray(value)) {
    const array = [];
    if (normalizeIncomingArray(array, value, unwrapArray)) {
      effect(
        () => (current = insertExpression(parent, array, current, marker, true))
      );
      return () => current;
    }
    if (array.length === 0) {
      current = cleanChildren(parent, current, marker);
      if (multi) return current;
    } else {
      if (Array.isArray(current)) {
        if (current.length === 0) {
          appendNodes(parent, array, marker);
        } else reconcileArrays(parent, current, array);
      } else if (current == null || current === "") {
        appendNodes(parent, array);
      } else {
        reconcileArrays(
          parent,
          (multi && current) || [parent.firstChild],
          array
        );
      }
    }
    current = array;
  } else if (value instanceof Node) {
    if (Array.isArray(current)) {
      if (multi)
        return (current = cleanChildren(parent, current, marker, value));
      cleanChildren(parent, current, null, value);
    } else if (current == null || current === "" || !parent.firstChild) {
      parent.appendChild(value);
    } else parent.replaceChild(value, parent.firstChild);
    current = value;
  } else console.warn(`Skipped inserting`, value);

  return current;
}

function normalizeIncomingArray(normalized, array, unwrap) {
  let dynamic = false;
  for (let i = 0, len = array.length; i < len; i++) {
    let item = array[i],
      t;
    if (item instanceof Node) {
      normalized.push(item);
    } else if (item == null || item === true || item === false) {
      // matches null, undefined, true or false
      // skip
    } else if (Array.isArray(item)) {
      dynamic = normalizeIncomingArray(normalized, item) || dynamic;
    } else if ((t = typeof item) === "string") {
      normalized.push(document.createTextNode(item));
    } else if (t === "function") {
      if (unwrap) {
        const idx = item();
        dynamic =
          normalizeIncomingArray(
            normalized,
            Array.isArray(idx) ? idx : [idx]
          ) || dynamic;
      } else {
        normalized.push(item);
        dynamic = true;
      }
    } else normalized.push(document.createTextNode(item.toString()));
  }
  return dynamic;
}

function appendNodes(parent, array, marker) {
  for (let i = 0, len = array.length; i < len; i++)
    parent.insertBefore(array[i], marker);
}

function cleanChildren(parent, current, marker, replacement) {
  if (marker === undefined) return (parent.textContent = "");
  const node = replacement || document.createTextNode("");
  if (current.length) {
    let inserted = false;
    for (let i = current.length - 1; i >= 0; i--) {
      const el = current[i];
      if (node !== el) {
        const isParent = el.parentNode === parent;
        if (!inserted && !i)
          isParent
            ? parent.replaceChild(node, el)
            : parent.insertBefore(node, marker);
        else isParent && parent.removeChild(el);
      } else inserted = true;
    }
  } else parent.insertBefore(node, marker);
  return [node];
}

export function h() {
  let args = [].slice.call(arguments),
    e,
    multiExpression = false;

  function item(l) {
    const type = typeof l;
    if (l == null) void 0;
    else if ("string" === type) {
      if (!e) parseClass(l);
      else e.appendChild(document.createTextNode(l));
    } else if (
      "number" === type ||
      "boolean" === type ||
      l instanceof Date ||
      l instanceof RegExp
    ) {
      e.appendChild(document.createTextNode(l.toString()));
    } else if (Array.isArray(l)) {
      for (let i = 0; i < l.length; i++) item(l[i]);
    } else if (l instanceof Element) {
      insert(e, l, undefined, multiExpression ? null : undefined);
    } else if ("object" === type) {
      let dynamic = false;
      for (const k in l) {
        if (
          typeof l[k] === "function" &&
          k !== "ref" &&
          k.slice(0, 2) !== "on"
        ) {
          dynamicProperty(l, k);
          dynamic = true;
        }
      }
      dynamic
        ? spread(e, l, e instanceof SVGElement, !!args.length)
        : assign(e, l, e instanceof SVGElement, !!args.length);
    } else if ("function" === type) {
      if (!e) {
        let props,
          next = args[0];
        if (
          next == null ||
          (typeof next === "object" &&
            !Array.isArray(next) &&
            !(next instanceof Element))
        )
          props = args.shift();
        props || (props = {});
        props.children = (args.length > 1 ? args : args[0]) || props.children;
        for (const k in props) {
          if (typeof props[k] === "function" && !props[k].length)
            dynamicProperty(props, k);
        }
        e = createComponent(l, props);
        args = [];
      } else insert(e, l, undefined, multiExpression ? null : undefined);
    }
  }
  typeof args[0] === "string" && detectMultiExpression(args);
  while (args.length) item(args.shift());
  return e;

  function parseClass(string) {
    // Our minimal parser doesn’t understand escaping CSS special
    // characters like `#`. Don’t use them. More reading:
    // https://mathiasbynens.be/notes/css-escapes .

    const m = string.split(/([\.#]?[^\s#.]+)/);
    if (/^\.|#/.test(m[1])) e = document.createElement("div");
    for (let i = 0; i < m.length; i++) {
      const v = m[i],
        s = v.substring(1, v.length);
      if (!v) continue;
      if (!e) e = document.createElement(v);
      else if (v[0] === ".") e.classList.add(s);
      else if (v[0] === "#") e.setAttribute("id", s);
    }
  }
  function detectMultiExpression(list) {
    for (let i = 1; i < list.length; i++) {
      if (typeof list[i] === "function") {
        multiExpression = true;
        return;
      } else if (Array.isArray(list[i])) {
        detectMultiExpression(list[i]);
      }
    }
  }
}
