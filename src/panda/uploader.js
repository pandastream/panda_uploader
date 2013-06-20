goog.provide('panda.uploader.init');
goog.provide('panda.progressBar.init');
goog.provide('panda.fileDrop.init');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.object');
goog.require('panda.base');

goog.require('panda.upload.Queue');
goog.require('panda.uploader.UploadHandler');

goog.require('panda.upload.FlashUploader');
goog.require('panda.upload.Html5Uploader');

goog.require('panda.upload.ProgressBar');
goog.require('panda.upload.FileDrop');

goog.exportSymbol('panda.upload.Uploader', panda.upload.Uploader);
goog.exportSymbol('panda.upload.Html5Uploader', panda.upload.Html5Uploader);
goog.exportSymbol('panda.upload.FlashUploader', panda.upload.FlashUploader);

goog.exportSymbol('panda.upload.File', panda.upload.File);
goog.exportSymbol('panda.upload.Html5File', panda.upload.Html5File);

goog.exportSymbol('panda.upload.Queue', panda.upload.Queue);


/**
 * Print the uploader version
 * @type {string}
 */
panda.uploader.version = "<VERSION>";

/**
 * This is the entry point for creating a new uploader.
 *
 * We use the module pattern to provide strong encapsulation and prevent
 * people from getting at any private members that may (will) change.
 *
 * @param {Object} options_ Uploader options.
 * @return {Object} Public "methods" for the uploader.
 */
panda.uploader.init = function(options_) {
  /**
   * This will be the set of public methods that this function returns to
   * the API consumer. We use this instead of an instance of a class so that
   * private members are truly private (only functions defined within this
   * can access to the other non-public members inside the scope of this
   * function).
   * @type {Object}
   */
  var exports = {};

  var options = {
      'authorizeUrl': '/panda/authorize_upload',
      'autoStart': true,
      'autoResume': true,
      'resumeInterval': 5000,
      'allowSelectMultipleFiles': false,
      'flashUrl': "//<CDN_HOST>/u/<VERSION>/assets/flashuploader.swf",
      'confirmBeforeUnload': true
  };
  goog.object.extend(options, options_);

  if (options["debug"]) {
    panda.log = Function.prototype.bind.call(panda.debugLogger);
  }

  var flashUrl = goog.uri.utils.makeUnique(options['flashUrl']);

  /**
   * The upload file button.
   * @type {Element}
   */
  var button = goog.dom.getElement(options['buttonId']);
  var dom = goog.dom.getDomHelper(button);

  if (!button) {
    throw Error('Invalid upload button.');
  }
  if (!flashUrl) {
    throw Error('No flash uploader SWF URL provided.');
  }
  if (!options['authorizeUrl']) {
    throw Error('No authorizeUrl provided.');
  }

  /**
   * The core file upload workflow logic. This decorates the uploader file.
   * @type {!panda.uploader.UploadHandler}
   */
  var uploadHandler;

  /**
   * The uploader implementation.
   * @type {!panda.upload.Uploader}
   */
  var uploader;

  if(!options["type"]) {
    if (panda.upload.Html5Uploader.isSupported()) {
      options["type"] = "html5";
    }else if(panda.upload.FlashUploader.isSupported()){
      options["type"] = "flash";
    }
  }

  if (options["type"] == "html5") {
    uploader = new panda.upload.Html5Uploader(dom);
  } else if (options["type"] == "flash") {
    uploader = new panda.upload.FlashUploader(flashUrl, true, dom);
  } else {
    throw Error('This browser does not support HTML5 or Flash uploads.');
  }

  var handleUploadQueue = function(e) {
    if (goog.isFunction(options['onQueue']))
      options['onQueue'](e.newFiles);
  };
  var handleUploadStart = function(e) {
    if (goog.isFunction(options['onStart']))
      options['onStart'](e.target);
  };
  var handleUploadProgress = function(e){
    if (goog.isFunction(options['onProgress']))
      options['onProgress'](e.target, e.getPercentComplete());

    if (exports['setProgress'])
      exports['setProgress'](e.getPercentComplete());
  };
  var handleUploadSuccess = function(file, json){
    if (goog.isFunction(options['onSuccess']))
      options['onSuccess'](file, json);
  };
  var handleUploadComplete = function(e){
    if (goog.isFunction(options['onComplete']))
      options['onComplete']();
  };
  var handleUploadCancel = function(e){
    if (goog.isFunction(options['onCancel']))
      options['onCancel'](e.target);
  };
  var handleUploadError = function(e){
    if (goog.isFunction(options['onError']))
      options['onError'](e.target, e.responseText);
  };
  var handleUploadPaused = function(e){
    if (options['autoResume']) {
      setTimeout(function(){
        uploadQueue.upload();
      }, options['resumeInterval']);
    }

    if (goog.isFunction(options['onPause']))
      options['onPause'](e.target);
  };

  /**
   * @param {String} size File Size as a string
   * @private
   */
  function sizeInBytes(size) {
    if ( ! size ) { return 0; }

    var m = String(size).match(new RegExp("([0-9]+)\\s*([GKM]?B?)?"));

    if ( ! m ) { return 0; }

    var value = Number(m[1]);

    var units = m[2];
    var ex = 0;

    switch(units) {
      case 'B':  ex = 0; break;
      case 'K':
      case 'KB': ex = 1; break;
      case 'M':
      case 'MB': ex = 2; break;
      case 'G':
      case 'GB': ex = 3; break;
    }

    return value*Math.pow(1024, ex);
  }

  /**
   * Accept the given file as the one we'll be uploading when the form is
   * submitted. This is called by the {@link panda.media.UploadHandler} when
   * new files are added to the queue. We only ever track one file at a time,
   * so only the last queued file will be uploaded.
   * @param {!panda.upload.File.EventType} event AddEvent
   * @private
   */
  function addFiles(event) {
    var queueFiles = event.newFiles;

    handleUploadQueue(event);

    for (var id in queueFiles) {
      var file = queueFiles[id];

      if(options['maxFileSize']) {
        var maxFileSizeInBytes = sizeInBytes(options['maxFileSize']);

        if (file.size > maxFileSizeInBytes) {
          uploadQueue.cancel(file);

          var MSG_FILE_TOO_LARGE = goog.getMsg(
            'Please choose a file that is under {$size}.',
            {'size': options['maxFileSize']});

          var win = uploadQueue.getUploader().getDomHelper().getWindow();
          win.alert(MSG_FILE_TOO_LARGE);
        }
      }

      goog.events.listen(file,
                         panda.upload.File.EventType.START,
                         handleUploadStart);
      goog.events.listen(file,
                         panda.upload.File.EventType.PROGRESS,
                         handleUploadProgress);
      goog.events.listen(file,
                         panda.upload.File.EventType.ERROR,
                         handleUploadError);
      goog.events.listen(file,
                         panda.upload.File.EventType.CANCEL,
                         handleUploadCancel);
      goog.events.listen(file,
                         panda.upload.File.EventType.PAUSED,
                         handleUploadPaused);
    }
  }

  /**
   * The upload queue
   * @type {panda.upload.Queue|undefined}
   */
  var uploadQueue = new panda.upload.Queue(uploader);

  uploader.render();
  uploader.attachButton(button);
  uploader.setAllowMultipleFiles(options['allowSelectMultipleFiles']);
  uploadQueue.setAutoStart(options['autoStart']);

  if (options['fileFilters']) {
    uploader.setFileFilters(options['fileFilters']);
  }

  uploadHandler = new panda.uploader.UploadHandler(
        /** @type {!panda.upload.Queue} */ (uploadQueue),
        /** @type {string} */ (options['authorizeUrl']),
        /** @type {boolean} */ (options['confirmBeforeUnload']),
        addFiles,
        handleUploadSuccess,
        handleUploadComplete
      );

  exports['type'] = options['type'];

  exports['queue'] = uploadQueue;

  exports['setPayload'] = function(file, data){
    file.setPayload(data);
  };

  exports['setEnabled'] = function(enable){
    uploadQueue.getUploader().setEnabled(enable);
  };

  exports['getQueuedFiles'] = function(){
    return uploadQueue.getQueuedFiles();
  };

  exports['start'] = function(){
    uploadQueue.upload();
  };

  exports['cancel'] = function(opt_file){
    uploadQueue.cancel(opt_file);
  };

  if (options['fileDropId'] && options["type"] == "html5") {
    exports['fileDrop'] = panda.fileDrop.init(uploadQueue.getUploader(), {'id': options['fileDropId']});
  }

  if (options['progressBarId']) {
    var progressBar = panda.progressBar.init(uploadQueue.getUploader(), {'id': options['progressBarId']});
    exports['setProgress'] = progressBar['setProgress'];
  }

  return exports;
};

