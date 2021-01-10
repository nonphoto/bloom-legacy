import S from "https://cdn.skypack.dev/s-js";
import lodashThrottle from "https://cdn.skypack.dev/lodash-es/throttle";
import lodashDebounce from "https://cdn.skypack.dev/lodash-es/debounce";
import sync, { cancelSync } from "https://cdn.skypack.dev/framesync";

export function animationEvent(type) {
  const event = S.data({ delta: 0, timestamp: 0 });
  const process = sync[type](event, true);
  S.cleanup(() => {
    cancelSync[type](process);
  });
  return event;
}

export const animationRead = S.root(() => animationEvent("read"));
export const animationUpdate = S.root(() => animationEvent("update"));
export const animationPreRender = S.root(() => animationEvent("preRender"));
export const animationRender = S.root(() => animationEvent("render"));
export const animationPostRender = S.root(() => animationEvent("postRender"));

export function domEvent(eventTarget, type, options) {
  const event = S.data();
  eventTarget.addEventListener(type, event, options);
  S.cleanup(() => {
    eventTarget.removeEventListener(type, event, options);
  });
  return event;
}

export const mouseEvent = domEvent(document, "mousemove", {
  passive: true,
});

export const mousePosition = S(() => {
  const { clientX, clientY } = mouseEvent() || { clientX: 0, clientY: 0 };
  return [clientX, clientY];
});

export const windowResize = domEvent(window, "resize", { passive: true });

export const windowSize = S.on(windowResize, () => [
  window.innerWidth,
  window.innerHeight,
]);

export const windowScroll = domEvent(window, "scroll", { passive: true });

export const windowOffset = S.on(windowScroll, () => [
  window.pageXOffset,
  window.pageYOffset,
]);

export function memo(fn, ...comparator) {
  const value = S.value(S.sample(fn), ...comparator);
  S(() => value(fn()));
  return value;
}

export function throttle(fn, ...options) {
  const value = S.value(S.sample(fn));
  S.on(fn, lodashThrottle(value, ...options));
  return value;
}

export function debounce(fn, ...options) {
  const value = S.value(S.sample(fn));
  S.on(fn, lodashDebounce(value, ...options));
  return value;
}

export const clientRect = (ref) => {
  const bounds = S.data({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    bottom: 0,
    right: 0,
    x: 0,
    y: 0,
  });
  S(() => {
    if (ref()) {
      const handler = () => {
        bounds(ref().getBoundingClientRect());
      };
      handler();
      const observer = new ResizeObserver(handler);
      observer.observe(ref());
      S.cleanup(() => {
        observer.disconnect();
      });
      S.on(
        domEvent(window, "resize", { passive: true }),
        handler,
        undefined,
        true
      );
      S.on(
        domEvent(window, "scroll", { passive: true, capture: true }),
        handler,
        undefined,
        true
      );
    }
  });
  return bounds;
};
