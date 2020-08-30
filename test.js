import { h, init } from "./lib/dom.js";
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

const newTree = [
  h(
    "div",
    {},
    S(() => (seconds() % 3 === 0 ? false : "a"))
  ),
  h("div", {}, ["b", "c", 3]),
  h("div", { style: { "--value": seconds } }, todos),
  h("div", {}, [
    h("input", {
      type: "text",
      value,
      onInput: (event) => {
        value(event.target.value);
      },
    }),
    h(
      "button",
      {
        onClick: () => {
          todos.push(value());
          value("");
        },
      },
      "add"
    ),
  ]),
];

init(document.querySelector("#app"), newTree);

loop();