goog.exportSymbol('panda.uploader.init', panda.uploader.init);
goog.exportSymbol('panda.uploader.version', panda.uploader.version);


/**
 * This is the entry point for creating a Progress Bar object
 *
 * @param {!panda.upload.Uploader} uploader File HTML5 Uploader.
 * @param {Object} options ProgressBar options.
 * @return {Object} Public "methods" for the progress bar.
 */
panda.progressBar.init = function(uploader, options){

    /**
   * This will be the set of public methods that this function returns to
   * the API consumer. We use this instead of an instance of a class so that
   * private members are truly private (only functions defined within this
   * can access to the other non-public members inside the scope of this
   * function).
   * @type {Object}
   */
  var exports = {};

  var holder = goog.dom.getElement(options['id']);
  var dom = goog.dom.getDomHelper(holder);

  if (!holder) {
    throw Error('Invalid progress bar holder.');
  }

  /**
   * The Progress Bar
   * @type {!panda.upload.ProgressBar}
   */
  var progressBar;

  progressBar = new panda.upload.ProgressBar(uploader, dom);
  progressBar.decorate(holder);

  exports['setProgress'] = goog.bind(progressBar.setProgress, progressBar);

  return exports;
};
goog.exportSymbol('panda.progressBar.init', panda.progressBar.init);


/**
 * This is the entry point for creating a File drop object
 *
 * @param {!panda.upload.Uploader} uploader File HTML5 Uploader.
 * @param {Object} options FileDrop options.
 * @return {Object} Public "methods" for the File drop
 */
panda.fileDrop.init = function(uploader, options){

    /**
   * This will be the set of public methods that this function returns to
   * the API consumer. We use this instead of an instance of a class so that
   * private members are truly private (only functions defined within this
   * can access to the other non-public members inside the scope of this
   * function).
   * @type {Object}
   */
  var exports = {};

  var holder = goog.dom.getElement(options['id']);
  var dom = goog.dom.getDomHelper(holder);

  if (!holder) {
    throw Error('Invalid drop holder.');
  }

  /**
   * The File Drop
   * @type {!panda.upload.FileDrop}
   */
  var drop;

  drop = new panda.upload.FileDrop(uploader, dom);
  drop.decorate(holder);

  return exports;
};
goog.exportSymbol('panda.fileDrop.init', panda.fileDrop.init);
