# Bloom

Bloom is a small toolkit for manipulating the DOM. It provides a declarative API and reactive behavior in combination with [S](https://github.com/adamhaile/S).

![](example.gif)

## Why

- **Small**: Less than 300 SLOC without S.
- **Minimal**: The API consists of only a handful of functions.
- **Fast**: Reactive updates only change the dependent part of the DOM with no diffing needed. This means reactive values can be animated in real-time with no performance loss.
- **Flexible**: Create anything from high performance animations to single-page apps.
- **Declarative**: Define the entire structure of your document with one data structure.
- **No compilation necessary**: Just import as an ES Module and use object literals to define nodes, no special syntax needed.
- **Obvious constraints**: no "rules of hooks" or other special conventions are necessary.
- **No implicit coupling**: satisfies the [Locality of Behavior](https://htmx.org/essays/locality-of-behaviour/) principle.

## API

### Create

`create(data: string | object): Node`

Creates a new `Node`. Pass a string to create a text node.

```js
create("Hello");
// #text "Hello"
```

Pass an object to create an element. Creates a div by default.

```js
create({});
// <div></div>
```

Create an element with attributes:

```js
create({
  tag: "a",
  href: "/",
  hidden: true,
  style: { opacity: 0.5 },
  classList: ["class-1", "class-2"],
  children: "Link",
  onClick: console.log,
});
// <a href="/" hidden style="opacity: 0.5;" class="class-1 class-2">Link</a>
```

Create children:

```js
create({ tag: "ul", children: [
  { tag: "li" children: "Alpha" },
  { tag: "li" children: "Bravo" },
  { tag: "li" children: "Charlie" },
]})
/*
  <ul>
    <li>Alpha</li>
    <li>Bravo</li>
    <li>Charlie</li>
  </ul>
*/
```

`create` accepts other `Nodes` for `children`.

```js
create({ children: create({ children: create("Hello") }) });
// <div><div>Hello</div></div>
```

Reactive attributes:

```js
const isHidden = S.data(false);
const element = create({ hidden: isHidden });
console.log(element);
// <div></div>
isHidden(true);
console.log(element);
// <div hidden></div>
```

Reactive child:

```js
const isToggled = S.data(false);
const element = create({ children: S(() => (isToggled() ? "On" : "Off")) });
console.log(element);
// <div>Off</div>
isToggled(true);
console.log(element);
// <div>On</div>
```

Children are updated intelligently. That is, child nodes will be updated instead of replaced when possible, using `patch` internally (see below). Reactive child arrays can be declared using [SArray](https://github.com/adamhaile/S-array):

```js
const items = SArray([]);
const element = create({
  tag: "ul",
  children: items.map((text) => ({
    tag: "li",
    children: text,
  })),
});
console.log(element);
// <ul></ul>
items.push("Alpha");
items.push("Bravo");
items.push("Charlie");
console.log(element);
/*
  <ul>
    <li>Alpha</li>
    <li>Bravo</li>
    <li>Charlie</li>
  </ul>
*/
items.reverse();
console.log(element);
/*
  <ul>
    <li>Charlie</li>
    <li>Bravo</li>
    <li>Alpha</li>
  </ul>
*/
```

### Assign

`assign(element: Element, props: object): Element`

Assigns properties to an existing element. Creating an element and then assigning props to it with `assign` is equivalent to creating the element with props using `create`.

```js
const props = {
  hidden: S.data(true),
  style: { opacity: 0.5 },
  classList: ["class-1", "class-2"],
};
const a = create({});
const b = assign(a, props);
const c = create(props);
console.log(a.isSameNode(b));
// true
console.log(b.isEqualNode(c));
// true
```

### Patch

`patch(parent: Element, data: any, current: Node | Array<Node>): Element`

Intelligently replaces the child nodes of `parent` with `Nodes` to match `data`. Create new children by passing an array:

```js
const data = [
  { tag: "li", children: "Alpha" },
  { tag: "li", children: "Bravo" },
  { tag: "li", children: "Charlie" },
];
const a = create({ tag: "ul" });
const b = patch(a, data);
console.log(a.isSameNode(b));
// true
console.log(b);
/*
  <li>Alpha</li>
  <li>Bravo</li>
  <li>Charlie</li>
*/
```

`patch` returns a `Node` or `Node` array representing the new children of `parent`. If `parent` already has children, they will be updated—not replaced—if possible.

```js
const a = create({ children: "On" });
const b = a.firstChild;
const c = patch(a, "Off");
const d = c.firstChild;
console.log(b.isSameNode(d));
// true
```

Patching `undefined`, a `boolean`, an empty array, or `null` will result in a placeholder `Comment` node.

```js
const element = create({ children: "Hello" });
patch(element, []);
console.log(element);
//<div><!--[]--></div>
```

`patch` accepts a third argument, `current`. If present, it will only patch over those nodes, and return just the children that were patched.

```js
const element = create({ children: ["Alpha", "Charlie"] });
console.log(element);
/*
  <div>
    #text Alpha
    #text Charlie
  </div>
*/
patch(element, ["Bravo", "Charlie"], element.lastChild());
console.log(element);
/*
  <div>
    #text Alpha
    #text Bravo
    #text Charlie
  </div>
*/
```

Use S and SArray to patch reactively. When updating it will remember the nodes it created last and pass them as the `current` argument.

```js
const items = SArray([]);
const placeholder = create({});
const element = create({
  children: [
    { tag: "span", children: "First node" },
    placeholder,
    { tag: "span", children: "Last node" },
  ],
});
patch(
  element,
  items.map((text) => ({ tag: "span", children: text })),
  placeholder
);
console.log(element);
/*
  <div>
    <span>First node</span>
    <!--[]-->
    <span>Last node</span>
  </div>
*/
items.push("Alpha");
items.push("Bravo");
items.push("Charlie");
console.log(element);
/*
  <div>
    <span>First node</span>
    <span>Alpha</span>
    <span>Bravo</span>
    <span>Charlie</span>
    <span>Last node</span>
  </div>
*/
```

## Examples

### Todo

Adapted from the [Surplus](https://github.com/adamhaile/surplus) simple todos example.

```js
const todos = SArray([]);
const inputText = S.data("");
const addTodo = () => {
  todos.push({ title: S.data(inputText()), done: S.data(false) });
  inputText("");
};

dom.patch(document.body, {
  children: [
    { tag: "h1", children: "Todo List" },
    {
      tag: "input",
      type: "text",
      onInput: (event) => void inputText(event.target.value),
      value: inputText,
    },
    { tag: "button", onClick: addTodo, children: "Add" },
    todos.map((todo) => ({
      children: [
        {
          tag: "input",
          type: "checkbox",
          onInput: todo.done,
          value: todo.done,
        },
        {
          tag: "input",
          type: "text",
          onInput: (event) => void todo.title(event.target.value),
          value: todo.title,
        },
        {
          tag: "button",
          onClick: () => todos.remove(todo),
          children: "Remove",
        },
      ],
    })),
  ],
});
```

### HyperScript

If you don't like writing object literal notation, you can create your own [HyperScript](https://github.com/hyperhype/hyperscript) inspired element factory.

```js
function h(tag, props, ...children) {
  return create({ tag, ...props, children });
}
const view = h(
  "ul",
  {},
  h("li", {}, "Alpha"),
  h("li", {}, "Bravo"),
  h("li", {}, "Charlie")
);
console.log(view);
/*
  <ul>
    <li>Alpha</li>
    <li>Bravo</li>
    <li>Charlie</li>
  </ul>
*/
```

Alternatively, you can create a separte factory for each tag name.

```js
const tagNames = [
  // ...
];
const elements = Object.fromEntries(
  tagNames.map((tag) => [
    tag,
    (props, ...children) => create({ tag, ...props, children }),
  ])
);
const view = ul({}, li({}, "Alpha"), li({}, "Bravo"), li({}, "Charlie"));
console.log(view);
/*
  <ul>
    <li>Alpha</li>
    <li>Bravo</li>
    <li>Charlie</li>
  </ul>
*/
```

## Planned Features

- Performance improvements
- Testing
- Bring your own stream library
- Declare [three.js](https://threejs.org/) scene graph as part of the object tree
- Tools for automatically attaching reactive behavior to an existing document
- Static site generator?

## Acknowledgements

- Adam Haile, [S](https://github.com/adamhaile/S), and [Surplus](https://github.com/adamhaile/surplus)
- Freak13's [Stage0](https://github.com/Freak613/stage0)
- [Composing Reactive Animations](http://conal.net/fran/tutorial.htm)
- [SolidJS: Reactivity to Rendering](https://indepth.dev/posts/1289/solidjs-reactivity-to-rendering)
- [The Misunderstood Roots of FRP Can Save Programming](https://futureofcoding.org/essays/dctp)
