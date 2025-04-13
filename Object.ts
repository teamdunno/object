class ParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParserError";
  }
}
export type FnOpt2<T, ReturnType> = (value: T) => ReturnType
export type AnyFnOpts2<T> = FnOpt2<T, boolean>;
export type AnyAsyncFnOpts2<T> = FnOpt2<T, Promise<boolean>>;
export type FnOpt1<T, ReturnType> = (value: T) => ReturnType
export type AnyFnOpts1<T> = FnOpt1<T, boolean>;
export type AnyAsyncFnOpts1<T> = FnOpt1<T, Promise<boolean>>;
/** "See" objects and check it */
export interface See<T extends unknown = unknown> {
  /**
   * Check if value was true or dosent containts error while parsing the object
   * 
   * @param fn The function to asert
   * 
   * @returns `this` value
   */
  check<ReturnType = See<T>>(fn: AnyFnOpts1<T>): ReturnType;
  check<ReturnType = See<T>>(fn: AnyFnOpts2<T>): ReturnType;

  /**
   * Check if value was true or dosent containts error while parsing the object. 
   * Supports `Promise`
   * 
   * @param fn The function to asert
   * 
   * @returns `this` value
   */
  checkAsync<ReturnType = See<T>>(fn: AnyAsyncFnOpts1<T>): ReturnType;
  checkAsync<ReturnType = See<T>>(fn: AnyAsyncFnOpts2<T>): ReturnType;

  /**
   * Make the type Into provided function that converts to desired object
   * 
   * @param fn The function to convert
   * 
   * @returns returned value from fn parameter
   */
  into<ReturnType>(fn: FnOpt2<T, ReturnType>): See<ReturnType>;

  /**
   * Make the type Into provided async function that converts to desired object. `Promise` is supported
   * 
   * @param fn The function to convert
   * 
   * @returns returned value from fn parameter
   */
  intoAsync<ReturnType>(fn: FnOpt2<T, Promise<ReturnType>>): Promise<See<ReturnType>>;
  /** Return to the chained object's value */
  raw(): T;
}
export class SeeMaker {
  /**
   * Make a {@link SeeMaker}
   * 
   * @param errorHook The error hook when the parsing at {@link SeeMaker.see} failed
   */
  constructor(errorHook?:((error: unknown) => unknown)) {
    this.errorHook = errorHook?errorHook:(v)=>{
      if (v instanceof ParserError) {
        throw v
      }
      throw TypeError("Incorrect type: "+v)
    };
  }
  errorHook: ((error: unknown) => unknown);
  /**
   * See objects and check it
   * 
   * @param value The value
   * 
   * @returns => "{@link See}" object
   */
  see<T extends unknown = unknown>(value: T): See<T> {
    const errorHook = this.errorHook
    return {
      check: function (fn) {
        try {
          const v = fn(value);
          if (typeof v === "boolean" && v) {
            return value;
          }
        } catch (e) {
          if (errorHook) errorHook(e)
          throw undefined
        }
      },
      checkAsync: async function (fn) {
        try {
          const v = await fn(value)
          if (typeof v === "boolean" && v) {
            return value
          }
        } catch (e) {
          if (errorHook) errorHook(e)
          // to trick the ide, even tho its always throwed at errorHook
          throw undefined
        }
      },
      into: function (fn) {
        try {
          return see(fn(value))
        } catch (e) {
          if (errorHook) errorHook(e)
          throw undefined
        }
      },
      intoAsync: async function (fn) {
        try {
          return see(await fn(value))
        } catch (e) {
          if (errorHook) errorHook(e)
          throw undefined
        }
      },
      raw: function () {
        return value
      }
    }
  }
}
// oh god
/** A wrapper for `(new SeeMaker()).see` with default error handling */
export const see:<T extends unknown = unknown>(value: T)=>See<T> = (new SeeMaker()).see

// export type Predicate<T> = (value: unknown) => value is T;
// type Infer<T> = T extends Predicate<infer U> ? U : never;

