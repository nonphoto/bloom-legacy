import S from "https://cdn.skypack.dev/s-js";
import { patch } from "./index.js";

export default function (tagName, data) {
  window.customElements.define(
    tagName.toLowerCase(),
    class extends HTMLElement {
      constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
      }
      connectedCallback() {
        this.dispose = S.root((dispose) => {
          patch(this.root, data);
          return dispose;
        });
      }
      disconnectedCallback() {
        if (typeof this.dispose === "function") {
          this.dispose();
        }
      }
    }
  );
}
