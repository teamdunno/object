/*
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

/**
 * Check if object passed was an array
 *
 * @param obj The object that you want to check
 */
export function isArray<
  Expected extends ArrayLike<unknown>,
  Initial extends unknown,
>(obj: Initial): obj is Initial extends Expected ? Initial : never {
  // or typeof Object(obj)[Symbol.iterator] === 'function'
  if (!(Symbol.iterator in Object(obj))) return false;
  return true;
}

/**
 * Check if object passed was a extended array class (for example, Int8Array, Int8ClampedArray, etc)
 *
 * @param obj The object that you want to check
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
 */
export function isLiteralArray<
  Expected extends Array<unknown>,
  Initial extends unknown,
>(obj: Initial): obj is Initial extends Expected ? Initial : never {
  const res = isArray<Expected, Initial>(obj);
  if (!res) return false;
  return (obj instanceof Array);
}

/**
 * Accepted object for {@link newRef}
 */
export type NewRefAcceptedObjects =
  | unknown[]
  | Record<string | number | symbol, object>
  | boolean
  | string
  | number;

/**
 * Make a new reference from object (see {@link NewRefAcceptedObjects} for the accepted objects)
 *
 * @param obj The object that you want make a new reference from
 */
export function newRef<T extends NewRefAcceptedObjects>(obj: T): T {
  // check if array
  const arrayTest = isArray(obj);
  if (arrayTest && isLiteralArray(obj)) {
    return [...obj] as T;
  } // return new reference for object
  else if (!arrayTest && !isExtendedArray(obj) && typeof obj === "object") {
    return { ...obj };
  } else {
    // return as primitive
    const prim = obj.valueOf();
    return prim as T;
  }
}
