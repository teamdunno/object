# Object

manipulating object? Nah, thats eazy!

This includes type-checking at runtime, so when you compare these objects, you are very VERY safe!

Unlike `Valibot`, `Zod` and others, this only checks types at JS. Some functions are supported to return as full Typescript types

## Current changelog
<details>

- Added `SeeMaker` class for typechecking at JS, including;
- Addded function `SeeMaker.see()` or default `see()` function, so you can access `.check()`, `.checkAsync()`, `.into()`, `.intoAsync()`
- Added `typer` to work on typechecking at JS
- Added `withTyper` for `typer` wrapper for `SeeMaker.see()` 

</details>

## Downloading from CDN

You can do that by checking the main branch of `Object.js`, and get the raw link

https://raw.githubusercontent.com/teamdunno/object/refs/heads/main/Object.js

or just download the release and get the `Object.js` file


## Installing

You can install this in Node! (Yes, without transpiling manually) By running

```shell
$ npx jsr add @dunno/object
```

Or in Yarn

```shell
$ yarn dlx jsr add @dunno/object
```

Or in pnpm

```shell
$ pnpm dlx jsr add @dunno/object
```

---

Or in Deno (they provide their built in JSR system, so just do this)

```shell
$ deno add jsr:@dunno/object
```

Or in Bun

```shell
$ bunx jsr add @dunno/object
```

## Importing

By default, the module dosent have a default export. You can do it like this

```js
import * as obj from "@dunno/object";
```

Or for [Deno](https://deno.com) users

```js
import * as obj from "jsr:@dunno/object";
```

## Contributing

If you want to report a bug, or suggestion, make a new issue under our
repository (see [Links](#links))

## License

This package is licensed under MIT. You can see at [LICENSE](./LICENSE)

## Links

- Repository https://github.com/teamdunno/object
- JSR page https://jsr.io/@dunno/object
- Live Playground: https://dash.deno.com/playground/dunno-object-example

## Example

You can also see our live playground (see [Links](#links))

#### Compare same non-primitive reference

```js
import * as obj from "@dunno/object";
// This is our reference one
const helloArray = ["Hello"];
// This variable just re-forwards the reference one
const hiArray = helloArray;
// The output should be `true`
console.log(obj.compareRef(helloArray, hiArray));
```

#### Compare diffrent non-primitive reference

```js
import * as obj from "@dunno/object";
// This is our reference one
const helloArray = ["Hello"];
/*
This is our reference two
(because it dosent re-forward reference one
like we do in the first example)
*/
const hiArray = ["Hello"];
/*
The output should be `false`.
Even though the value are exactly same
*/
console.log(obj.compareRef(helloArray, hiArray));
```

#### Detect if array was a normal array

```js
import * as obj from "@dunno/object";
// make a new, normal array
const test = ["Hello"];
/*
 The output should be `true`,
 because its using the normal Array class
*/
console.log(obj.isLiteralArray(test));
// The output should be `false`
console.log(obj.isExtendedArray(test));
```

#### Detect if array was an extended array class (Int16Array, or such)

```js
import * as obj from "@dunno/object";
// make a new Int16Array
const test = new Int16Array([8]);
// The output should be `false`
console.log(obj.isLiteralArray(test));
/*
 The output should be `true`,
 because its not a standard array class
*/
console.log(obj.isExtendedArray(test));
```
