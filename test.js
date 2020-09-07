import { element, render } from "./lib/dom.js";
import S from "https://cdn.skypack.dev/s-js";
import SArray from "https://cdn.skypack.dev/s-array";

const value = S.data("");
const todos = SArray([]);
S(() => {
  console.log(todos());
});

const t = S.data(0);
const loop = (_t) => {
  t(_t);
  requestAnimationFrame(loop);
};

const seconds = S(() => Math.floor(t() * 0.001));

const app = () => [
  element(
    "div",
    seconds,
    S(() => (seconds() % 3 === 0 ? null : "a"))
  ),
  element("div", "b", ["c"], 3),
  element("div", { style: { "--value": seconds } }, todos),
  element("form", { action: "#" }, [
    element("input", {
      type: "text",
      value,
      onInput: (event) => {
        value(event.target.value);
      },
    }),
    element(
      "button",
      {
        type: "submit",
        onClick: () => {
          todos.push(value());
          value("");
        },
      },
      "add"
    ),
  ]),
];

render(app, document.querySelector("#app"));

loop(0);
