import { element, render } from "./dom.js";
import S from "https://cdn.skypack.dev/s-js";
import SArray from "https://cdn.skypack.dev/s-array";

function value(fn) {
  const s = S.value(S.sample(fn));
  S(() => s(fn()));
  return s;
}

const inputValue = S.data("");
const todos = SArray([]);
S(() => {
  console.log(todos());
});

const time = S.value(0);
const loop = (t) => {
  time(t);
  requestAnimationFrame(loop);
};

const seconds = value(() => Math.floor(time() * 0.001));

const app = () => [
  element(
    "div",
    seconds,
    value(() => (seconds() % 3 === 0 ? null : "a"))
  ),
  element("div", "b", ["c"], 3),
  element("div", { style: { "--value": seconds } }, todos),
  element("form", { action: "#" }, [
    element("input", {
      type: "text",
      value: inputValue,
      onInput: (event) => {
        inputValue(event.target.value);
      },
    }),
    element(
      "button",
      {
        type: "submit",
        onClick: () => {
          todos.push(inputValue());
          inputValue("");
        },
      },
      "add"
    ),
  ]),
];

render(app, document.querySelector("#app"));

loop(0);
