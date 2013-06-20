goog.provide('panda.upload.Html5Uploader');

goog.require('goog.events.EventHandler');
goog.require('goog.fs');
goog.require('goog.json');
goog.require('goog.net.EventType');
goog.require('goog.net.HttpStatus');
goog.require('goog.net.XmlHttpFactory');
goog.require('goog.object');
goog.require('goog.style');
goog.require('goog.Uri');
goog.require('goog.uri.utils');
goog.require('goog.userAgent');
goog.require('panda.net.XhrIo');
goog.require('panda.upload.File');
goog.require('panda.upload.Uploader');



/**
 * Subclass that only creates XMLHTTPRequests that are capable of ajax
 * uploading.
 * @constructor
 * @extends {goog.net.XmlHttpFactory}
 */
panda.upload.XmlHttpFactory = function() {
  goog.net.XmlHttpFactory.call(this);
};
goog.inherits(panda.upload.XmlHttpFactory, goog.net.XmlHttpFactory);
goog.addSingletonGetter(panda.upload.XmlHttpFactory);


/**
 * Override this method in subclasses to preserve the caching offered by
 * getOptions().
 * @return {Object} Options describing how xhr objects obtained from this
 *     factory should be used.
 * @protected
 */
panda.upload.XmlHttpFactory.prototype.internalGetOptions = function() {
  return {};
};


/**
 * @return {!(XMLHttpRequest|XDomainRequest|GearsHttpRequest)} A new
 *    XMLHttpRequest instance.
 */
panda.upload.XmlHttpFactory.prototype.createInstance = function() {
  var xhr = null;

  if (typeof XMLHttpRequest != 'undefined') {
    xhr = new XMLHttpRequest();
    if (!('withCredentials' in xhr)) {
      // If an XMLHttpRequest doesn't support cross-domain requests,
      // it's no good to us
      // NB: we don't actually use credentials, but if withCredentials exists
      //     in gecko or webkit, it means the XMLHttpRequest object supports
      //     cross domain requests as per
      //     http://hacks.mozilla.org/2009/07/cross-site-xmlhttprequest-with-cors/
      xhr = null;
    }
  }

  if (!(xhr && ('upload' in xhr) && ('onprogress' in xhr.upload))) {
    // If our XMLHttpRequest doesn't support upload progress events,
    // it's no good to us.
    xhr = null;
  }

  if (xhr) {
    return xhr;
  } else {
    throw 'Cross-Domain uploading is not possible in this browser.';
  }
};



/**
 * Individual file for upload.
 * @param {string} id File ID as assigned by the uploader.
 * @param {File} domFile Associated File DOM object for uploading.
 * @constructor
 * @extends {panda.upload.File}
 */
panda.upload.Html5File = function(id, domFile) {
  panda.upload.File.call(this, id, domFile.name, domFile.size);

  /**
   * The DOM file associated with this upload. Private to this file.
   * @type {File}
   * @private
   */
  this.domFile_ = domFile;
};
goog.inherits(panda.upload.Html5File, panda.upload.File);


/**
* The number of bytes to send in each file chunk.
* @type {number}
*/

panda.upload.Html5File.CHUNK_SIZE = 5 * 1024 * 1024;

/**
 * The event handler used by the Html5Uploader for tracking upload events.
 * @type {goog.events.EventHandler}
 * @private
 */
panda.upload.Html5File.prototype.handler_ = null;


/**
 * The XHR IO used for uploading.
 * @type {panda.net.XhrIo}
 * @private
 */
panda.upload.Html5File.prototype.xhr_ = null;


/**
 * The number of bytes sent so far.
 * @type {number}
 * @private
 */
panda.upload.Html5File.prototype.bytesSent_ = 0;

/**
 * Start the file upload.
 * @private
 */
panda.upload.Html5File.prototype.uploadMultipart_ = function() {
  if (!this.dispatchEvent(panda.upload.File.EventType.BEFORE_START)) {
    return;
  }

  var xhr = new panda.net.XhrIo(panda.upload.XmlHttpFactory.getInstance());
  var handler = new goog.events.EventHandler(this);

  this.bytesSent_ = 0;
  this.xhr_ = xhr;
  this.handler_ = handler;

  handler.listen(xhr,
                 goog.net.EventType.PROGRESS,
                 this.handleProgress, false, this).
          listen(xhr,
                 goog.net.EventType.COMPLETE,
                 this.handleComplete, false, this);

  var headers = {'Cache-Control': 'no-cache'};
  var postVars = this.getUploadVars();
  var content = new FormData();
  for (var key in postVars) {
    content.append(key, postVars[key]);
  }
  content.append(this.getUploadVarName(), this.domFile_);

  xhr.upload(this.getUploadUrl(), 'POST', content, headers);

  this.dispatchEvent(panda.upload.File.EventType.START);
};


