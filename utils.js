import S from "s-js";
import sync, { cancelSync } from "https://cdn.skypack.dev/framesync";
import { animate, mix } from "https://cdn.skypack.dev/popmotion";
import {
  layoutNode,
  updateProjectionStyle,
} from "https://cdn.skypack.dev/projection@2.0.0-alpha.3";

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
export const time = S.on(animationUpdate, () => performance.now());

export function domEvent(eventTarget, type, options) {
  const event = S.data();
  eventTarget.addEventListener(type, event, options);
  S.cleanup(() => {
    eventTarget.removeEventListener(type, event, options);
  });
  return event;
}

export const mouseEvent = S.root(() =>
  domEvent(document, "mousemove", {
    passive: true,
  })
);

export const mousePosition = S(() => {
  const { clientX, clientY } = mouseEvent() || { clientX: 0, clientY: 0 };
  return [clientX, clientY];
});

export const windowResize = S.root(() =>
  throttleByAnimationFrame(domEvent(window, "resize", { passive: true }))
);

export const windowSize = S.root(() =>
  S.on(windowResize, () => [window.innerWidth, window.innerHeight])
);

export const windowScroll = S.root(() =>
  throttleByAnimationFrame(
    domEvent(window, "scroll", { passive: true, capture: true })
  )
);

export const windowOffset = S.root(() =>
  S.on(windowScroll, () => [window.pageXOffset, window.pageYOffset])
);

export function memo(fn, ...comparator) {
  const value = S.value(S.sample(fn), ...comparator);
  S(() => value(fn()));
  return value;
}

export function throttleByAnimationFrame(fn) {
  const value = S.value(S.sample(fn));
  S.on(animationRead, () => {
    value(fn());
  });
  return value;
}

export const after = (fn) => {
  const signal = S.data(S.sample(fn));
  S(() => {
    signal(fn());
  });
  return signal;
};

export const layoutRect = (element) => {
  const rect = S.data();
  S(() => {
    if (element()) {
      sync.read(() => {
        element().style.transform = "";
        sync.read(
          () => {
            rect(element().getBoundingClientRect());
          },
          false,
          true
        );
      });
    }
  });
  return rect;
};

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
      S.on(windowScroll, handler, undefined, true);
      S.on(windowResize, handler, undefined, true);
    }
  });
  return bounds;
};

export function Projected({
  target,
  parent,
  children,
  borderRadius = 0,
  ref,
  ...other
}) {
  const element = S.data();
  const projection = S(() => {
    if (element()) {
      const projection = layoutNode(
        {
          onProjectionUpdate: () =>
            updateProjectionStyle(element(), projection),
        },
        typeof parent === "function" ? parent() : undefined
      );
      S.cleanup(() => {
        projection.destroy();
      });
      const layout = layoutRect(element);
      S(() => {
        if (layout()) {
          projection.setLayout(layout());
        }
      });
      S(() => {
        const rect = target() || layout();
        if (rect) {
          sync.update(() => {
            projection.setTarget(rect);
            element().style.borderRadius = `${pixelsToPercent(
              borderRadius,
              rect.left,
              rect.right
            )}% / ${pixelsToPercent(borderRadius, rect.top, rect.bottom)}%`;
          });
        }
      });
      return projection;
    }
  });
  return {
    ...other,
    ref: (value) => {
      if (ref) {
        ref(value);
      }
      element(value);
    },
    children: typeof children === "function" ? children(projection) : children,
  };
}

export function Animated({ animation, ...props }) {
  const ref = S.data();
  const target = animateRect(layoutRect(ref), animation);
  return Projected({ ref, target, ...props });
}

export function mixRect(prev, next, p) {
  return {
    top: mix(prev.top, next.top, p),
    left: mix(prev.left, next.left, p),
    right: mix(prev.right, next.right, p),
    bottom: mix(prev.bottom, next.bottom, p),
  };
}

export function pixelsToPercent(pixels, min, max) {
  return (pixels / (max - min)) * 100;
}

export function animateRect(stream, options = {}) {
  const result = S.data(S.sample(stream));
  S((prev) => {
    if (prev && stream()) {
      animate({
        ...options,
        from: 0,
        to: 1,
        onUpdate: (p) => void result(mixRect(prev, stream(), p)),
      });
    }
    return stream();
  }, S.sample(stream));
  return result;
}
