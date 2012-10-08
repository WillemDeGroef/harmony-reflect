/**
 * A simple membrane that doesn't distinguish between "inward"
 * and "outward" crossing of the membrane.
 *
 * @author tvcutsem
 *
 * For a general introduction to membranes, see:
 * http://soft.vub.ac.be/~tvcutsem/invokedynamic/js-membranes
 *
 * usage:
 * var membrane = makeMembrane(obj)
 * var wrappedObj = membrane.target;
 * var wrappedX = wrappedObj.x; // accessed objects are recursively wrapped
 * membrane.revoke(); // touching any wrapped value after this point throws
 */
function makeMembrane(initTarget) {
  var cache = new WeakMap();
  var revoked = false;
  
  function wrap(obj) {
    if (Object(obj) !== obj) return obj; // primitives are passed through
    var wrapper = cache.get(obj);
    if (wrapper) return wrapper;
    wrapper = Proxy(obj, Proxy(obj, { // "double lifting"
      get: function(target, trapName) {
        if (revoked) throw new TypeError("membrane revoked");
        return function(target /*, ...args*/) { // generic trap
          var args = Array.prototype.slice.call(arguments, 1).map(wrap);
          return wrap(Reflect[trapName].apply(undefined, [target].concat(args)));
        }
      }
    }));
    cache.set(obj, wrapper);
    return wrapper;
  }
  
  function revoke() { revoked = true; }
  
  return {revoke: revoke, target: wrap(initTarget)};
}