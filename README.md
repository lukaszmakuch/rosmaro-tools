# rosmaro-tools

CLI utilities for [Rosmaro](https://rosmaro.js.org).

To get started, get [npm](https://npmjs.com) and then simply type the following command in your terminal:
```
$ npx rosmaro-tools
```

Available commands are described below.

## npx rosmaro-tools bindings:build path/to/the/bindings/folder

Generates a JavaScript file exporting a factory function that takes an object and returns another object which is meant to be used as [Rosmaro bindings](https://rosmaro.js.org/doc/#building-a-model-bindings).

Let's say we have a [Rosmaro model](https://rosmaro.js.org/doc/#building-a-model) which consists of the following nodes:
- `main`
- `main:A`
- `main:B`
- `main:B:A`
- `main:B:B`

Rosmaro expects the `bindings` object to reflect the node hierarchy, like this:
```javascript
{
  'main': {handler, lens, nodes},
  'main:A': {handler, lens, nodes},
  'main:B': {handler, lens, nodes},
  'main:B:A': {handler, lens, nodes},
  'main:B:B': {handler, lens, nodes},
}
```

As soon as the number of nodes grows, writing this by hand may be cumbersome. `rosmaro-tools` solves this problem by utilizing a directory-based convention. 

Instead of manually building the `bindings` object, we create a directory which structure reflects the hierarchy of nodes of our graph:
```
$ tree -U
.
└── main
    ├── index.js
    ├── A
    │   └── index.js
    └── B
        ├── anotherFile.js
        ├── index.js
        ├── A
        │   └── index.js
        └── B
            └── index.js
```

The `main/index.js` file contains code related to the `main` binding. The `main/A/index.js` file contains code related to the `main:A` binding and so on. Files named differently are ignored by the generator. However, they may still be imported by `index.js` files.

Every `index.js` file is meant to have one default export - a binding factory. It looks like this:
```javascript
export default (options) => ({

  // Somehow define these three.
  handler,
  lens,
  nodes
  
});
```

It's basically exporting a function that takes an arbitrary value and returns an object which is a [Rosmaro binding](https://rosmaro.js.org/doc/#bindings-node-bindings). The `options` object is explained below.

As soon as we run `$ npx rosmaro-tools bindings:build path/to/the/bindings/folder`, it's going to generate an `index.js` file in the root directory:
```
$ npx rosmaro-tools bindings:build .
Generated index.js!
$ tree -U
.
├── index.js
└── main
    ├── index.js
    ├── A
    │   └── index.js
    └── B
        ├── anotherFile.js
        ├── index.js
        ├── A
        │   └── index.js
        └── B
            └── index.js
```

This **automatically generated file** exports a function taking an arbitrary value and returning an object with keys named after graph nodes. It follows this pattern:
```
export default (options) => ({
  'main': <the function exported from the main/index.js file>(options),
  'main:A': <the function exported from the main/A/index.js file>(options),
  'main:B': <the function exported from the main/B/index.js file>(options),
  'main:B:A': <the function exported from the main/B/A/index.js file>(options),
  'main:B:B': <the function exported from the main/B/B/index.js file>(options),
});
``` 

As we can see, it calls binding factories from each `index.js` file and builds an object which may be used as `bindings` for Rosmaro:

```javascript
import rosmaro from 'rosmaro';
// ...
// This will import the generated index.js file.
import makeBindings from './bindings';

const bindings = makeBindings({parameters, passed, to, bindings, factories});
const model = rosmaro({graph, bindings});
```

Please remember that you can use symlinks in order to reuse bindings:

```
$ ln -s ToReuse Reused
```
