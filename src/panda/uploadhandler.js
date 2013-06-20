goog.provide('panda.uploader.UploadHandler');

goog.require('goog.json');
goog.require('panda.net.XhrCommand');
goog.require('panda.upload.Queue');

/**
 * Upload event handler.
 *
 * @param {!Function} addFilesCb The function to call when a new File model is
 *     created as a result of a new file being added to the upload queue.
 * @param {!Function} onCompleteCb The function to call when everything is complete
 * @param {!Function} onQueueCompleteCb The function to call when the upload queue is complete
 * @param {!panda.upload.Queue} uploadQueue Upload queue to listen to.
 * @param {string} handshakeUrl The URL will be query for permission to begin
 *     the full upload. It may return a new POST URL and POST vars.
 * @extends {goog.events.EventHandler}
 * @constructor
 */
panda.uploader.UploadHandler = function(
  uploadQueue, handshakeUrl, confirmBeforeUnload, addFilesCb, onCompleteCb, onQueueCompleteCb) {
  goog.base(this, this);

  /**
   * The function to call when a new a list of {@link panda.uploader.File} is added to the upload queue
   * @type {!Function}
   * @private
   */
  this.addFilesCallback_ = addFilesCb;

  /**
   * Perform a callback on the given file object after the
   * entire upload and optional post-processing is complete.
   * @type {!Function}
   * @private
   */
  this.handleEverythingComplete_ = onCompleteCb;

  /**
   * Perform a callback after the entire upload queue is complete.
   * @type {!Function}
   * @private
   */
  this.queueCompleteCallback_ = onQueueCompleteCb;

  /**
   * The upload queue to listen to.
   * @type {!panda.upload.Queue}
   * @private
   */
  this.queue_ = uploadQueue;

  this.listen(this.queue_,
              panda.upload.Queue.EventType.ADD,
              this.handleQueuedFiles_);

  /**
   * Before uploading, this URL will be queried for permission to begin the
   * full upload. It may return a new upload URL and vars.
   * @type {string}
   * @private
   */
  this.handshakeUrl_ = handshakeUrl;


  /**
   * Alert user before leaving the window when an upload is processing
   * @type {boolean}
   * @private
   */
  this.confirmBeforeUnload_ = confirmBeforeUnload;

  /**
   * After an upload to a remote service completes, a request must be made
   * to our own server to mark the upload as complete and ready for use.
   * This is a map of those URLs keyed by the file ID.
   * @type {Object.<string, string>}
   * @private
   */
  this.postprocessUrls_ = {};

  /**
   * Content type of the coming upload
   * @type {Object.<string, string>}
   * @private
   */
  this.contentType_ = 'multipart/form-data';

};
goog.inherits(panda.uploader.UploadHandler, goog.events.EventHandler);

/**
 * Create a {@link panda.uploader.FileModel} for each file in the upload queue
 * @param {!panda.upload.Queue.AddEvent} e Queue event.
 * @private
 */
panda.uploader.UploadHandler.prototype.handleQueuedFiles_ = function(e) {
  this.attachQueueEvents_(true);

  this.addFilesCallback_(e);
};

/**
 * Attach queue events for handling individual files and cleaning up
 * these events after everything is done.
 * @param {boolean} enable Attach or detach.
 * @private
 */
panda.uploader.UploadHandler.prototype.attachQueueEvents_ = function(enable) {
  var method = goog.bind(enable ? this.listen : this.unlisten, this);
  var uploader = this.queue_.getUploader();
  method(uploader,
         panda.upload.File.EventType.BEFORE_START,
         this.handleUploadBeforeStart_);
  method(uploader,
         panda.upload.File.EventType.COMPLETE,
         this.handleUploadComplete_);
  method(this.queue_,
         panda.upload.Queue.EventType.COMPLETE,
         this.handleQueueComplete_);
};


/**
 * Process a queue file before it begins uploading.
 *
 * This will be called exactly twice for each {@link panda.upload.File}.
 * The first time, the upload is stopped while a "prepare for upload" request
 * is sent to the server. This creates a file record in the database and gets
 * an ID. Once the handshake is complete, the upload is restarted, and this
 * handler is called again.
 *
 * @param {!goog.events.Event} e File event.
 * @private
 */
panda.uploader.UploadHandler.prototype.handleUploadBeforeStart_ = function(e) {
  var queueFile = /** @type {!panda.upload.File} */ (e.target);

  if (!queueFile.isProcessable()) {
    // Stop the upload. We'll restart it once the handshake completes.
    e.preventDefault();

    if(this.queue_.getUploader().
        acceptsContentType('application/octet-stream')) {
      this.contentType_ = 'application/octet-stream';
    }

    var payload = {};
    goog.object.extend(payload, queueFile.getPayload(), {
      'filename': queueFile.name,
      'filesize': queueFile.size,
      'content_type': this.contentType_
    });

    var handshakeContent = {};
    handshakeContent['payload'] = goog.json.serialize(payload);

    panda.net.XhrCommand.send(this.handshakeUrl_, handshakeContent,
        goog.bind(this.handleHandshakeSuccess_, this, queueFile),
        goog.bind(this.handleHandshakeFailure_, this, queueFile));

    if(this.confirmBeforeUnload_)
      this.attachBeforeUnloadEvent_(true);
  }
};


/**
 * Attach or detach window unload events for:
 *  - warning the user before they navigate away and mess up their uploads, and
 *  - making sure the server knows so the messed up uploads are deleted.
 * @param {boolean} enable Attach or detach.
 * @private
 */
