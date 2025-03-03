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
type Extended<Initial, Expected> = Initial extends Expected ? Initial : never

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
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isArray<
  Expected extends ArrayLike<unknown>,
  Initial extends unknown,
>(obj: Initial): obj is Extended<Initial, Expected> {
  const n = isNull(obj)
  if (n) return false
  // or typeof Object(obj)[Symbol.iterator] === 'function'
  if (!(Symbol.iterator in Object(obj))) return false;
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
 * Check if literal array was empty
 *
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isEmptyLiteralArray<
  Initial extends unknown
>(obj: Initial): boolean {
  if (!isLiteralArray(obj)) return false
  if (obj.length < 1) return false;
  return true
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
  if (Object.keys(obj as (Initial & object)).length < 1) return false;
  return true
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
  if (obj.length < 1) return false;
  return true
}

/**
 * Check if array was empty
 * 
 * ℹ️ **Note**: This dosen't uses {@link isEmptyExtendedArray} nor {@link isEmptyLiteralArray}. 
 * It only check using {@link isArray}, then get the length
 * 
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isEmptyArray<
  Initial extends unknown
>(obj: Initial): boolean {
  if (!isArray(obj)) return false
  if (obj.length < 1) return false;
  return true
}

/**
 * Check if literal array was empty
 *
 * @param obj The object that you want to check
 * @returns boolean
 */
export function isEmptyExtendedArray<
  Initial extends unknown
>(obj: Initial): boolean {
  if (!isExtendedArray(obj)) return false
  if (obj.length < 1) return false;
  return true
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
  return (propertyNames.includes('prototype') && !propertyNames.includes('arguments'));
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
  if (isLiteralArray(obj)) {
    return [...obj] as T;
  } else if (typeof obj === "object") {
    return { ...obj };
  }
  if (typeof obj === "function") {
    return obj
  }
  const prim = (obj as { valueOf: () => unknown }).valueOf();
  return prim as T;
}
/** Track object */
export interface Track<Value, Max extends number|undefined=undefined> {
  /** The value */
  value:Value
  /** 
   * Listen only on changes
   * 
   * ℹ️ **Note**: This is different than {@link Track.observe} since it wasn't triggered on listener initialization
   * 
   * @param fn The function that you want to listen
  */
  watch(fn:(val:Value)=>void):void
  /** 
   * Trigger once, and listen on changes
   * 
   * ℹ️ **Note**: This is different than {@link Track.watch} since it trigger first on listener initialization
   * 
   * @param fn The function that you want to listen
  */
  observe(fn:(val:Value)=>void):void
  /** 
   * "Does this function has been added inside {@link Track}?"
   * 
   * @param fn The function that you want to see inside {@link Track}
  */
  hasFn(fn:(val:Value)=>void):boolean
  /** Max event listeners. Can be `undefined` if dosen't set */
  maxFn?:number
  /** 
   * Remove function by reference
   * 
   * @param fn The function that you want to remove inside {@link Track}
  */
  remove(fn:(val:Value)=>void):void,
  /** Remove all function listeners */
  removeAll():void
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
export function track<T extends unknown, Max extends number|undefined>(value:T, maxFn?:Max):Track<T, Max> {
  let _listOfEvs : ((val:T)=>void)[] = []
  let v = value
  return {
    get value(){return v},
    set value(newV){
      v = newV
      if (_listOfEvs.length<1) {
        return
      }
      for (let i=0;i<_listOfEvs.length;i++) {
        _listOfEvs[i](v)
      }
    },
    watch(fn){
      if (maxFn && _listOfEvs.length>=maxFn) {
        return
      }
      _listOfEvs.push(fn)
    },
    observe(fn){
      if (maxFn && _listOfEvs.length>=maxFn) {
        return
      }
      fn(v)
      _listOfEvs.push(fn)
    },
    hasFn(fn){
      return _listOfEvs.includes(fn)
    },
    remove(fn) {
      _listOfEvs = _listOfEvs.filter((currFn)=>{
        return compareRef(currFn, fn)
      })
    },
    removeAll() {
      _listOfEvs = []
    }
  }
}

// for typeof. https://stackoverflow.com/a/69655302/22147523
const _dummyVar = typeof (1 as unknown);
/** enum for `typeof` keyword */
export type Typeof = typeof _dummyVar;

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