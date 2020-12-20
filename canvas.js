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
    context.fillStyle = resolve(data.fill) || "white";
    context.strokeStyle = resolve(data.stroke) || "black";
    if (resolve(data.op)) {
      context[resolve(data.op)](
        ...resolve(data.position),
        ...resolve(data.size)
      );
    }
  }
}

export function canvas(data) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const observer = new ResizeObserver((entries) => {
    for (let entry of entries) {
      console.log(entry.contentBoxSize);
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
