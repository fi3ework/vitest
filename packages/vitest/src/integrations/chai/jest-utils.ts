/* eslint-disable eslint-comments/no-unlimited-disable */

/*
Copyright (c) 2008-2016 Pivotal Labs

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

// disabled because copyrighted
/* eslint-disable */

import type {Tester} from './types';

export const isObject = (val: any): val is object => toString.call(val) === '[object Object]'

// Extracted out of jasmine 2.5.2
export function equals(
  a: unknown,
  b: unknown,
  customTesters?: Array<Tester>,
  strictCheck?: boolean,
): boolean {
  customTesters = customTesters || [];
  return eq(a, b, [], [], customTesters, strictCheck ? hasKey : hasDefinedKey);
}

const functionToString = Function.prototype.toString;

function isAsymmetric(obj: any) {
  return !!obj && isA('Function', obj.asymmetricMatch);
}

function asymmetricMatch(a: any, b: any) {
  var asymmetricA = isAsymmetric(a),
    asymmetricB = isAsymmetric(b);

  if (asymmetricA && asymmetricB) {
    return undefined;
  }

  if (asymmetricA) {
    return a.asymmetricMatch(b);
  }

  if (asymmetricB) {
    return b.asymmetricMatch(a);
  }
}

// Equality function lovingly adapted from isEqual in
//   [Underscore](http://underscorejs.org)
function eq(
  a: any,
  b: any,
  aStack: Array<unknown>,
  bStack: Array<unknown>,
  customTesters: Array<Tester>,
  hasKey: any,
): boolean {
  var result = true;

  var asymmetricResult = asymmetricMatch(a, b);
  if (asymmetricResult !== undefined) {
    return asymmetricResult;
  }

  for (var i = 0; i < customTesters.length; i++) {
    var customTesterResult = customTesters[i](a, b);
    if (customTesterResult !== undefined) {
      return customTesterResult;
    }
  }

  if (a instanceof Error && b instanceof Error) {
    return a.message == b.message;
  }

  if (Object.is(a, b)) {
    return true;
  }
  // A strict comparison is necessary because `null == undefined`.
  if (a === null || b === null) {
    return a === b;
  }
  var className = Object.prototype.toString.call(a);
  if (className != Object.prototype.toString.call(b)) {
    return false;
  }
  switch (className) {
    case '[object Boolean]':
    case '[object String]':
    case '[object Number]':
      if (typeof a !== typeof b) {
        // One is a primitive, one a `new Primitive()`
        return false;
      } else if (typeof a !== 'object' && typeof b !== 'object') {
        // both are proper primitives
        return Object.is(a, b);
      } else {
        // both are `new Primitive()`s
        return Object.is(a.valueOf(), b.valueOf());
      }
    case '[object Date]':
      // Coerce dates to numeric primitive values. Dates are compared by their
      // millisecond representations. Note that invalid dates with millisecond representations
      // of `NaN` are not equivalent.
      return +a == +b;
    // RegExps are compared by their source patterns and flags.
    case '[object RegExp]':
      return a.source === b.source && a.flags === b.flags;
  }
  if (typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }

  // Use DOM3 method isEqualNode (IE>=9)
  if (isDomNode(a) && isDomNode(b)) {
    return a.isEqualNode(b);
  }

  // Used to detect circular references.
  var length = aStack.length;
  while (length--) {
    // Linear search. Performance is inversely proportional to the number of
    // unique nested structures.
    // circular references at same depth are equal
    // circular reference is not equal to non-circular one
    if (aStack[length] === a) {
      return bStack[length] === b;
    } else if (bStack[length] === b) {
      return false;
    }
  }
  // Add the first object to the stack of traversed objects.
  aStack.push(a);
  bStack.push(b);
  // Recursively compare objects and arrays.
  // Compare array lengths to determine if a deep comparison is necessary.
  if (className == '[object Array]' && a.length !== b.length) {
    return false;
  }

  // Deep compare objects.
  var aKeys = keys(a, hasKey),
    key;
  var size = aKeys.length;

  // Ensure that both objects contain the same number of properties before comparing deep equality.
  if (keys(b, hasKey).length !== size) {
    return false;
  }

  while (size--) {
    key = aKeys[size];

    // Deep compare each member
    result =
      hasKey(b, key) &&
      eq(a[key], b[key], aStack, bStack, customTesters, hasKey);

    if (!result) {
      return false;
    }
  }
  // Remove the first object from the stack of traversed objects.
  aStack.pop();
  bStack.pop();

  return result;
}

