goog.provide('panda.upload.File');

goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.json');
goog.require('goog.object');


/**
 * Individual file for upload.
 * @param {string} id File ID as assigned by the uploader.
 * @param {string} name File name.
 * @param {number} size File size in bytes.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
panda.upload.File = function(id, name, size) {
  goog.events.EventTarget.call(this);

  /**
   * File ID as assigned by the uploader.
   * @type {string}
   */
  this.id = id;

  /**
   * File name.
   * @type {string}
   */
  this.name = name;

  /**
   * File size in bytes.
   * @type {number}
   */
  this.size = size;

    /**
   * Payload.
   * @type {Object}
   */
  this.payload = {};
};
goog.inherits(panda.upload.File, goog.events.EventTarget);


/**
 * Events dispatched by each queued file.
 * @enum {string}
 */
panda.upload.File.EventType = {
  /**
   * Dispatched before the file begins to upload. This allows the upload
   * to be cancelled or modified.
   */
  BEFORE_START: goog.events.getUniqueId('beforestart'),

  /**
   * Dispatched when the file has begun to upload.
   */
  START: goog.events.getUniqueId('start'),

  /**
   * Dispatched during the upload with to report progress.
   */
  PROGRESS: goog.events.getUniqueId('progress'),

  /**
   * Dispatched when the file is completely uploaded.
   */
  COMPLETE: goog.events.getUniqueId('complete'),

  /**
   * Dispatched when the file upload fails for some reason.
   */
  ERROR: goog.events.getUniqueId('error'),

  /**
   * Dispatched when the user cancels the upload manually.
   */
  CANCEL: goog.events.getUniqueId('cancel'),

  /**
   * Dispatched when the upload is paused.
   */
  PAUSED: goog.events.getUniqueId('paused')
};


/**
 * A flag that tracks whether this file has fired its COMPLETE event.
 * @type {boolean}
 * @private
 */
panda.upload.File.prototype.complete_ = false;


/**
 * Optional upload URL that will be used instead of the queue's upload URL.
 * @type {string|undefined}
 * @private
 */
panda.upload.File.prototype.uploadUrl_;


/**
 * Optional upload POST data or request headers, depending on the uploader.
 * Flash uploaders send files in a multipart/form-data request, so these
 * vars are sent as POST data. HTML5 uploads do a direct file upload as an
 * application/octet-stream so these vars will be sent as request headers.
 * @type {Object|undefined}
 * @private
 */
panda.upload.File.prototype.uploadVars_;


/**
 * Optional variable name of the uploaded file, when a multipart/form-data
 * request is being used. This will be ignored with HTML5 uploads.
 * @type {string|undefined}
 * @private
 */
panda.upload.File.prototype.uploadVarName_;



/**
 * TODO
 * @type {string|undefined}
 * @private
 */
panda.upload.File.prototype.uploadContentType_;


/**
 * Set an alternate upload URL from the one the queue defaults to.
 * @param {string} url URL.
 */
panda.upload.File.prototype.setUploadUrl = function(url) {
  this.uploadUrl_ = url;
};

/**
 * Set some additional handshake data to include with the standard
 * handshake data.
 * @param {Object} payload data to send during handshake.
 */
panda.upload.File.prototype.setPayload = function(payload) {
  this.payload = payload;
};


/**
 * @return {boolean} Upload URL.
 */
panda.upload.File.prototype.isProcessable = function() {
  return this.uploadUrl_ !== undefined;
};

/**
 * @return {string} Upload URL.
 */
panda.upload.File.prototype.getUploadUrl = function() {
  goog.asserts.assert(this.uploadUrl_);
  return this.uploadUrl_;
};

/**
 * @return {Object} Playload Data.
 */
panda.upload.File.prototype.getPayload = function() {
  goog.asserts.assert(this.payload);
  return this.payload;
};

/**
 * Set optional upload POST data or request headers, depending on the uploader.
 * Flash uploaders send files in a multipart/form-data request, so these
 * vars are sent as POST data. HTML5 uploads do a direct file upload as an
 * application/octet-stream so these vars will be sent as request headers.
 * @param {Object} map Map of keys and values.
 */
panda.upload.File.prototype.setUploadVars = function(map) {
  this.uploadVars_ = map;
};

/**
 * Set the upload content type
 * @param {string} contentType var.
 */
panda.upload.File.prototype.setUploadContentType = function(contentType) {
  this.uploadContentType_ = contentType;
};

