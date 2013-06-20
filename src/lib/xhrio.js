goog.provide('panda.net.XhrIo');

goog.require('goog.net.EventType');
goog.require('goog.net.XhrIo');
goog.require('goog.structs.Map');
goog.require('goog.uri.utils');
goog.require('panda.net');



/**
 * Custom XMLHTTPRequest wrapper that adds upload support and includes
 * some default headers.
 *
 * @param {goog.net.XmlHttpFactory=} opt_xmlHttpFactory Factory to use when
 *     creating XMLHttpRequest objects.
 * @constructor
 * @extends {goog.net.XhrIo}
 */
panda.net.XhrIo = function(opt_xmlHttpFactory) {
  goog.net.XhrIo.call(this, opt_xmlHttpFactory);
};
goog.inherits(panda.net.XhrIo, goog.net.XhrIo);


/**
 * This flag is set to true when a call to upload() is made instead of send().
 * We use this to enable progress tracking.
 * @type {boolean}
 * @private
 */
panda.net.XhrIo.prototype.isUpload_ = false;


/**
 * Send the Xhr using the form action and method.
 *
 * Our server depends on an 'X-Requested-With: XMLHttpRequest' header,
 * so we add it automatically here.
 *
 * @param {string} url Uri to make request to.
 * @param {string=} opt_method Send method, default: GET.
 * @param {string|FormData|Blob|Object|goog.structs.Map=} opt_content Post data.
 * @param {Object|goog.structs.Map=} opt_headers Map of headers to add to the
 *     request.
 */
panda.net.XhrIo.prototype.send = function(url, opt_method, opt_content,
    opt_headers) {
  var headers = panda.net.addDefaultHeaders(opt_headers);
  var method = opt_method || 'GET';
  var content;
  if (goog.isObject(opt_content)) {
    if (opt_content instanceof goog.structs.Map) {
      opt_content = opt_content.toObject();
    }
    if (method == 'GET') {
      url = goog.uri.utils.appendParamsFromMap(url, opt_content);
    } else {
      content = goog.uri.utils.buildQueryDataFromMap(opt_content);
    }
  } else if (opt_content) {
    content = opt_content;
  }
  this.send_(url, method, content, headers);
};


/**
 * Send an XHR Upload for a FormData or File object. This is identical to a
 * normal XHR request except that it enables PROGRESS events if the underlying
 * XHR supports it.
 *
 * @param {string} url Uri to make request to.
 * @param {string=} opt_method Send method, default: GET.
 * @param {string|FormData|Blob|Object|goog.structs.Map=} opt_content Post data.
 * @param {Object|goog.structs.Map=} opt_headers Map of headers to add to the
 *     request.
 */
panda.net.XhrIo.prototype.upload = function(url, opt_method, opt_content,
    opt_headers) {
  /**
   * XXX: Iff this is a Cross-Domain request, the browser will send a
   *      'preflight' HTTP OPTIONS request to the given URL, and then send
   *      a HTTP POST request.
   *
   *      For each request, the server must read these three request headers:
   *          'Access-Control-Request-Headers'
   *          'Access-Control-Request-Method'
   *          'Origin'
   *      and set the corresponding response headers:
   *          'Access-Control-Allow-Headers',
   *          'Access-Control-Allow-Method',
   *          'Access-Control-Allow-Origin'
   *
   *      If the server fails to set the appropriate headers on the OPTIONS
   *      response, the POST request will never be sent by the browser.
   *
   *      If the server fails to set the appropriate headers on the POST
   *      response, the POST request will complete normally, but javascript
   *      will see an error, as though the request was aborted.
   *
   *      Regular requests to the same domain are unaffected by any of this.
   */
  var headers = panda.net.addDefaultHeaders(opt_headers);
  this.isUpload_ = true;
  this.send_(url, opt_method, opt_content, headers);
};


/**
 * Creates a new XHR object.
 * @return {XMLHttpRequest|GearsHttpRequest} The newly created XHR object.
 * @protected
 */
panda.net.XhrIo.prototype.createXhr = function() {
  var xhr = panda.net.XhrIo.superClass_.createXhr.call(this);
  if (this.isUpload_ && 'upload' in xhr) {
    goog.events.listen(xhr.upload,
        goog.net.EventType.PROGRESS,
        this.handleProgress, false, this);
  }
  return xhr;
};


/**
 * Instance send that actually uses XMLHttpRequest to make a server call.
 * This is an near exact copy of goog.net.XhrIo.prototype.send -- the only
 * change is that we check for FormData content before setting the default
 * Content-Type header (to support files).
 *
 * @param {string|goog.Uri} url Uri to make request to.
 * @param {string=} opt_method Send method, default: GET.
 * @param {string|FormData|Blob|Object|goog.structs.Map=} opt_content Post data.
 * @param {Object|goog.structs.Map=} opt_headers Map of headers to add to the
 *     request.
 * @suppress {visibility}
 * @private
 */
