<p align="center">
    <img src="https://user-images.githubusercontent.com/6702424/80216211-00ef5280-863e-11ea-81de-59f3a3d4b8e4.png">  
</p>
<p align="center">
    <i></i>
    <br>
    <br>
    <img src="https://github.com/garronej/typed-builder/workflows/ci/badge.svg?branch=master">
    <img src="https://img.shields.io/bundlephobia/minzip/typed-builder">
    <img src="https://img.shields.io/npm/dw/typed-builder">
    <img src="https://img.shields.io/npm/l/typed-builder">
</p>
<p align="center">
  <a href="https://github.com/sonhanguyen/typed-builder">Home</a>
  -
  <a href="https://github.com/sonhanguyen/typed-builder">Documentation</a>
</p>

# Install / Import

```bash
$ npm install --save typed-builder
```

```typescript
import { myFunction, myObject } from "typed-builder";
```

Specific imports:

```typescript
import { myFunction } from "typed-builder/myFunction";
import { myObject } from "typed-builder/myObject";
```

## Import from HTML, with CDN

Import it via a bundle that creates a global ( wider browser support ):

```html
<script src="//unpkg.com/typed-builder/bundle.min.js"></script>
<script>
    const { myFunction, myObject } = typed_builder;
</script>
```

Or import it as an ES module:

```html
<script type="module">
    import {
        myFunction,
        myObject,
    } from "//unpkg.com/typed-builder/zz_esm/index.js";
</script>
```

_You can specify the version you wish to import:_ [unpkg.com](https://unpkg.com)

## Contribute

```bash
npm install
npm run build
npm test
```