/**
 * Start the file upload.
 * @private
 */
panda.upload.Html5File.prototype.upload_ = function() {

  if (!this.dispatchEvent(panda.upload.File.EventType.BEFORE_START)) {
    return;
  }

  var xhr = new goog.net.XhrIo();
  var handler = new goog.events.EventHandler(this);

  this.xhr_ = xhr;
  this.handler_ = handler;

  handler.listen(xhr,
                 goog.net.EventType.PROGRESS,
                 this.handleProgress, false, this).
          listen(xhr,
                 goog.net.EventType.COMPLETE,
                 this.handleComplete, false, this);

  var headers = {
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/octet-stream',
    'Content-Range': 'bytes */' + this.size
  };

  // use send instead of upload since we don't need PROGRESS events for this
  // initial request -- it contains no content
  xhr.send(this.getUploadUrl(), 'PUT', null, headers);

  this.dispatchEvent(panda.upload.File.EventType.START);
};

panda.upload.Html5File.prototype.uploadNextChunk_ = function() {
  var xhr = new panda.net.XhrIo(panda.upload.XmlHttpFactory.getInstance());

  var handler = this.handler_;
  this.xhr_ = xhr;

  handler.listen(xhr,
                 goog.net.EventType.PROGRESS,
                 this.handleProgress, false, this).
          listen(xhr,
                 goog.net.EventType.COMPLETE,
                 this.handleComplete, false, this);

  goog.asserts.assert(this.domFile_);

  var start = this.bytesSent_;

  var chunk_size = panda.upload.Html5File.CHUNK_SIZE;

  var end = Math.min(start + chunk_size, this.size);
  var blob = goog.fs.sliceBlob(this.domFile_, start, end);

  var headers = {
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/octet-stream',
    'Content-Range': 'bytes ' + start + '-' + (end-1) + '/' + this.size
  };

  xhr.upload(this.location_, 'PUT', blob, headers);
};


/**
 * Handle an upload progress event for the given file ID.
 * @param {!goog.events.BrowserEvent} e A goog event that wraps a native
 *     XMLHttpRequestProgressEvent object.
 * @protected
 */
panda.upload.Html5File.prototype.handleProgress = function(e) {
  var xhr = /** @type {!panda.net.XhrIo} */ (e.target);
  var be = e.getBrowserEvent();
  var event = new panda.upload.File.ProgressEvent(this,
     this.bytesSent_ + be.loaded, this.size);
  this.dispatchEvent(event);
};

/**
 * Destroy the upload session to avoid keeping the data on disk
 * @param {!panda.net.XhrIo} uploadXhr XhrIo.
 * @protected
 */
panda.upload.Html5File.prototype.deleteUploadSession = function(uploadXhr) {

 var location_ = uploadXhr.getLastUri();
 uploadXhr.dispose();
 uploadXhr.send(location_, 'DELETE');

  goog.events.listenOnce(uploadXhr,
    goog.net.EventType.COMPLETE,
    function(){uploadXhr.dispose();},
    false, this);
};

/**
 * Handle an upload progress event for the given file ID.
 * @param {!goog.events.Event} e XhrIo event.
 * @protected
 */
panda.upload.Html5File.prototype.handleComplete = function(e) {
  var xhr = /** @type {!panda.net.XhrIo} */ (e.target);

  var statusCode = xhr.getStatus();
  var errorCode = xhr.getLastErrorCode();
  var data = xhr.getResponseText();

  // This upload was cancelled intentionally.
  if (errorCode == goog.net.ErrorCode.ABORT) {
    panda.log('Received a HTML5 Upload cancel event', e);

    this.deleteUploadSession(xhr);
    return;
  }

  if (statusCode == 204) {
    if (xhr.getResponseHeader('Location')){
      this.location_ = xhr.getResponseHeader('Location');
    }

    var rangeHeader = xhr.getResponseHeader('Range');
    if(rangeHeader){
      var ranges = rangeHeader.match(new RegExp("^(\\d+)-(\\d+)$"));
      if(ranges) {
        var lastByte = Number(ranges[2]);
        if (lastByte < this.size - 1) {
          this.bytesSent_ = lastByte + 1;
        }else{
          this.bytesSent_ = lastByte;
        }
      }else {

        this.dispatchEvent(new panda.upload.File.ErrorEvent(this, statusCode, "File range not found"));

        this.dispose();

        return;
      }
    } else {
      this.bytesSent_ = 0;
    }

    xhr.dispose();

    this.uploadNextChunk_();

    return;
  }

  if (errorCode == goog.net.ErrorCode.TIMEOUT ||
      statusCode >= 500 ||
      statusCode == 408 ||
      statusCode === 0){

    panda.log('Error occured - Upload is paused', e);

    this.dispatchEvent(panda.upload.File.EventType.PAUSED);

    xhr.dispose();

    return;
  }

  var event = goog.net.HttpStatus.isSuccess(statusCode) ?
      new panda.upload.File.CompleteEvent(this, data) :
      new panda.upload.File.ErrorEvent(this, statusCode, data);
  this.dispatchEvent(event);

  // Cleanup the event handlers associated with the current XHR.
  this.dispose();
};


