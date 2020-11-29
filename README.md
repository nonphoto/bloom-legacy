# Bloom

Bloom is a small toolkit for manipulating the DOM. It provides a declarative API and reactive behavior in combination with [S](https://github.com/adamhaile/S).

## API

### `create`

Creates a new `Node`.

#### Create a text node

```js
create("Hello");
// #text "Hello"
```

#### Create an element

```js
create({});
// <div></div>
```

#### Create an element with attributes

```js
create({
  tag: "a",
  href: "/",
  hidden: true,
  style: { opacity: 0.5 },
  classList: ["class-1", "class-2"],
  children: "Link",
});
// <a href="/" hidden style="opacity: 0.5;" class="class-1 class-2">Link</a>
```

#### Create children

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

#### `create` accepts other `Nodes`

```js
create({ children: create({ children: create("Hello") }) });
// <div><div>Hello</div></div>
```

#### Reactive attributes

```js
const isHidden = S.data(false);
const element = create({ hidden: isHidden });
console.log(element);
// <div></div>
isHidden(true);
console.log(element);
// <div hidden></div>
```

#### Reactive child

```js
const isToggled = S.data(false);
const element = create({ children: S(() => (isToggled() ? "On" : "Off")) });
console.log(element);
// element === <div>Off</div>
isToggled(true);
console.log(element);
// element === <div>On</div>
```

#### Reactive children

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
```

### `assign`

#### Assign properties to an `Element`

```js
const element = create({ tag: "a" });
console.log(element);
// <a></a>
assign(
  {
    href: "/",
    hidden: true,
    style: { opacity: 0.5 },
    classList: ["class-1", "class-2"],
    children: "Link",
  },
  element
);
console.log(element);
// <a href="/" hidden style="opacity: 0.5;" class="class-1 class-2">Link</a>
```

#### Reactive assignment

```js
const isToggled = S.data(false);
const element = create({});
assign(
  {
    dataset: { isToggled },
    children: S(() => (isToggled() ? "On" : "Off")),
  },
  element
);
console.log(element);
// element === <div data-is-toggled="false">Off</div>
isToggled(true);
console.log(element);
// element === <div data-is-toggled="true">On</div>
```

### `patch`

Intelligently replaces the child nodes of an `Element`
