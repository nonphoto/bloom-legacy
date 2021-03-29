import S from "https://cdn.skypack.dev/s-js";

function resolve(value) {
  if (typeof value === "function") {
    return resolve(value());
  } else {
    return value;
  }
}

function draw(context, data) {
  if (Array.isArray(data)) {
    for (let item of data) {
      draw(context, item);
    }
  } else {
    const { translate, scale, path, children, ...props } = data;
    context.save();
    context.beginPath();
    for (let [key, value] of Object.entries(props)) {
      console.log(key, value);
      context[key] = resolve(value);
    }
    if (resolve(translate)) {
      context.translate(...resolve(translate));
    }
    if (resolve(scale)) {
      context.scale(...resolve(scale));
    }
    if (path) {
      for (let { op, args } of path) {
        context[op](...args);
      }
    }
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
  }
}

export function canvas(data) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const observer = new ResizeObserver((entries) => {
    for (let entry of entries) {
      entry.target.width = entry.contentBoxSize.inlineSize;
      entry.target.height = entry.contentBoxSize.blockSize;
      context.clearRect(0, 0, entry.target.width, entry.target.height);
      draw(context, data);
    }
  });
  observer.observe(canvas);
  S(() => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    draw(context, data);
  });
  return canvas;
}
