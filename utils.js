import S from "https://cdn.skypack.dev/s-js";

export const time = S.root(() => {
  const time = S.data(0);
  (function loop(t) {
    time(t);
    requestAnimationFrame(loop);
  })();
  return time;
});

export const mouse = S.root(() => {
  const mouse = S.data([0, 0]);
  document.addEventListener("mousemove", (event) =>
    mouse([event.clientX, event.clientY])
  );
  return mouse;
});
