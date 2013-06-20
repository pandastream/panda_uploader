goog.provide('panda.upload.Queue');

goog.require('goog.events.EventTarget');
goog.require('goog.object');
goog.require('goog.structs.Queue');
goog.require('panda.upload.File');
goog.require('panda.upload.Uploader');



/**
 * Upload Queue.
 *
 * @param {!panda.upload.Uploader} uploader Uploader instance.
 * @param {string=} opt_uploadUrl URL to upload all files to.
 * @param {Object=} opt_uploadVars Upload POST data or headers
 *    to include in all files.
 * @param {string=} opt_uploadVarName Upload POST var name to use for all
 *    files, if applicable.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
panda.upload.Queue = function(uploader, opt_uploadUrl, opt_uploadVars,
    opt_uploadVarName) {
  goog.base(this);

  /**
   * Uploader instance.
   * @type {!panda.upload.Uploader}
   * @private
   */
  this.uploader_ = uploader;

  /**
   * Upload submit URL.
   * @type {string|undefined}
   * @private
   */
  this.uploadUrl_ = opt_uploadUrl;

  /**
   * Upload POST data or headers to include in the upload request.
   * @type {Object|undefined}
   * @private
   */
  this.uploadVars_ = opt_uploadVars;

  /**
   * Upload POST field name for the file, if applicable with the current
   * uploader.
   * @type {string|undefined}
   * @private
   */
  this.uploadVarName_ = opt_uploadVarName;

  this.getHandler().
    listen(this.uploader_,
           panda.upload.Uploader.EventType.FILE_SELECT,
           this.handleFileSelect);
};
goog.inherits(panda.upload.Queue, goog.events.EventTarget);


/**
 * Queue events.
 * @enum {string}
 */
panda.upload.Queue.EventType = {
  /**
   * Dispatched when one or more new files are added to the queue.
   */
  ADD: goog.events.getUniqueId('add'),

  /**
   * Dispatched when first file starts uploading.
   */
  START: goog.events.getUniqueId('start'),

  /**
   * Dispatched when the whole queue has finished uploading.
   */
  COMPLETE: goog.events.getUniqueId('complete')
};


/**
 * True if a file is uploading at the moment.
 * @type {boolean}
 * @private
 */
panda.upload.Queue.prototype.isUploading_ = false;


/**
 * Queued File instances keyed by their ID as assigned by the uploader.
 * @type {Object.<string, panda.upload.File>}
 * @private
 */
panda.upload.Queue.prototype.files_ = null;


/**
 * Files that are waiting to start uploading.
 * @type {goog.structs.Queue}
 * @private
 */
panda.upload.Queue.prototype.queue_ = null;


/**
 * The file that is currently uploading, if any.
 * @type {panda.upload.File|undefined}
 * @private
 */
panda.upload.Queue.prototype.fileInProgress_;


/**
 * Automatically start uploading when file(s) are queued.
 * @type {boolean}
 * @private
 */
panda.upload.Queue.prototype.autoStart_ = false;


/**
 * Total number of bytes for all the files in the queue.
 * @type {number}
 * @private
 */
panda.upload.Queue.prototype.bytesTotal_ = 0;


/**
 * Total number of bytes for files that have finished uploading.
 * @type {number}
 * @private
 */
panda.upload.Queue.prototype.bytesCompleted_ = 0;


/**
 * Total number of bytes uploaded for the file that is currently uploading.
 * @type {number}
 * @private
 */
panda.upload.Queue.prototype.bytesInProgress_ = 0;


/**
 * Event Handler for this instance.
 * @type {goog.events.EventHandler}
 * @private
 */
panda.upload.Queue.prototype.handler_ = null;


/**
 * Enable or disable automatic upload when a file is selected.
 * @param {boolean} flag Boolean flag.
 */
panda.upload.Queue.prototype.setAutoStart = function(flag) {
  this.autoStart_ = flag;
};


/**
 * Check if there are any files currently queued for upload.
 * @return {boolean} True of at least one file has yet to start uploading.
 */
panda.upload.Queue.prototype.hasQueuedFiles = function() {
  return !!(this.queue_ && !this.queue_.isEmpty());
};