/**
 * @return {Object} Upload POST vars.
 */
panda.upload.File.prototype.getUploadVars = function() {
  return this.uploadVars_ || (this.uploadVars_ = {});
};


/**
 * Override the variable name of the uploaded file, when a multipart/form-data
 * request is being used. This will be ignored with HTML5 uploads, and should
 * default to 'file' if not set.
 * @param {string} name File POST variable name.
 */
panda.upload.File.prototype.setUploadVarName = function(name) {
  this.uploadVarName_ = name;
};


/**
 * @return {string} Upload POST var name for the file.
 */
panda.upload.File.prototype.getUploadVarName = function() {
  return this.uploadVarName_ || 'file';
};

/**
 * @return {string|undefined} Upload content type for the file
 */
panda.upload.File.prototype.getUploadContentType = function() {
  return this.uploadContentType_;
};

/**
 * Check if this file upload has completed, whether it be successful
 * or an error.
 * @return {boolean}
 */
panda.upload.File.prototype.isComplete = function() {
  return this.complete_;
};



/**
 * File Event Base Class.
 *
 * @param {panda.upload.File.EventType} type Event type.
 * @param {!panda.upload.File} file Target file.
 * @constructor
 * @extends {goog.events.Event}
 */
panda.upload.File.Event = function(type, file) {
  goog.events.Event.call(this, type, file);

  /**
   * The abitrary but unique file ID assigned by the uploader.
   * @type {string}
   */
  this.id = file.id;
};
goog.inherits(panda.upload.File.Event, goog.events.Event);



/**
 * File Upload Progress Event.
 *
 * @param {!panda.upload.File} file Target file.
 * @param {number} bytesTotal Total bytes to upload.
 * @param {number} bytesLoaded Total bytes uploaded thus far.
 * @constructor
 * @extends {panda.upload.File.Event}
 */
panda.upload.File.ProgressEvent = function(file, bytesLoaded, bytesTotal) {
  panda.upload.File.Event.call(this, panda.upload.File.EventType.PROGRESS,
      file);

  /**
   * Total bytes to upload.
   * @type {number}
   */
  this.bytesTotal = bytesTotal;

  /**
   * Total bytes uploaded thus far.
   * @type {number}
   */
  this.bytesLoaded = bytesLoaded;
};
goog.inherits(panda.upload.File.ProgressEvent, panda.upload.File.Event);


/**
 * Get the current upload percentage completed.
 * @return {number}
 */
panda.upload.File.ProgressEvent.prototype.getPercentComplete = function() {
  return Math.round(this.bytesLoaded / this.bytesTotal * 100);
};



/**
 * File Upload Complete Event.
 *
 * @param {string} responseText Response string.
 * @constructor
 * @extends {panda.upload.File.Event}
 */
panda.upload.File.CompleteEvent = function(file, responseText) {
  goog.base(this, panda.upload.File.EventType.COMPLETE, file);

  /**
   * The response text given when the upload completed.
   * @type {string}
   */
  this.responseText = responseText;

  /**
   * Memoized response JSON.
   * @type {Object|undefined}
   */
  this.responseJson_;
};
goog.inherits(panda.upload.File.CompleteEvent, panda.upload.File.Event);


/**
 * Get the response text as a JSON object.
 * @return {Object} Response JSON.
 */
panda.upload.File.CompleteEvent.prototype.getResponseJson = function() {
  return this.responseJson_ ||
      (this.responseJson_ = goog.json.parse(this.responseText));
};


/** @inheritDoc */
panda.upload.File.CompleteEvent.prototype.disposeInternal = function() {
  delete this.responseText;
  delete this.responseJson_;
};



/**
 * File Upload Error Event.
 *
 * @param {!panda.upload.File} file Target file.
 * @param {number} status HTTP status code returned.
 * @param {string=} opt_responseText Response text from the error, if any.
 * @constructor
 * @extends {panda.upload.File.Event}
 */
panda.upload.File.ErrorEvent = function(file, status, opt_responseText) {
  panda.upload.File.Event.call(this, panda.upload.File.EventType.ERROR, file);

  /**
   * The HTTP status code returned.
   * @type {number}
   */
  this.status = status;

  /**
   * Response text from the error, if any.
   * @type {string|undefined}
   */
  this.responseText = opt_responseText;
};
goog.inherits(panda.upload.File.ErrorEvent, panda.upload.File.Event);
