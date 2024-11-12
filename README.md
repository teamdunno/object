# Object
manipulating object? Nah, thats eazy!
## Installing 
You can install this in Node! (Yes, without transpilling) By running
```shell
$ npx jsr add @cupglassdev/object
```
Or in Yarn
```shell
$ yarn dlx jsr add @cupglassdev/object
```
Or in pnpm
```shell
$ pnpm dlx jsr add @cupglassdev/object
```
---
Or in Deno (they provide their built in JSR system, so just do this)
```shell
$ deno add @cupglassdev/object
```
Or in Bun
```shell
$ bunx jsr add @cupglassdev/object
```
## Importing
By default, the module dosent have a default export. You can do it like this
```js
import * as obj from "@cupglassdev/object"
```
Or for [Deno](https://deno.com) users
```js
import * as obj from "jsr:@cupglassdev/object"
```
## (Deno only) Test for production
This package is included with the [test.ts](./test.ts) file. If you want to run it, do these
- Download the test file from our original repository https://github.com/cupglassDEV/object/blob/main/test.ts
- Run the deno Test command
```shell
$ deno test /path/to/test.ts
```
- Then just see the result

However, Deno can exchange the test result into a report file. For example, JUnit, and other stuff
https://docs.deno.com/runtime/fundamentals/testing/#reporters
## Contributing
If you want to report a bug, or suggestion, make a new issue under our repository

- New issue https://github.com/cupglassDEV/object/issues/new/choose
- Contributing/pull request https://github.com/cupglassDEV/object/compare
## License
This package is licensed under MIT. You can see at [LICENSE](./LICENSE)
## Example
#### Compare same non-primitive reference
```js
import * as obj from "@cupglassdev/object"
// This is our reference one
const helloArray = ['Hello']
// This variable just re-forwards the reference one
const hiArray = helloArray
// The output should be `true`
console.log(obj.refCompare(helloArray, hiArray))
```
#### Compare diffrent non-primitive reference
```js
import * as obj from "@cupglassdev/object"
// This is our reference one
const helloArray = ['Hello']
/* 
This is our reference two 
(because it isnt re-forward reference one 
like we do in the first example)
*/
const hiArray = ['Hello']
/*
The output should be `false`. 
Even though the value are exactly same
*/
console.log(obj.refCompare(helloArray, hiArray))
```
#### Detect if array was a normal array
```js
import * as obj from "@cupglassdev/object"
// make a new, normal array
const test = ["Hello"]
/*
 The output should be `true`,
 because its using the normal Array class
*/
console.log(obj.isLiteralArray(test))
// The output should be `false`
console.log(obj.isExtendedArray(test))
```
#### Detect if array was an extended array class (Int16Array, or such)
```js
import * as obj from "@cupglassdev/object"
// make a new Int16Array
const test = new Int16Array([8])
// The output should be `false`
console.log(obj.isLiteralArray(test))
/*
 The output should be `true`, 
 because its not a standard array class
*/
console.log(obj.isExtendedArray(test))
```