/**
 * Get the files that are currently queued for upload.
 * @return {Array.<!panda.upload.File>} Queued files.
 */
panda.upload.Queue.prototype.getQueuedFiles = function() {
  // Return a copy to prevent re-ordering.
  return this.queue_ ? this.queue_.getValues() : [];
};


/**
 * Queue up the selected files and begin uploading the first one.
 * @param {!panda.upload.Uploader.FileSelectEvent} e Uploader event.
 * @protected
 */
panda.upload.Queue.prototype.handleFileSelect = function(e) {
  var files = e.files;
  var file;
  var allowMultipleFiles = this.uploader_.getAllowMultipleFiles();

  // Keep track of what files we actually add in this pass.
  // This is necessary for listeners to know what's new.
  var newFiles = [];

  if (!this.files_) {
    this.files_ = {};
  }
  if (!this.queue_) {
    this.queue_ = new goog.structs.Queue();
  }

  // In single-file mode, the SWF files list is cleared on each new selection.
  // We must ensure our internal file handling is updated accordingly.
  if (!allowMultipleFiles) {
    this.cleanUpFiles();
  }

  for (var i = 0; file = files[i]; i++) {
    // In queue-mode, the flash uploader provides all files each time a new
    // file is added to the queue, so we must filter out the files we've
    // already handled.
    if (allowMultipleFiles && file.id in this.files_) {
      continue;
    }

    this.files_[file.id] = file;
    this.queue_.enqueue(file);
    newFiles.push(file);
    this.bytesTotal_ += file.size;
  }

  if (newFiles.length) {
    this.dispatchEvent(new panda.upload.Queue.AddEvent(newFiles));
  }

  if (this.autoStart_) {
    this.upload();
  }
};

/**
 * Start the upload queue.
 * @param {!panda.upload.File=} opt_file File to upload.
 */
panda.upload.Queue.prototype.upload = function(opt_file) {
  if (!this.isUploading_) {
    if(this.fileInProgress_) {
      this.uploadFile_(this.fileInProgress_);
      return;
    }else{
      this.isUploading_ = true;
      this.attachUploadEvents_(true);
      this.dispatchEvent(panda.upload.Queue.EventType.START);
    }
  }

  if (opt_file) {
    this.uploadFile_(opt_file);
  } else if(!this.fileInProgress_) {
    this.uploadNextFile();
  }
};


/**
 * Cancel the given file.
 * @param {!panda.upload.File} file Target file to cancel.
 */
panda.upload.Queue.prototype.cancel = function(file) {
  if (file.id in this.files_) {
    this.uploader_.cancel(file);
    this.queue_.remove(file);
    delete this.files_[file.id];
    this.bytesTotal_ -= file.size;
    if (this.fileInProgress_ == file) {
      this.bytesInProgress_ = 0;
      this.uploadNextFile();
    }
  } else {
    panda.log('The uploader queue cannot cancel a file that does not belong to it.');
  }
};


/**
 * Clean up after the queue completes.
 * @protected
 */
panda.upload.Queue.prototype.uploadsCompleted = function() {
  this.isUploading_ = false;
  this.attachUploadEvents_(false);
  this.dispatchEvent(panda.upload.Queue.EventType.COMPLETE);
  this.cleanUpFiles();
};


/**
 * Clean up the files list.
 * @protected
 */
panda.upload.Queue.prototype.cleanUpFiles = function() {
  this.bytesTotal_ = 0;
  this.bytesCompleted_ = 0;
  this.queue_.clear();
  delete this.fileInProgress_;
  for (var id in this.files_) {
    goog.dispose(this.files_[id]);
    delete this.files_[id];
  }
};


/**
 * Begin uploading the first file in the queue.
 * @protected
 */
panda.upload.Queue.prototype.uploadNextFile = function() {
  this.fileInProgress_ = /** @type {panda.upload.File|undefined} */ (
      this.queue_.peek());
  if (this.fileInProgress_) {
    this.uploadFile_(this.fileInProgress_);
  } else {
    this.uploadsCompleted();
  }
};


