goog.provide('panda.net.Request');

goog.require('goog.events.EventTarget');
goog.require('goog.json');
goog.require('goog.net.HttpStatus');
goog.require('panda.net.XhrIo');



/**
 * High-level XhrIo wrapper.
 *
 * This wraps the logic for making a RESTful API call and parsing the
 * response as JSON.  We assume that 400 Bad Request responses are in
 * fact a result of invalid user input in the request, and the response
 * body contains JSON-encoded error message(s).
 *
 * See {@link panda.net.Request.send} and {@link panda.net.Request.sendJson}
 * for an easy way to send a request with onSuccess and onFailure callbacks.
 *
 * @constructor
 * @extends {goog.events.EventTarget}
 */
panda.net.Request = function() {
  /**
   * The wrapped XHR.
   * @type {!panda.net.XhrIo}
   * @private
   */
  this.xhr_ = new panda.net.XhrIo;
};
goog.inherits(panda.net.Request, goog.events.EventTarget);


/**
 * Request-specific events.
 * @enum {string}
 */
panda.net.Request.EventType = {
  DISPOSE: goog.events.getUniqueId('dispose')
};


/**
 * If the response text is prefixed by this string, it will be stripped
 * before parsing. This prevents cross site script inclusion (XSSI)
 * which can, in some browsers, make any JSON response capture-able, much
 * like JSONP. Normally this is mitigated by returning an object literal
 * as the top-level object, which is itself a syntax error in Javascript,
 * but we want to be able to return arrays which are lighter weight.
 * See: http://google-gruyere.appspot.com/part3#3__cross_site_script_inclusion
 * See: http://flask.pocoo.org/docs/security/#json-security
 * @define {string} Specify an alternate prefix to ignore in response bodies.
 */
panda.net.Request.XSSI_PREFIX = '])}while(1);</x>\n\n';


/**
 * Automatically frees the resources associated with the XHR once the
 * response has been handled and the callbacks triggered. Useful for
 * one-off commands, perhaps not so good for more complex commands?
 * @type {boolean}
 * @protected
 */
panda.net.Request.prototype.disposeAutomatically = false;


/**
 * Called when the XHR completes with a successful response.
 * @param {!goog.events.Event} e Xhr COMPLETE event.
 * @param {Object|Array} json Response JSON.
 * @protected
 */
panda.net.Request.prototype.handleSuccess = goog.nullFunction;


/**
 * Called when the XHR returns an error response.
 * @param {goog.events.Event} e Xhr COMPLETE event.
 * @param {Object|Array|undefined} json Response JSON. In the case of 400s,
 *     this should be a map of errors, and when a network error occurs it
 *     will be undefined.
 * @protected
 */
panda.net.Request.prototype.handleFailure = goog.nullFunction;


/**
 * Send the XHR. Including content is optional for subclassers.
 * @param {string} url Uri to make request to.
 * @param {string=} opt_method Send method, default: GET.
 * @param {string|Object|goog.structs.Map=} opt_content Post data.
 * @param {Object|goog.structs.Map=} opt_headers Map of headers to add to the
 *     request.
 */
panda.net.Request.prototype.send = function(url, opt_method, opt_content,
    opt_headers) {
  goog.events.listenOnce(this.xhr_,
      goog.net.EventType.COMPLETE,
      this.handleResponse,
      false, this);

  this.xhr_.send(url, opt_method, opt_content, opt_headers);
};


/**
 * @return {boolean} Whether there is an open request.
 */
panda.net.Request.prototype.isActive = function() {
  return this.xhr_.isActive();
};


/**
 * Abort the XHR. This is can be called any number of times.
 */
panda.net.Request.prototype.abort = function() {
  this.xhr_.abort();
};


/**
 * Handle the XHR response and trigger the correct callback.
 * @param {!goog.events.Event} e XHR event.
 * @protected
 */
panda.net.Request.prototype.handleResponse = function(e) {
  if (this.xhr_.getLastErrorCode() == goog.net.ErrorCode.ABORT) {
    return;
  }

  var isSuccess = this.xhr_.isSuccess();
  var status = this.xhr_.getStatus();
  var json;

  if (status == goog.net.HttpStatus.BAD_REQUEST ||
      (isSuccess && status != goog.net.HttpStatus.NO_CONTENT &&
                    status != goog.net.HttpStatus.QUIRK_IE_NO_CONTENT)) {
    json = this.xhr_.getResponseJson(panda.net.Request.XSSI_PREFIX);
  }

  if (isSuccess) {
    this.handleSuccess(e, json || null);
  } else {
    this.handleFailure(e, json);
  }

  if (this.disposeAutomatically) {
    this.dispose();
  }
};


/** @inheritDoc */
panda.net.Request.prototype.disposeInternal = function() {
  this.dispatchEvent(panda.net.Request.EventType.DISPOSE);
  this.xhr_.dispose();
  delete this.xhr_;
  delete this.handleSuccess;
  delete this.handleFailure;
  panda.net.Request.superClass_.disposeInternal.call(this);
};



/**
 * Create a command to send the given request by POST. One of the two given
 * callbacks will be fired, and the command and XHR will be cleaned up
 * automatically.
 * @param {string} url Request URL.
 * @param {string} method Request method.
 * @param {string|Object|goog.structs.Map} content Request body.
 * @param {function(!goog.events.Event, Object)} onSuccess A function to call
 *     on a successful JSON response. The second argument is the response JSON.
 * @param {function(!goog.events.Event, (Object|undefined))} onFailure A function
 *     to call when a request fails to complete, or returns a non-200 or 300
 *     level response.
 * @param {Object=} opt_handler Element in whose scope to call the callbacks.
 * @return {!panda.net.Request} The command, so that it can be aborted
 *     if need be.
 */
panda.net.Request.send = function(url, method, content, onSuccess, onFailure,
    opt_handler) {
  if (opt_handler) {
    onSuccess = goog.bind(onSuccess, opt_handler);
    onFailure = goog.bind(onFailure, opt_handler);
  }
  var request = new panda.net.Request();
  request.handleSuccess = onSuccess;
  request.handleFailure = onFailure;
  request.disposeAutomatically = true;
  request.send(url, method, content);
  return request;
};


/**
 * Create a command to send the given request by POST. One of the two given
 * callbacks will be fired, and the command and XHR will be cleaned up
 * automatically.
 * @param {string} url Request URL.
 * @param {string} method Request method.
 * @param {Object} content Request body.
 * @param {function(Object)} onSuccess A function to call on a successful JSON
 *     response. The only argument is the response JSON.
 * @param {function(Object=, string=)} onFailure A function to call when a
 *     request fails or the response JSON shows the action was not successful.
 *     The first argument is the response JSON or undefined, the second is
 *     a user-friendly error message if the XHR failed for some reason.
 * @param {Object=} opt_handler Element in whose scope to call the callbacks.
 * @return {!panda.net.Request} The command, so that it can be aborted
 *     if need be.
 */
panda.net.Request.sendJson = function(url, method, content, onSuccess, onFailure,
    opt_handler) {
  if (opt_handler) {
    onSuccess = goog.bind(onSuccess, opt_handler);
    onFailure = goog.bind(onFailure, opt_handler);
  }
  var headers = {'Content-Type': 'application/json'};
  var jsonContent = goog.json.serialize(content);
  var request = new panda.net.Request();
  request.handleSuccess = onSuccess;
  request.handleFailure = onFailure;
  request.disposeAutomatically = true;
  request.send(url, method, jsonContent, headers);
  return request;
};