panda.uploader.UploadHandler.prototype.attachBeforeUnloadEvent_ = function(enable) {
  // FIXME: Play nice with any other window.onbeforeunload handlers.
  var win = this.queue_.getUploader().getDomHelper().getWindow();
  if (enable) {
    win.onbeforeunload = goog.bind(this.handleWindowBeforeUnload_, this);
  } else {
    win.onbeforeunload = null;
  }
};


/**
 * Process a successful handshake request by starting the file upload again,
 * but for real this time.
 * @param {!panda.upload.File} queueFile The upload queue file object.
 * @param {!Object} json Response JSON.
 * @private
 */
panda.uploader.UploadHandler.prototype.handleHandshakeSuccess_ = function(
    queueFile, json) {

  var uploadVars =  {
    'upload_var_name': 'file'
  };
  goog.object.extend(uploadVars, json);

  queueFile.setUploadUrl(uploadVars['upload_url']);
  queueFile.setUploadVarName(uploadVars['upload_var_name']);

  if(uploadVars['upload_content_type']) {
    queueFile.setUploadContentType(uploadVars['upload_content_type']);
  }else{
    queueFile.setUploadContentType(this.contentType_);
  }

  if ('postprocess_url' in json) {
    this.postprocessUrls_[queueFile.id] = json['postprocess_url'];
  }

  this.queue_.upload(queueFile);
};


/**
 * Process a failed handshake request by marking the whole upload as a failure.
 * This will transitively call {@link handleUploadError_}.
 * @param {!panda.upload.File} queueFile The upload queue file object.
 * @param {!Object} json Response JSON.
 * @private
 */
panda.uploader.UploadHandler.prototype.handleHandshakeFailure_ = function(
    queueFile, json) {

  this.queue_.getUploader().cancel(queueFile);

  this.attachBeforeUnloadEvent_(false);
};


/**
 * Handle the completion of the actual file upload. If this was a file
 * upload to a third-party service, a postprocess request is made to
 * let our server know that the client finished uploading the file.
 * If the upload was to our own servers, the response is the same as
 * that of the postprocess request, so it can be skipped, and the file
 * model is immediately marked completed.
 * @param {!panda.upload.File.CompleteEvent} e File event.
 * @private
 */
panda.uploader.UploadHandler.prototype.handleUploadComplete_ = function(e) {
  var queueFile = /** @type {!panda.upload.File} */ (e.target);
  if (queueFile.id in this.postprocessUrls_) {
    var content = {
      'upload_response': e.responseText
    };
    this.sendPostprocessRequest_(queueFile, content);
  } else {
    this.handleEverythingComplete_(queueFile, e.getResponseJson());
  }
};

/**
 * Send a postprocess request to notify our server that an upload succeeded
 * of failed.
 * @param {!panda.upload.File} queueFile The upload queue file object.
 * @param {!Object} content POST vars.
 * @private
 */
panda.uploader.UploadHandler.prototype.sendPostprocessRequest_ = function(
    queueFile, content) {
  goog.asserts.assert(queueFile.id);
  goog.asserts.assert(queueFile.id in this.postprocessUrls_);
  panda.net.XhrCommand.send(this.postprocessUrls_[queueFile.id], content,
      goog.bind(this.handlePostprocessComplete_, this, queueFile),
      goog.bind(this.handlePostprocessFailure_, this, queueFile,
                content));
};


/**
 * Handle a successful postprocessing callback to our server, which reports
 * whether the file upload was successful or a failure.
 * @param {!panda.upload.File} queueFile The upload queue file object.
 * @param {Object} json Response JSON.
 * @private
 */
panda.uploader.UploadHandler.prototype.handlePostprocessComplete_ = function(
    queueFile, json) {
    this.handleEverythingComplete_(queueFile, json);
};


/**
 * Handle a failed request to our server which is meant to inform us that
 * an upload to a third-party service completed successfully. We'll have no
 * idea that the file finished unless this gets through.
 * @param {!panda.upload.File} queueFile The upload queue file object.
 * @param {!Object} content The original request content. This is used when
 *     the request failed completely and needs to be retried.
 * @param {!Object} json Response JSON.
 * @private
 */
panda.uploader.UploadHandler.prototype.handlePostprocessFailure_ = function(
    queueFile, content, json) {
  if (json) {
    // This implies that the request succeeded, but json.success == false
    panda.log('File upload rejected or failed.');
    if (json['message']) {
      var win = this.queue_.getUploader().getDomHelper().getWindow();
      win.alert(json['message']);
    }
  } else {
    panda.log('Failed to report to the postprocess URL.');
  }
};


/**
 * Warn the user when they try to navigate away from the current page that
 * their uploads will be cancelled. Note that this is note a typical closure
 * event, since we have to be able to return the warning message as a string,
 * which closure does not support.
 * @param {Event=} e Barebones W3C DOM event or nothing in the case of IE.
 * @private
 */
panda.uploader.UploadHandler.prototype.handleWindowBeforeUnload_ = function(e) {
  if (!e) {
    e = this.queue_.getUploader().getDomHelper().getWindow().event;
  }
  var MSG_ABORT_FILE_UPLOADS = goog.getMsg('Please stay on this page until ' +
                                           'your uploads complete.');
  // For IE and Firefox < 4.0
  if (e) {
    e.returnValue = MSG_ABORT_FILE_UPLOADS;
  }
  // For Safari (and Chrome, I'm assuming)
  return MSG_ABORT_FILE_UPLOADS;
};


/**
 * Once the whole queue is complete, remove the unnecessary event listeners
 * to improve performance.
 * @param {!goog.events.Event} e Queue event.
 * @private
 */
panda.uploader.UploadHandler.prototype.handleQueueComplete_ = function(e) {
  this.attachQueueEvents_(false);
  this.attachBeforeUnloadEvent_(false);
  this.queueCompleteCallback_();
};