/** Type checker for objects. Dosen't provide "real" type (like Schema on Zod, Valibot, etc) */
export const typer = {
  enum: <T extends readonly string[]>(...values: T) => {
    return ((val: unknown): ParserError | undefined => {
      if (typeof val !== "string" || !values.includes(val as T[number])) {
        return new ParserError(`Value is not a valid enum: ${val}`);
      }
      return undefined; // Success
    });
  },

  tuple: (...types: ((v: unknown) => (ParserError | undefined))[]) => {
    return ((val: unknown): ParserError | undefined => {
      if (!Array.isArray(val)) {
        return new ParserError("Value is not an array");
      }
      if (val.length !== types.length) {
        return new ParserError(`Array length mismatch: expected ${types.length}, got ${val.length}`);
      }
      for (let i = 0; i < val.length; i++) {
        const result = types[i](val[i]);
        if (result instanceof ParserError) {
          return result; // Return the first error encountered
        }
      }
      return undefined; // Success
    });
  },

  string: () => {
    return ((val: unknown): ParserError | undefined => {
      if (typeof val !== "string") {
        return new ParserError(`Expected string, but got ${realTypeof(val)}`);
      }
      return undefined; // Success
    });
  },

  number: () => {
    return ((val: unknown): ParserError | undefined => {
      if (typeof val !== "number") {
        return new ParserError(`Expected number, but got ${realTypeof(val)}`);
      }
      return undefined; // Success
    });
  },

  optional: (pred: (v: unknown) => (ParserError | undefined)) => {
    return ((val: unknown): ParserError | undefined => {
      if (val === undefined) {
        return undefined; // Success
      }
      const result = pred(val);
      if (result instanceof ParserError) {
        return result; // Return the error if validation fails
      }
      return undefined; // Success
    });
  },

  object: <T extends Record<string, (v: unknown) => (ParserError | undefined)>>(shape: T) => {
    return ((val: unknown): ParserError | undefined => {
      if (typeof val !== "object" || val === null) {
        return new ParserError("Expected object, but got " + typeof val);
      }
      for (const key of Object.keys(shape) as (keyof T)[]) {
        // deno-lint-ignore no-explicit-any
        const validationResult = shape[key]((val as any)[key]);
        if (validationResult instanceof ParserError) {
          return validationResult; // Return the first error encountered
        }
      }
      return undefined; // Success
    });
  },

  record: (keyType: (v: unknown) => (ParserError | undefined), valueType: (v: unknown) => (ParserError | undefined)) => {
    return ((val: unknown): ParserError | undefined => {
      if (typeof val !== "object" || val === null) {
        return new ParserError("Expected object, but got " + typeof val);
      }
      for (const key in val) {
        const keyResult = keyType(key);
        if (keyResult instanceof ParserError) {
          return keyResult; // Return the error if key validation fails
        }
        // deno-lint-ignore no-explicit-any
        const valueResult = valueType((val as any)[key]);
        if (valueResult instanceof ParserError) {
          return valueResult; // Return the error if value validation fails
        }
      }
      return undefined; // Success
    });
  },

  or: (...preds: ((v: unknown) => (ParserError | undefined))[]) => {
    return ((val: unknown): ParserError | undefined => {
      for (const pred of preds) {
        const result = pred(val);
        if (result === undefined) {
          return undefined; // Success on first successful predicate
        }
      }
      return new ParserError(`Value does not match any of the predicates`); // No match found
    });
  },

  and: (...preds: ((v: unknown) => (ParserError | undefined))[]) => {
    return ((val: unknown): ParserError | undefined => {
      for (const pred of preds) {
        const result = pred(val);
        if (result instanceof ParserError) {
          return result; // Return the first error encountered
        }
      }
      return undefined; // Success
    });
  },
};
/** 
 * A {@link typer} wrapper for "{@link SeeMaker.see}" function 
 * 
 * This function may "fakes" the value, since it always returns true. Or else just throw the returned {@link ParseError}
 * 
 * (also, {@link See.check} can handle errors)
 * 
 * @param fn The typer function
 * 
 * @returns => {@link See.check} compatible function
*/
export function withTyper(fn: ((v: unknown) => (ParserError | undefined))): (v: unknown) => boolean {
  return (v) => {
    fn(v)
    return true;
  }
}
/**
 * Compare objects BY reference, can be any
 *
 * @param obj1 The first object that you want to compare
 * @param obj2 The second object that you want to compare
 */
export function compareRef<O1 extends unknown, O2 extends unknown>(
  obj1: O1,
  obj2: O2,
): boolean {
  if (typeof Object.is === "undefined") {
    // deno-lint-ignore ban-ts-comment
    //@ts-ignore
    return (obj1 === obj2);
  }
  return (Object.is(obj1, obj2));
}
/** Is type extended? */
export type Extended<Initial, Expected> = Initial extends Expected ? Initial : never