/**
 * Cancels the upload of a specific file, if currently in progress,
 * and removes it from the file list.
 * @private
 */
panda.upload.Html5File.prototype.cancel_ = function() {
  if (this.xhr_) {
    this.xhr_.abort();
    this.xhr_.dispose();
  }
  if (this.handler_) {
    this.handler_.dispose();
  }
  delete this.xhr_;
  delete this.handler_;

  this.bytesSent_ = 0;

  this.dispatchEvent(panda.upload.File.EventType.CANCEL);
};


/** @inheritDoc */
panda.upload.Html5File.prototype.disposeInternal = function() {
  goog.dispose(this.xhr_);
  delete this.xhr_;
  goog.dispose(this.handler_);
  delete this.handler_;
  delete this.domFile_;
  goog.base(this, 'disposeInternal');
};



/**
 * An Html5 uploader using Closure's event management
 * and the new HTML5 File API and XMLHttpRequest Level 2.
 *
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 * @implements {panda.upload.Uploader}
 */
panda.upload.Html5Uploader = function(opt_domHelper) {
  goog.ui.Component.call(this, opt_domHelper);

  /**
   * Counter for uniquely identifying selected files.
   * @type {number}
   * @private
   */
  this.counter_ = 0;
};
goog.inherits(panda.upload.Html5Uploader, goog.ui.Component);


/**
 * Cached support check.
 * @type {boolean|undefined}
 */
panda.upload.Html5Uploader.isSupported_;


/**
 * Check for Html5 upload support.
 * @return {boolean} True if the browser supports Html5 uploads.
 */
panda.upload.Html5Uploader.isSupported = function() {
  if (!goog.isDef(panda.upload.Html5Uploader.isSupported_)) {
    var input = goog.dom.createDom(goog.dom.TagName.INPUT, {'type': 'file'});
    var supportsMultipleFiles = ('files' in input);
    var supportsCrossDomainAsyncUploads = false;
    var supportsFileApi = (typeof FormData != 'undefined');

    /**
     * TODO: Find out if this is actually required in this context.
     *       For now, better safe than sorry.
     * @preserveTry
     */
    try {
      var factory = panda.upload.XmlHttpFactory.getInstance();
      var xhr = factory.createInstance();
      supportsCrossDomainAsyncUploads = true;
    } catch (e) { }

    panda.upload.Html5Uploader.isSupported_ = (
        supportsMultipleFiles &&
        supportsCrossDomainAsyncUploads &&
        supportsFileApi
    );

    var isOldWebkit = (goog.userAgent.WEBKIT && !goog.userAgent.isVersion(536));
    supportsResumableProtocol = panda.upload.Html5Uploader.isSupported_ && !isOldWebkit

    panda.log('Checking HTML5 Upload Support:');
    panda.log('multiple files:', supportsMultipleFiles);
    panda.log('crossdomain async:', supportsCrossDomainAsyncUploads);
    panda.log('fileApi:', supportsFileApi);
    panda.log('isSupported:', panda.upload.Html5Uploader.isSupported_);
    panda.log('resumable:', supportsResumableProtocol);
  }
  return panda.upload.Html5Uploader.isSupported_;
};


/**
 * Creates the DOM structure.
 * @protected
 */
panda.upload.Html5Uploader.prototype.createDom = function() {
  var input = /** @type {HTMLInputElement} */ (
      this.dom_.createDom(goog.dom.TagName.INPUT, {'type': 'file'}));
  this.decorateInternal(input);
};


/**
 * Set the file input Dom Object. The input will be hidden until you
 * attach it to an element with {@link attachButton}.
 * @param {HTMLInputElement} input File input.
 * @protected
 */
panda.upload.Html5Uploader.prototype.decorateInternal = function(input) {
  goog.base(this, 'decorateInternal', input);
  goog.dom.classes.add(input, 'panda-uploader');
  input.style.display = 'none';
};


/**
 * Listen for selected files in the file input.
 */
panda.upload.Html5Uploader.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  this.getHandler().listen(this.getElement(), goog.events.EventType.CHANGE,
      this.handleSelect);
};



/**
 * Handler for the File selected event
 * @param {!goog.events.BrowserEvent} e Select event.
 * @protected
 */
panda.upload.Html5Uploader.prototype.handleSelect = function(e) {
  var files = [];
  var input = this.getElement();

  for (var i = 0, domFile; domFile = input.files[i]; i++) {
    files.push(this.newHtml5File(domFile));
  }
  this.dispatchEvent(new panda.upload.Uploader.FileSelectEvent(files));

  // Clear the selected files from the input element.
  input.value = '';
};


