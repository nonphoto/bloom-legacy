const keyAttribute = "data-component";

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node instanceof Element && node.getAttribute(keyAttribute)) {
        connect(node.getAttribute(keyAttribute), node);
      }
    }
    for (const node of mutation.removedNodes) {
      if (node instanceof Element && node.getAttribute(keyAttribute)) {
        disconnect(node);
      }
    }
  }
});

observer.observe(document.body, {
  subtree: true,
  childList: true,
  attributes: true,
  attributeFilter: [keyAttribute],
});

const constructorMap = new Map();
const disposerMap = new WeakMap();

function connect(name, node) {
  if (!constructorMap.has(name)) {
    throw new Error(`Component "${name}" does not exist.`);
  } else {
    S.root((dispose) => {
      const preDispose = constructorMap.get(name)(node);
      disposerMap.set(node, () => {
        preDispose();
        dispose();
      });
    });
  }
}

function disconnect(node) {
  if (disposerMap.has(node)) {
    disposerMap.get(node)();
    disposerMap.delete(node);
  }
}

export function defineComponent(name, callback) {
  if (constructorMap.has(name)) {
    throw new Error(`Component "${name}" is already defined.`);
  } else {
    constructorMap.set(name, callback);
    const nodes = document.querySelectorAll(`[${keyAttribute}=${name}]`);
    for (const node of nodes) {
      connect(name, node);
    }
  }
}