/**
 * Check if object was either `null` or `undefined`
 *
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isNull<
  Expected extends null | undefined,
  Initial extends unknown,
>(obj: Initial): obj is Extended<Initial, Expected> {
  if (typeof obj === "undefined") return true;
  // null will be asserted to object
  // see https://alexanderell.is/posts/typeof-null/
  if (typeof obj !== "object") return false;
  if (obj === null) return true
  return false
}

/**
 * Check if object passed was an array
 * 
 * It also has a guard for javascript version that dosent support `Symbol.asyncIterator`
 *
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isArray<
  Expected extends ArrayLike<unknown>,
  Initial extends unknown,
>(obj: Initial): obj is Extended<Initial, Expected> {
  const n = isNull(obj)
  if (n) return false
  if (typeof obj === "string") return false;
  if (typeof Symbol.asyncIterator !== "undefined") {
    const res = Symbol.asyncIterator in Object(obj)
    if (res) return true;
  }
  if (!(Symbol.iterator in Object(obj))) {
    return false
  };
  return true;
}

/**
 * Check if object passed was a extended array class (for example, Int8Array, Int8ClampedArray, etc) that dosent include normal Array class
 *
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isExtendedArray<
  Expected extends Exclude<ArrayLike<unknown>, Array<unknown>>,
  Initial extends unknown,
>(
  obj: Initial,
): obj is Initial extends Array<unknown> ? never
: Initial extends Expected ? Initial
: never {
  const res = isArray<Expected, Initial>(obj);
  if (!res) return false;
  return !(obj instanceof Array);
}

/**
 * Check if object passed was a literal array (Not extended/custom array)
 *
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isLiteralArray<
  Expected extends Array<unknown>,
  Initial extends unknown,
>(obj: Initial): obj is Extended<Initial, Expected> {
  const res = isArray<Expected, Initial>(obj);
  if (!res) return false;
  return (obj instanceof Array);
}

/**
 * Check if object passed was an synced array
 *
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isSyncArray<
  Expected extends ArrayLike<unknown>,
  Initial extends unknown,
>(obj: Initial): obj is Extended<Initial, Expected> {
  const n = isNull(obj)
  if (n) return false
  if (typeof obj === "string") return false;
  // or typeof Object(obj)[Symbol.iterator] === 'function'
  if (!(Symbol.iterator in Object(obj))) {
    return false
  };
  return true;
}

/**
 * Check if object passed was a synced, extended array class (for example, Int8Array, Int8ClampedArray, etc) that dosent include normal Array class
 *
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isSyncExtendedArray<
  Expected extends Exclude<ArrayLike<unknown>, Array<unknown>>,
  Initial extends unknown,
>(
  obj: Initial,
): obj is Initial extends Array<unknown> ? never
: Initial extends Expected ? Initial
: never {
  const res = isSyncArray<Expected, Initial>(obj);
  if (!res) return false;
  return !(obj instanceof Array);
}

/**
 * Check if object passed was a synced, literal array (Not extended/custom array)
 *
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isSyncLiteralArray<
  Expected extends Array<unknown>,
  Initial extends unknown,
>(obj: Initial): obj is Extended<Initial, Expected> {
  const res = isSyncArray<Expected, Initial>(obj);
  if (!res) return false;
  return (obj instanceof Array);
}

/**
 * Check if object passed was an asyncronous array
 * 
 * It also has a guard for javascript version that dosent support `Symbol.asyncIterator`
 *
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isAsyncArray<
  Expected extends ArrayLike<unknown>,
  Initial extends unknown,
>(obj: Initial): obj is Extended<Initial, Expected> {
  const n = isNull(obj)
  if (n) return false
  if (typeof obj === "string") return false;
  // or typeof Object(obj)[Symbol.iterator] === 'function'
  if (typeof Symbol.asyncIterator !== "undefined") {
    return Symbol.asyncIterator in Object(obj)
  }
  return false;
}

/**
 * Check if object passed was a asyncronous, extended array class (for example, Int8Array, Int8ClampedArray, etc) that dosent include normal Array class
 *
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isAsyncExtendedArray<
  Expected extends Exclude<ArrayLike<unknown>, Array<unknown>>,
  Initial extends unknown,
>(
  obj: Initial,
): obj is Initial extends Array<unknown> ? never
: Initial extends Expected ? Initial
: never {
  const res = isAsyncArray<Expected, Initial>(obj);
  if (!res) return false;
  return !(obj instanceof Array);
}

/**
 * Check if object passed was a asyncronous, literal array (Not extended/custom array)
 *
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isAsyncLiteralArray<
  Expected extends Array<unknown>,
  Initial extends unknown,
>(obj: Initial): obj is Extended<Initial, Expected> {
  const res = isAsyncArray<Expected, Initial>(obj);
  if (!res) return false;
  return (obj instanceof Array);
}

// for empty arrays

/**
 * Check if array was empty
 * 
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isEmptyArray<
  Initial extends unknown
>(obj: Initial): boolean {
  if (!isArray(obj)) return false
  if (obj.length < 1) return true;
  return false
}

/**
 * Check if literal array was empty
 *
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isEmptyLiteralArray<
  Initial extends unknown
>(obj: Initial): boolean {
  if (!isLiteralArray(obj)) return false
  if (obj.length < 1) return true;
  return false
}

/**
 * Check if extended array was empty
 *
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isEmptyExtendedArray<
  Initial extends unknown
>(obj: Initial): boolean {
  if (!isExtendedArray(obj)) return false
  if (obj.length < 1) return true;
  return false
}


/**
 * Check if synced array was empty
 * 
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isEmptySyncArray<
  Initial extends unknown
>(obj: Initial): boolean {
  if (!isSyncArray(obj)) return false
  if (obj.length < 1) return true;
  return false
}

/**
 * Check if synced, literal array was empty
 *
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isEmptySyncLiteralArray<
  Initial extends unknown
>(obj: Initial): boolean {
  if (!isSyncLiteralArray(obj)) return false
  if (obj.length < 1) return true;
  return false
}

/**
 * Check if synced, extended array was empty
 *
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isEmptySyncExtendedArray<
  Initial extends unknown
>(obj: Initial): boolean {
  if (!isSyncExtendedArray(obj)) return false
  if (obj.length < 1) return true;
  return false
}


/**
 * Check if asyncronous array was empty
 * 
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isEmptyAsyncArray<
  Initial extends unknown
>(obj: Initial): boolean {
  if (!isAsyncArray(obj)) return false
  if (obj.length < 1) return true;
  return false
}

/**
 * Check if asyncronous, literal array was empty
 *
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isEmptyAsyncLiteralArray<
  Initial extends unknown
>(obj: Initial): boolean {
  if (!isAsyncLiteralArray(obj)) return false
  if (obj.length < 1) return true;
  return false
}

/**
 * Check if asyncronous, extended array was empty
 *
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isEmptyAsyncExtendedArray<
  Initial extends unknown
>(obj: Initial): boolean {
  if (!isAsyncExtendedArray(obj)) return false
  if (obj.length < 1) return true;
  return false
}

/**
 * Check if object was empty, and aren't null
 *
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isEmptyObject<
  Expected extends Record<string, unknown>,
  Initial extends unknown,
>(obj: Initial): obj is Extended<Initial, Expected> {
  const n = isNull(obj)
  if (n) return false
  if (typeof obj !== "object") return false;
  if (Object.keys(obj as (Initial & object)).length < 1) return true;
  return false
}

/**
 * Check if string was empty
 * 
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isEmptyString<
  Initial extends unknown
>(obj: Initial): boolean {
  if (isNull(obj)) return false;
  if (typeof obj !== "string") return false;
  if (obj.length < 1) return true;
  return false
}

/**
 * Check if object passed was a class
 *
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isObject<
  Expected extends Record<string | number | symbol, unknown>,
  Initial extends unknown,
>(obj: Initial): obj is Extended<Initial, Expected> {
  if (typeof obj === "undefined") return false;
  // class is actually a function, since js picks up the constructor
  if (typeof obj !== "object") return false;
  if (obj === null || (Symbol.iterator in Object(obj))) {
    return false
  } else {
    return true
  }
}

/**
 * Check if object, string, or array was empty
 * 
 * ℹ️ **Note**: This is different than {@link isEmptyObject}, since it was reiterating to some type of objects (`array`, `string`, etc)
 * 
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isObjectEmpty<
  Initial extends unknown
>(obj: Initial): boolean {
  if (isEmptyString(obj)) return true;
  if (isEmptyArray(obj)) return true;
  if (isEmptyObject(obj)) return true;
  return false
}

/**
 * Check if object passed was a function
 *
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isFunction<
  Expected extends (...args: unknown[]) => unknown,
  Initial extends unknown,
>(obj: Initial): obj is Extended<Initial, Expected> {
  if (typeof obj === "undefined") return false;
  // class is actually a function, since js picks up the constructor
  if (typeof obj !== "function") return false;
  const propertyNames = Object.getOwnPropertyNames(obj);
  return !propertyNames.includes('prototype');
}


/**
 * Check if object passed was a class
 *
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isClass<
  Expected extends { new(...args: unknown[]): unknown },
  Initial extends unknown,
>(obj: Initial): obj is Extended<Initial, Expected> {
  if (typeof obj === "undefined") return false;
  // class is actually a function, since js picks up the constructor
  if (typeof obj !== "function") return false;
  const propertyNames = Object.getOwnPropertyNames(obj);
  return propertyNames.includes('prototype');
}

/**
 * Make a new reference from object 
 * 
 * ℹ️ **Note**: `Function`, `class`, `null`, and `undefined` objects returned again as fallback
 *
 * @param obj The object that you want make a new reference from
 * @returns New reference (or same reference (see Note)) from object
 */