panda.net.XhrIo.prototype.send_ = function(url, opt_method, opt_content,
                                           opt_headers) {
  if (this.xhr_) {
    throw Error('[goog.net.XhrIo] Object is active with another request');
  }

  var method = opt_method ? opt_method.toUpperCase() : 'GET';

  this.lastUri_ = url;
  this.lastError_ = '';
  this.lastErrorCode_ = goog.net.ErrorCode.NO_ERROR;
  this.lastMethod_ = method;
  this.errorDispatched_ = false;
  this.active_ = true;

  // Use the factory to create the XHR object and options
  this.xhr_ = this.createXhr();
  this.xhrOptions_ = this.xmlHttpFactory_ ?
      this.xmlHttpFactory_.getOptions() : goog.net.XmlHttp.getOptions();

  // Set up the onreadystatechange callback
  this.xhr_.onreadystatechange = goog.bind(this.onReadyStateChange_, this);

  /**
   * Try to open the XMLHttpRequest (always async), if an error occurs here it
   * is generally permission denied
   * @preserveTry
   */
  try {
    this.logger_.fine(this.formatMsg_('Opening Xhr'));
    this.inOpen_ = true;
    this.xhr_.open(method, url, true);  // Always async!
    this.inOpen_ = false;
  } catch (err) {
    this.logger_.fine(this.formatMsg_('Error opening Xhr: ' + err.message));
    this.error_(goog.net.ErrorCode.EXCEPTION, err);
    return;
  }

  // We can't use null since this won't allow POSTs to have a content length
  // specified which will cause some proxies to return a 411 error.
  var content = opt_content || '';

  var headers = this.headers.clone();

  // Add headers specific to this request
  if (opt_headers) {
    goog.structs.forEach(opt_headers, function(value, key) {
      headers.set(key, value);
    });
  }

  // Panda addition: Don't set a default Content-Type header if the content
  // is a FormData object -- the correct behaviour is to allow the browser to
  // set it automatically.
  if (method == 'POST' &&
      !headers.containsKey(goog.net.XhrIo.CONTENT_TYPE_HEADER) &&
      (typeof FormData == 'undefined' || !(content instanceof FormData))) {
    // For POST requests, default to the url-encoded form content type.
    headers.set(goog.net.XhrIo.CONTENT_TYPE_HEADER,
                goog.net.XhrIo.FORM_CONTENT_TYPE);
  }

  // Add the headers to the Xhr object
  goog.structs.forEach(headers, function(value, key) {
    this.xhr_.setRequestHeader(key, value);
  }, this);

  if (this.responseType_) {
    this.xhr_.responseType = this.responseType_;
  }

  if (goog.object.containsKey(this.xhr_, 'withCredentials')) {
    this.xhr_.withCredentials = this.withCredentials_;
  }

  /**
   * Try to send the request, or other wise report an error (404 not found).
   * @preserveTry
   */
  try {
    if (this.timeoutId_) {
      // This should never happen, since the if (this.active_) above shouldn't
      // let execution reach this point if there is a request in progress...
      goog.Timer.defaultTimerObject.clearTimeout(this.timeoutId_);
      this.timeoutId_ = null;
    }
    if (this.timeoutInterval_ > 0) {
      this.logger_.fine(this.formatMsg_('Will abort after ' +
          this.timeoutInterval_ + 'ms if incomplete'));
      this.timeoutId_ = goog.Timer.defaultTimerObject.setTimeout(
          goog.bind(this.timeout_, this), this.timeoutInterval_);
    }
    this.logger_.fine(this.formatMsg_('Sending request'));
    this.inSend_ = true;
    this.xhr_.send(content);
    this.inSend_ = false;

  } catch (err) {
    this.logger_.fine(this.formatMsg_('Send error: ' + err.message));
    this.error_(goog.net.ErrorCode.EXCEPTION, err);
  }
};


/**
 * @inheritDoc
 * @suppress {visibility}
 */
panda.net.XhrIo.prototype.disposeInternal = function() {
  if (this.isUpload_ && this.xhr_) {
    var xhr_ = /** @type {XMLHttpRequest} */ (this.xhr_);
    goog.events.unlisten(xhr_.upload,
        goog.net.EventType.PROGRESS,
        this.handleProgress, false, this);
  }
  panda.net.XhrIo.superClass_.disposeInternal.call(this);
};


/**
 * If our internal xhr_ fires a progress event, we should fire it, too.
 * @param {!goog.events.BrowserEvent} e Browser Event wrapping a
 *     XMLHttpRequestProgressEvent object.
 * @protected
 */
panda.net.XhrIo.prototype.handleProgress = function(e) {
  this.dispatchEvent(e);
};
