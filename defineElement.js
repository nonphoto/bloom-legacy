import S from "https://cdn.skypack.dev/s-js";
import { camelCase } from "https://cdn.skypack.dev/camel-case";
import { patch } from "./index.js";

export default function (tagName, data) {
  window.customElements.define(
    tagName.toLowerCase(),
    class extends HTMLElement {
      constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.state = new Proxy(
          Object.fromEntries(
            Object.entries(this.attributes).map(([key, value]) => {
              return [camelCase(key), S.data(value)];
            })
          ),
          {
            get(target, key) {
              if (target[key] !== "function") {
                target[key] = S.data();
              }
              return target[key];
            },
            set(target, key, value) {
              if (target[key] !== "function") {
                target[key] = S.data(value);
              } else {
                target[key](value);
              }
            },
          }
        );
      }
      setAttribute(key, value) {
        this.state[camelCase(key)] = value;
        super.setAttribute(key, value);
      }
      connectedCallback() {
        this.dispose = S.root((dispose) => {
          patch(
            this.root,
            typeof data === "function" ? data.call(this, this.state) : data
          );
          return dispose;
        });
      }
      disconnectedCallback() {
        if (typeof this.dispose === "function") {
          this.dispose();
        }
      }
      dispatch(name, detail) {
        const event = new CustomEvent(name, {
          bubbles: true,
          composed: true,
          detail,
        });
        this.dispatchEvent(event);
      }
    }
  );
}