export function newRef<T>(obj: T): T {
  // add a fallback for non-refable
  // also, class is actually a function. Since js picks up the constructor
  if (
    isNull(obj)
  ) {
    return obj as T
  }
  // return new reference for object
  if (isExtendedArray(obj)) {
    return obj as T
  } else if (isLiteralArray(obj)) {
    return [...obj] as T;
  }
  if (typeof obj === "object") {
    return { ...obj };
  } else if (typeof obj === "function") {
    return obj
  }
  const prim = (obj as { valueOf: () => unknown }).valueOf();
  return prim as T;
}
/** Track object */
export interface Track<Value> {
  /** The value */
  value: Value
  /** 
   * Listen only on changes
   * 
   * ℹ️ **Note**: This is different than {@link Track.observe} since it wasn't triggered on listener initialization
   * 
   * @param fn The function that you want to listen
  */
  watch(fn: (val: Value) => void): void
  /** 
   * Trigger once, and listen on changes
   * 
   * ℹ️ **Note**: This is different than {@link Track.watch} since it trigger first on listener initialization
   * 
   * @param fn The function that you want to listen
  */
  observe(fn: (val: Value) => void): void
  /** 
   * "Does this function has been added inside {@link Track}?"
   * 
   * @param fn The function that you want to see inside {@link Track}
  */
  hasFn(fn: (val: Value) => void): boolean
  /** Max event listeners. Can be `undefined` if dosen't set */
  maxFn?: number
  /** 
   * Remove function by reference
   * 
   * @param fn The function that you want to remove inside {@link Track}
  */
  remove(fn: (val: Value) => void): void,
  /** Remove all function listeners */
  removeAll(): void
}
/**
 * Track object
 * 
 * ℹ️ **Note**: This function dosent uses {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy Proxy}.
 * So, if you want to trigger changes (for object and array), use {@link newRef}
 * 
 * @param value The value
 * @param maxFn (Optional) Maximum event listeners. If the listener limit has exceeded by that argument, it would be silently discarded from {@link Track.watch} and {@link Track.observe} unless you clean it
 * @returns => {@link Track} object
 */