function keys(obj: object, hasKey: (obj: object, key: string) => boolean) {
  var keys = [];
  for (var key in obj) {
    if (hasKey(obj, key)) {
      keys.push(key);
    }
  }
  return keys.concat(
    (Object.getOwnPropertySymbols(obj) as Array<any>).filter(
      symbol =>
        (Object.getOwnPropertyDescriptor(obj, symbol) as PropertyDescriptor)
          .enumerable,
    ),
  );
}

function hasDefinedKey(obj: any, key: string) {
  return hasKey(obj, key) && obj[key] !== undefined;
}

function hasKey(obj: any, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function isA(typeName: string, value: unknown) {
  return Object.prototype.toString.apply(value) === '[object ' + typeName + ']';
}

function isDomNode(obj: any): boolean {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.nodeType === 'number' &&
    typeof obj.nodeName === 'string' &&
    typeof obj.isEqualNode === 'function'
  );
}

export function fnNameFor(func: Function) {
  if (func.name) {
    return func.name;
  }

  const matches = functionToString
    .call(func)
    .match(/^(?:async)?\s*function\s*\*?\s*([\w$]+)\s*\(/);
  return matches ? matches[1] : '<anonymous>';
}

export function isUndefined(obj: any) {
  return obj === void 0;
}

function getPrototype(obj: object) {
  if (Object.getPrototypeOf) {
    return Object.getPrototypeOf(obj);
  }

  if (obj.constructor.prototype == obj) {
    return null;
  }

  return obj.constructor.prototype;
}

export function hasProperty(obj: object | null, property: string): boolean {
  if (!obj) {
    return false;
  }

  if (Object.prototype.hasOwnProperty.call(obj, property)) {
    return true;
  }

  return hasProperty(getPrototype(obj), property);
}

// SENTINEL constants are from https://github.com/facebook/immutable-js
const IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
const IS_SET_SENTINEL = '@@__IMMUTABLE_SET__@@';
const IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';

export function isImmutableUnorderedKeyed(maybeKeyed: any) {
  return !!(
    maybeKeyed &&
    maybeKeyed[IS_KEYED_SENTINEL] &&
    !maybeKeyed[IS_ORDERED_SENTINEL]
  );
}

export function isImmutableUnorderedSet(maybeSet: any) {
  return !!(
    maybeSet &&
    maybeSet[IS_SET_SENTINEL] &&
    !maybeSet[IS_ORDERED_SENTINEL]
  );
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const IteratorSymbol = Symbol.iterator;

const hasIterator = (object: any) =>
  !!(object != null && object[IteratorSymbol]);

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const iterableEquality = (
  a: any,
  b: any,
  /* eslint-enable @typescript-eslint/explicit-module-boundary-types */
  aStack: Array<any> = [],
  bStack: Array<any> = [],
): boolean | undefined => {
  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    Array.isArray(a) ||
    Array.isArray(b) ||
    !hasIterator(a) ||
    !hasIterator(b)
  ) {
    return undefined;
  }
  if (a.constructor !== b.constructor) {
    return false;
  }
  let length = aStack.length;
  while (length--) {
    // Linear search. Performance is inversely proportional to the number of
    // unique nested structures.
    // circular references at same depth are equal
    // circular reference is not equal to non-circular one
    if (aStack[length] === a) {
      return bStack[length] === b;
    }
  }
  aStack.push(a);
  bStack.push(b);

  const iterableEqualityWithStack = (a: any, b: any) =>
    iterableEquality(a, b, [...aStack], [...bStack]);

  if (a.size !== undefined) {
    if (a.size !== b.size) {
      return false;
    } else if (isA('Set', a) || isImmutableUnorderedSet(a)) {
      let allFound = true;
      for (const aValue of a) {
        if (!b.has(aValue)) {
          let has = false;
          for (const bValue of b) {
            const isEqual = equals(aValue, bValue, [iterableEqualityWithStack]);
            if (isEqual === true) {
              has = true;
            }
          }

          if (has === false) {
            allFound = false;
            break;
          }
        }
      }
      // Remove the first value from the stack of traversed values.
      aStack.pop();
      bStack.pop();
      return allFound;
    } else if (isA('Map', a) || isImmutableUnorderedKeyed(a)) {
      let allFound = true;
      for (const aEntry of a) {
        if (
          !b.has(aEntry[0]) ||
          !equals(aEntry[1], b.get(aEntry[0]), [iterableEqualityWithStack])
        ) {
          let has = false;
          for (const bEntry of b) {
            const matchedKey = equals(aEntry[0], bEntry[0], [
              iterableEqualityWithStack,
            ]);

            let matchedValue = false;
            if (matchedKey === true) {
              matchedValue = equals(aEntry[1], bEntry[1], [
                iterableEqualityWithStack,
              ]);
            }
            if (matchedValue === true) {
              has = true;
            }
          }

          if (has === false) {
            allFound = false;
            break;
          }
        }
      }
      // Remove the first value from the stack of traversed values.
      aStack.pop();
      bStack.pop();
      return allFound;
    }
  }

  const bIterator = b[IteratorSymbol]();

  for (const aValue of a) {
    const nextB = bIterator.next();
    if (
      nextB.done ||
      !equals(aValue, nextB.value, [iterableEqualityWithStack])
    ) {
      return false;
    }
  }
  if (!bIterator.next().done) {
    return false;
  }

  // Remove the first value from the stack of traversed values.
  aStack.pop();
  bStack.pop();
  return true;
};

/**
 * Checks if `hasOwnProperty(object, key)` up the prototype chain, stopping at `Object.prototype`.
 */
 const hasPropertyInObject = (object: object, key: string): boolean => {
  const shouldTerminate =
    !object || typeof object !== 'object' || object === Object.prototype;

  if (shouldTerminate) {
    return false;
  }

  return (
    Object.prototype.hasOwnProperty.call(object, key) ||
    hasPropertyInObject(Object.getPrototypeOf(object), key)
  );
};


const isObjectWithKeys = (a: any) =>
  isObject(a) &&
  !(a instanceof Error) &&
  !(a instanceof Array) &&
  !(a instanceof Date);

export const subsetEquality = (
  object: unknown,
  subset: unknown,
): boolean | undefined => {
  // subsetEquality needs to keep track of the references
  // it has already visited to avoid infinite loops in case
  // there are circular references in the subset passed to it.
  const subsetEqualityWithContext =
    (seenReferences: WeakMap<object, boolean> = new WeakMap()) =>
    (object: any, subset: any): boolean | undefined => {
      if (!isObjectWithKeys(subset)) {
        return undefined;
      }

      return Object.keys(subset).every(key => {
        if (isObjectWithKeys(subset[key])) {
          if (seenReferences.has(subset[key])) {
            return equals(object[key], subset[key], [iterableEquality]);
          }
          seenReferences.set(subset[key], true);
        }
        const result =
          object != null &&
          hasPropertyInObject(object, key) &&
          equals(object[key], subset[key], [
            iterableEquality,
            subsetEqualityWithContext(seenReferences),
          ]);
        // The main goal of using seenReference is to avoid circular node on tree.
        // It will only happen within a parent and its child, not a node and nodes next to it (same level)
        // We should keep the reference for a parent and its child only
        // Thus we should delete the reference immediately so that it doesn't interfere
        // other nodes within the same level on tree.
        seenReferences.delete(subset[key]);
        return result;
      });
    };

  return subsetEqualityWithContext()(object, subset);
};