/**
 * Handler for the File selected event
 * @param {File} domFile Associated File DOM object for uploading.
 * @return {panda.upload.Html5File}
 */

panda.upload.Html5Uploader.prototype.newHtml5File = function(domFile) {
  var fileID = 'file' + (this.counter_++);
  var file = new panda.upload.Html5File(fileID, domFile);
  file.setParentEventTarget(this);
  return file;
};


/**
 * Upload one file using the fileID.
 * @param {!panda.upload.File} file File object to upload.
 */
panda.upload.Html5Uploader.prototype.upload = function(file) {
  goog.asserts.assertInstanceof(file, panda.upload.Html5File);

  if(file.getUploadContentType() != 'multipart/form-data'){
    file.upload_();
  }else{
    file.uploadMultipart_();
  }

};


/**
 * Cancels the upload of a specific file, if currently in progress,
 * and removes it from the file list.
 * @param {!panda.upload.File} file File object.
 */
panda.upload.Html5Uploader.prototype.cancel = function(file) {
  goog.asserts.assertInstanceof(file, panda.upload.Html5File);
  file.cancel_();
};


/**
 * Setter for the 'fileFilters' property.
 * @param {Array} fileFilters The value for the 'fileFilters' property.
 */
panda.upload.Html5Uploader.prototype.setFileFilters = function(fileFilters) {
  this.getElement().setAttribute('accept', fileFilters);
};


/**
 * Enables or disables the mouse event handling on the 'Browse' button.
 * If the button skin is applied, the sprite is set to the 'disabled' state.
 * @param {boolean} enable True to enable, false to disable.
 */
panda.upload.Html5Uploader.prototype.setEnabled = function(enable) {
  if (enable) {
    this.getElement().removeAttribute('disabled');
  } else {
    this.getElement().setAttribute('disabled', 'disabled');
  }
};


/**
 * Setter for the 'multiFiles' property.
 * @param {boolean} value The value for the 'multiFiles' property.
 */
panda.upload.Html5Uploader.prototype.setAllowMultipleFiles = function(value) {
  if (value) {
    this.getElement().setAttribute('multiple', 'multiple');
  } else {
    this.getElement().removeAttribute('multiple');
  }
};


/**
 * Getter for the 'multiFiles' property.
 * @return {boolean} The value for the 'multiFiles' property.
 */
panda.upload.Html5Uploader.prototype.getAllowMultipleFiles = function() {
  return !!this.getElement().getAttribute('multiple');
};

/**
 * Check if the uploaders support a certain content type.
 * @param {string} contentType that needs to be supported
 * @return {boolean}
 */
panda.upload.Html5Uploader.prototype.acceptsContentType = function(contentType) {
  var result = false;

  if (contentType == 'multipart/form-data') {
    result = true;
  }

  if (contentType == 'application/octet-stream') {
    var isOldWebkit = (goog.userAgent.WEBKIT && !goog.userAgent.isVersion(536));
    if (isOldWebkit) {
      panda.log("Older versions of WebKit can't do chunked upload because they don't allow you to read the 'Range' and 'Location' headers off of a cross-domain XHR.");
      result = false;
    } else {
      result = true;
    }
  }

  panda.log('Checking if this browser supports "' + contentType + '" uploads:', result)

  return result;
};


/**
 * Attach this uploader to an event-less 'browse files' button.
 *
 * XXX: Must be called after decoration.
 * @param {Element} element Button element.
 */
panda.upload.Html5Uploader.prototype.attachButton = function(element) {
  this.button_ = element;
  this.button_.style.position = 'relative';
  this.button_.style.overflow = 'hidden';

  var input = this.getElement();

  /**
   * Attempt to create huge invisible floating file input to cover the
   * supplied button.
   *
   * Note 1: the max useable size for something like this varies by browser
   *         100px tall by 200px wide should be safe, though.
   * Note 2: In Opera, only the 'browse' button is clickable, but we know it's
   *         on the right hand side, so align with the right hand side.
   * Note 3: 118 is the max font size allowed by some browsers
   */
  var style = input.style;
  style.display = 'block';
  style.position = 'absolute';
  style.top = '-5px';
  style.right = '-5px';
  style.font = '118px Arial';
  style.margin = '0';
  style.padding = '0';
  style.cursor = 'pointer';
  style.opacity = '0';
  style.height = '118px';

  goog.dom.removeNode(input);
  goog.dom.appendChild(this.button_, input);
};


/**
 * Return the attached 'browse files' button that sits under the
 * transparent flash clickable region.
 * @return {Element} Button element.
 */
panda.upload.Html5Uploader.prototype.getButton = function() {
  return this.button_;
};
