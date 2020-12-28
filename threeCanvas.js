import * as three from "https://cdn.skypack.dev/three";
import { time } from "./utils.js";
import S from "https://cdn.skypack.dev/s-js";
import set from "https://cdn.skypack.dev/set-value";

export function threeCanvas(options, data) {
  const scene = new three.Scene();
  const camera = new three.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;
  Object.assign(camera, options.camera);
  const renderer = new three.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    ...options.renderer,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  patch(scene, data);
  const observer = new ResizeObserver(() => {
    renderer.setSize(
      renderer.domElement.clientWidth,
      renderer.domElement.clientHeight
    );
    renderer.render(scene, camera);
  });
  observer.observe(renderer.domElement);
  S.on(time, () => {
    renderer.render(scene, camera);
  });
  S.cleanup(() => {
    renderer.dispose();
    camera.dispose();
  });
  return renderer.domElement;
}

export function patch(parent, value, current) {
  while (typeof current === "function") {
    current = current();
  }
  if (!(Array.isArray(current) || current instanceof three.Object3D)) {
    current = parent.children;
  }
  if (value === current) {
    return current;
  }
  if (typeof value === "function") {
    return S((acc) => patch(parent, value(), acc), current);
  } else if (Array.isArray(value)) {
    const array = value.flat(Infinity);
    if (Array.isArray(current)) {
      return reconcile(parent, array, current);
    } else if (current instanceof three.Object3D) {
      return reconcile(parent, array, [current]);
    } else {
      throw new Error("Not possible");
    }
  } else if (value instanceof three.Object3D) {
    if (Array.isArray(current)) {
      for (let item of current) {
        parent.remove(item);
      }
      parent.add(value);
    } else if (current instanceof three.Object3D) {
      parent.remove(current);
      parent.add(value);
    } else {
      parent.add(value);
    }
    return value;
  } else if (typeof value === "object") {
    if (
      current instanceof three.Object3D &&
      value.type === current.constructor.name
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

function reconcile(parent, array, current) {
  for (let i = current.length; i > array.length; i--) {
    parent.remove(current[i - 1]);
  }
  let head = current[0];
  let result = [];
  for (let i = 0; i < array.length; i++) {
    if (i < current.length) {
      head = patch(parent, array[i], current[i]);
    } else {
      head = patch(parent, array[i], []);
    }
    result.push(head);
  }
  return result;
}

function assign(node, props) {
  for (const key in props) {
    const value = props[key];
    if (key === "constructor") {
      continue;
    } else if (key === "children") {
      patch(node, value);
    } else if (key.startsWith("on")) {
      node[key] = value;
    } else {
      if (typeof value === "function") {
        S(() => {
          set(node, key, value());
        });
      } else {
        set(node, key, value);
      }
    }
  }
}

function create(data) {
  if (Array.isArray(data)) {
  } else if (typeof data === "object") {
    const { constructor, ...props } = data;
    const node = new constructor();
    assign(node, props);
    return node;
  } else {
    return new three.Group();
  }
}