export function track<T extends unknown>(value: T, maxFn?: number): Track<T> {
  let _listOfEvs: ((val: T) => void)[] = []
  let v = value
  return {
    get value() { return v },
    set value(newV) {
      v = newV
      if (_listOfEvs.length < 1) {
        return
      }
      for (let i = 0; i < _listOfEvs.length; i++) {
        _listOfEvs[i](v)
      }
    },
    watch(fn) {
      if (maxFn && _listOfEvs.length >= maxFn) {
        return
      }
      _listOfEvs.push(fn)
    },
    observe(fn) {
      if (maxFn && _listOfEvs.length >= maxFn) {
        return
      }
      fn(v)
      _listOfEvs.push(fn)
    },
    hasFn(fn) {
      return _listOfEvs.includes(fn)
    },
    remove(fn) {
      _listOfEvs = _listOfEvs.filter((currFn) => {
        return compareRef(currFn, fn)
      })
    },
    removeAll() {
      _listOfEvs = []
    }
  }
}

// for typeof. https://stackoverflow.com/a/69655302/22147523
const _internalAnyTypeof = typeof (0 as unknown);
/** enum of `typeof` keyword. Managed internally but can be used as possible values of `typeof` */
export type Typeof = typeof _internalAnyTypeof;

/** enum for {@link realTypeof} */
export type RealTypeof = "class" | "array" | "null" | Typeof
/**
 * Get a real `typeof`! (See docs for more info)
 * 
 * @param obj The object that you want make a new reference from
 * @returns enum {@link RealTypeof}
 */
export function realTypeof(obj: unknown): RealTypeof {
  const t = typeof obj
  switch (t) {
    case ("object"): {
      if (obj === null) {
        return "null"
      } else if (Symbol.iterator in Object(obj)) {
        return "array"
      } else {
        return "object"
      }
    }
    case ("function"): {
      const propertyNames = Object.getOwnPropertyNames(obj);
      if (propertyNames.includes('prototype') && !propertyNames.includes('arguments')) {
        return "class"
      } else {
        return "function"
      }
    }
    default: {
      return t;
    }
  }
}