/**
 * Upload the given file.
 * @param {!panda.upload.File} file Target file.
 * @private
 */
panda.upload.Queue.prototype.uploadFile_ = function(file) {
  if (this.uploadUrl_) {
    file.setUploadUrl(this.uploadUrl_);
  }
  if (this.uploadVars_) {
    file.setUploadVars(this.uploadVars_);
  }
  if (this.uploadVarName_) {
    file.setUploadVarName(this.uploadVarName_);
  }
  this.uploader_.upload(file);
};


/**
 * When a file has been paused.
 * @param {!goog.events.Event} e Queued file event.
 * @protected
 */
panda.upload.Queue.prototype.handleFilePaused = function(e) {
  this.isUploading_ = false;
};


/**
 * When one file finished begin uploading the next.
 * @param {!goog.events.Event} e Queued file event.
 * @protected
 */
panda.upload.Queue.prototype.handleFileComplete = function(e) {
  var file = /** @type {panda.upload.File} */ (e.target);
  this.bytesCompleted_ += file.size;
  this.bytesInProgress_ = 0;
  this.queue_.remove(file);
  this.uploadNextFile();
};


panda.upload.Queue.prototype.handleFileError = function(e) {
  var file = /** @type {panda.upload.File} */ (e.target);
  this.bytesTotal_ -= file.size;
  this.bytesInProgress_ = 0;
  this.queue_.remove(file);
  this.uploadNextFile();
};


/**
 * Cancel a file upload in progress, or before it's started.
 * @param {!goog.events.Event} e Queued file event.
 * @protected
 */
panda.upload.Queue.prototype.handleFileCancel = function(e) {
  var file = /** @type {panda.upload.File} */ (e.target);
  this.bytesTotal_ -= file.size;
  this.bytesInProgress_ = 0;
  this.queue_.remove(file);
  if (this.isUploading_ && this.fileInProgress_ == file) {
    this.uploadNextFile();
  }
};


/**
 * @return {!goog.events.EventHandler} Event handler.
 * @protected
 */
panda.upload.Queue.prototype.getHandler = function() {
  return this.handler_ || (this.handler_ = new goog.events.EventHandler(this));
};


/**
 * Listen or unlisten for upload and child events.
 * @param {boolean} attach True to attach, False to detach.
 * @private
 */
panda.upload.Queue.prototype.attachUploadEvents_ = function(attach) {
  var handler = this.getHandler();
  var action = goog.bind(attach ? handler.listen : handler.unlisten, handler);
  action(this.uploader_,
         panda.upload.File.EventType.COMPLETE,
         this.handleFileComplete);
  action(this.uploader_,
         panda.upload.File.EventType.PAUSED,
         this.handleFilePaused);
  action(this.uploader_,
         panda.upload.File.EventType.ERROR,
         this.handleFileError);
  action(this.uploader_,
         panda.upload.File.EventType.CANCEL,
         this.handleFileCancel);
};


/**
 * Return the number of bytes that have been uploaded across the entire queue.
 * @return {number} Bytes uploaded.
 */
panda.upload.Queue.prototype.getBytesLoaded = function() {
  return this.bytesCompleted_ + this.bytesInProgress_;
};


/**
 * Return the total number of bytes in the upload queue.
 * @return {number} Total bytes to upload.
 */
panda.upload.Queue.prototype.getBytesTotal = function() {
  return this.bytesTotal_;
};


/**
 * @return {!panda.upload.Uploader} The uploader component.
 */
panda.upload.Queue.prototype.getUploader = function() {
  return this.uploader_;
};



/**
 * Event for when new files have been added to the queue.
 * @param {Array.<panda.upload.File>} newFiles Newly queued files.
 * @constructor
 * @extends {goog.events.Event}
 */
panda.upload.Queue.AddEvent = function(newFiles) {
  goog.base(this, panda.upload.Queue.EventType.ADD);

  /**
   * The files that have just been added to the queue.
   * @type {Array.<!panda.upload.File>}
   */
  this.newFiles = newFiles;
};
goog.inherits(panda.upload.Queue.AddEvent, goog.events.Event);
