goog.provide('panda.base');

goog.require('goog.uri.utils');
goog.require('goog.userAgent.product');


/**
 * Log the given arguments to the console if available.
 *
 * This will be stripped out by the compiler unless DEBUG mode is enabled.
 *
 * In Firefox, logging will only be enabled if the console was open at the
 * start of the request.
 *
 * @param {...*} var_args Strings or objects.
 */
panda.log = function(var_args) {};

if (goog.userAgent.product.IE) {
  if (Function.prototype.bind &&
      Function.prototype.bind.toString().indexOf('native code') != -1) {
    panda.debugLogger = Function.prototype.bind.call(window.console.log, window.console);
  } else {
    panda.debugLogger = function(var_args) {
      if (window.console && window.console.log) {
        window.console.log(arguments);
      }
    };
  }
} else if (window.console && window.console.log) {
  panda.debugLogger = goog.bind(window.console.log, window.console);
}

if (goog.DEBUG) {
  panda.log = Function.prototype.bind.call(panda.debugLogger);
}
