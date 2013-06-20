goog.provide('panda.net');

goog.require('goog.object');
goog.require('goog.structs');
goog.require('goog.structs.Map');


/**
 * Add the default headers to the given headers.
 * @param {goog.structs.Map|Object=} opt_headers Map of headers.
 * @return {Object} Map of headers.
 */
panda.net.addDefaultHeaders = function(opt_headers) {
  var headers;
  if (opt_headers instanceof goog.structs.Map) {
    headers = opt_headers.toObject();
  } else {
    headers = opt_headers || {};
  }
  goog.object.setIfUndefined(headers, 'X-Requested-With', 'XMLHttpRequest');
  return headers;
};
