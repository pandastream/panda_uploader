/**
 * @fileoverview This an *DEPRECATED* abstraction for sending requests.
 * It has been superceded by {@link panda.net.Request} -- use that instead.
 */

goog.provide('panda.net.XhrCommand');

goog.require('panda.net.Request');



/**
 * XHR wrapper that makes a request to a URL that will return JSON.
 * If the XHR succeeds, and the JSON contains a 'success' boolean true,
 * then the {@link handleSuccess} method will be called. Otherwise,
 * the {@link handleFailure} method will be called.
 *
 * See {@link panda.net.Request.send} for an easy way to send a
 * request with onSuccess and onFailure callbacks.
 *
 * @constructor
 * @extends {panda.net.Request}
 */
panda.net.XhrCommand = function() {
  panda.net.Request.call(this);
};
goog.inherits(panda.net.XhrCommand, panda.net.Request);


/**
 * Called when the XHR completes successfully and the JSON contains a
 * 'success' key that is equal to true. You may implement this method
 * in a subclass, or use the {@link panda.net.XhrCommand.send} helper.
 * @param {Object} json Response JSON.
 * @protected
 */
panda.net.XhrCommand.prototype.handleSuccess = goog.nullFunction;


/**
 * Called when the XHR fails or the JSON does not contain a
 * 'success' key that is equal to true. You may implement this method
 * in a subclass, or use the {@link panda.net.Request.send} helper.
 * @param {Object|undefined} json Response JSON. This is undefined when
 *     a network error occurrs.
 * @param {string=} opt_netErrorMsg A network error message that can be
 *     displayed to the user.
 * @protected
 */
panda.net.XhrCommand.prototype.handleFailure = goog.nullFunction;


/**
 * Handle the XHR response and trigger the correct callback.
 * @param {!goog.events.Event} e XHR event.
 * @protected
 */
panda.net.XhrCommand.prototype.handleResponse = function(e) {
  if (this.xhr_.getLastErrorCode() == goog.net.ErrorCode.ABORT) {
    return;
  }
  if (this.xhr_.isSuccess()) {
    var json = this.xhr_.getResponseJson();
    /** @type {function(Object)} */ (this.handleSuccess)(json);
  } else {
    var MSG_NETWORK_ERROR_TRY_AGAIN = goog.getMsg(
        'A network error occurred. Please try again.');
    this.handleFailure(json, MSG_NETWORK_ERROR_TRY_AGAIN);
  }
  if (this.disposeAutomatically) {
    this.dispose();
  }
};


/**
 * Create a command to send the given request by POST. One of the two given
 * callbacks will be fired, and the command and XHR will be cleaned up
 * automatically.
 * @param {string} url Request URL.
 * @param {Object|goog.structs.Map|undefined} content POST data.
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
panda.net.XhrCommand.send = function(url, content, onSuccess, onFailure,
    opt_handler) {
  if (opt_handler) {
    onSuccess = goog.bind(onSuccess, opt_handler);
    onFailure = goog.bind(onFailure, opt_handler);
  }
  var command = new panda.net.XhrCommand();
  command.handleSuccess = onSuccess;
  command.handleFailure = onFailure;
  command.disposeAutomatically = true;
  command.send(url, 'POST', content);
  return command;
};
