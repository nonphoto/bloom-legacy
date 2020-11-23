import { patch } from "./dom.js";
import S from "https://cdn.skypack.dev/s-js";
import SArray from "https://cdn.skypack.dev/s-array";

S.root(() => {
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
    {
      children: [seconds, value(() => (seconds() % 3 === 0 ? null : "!"))],
    },
    todos,
    {
      tag: "form",
      action: "#",
      children: [
        {
          tag: "input",
          type: "text",
          value: inputValue,
          onInput: (event) => void inputValue(event.target.value),
        },
        {
          tag: "button",
          type: "submit",
          onClick: () => {
            todos.push(inputValue());
            inputValue("");
          },
          children: "add",
        },
      ],
    },
  ];

  patch(document.querySelector("#app"), app);

  loop(0);
});
