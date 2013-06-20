goog.provide('panda.upload.FlashUploader');

goog.require('goog.dom.classes');
goog.require('goog.net.cookies');
goog.require('goog.object');
goog.require('goog.style');
goog.require('goog.ui.media.FlashObject');
goog.require('goog.uri.utils');
goog.require('panda.upload.File');
goog.require('panda.upload.Uploader');



/**
 * A thin wrapper for the YUI Uploader using Closure's event management
 * and FlashObject component.
 *
 * @param {string} flashUrl The flash SWF URL.
 * @param {boolean=} opt_autoHideFlash If true, the flash element will be
 *     hidden when the mouse leaves the button area, and replaced on hover.
 * @param {goog.dom.DomHelper=} opt_domHelper An optional DomHelper.
 * @constructor
 * @extends {goog.ui.Component}
 * @implements {panda.upload.Uploader}
 */
panda.upload.FlashUploader = function(flashUrl, opt_autoHideFlash,
    opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * Flash object to reference our YUI Uploader.
   * @type {goog.ui.media.FlashObject}
   * @private
   */
  this.yup_ = new goog.ui.media.FlashObject(flashUrl, opt_domHelper);
  this.yup_.setRequiredVersion(panda.upload.FlashUploader.REQUIRED_VERSION);
  this.yup_.setAllowScriptAccess(
      goog.ui.media.FlashObject.ScriptAccessLevel.ALWAYS);
  this.yup_.setWmode(goog.ui.media.FlashObject.Wmodes.TRANSPARENT);
  this.yup_.addFlashVars({
    // Necessary flashvars for the YUIBridge (ExternalInterface)
    'yId': 'closure',
    'YUISwfId': this.getId(),
    'YUIBridgeCallback': 'panda.upload.FlashUploader',
    'allowedDomain': this.dom_.getDocument().location.hostname
  });

  /**
   * Flag to enable automatically moving the flash object to cover the button
   * when your mouse enters the button area, and then hiding it after.
   * @type {boolean}
   * @private
   */
  this.autoHideFlash_ = !!opt_autoHideFlash;

  // Store a reference to this instance so we can look it up and dispatch
  // events from the flash uploader itself.
  panda.upload.FlashUploader.instances_[this.getId()] = this;
};
goog.inherits(panda.upload.FlashUploader, goog.ui.Component);


/**
 * The version of flash required by the YUI Uploader flash object.
 * @type {string}
 */
panda.upload.FlashUploader.REQUIRED_VERSION = '9.0.45';


/**
 * Check for flash upload support.
 * @return {boolean} True if the browser supports flash uploads.
 */
panda.upload.FlashUploader.isSupported = function() {
  return goog.userAgent.flash.isVersion(
      panda.upload.FlashUploader.REQUIRED_VERSION);
};


/**
 * Error Messages.
 * @enum {string}
 */
panda.upload.FlashUploader.Error = {
  METHOD_NOT_FOUND: 'External interface method not found.'
};


/**
 * Uploader instance storage so that a callback from flash can be mapped
 * to the correct instance.
 * @type {Object}
 * @private
 */
panda.upload.FlashUploader.instances_ = {};


/**
 * Auth cookie name.
 * @type {string}
 */
panda.upload.FlashUploader.AUTH_COOKIE_NAME = 'authtkt';


/**
 * The 'Browse Files' button element that the flash uploader is overlaid.
 * @type {Element}
 * @private
 */
panda.upload.FlashUploader.prototype.button_ = null;


/**
 * The uploader SWF behaves differently when multiple files are allowed
 * to be queued up, so this caches its value so we can adjust accordingly.
 * @type {boolean}
 * @private
 */
panda.upload.FlashUploader.prototype.allowMultipleFiles_ = false;


/**
 * A mapping of file objects that are currently uploading.
 * @type {Object.<string, !panda.upload.File>}
 * @private
 */
panda.upload.FlashUploader.prototype.activeFiles_ = null;


/**
 * Add the auth info to the POST vars since Flash doesn't send the cookies.
 * This checks the URL to ensure that we don't expose the authtkt to
 * third-party sites.
 * @param {string} url Upload URL.
 * @param {Object=} opt_postVars An object to add the authtkt to.
 * @return {Object} Post vars.
 */
panda.upload.FlashUploader.prototype.addAuthTicketToVars = function(url,
    opt_postVars) {
  var postVars = opt_postVars || {};
  if (!goog.uri.utils.getDomainEncoded(url) ||
      goog.uri.utils.haveSameDomain(url, this.dom_.getWindow().location.href)) {
    var authTkt = goog.net.cookies.get(
        panda.upload.FlashUploader.AUTH_COOKIE_NAME);
    if (goog.isDef(authTkt)) {
      postVars[panda.upload.FlashUploader.AUTH_COOKIE_NAME] = authTkt;
    }
  }
  return postVars;
};


/**
 * Attach this uploader to an event-less 'browse files' button.
 * @param {Element} element Button element.
 */
panda.upload.FlashUploader.prototype.attachButton = function(element) {
  if (this.autoHideFlash_) {
    if (this.button_) {
      this.getHandler().unlisten(this.button_,
          goog.events.EventType.MOUSEOVER,
          this.handleButtonMouseOver);
    }
    this.getHandler().listen(element,
        goog.events.EventType.MOUSEOVER,
        this.handleButtonMouseOver);
  } else {
    var size = goog.style.getSize(element);
    this.yup_.setSize(size.width, size.height);
  }
  this.button_ = element;
};


/**
 * Return the attached 'browse files' button that sits under the
 * transparent flash clickable region.
 * @return {Element} Button element.
 */
panda.upload.FlashUploader.prototype.getButton = function() {
  return this.button_;
};


/** @inheritDoc */
panda.upload.FlashUploader.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  var div = this.dom_.createDom(goog.dom.TagName.DIV);
  this.yup_.decorate(div);
  goog.dom.appendChild(this.getElement(), div);
  this.addChild(this.yup_);

  goog.dom.classes.add(this.yup_.getElement(), 'panda-uploader');

  var flashEl = this.yup_.getFlashElement();
  flashEl.style.position = 'absolute';

  /**
   * The following events are all triggered via calls to YUI.applyTo(), which
   * is an alias for panda.upload.FlashUploader.receiveYUIBridgeCallback_,
   * which calls panda.upload.FlashUploader.dispatchUploaderEvent_, which
   * selects the instance and actually dispatches the event.
   */
  this.getHandler().
    listen(this, goog.events.EventType.MOUSEOVER, this.handleMouseOver).
    listen(this, goog.events.EventType.MOUSEOUT, this.handleMouseOut).
    listen(this, goog.events.EventType.MOUSEDOWN, this.handleMouseDown).
    listen(this, goog.events.EventType.MOUSEUP, this.handleMouseUp);

  if (this.autoHideFlash_) {
    this.hideFlash();
  }
};


/**
 * Upload the given queued file.
 * @param {!panda.upload.File} file File object to upload.
 */
panda.upload.FlashUploader.prototype.upload = function(file) {
  if (!file.dispatchEvent(panda.upload.File.EventType.BEFORE_START)) {
    return;
  }
  var postVars = this.addAuthTicketToVars(file.getUploadUrl(),
      file.getUploadVars());
  if (!this.activeFiles_) {
    this.activeFiles_ = {};
  }
  this.activeFiles_[file.id] = file;
  this.callFlash_('upload', [file.id, file.getUploadUrl(), 'POST',
      postVars, file.getUploadVarName()]);
  file.dispatchEvent(panda.upload.File.EventType.START);
};


/**
 * Cancels the upload of a specific file, if currently in progress,
 * and removes it from the file list.
 * @param {!panda.upload.File} file File object to upload.
 */
panda.upload.FlashUploader.prototype.cancel = function(file) {
  if (this.activeFiles_) {
    delete this.activeFiles_[file.id];
  }
  this.callFlash_('cancel', [file.id]);
  file.dispatchEvent(panda.upload.File.EventType.CANCEL);
};


/**
 * Setter for the 'log' property.
 * @param {boolean} value The value for the 'log' property.
 */
panda.upload.FlashUploader.prototype.setAllowLogging = function(value) {
  this.callFlash_('setAllowLogging', [value]);
};


/**
 * Setter for the 'multiFiles' property.
 * @param {boolean} value The value for the 'multiFiles' property.
 */
panda.upload.FlashUploader.prototype.setAllowMultipleFiles = function(value) {
  this.allowMultipleFiles_ = value;
  // Configure the uploader the next time it is used.
  this.getHandler().listenOnce(this,
      goog.events.EventType.MOUSEDOWN,
      function(e) {
        this.callFlash_('setAllowMultipleFiles', [value]);
      });
};


/**
 * Getter for the 'multiFiles' property.
 * @return {boolean} The value for the 'multiFiles' property.
 */
panda.upload.FlashUploader.prototype.getAllowMultipleFiles = function() {
  return this.allowMultipleFiles_;
};


/**
 * Setter for the 'simLimit' property.
 * @param {number} value The value for the 'simLimit' property.
 */
panda.upload.FlashUploader.prototype.setSimultaneousUploadLimit = function(
    value) {
  this.callFlash_('setSimUploadLimit', [value]);
};


/**
 * Setter for the 'fileFilters' property.
 * @param {Array} fileFilters The value for the 'fileFilters' property.
 */
panda.upload.FlashUploader.prototype.setFileFilters = function(fileFilters) {
  this.callFlash_('setFileFilters', [fileFilters]);
};


/**
 * Enables or disables the mouse event handling on the 'Browse' button.
 * If the button skin is applied, the sprite is set to the 'disabled' state.
 * @param {boolean} enable True to enable, false to disable.
 */
panda.upload.FlashUploader.prototype.setEnabled = function(enable) {
  this.callFlash_(enable ? 'enable' : 'disable');
};

/**
 * Check if the uploaders support a certain content type.
 * @param {string} contentType that needs to be supported
 * @return {boolean}
 */
panda.upload.FlashUploader.prototype.acceptsContentType = function(contentType) {
  if(contentType == 'multipart/form-data')
    return true;

  return false;
};



/**
 * @param {!goog.events.BrowserEvent} e Mouse-over event.
 * @protected
 */
panda.upload.FlashUploader.prototype.handleMouseOver = function(e) {
  goog.dom.classes.add(this.button_, 'hover');
};


/**
 * Since clicks don't occur on the actual button element, we pretend.
 * @param {!goog.events.BrowserEvent} e Mouse-down event.
 * @protected
 */
panda.upload.FlashUploader.prototype.handleMouseDown = function(e) {
  goog.dom.classes.swap(this.button_, 'hover', 'active');
};


/**
 * Since clicks don't occur on the actual button element, we pretend.
 * @param {!goog.events.BrowserEvent} e Mouse-up event.
 * @protected
 */
panda.upload.FlashUploader.prototype.handleMouseUp = function(e) {
  goog.dom.classes.swap(this.button_, 'active', 'hover');
  this.button_.focus();
};


/**
 * Since clicks don't occur on the actual button element, we pretend.
 * @param {!goog.events.BrowserEvent} e Mouse-leave event.
 * @protected
 */
panda.upload.FlashUploader.prototype.handleMouseOut = function(e) {
  goog.dom.classes.remove(this.button_, 'hover');
  if (this.autoHideFlash_) {
    this.hideFlash();
  }
};


/**
 * Respond to the user hovering over the attached button by shooting
 * the flash element over top of the button, so that when they click,
 * it they get the 'browse for files' dialog from flash. This listener
 * is only attached when {@link autoHideFlash_} is true.
 * @param {!goog.events.BrowserEvent} e Mouse-over event.
 * @protected
 */
panda.upload.FlashUploader.prototype.handleButtonMouseOver = function(e) {
  // Treat this as if we hovered over the flash, adding a 'hover' class
  // immediately to ensure that the hover effect is continuous while we
  // move the flash object over the button/under the cursor.
  var button = this.getButton();
  goog.dom.classes.add(button, 'hover');

  // This button position assumes that the uploader is being rendered
  // into the top level of the page, so that no parent element has
  // a position: relative style set.
  var buttonPosition = goog.style.getPageOffset(button);
  var buttonSize = goog.style.getSize(button);
  var element = this.yup_.getFlashElement();
  goog.style.setPosition(element, buttonPosition);
  goog.style.setSize(element, buttonSize);

  var zIndex = 999999;
  var parentZIndex = parseInt(goog.style.getComputedZIndex(button), 10);

  if (typeof(parentZIndex) == "number" && !isNaN(parentZIndex)) {
    zIndex = parseInt(parentZIndex, 10) + 1;
  }

  element.style.zIndex = zIndex;
};


/**
 * Hide the flash by giving it zero size and positioning it in the
 * top left corner of the document. We can't use display none or
 * visibility hidden because this breaks communication with the SWF,
 * halting any uploads that may be in progress.
 * @protected
 */
panda.upload.FlashUploader.prototype.hideFlash = function() {
  var element = this.yup_.getFlashElement();
  goog.style.setPosition(element, 0, 0);
  goog.style.setSize(element, 0, 0);
};


/** @inheritDoc */
panda.upload.FlashUploader.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
  delete panda.upload.FlashUploader.instances_[this.getId()];
  this.button_ = null;
};


/**
 * Call a function that is defined in the YUI Uploader ActionScript.
 * @param {string} func Callback name.
 * @param {Array=} opt_args Optional arguments to pass to the callback.
 * @return {*} The callback's return value.
 * @private
 */
panda.upload.FlashUploader.prototype.callFlash_ = function(func, opt_args) {
  var args = opt_args || [];
  var element = this.yup_.getFlashElement();
  if (func in element) {
    return element[func].apply(element, args);
  } else {
    throw Error(panda.upload.FlashUploader.Error.METHOD_NOT_FOUND);
  }
};


/**
 * Dispatch the given event on the correct Uploader instance.
 * See http://developer.yahoo.com/yui/uploader/ for events produced.
 * @param {string} uploaderId The uploader's element ID.
 * @param {Object} yuiEvent A simple object containing event-like attributes.
 * @private
 */
panda.upload.FlashUploader.dispatchUploaderEvent_ = function(uploaderId,
    yuiEvent) {
  var e;
  var yuiEventType = yuiEvent['type'];
  var uploader = panda.upload.FlashUploader.instances_[uploaderId];
  var fileID = yuiEvent['id'];
  var file = fileID ? uploader.activeFiles_[fileID] : undefined;

  // TODO: Refactor the contents of these cases into handle* methods on
  //       the FlashUploader.

  switch (yuiEvent['type']) {
    /**
     * Here we catch some events that should be dispatched on the uploader.
     */
    case 'fileselect':
      var files = [];
      goog.object.forEach(yuiEvent['fileList'], function(f) {
        file = new panda.upload.File(f['id'], f['name'], f['size']);
        file.setParentEventTarget(uploader);
        files.push(file);
      });
      e = new panda.upload.Uploader.FileSelectEvent(files);
      break;

    /**
     * Here we catch some interaction events and make sure they are dispatched
     * using the standard event names.
     */
    case 'click':
    case 'mousedown':
    case 'mouseup':
      e = yuiEvent['type'];
      break;
    case 'mouseenter':
      e = goog.events.EventType.MOUSEOVER;
      break;
    case 'mouseleave':
      e = goog.events.EventType.MOUSEOUT;
      break;

    /**
     * Here we catch events specific to individual files.
     */
    case 'uploadprogress':
      e = new panda.upload.File.ProgressEvent(file,
          yuiEvent['bytesLoaded'], yuiEvent['bytesTotal']);
      break;
    case 'uploadcompletedata':
      e = new panda.upload.File.CompleteEvent(file, yuiEvent['data']);
      delete uploader.activeFiles_[fileID];
      break;
    case 'uploaderror':
      // There can be multiple uploaderror events thrown for the same file
      // and error; only dispatch the first error.
      if (file) {
        // The SWF will send flash IOError text, SecurityError text, and
        // HTTPStatusEvent status codes using the same status property.
        var error = /** @type {string|number} */ (yuiEvent['status']);
        var status = parseInt(error, 10);
        var msg = isNaN(status) ? /** @type {string} */ (error) : undefined;
        e = new panda.upload.File.ErrorEvent(file, status, msg);
        delete uploader.activeFiles_[fileID];
      } else {
        e = null;
        panda.log('Ignored extraneous YUI uploader event', yuiEvent['type'],
                  yuiEvent);
      }
      break;
  }

  // Log unexpected events when in debug mode, otherwise ignore.
  if (goog.DEBUG && !goog.isDef(e)) {
    switch (yuiEvent['type']) {
      /**
       * These events are dispatched within FlashUploader.upload() and cancel()
       * to match the synchronous dispatch by the HTML5 uploader.
       * NOTE: In my most recent round of testing, the uploadcancel event has not
       *       been firing at all, it seems.
       */
      case 'uploadstart':
      case 'uploadcancel':
        panda.log('Received YUI uploader event', yuiEvent['type'], yuiEvent);
        break;

      /**
       * Ignore the upload complete event in favor of uploadcompletedata.
       */
      case 'uploadcomplete':
        panda.log('Received YUI uploader event', yuiEvent['type'], yuiEvent);
        break;

      /**
       * Don't dispatch an swfReady event. Although the YUIBridge raises a
       * swfReady event, its behaviour is odd in Firefox, sometimes being
       * called multiple times or before the YUIBridge is actually ready.
       * We want to discourage its use, so just let it die here.
       */
      case 'swfReady':
        break;

      default:
        // Ignore unrecognized events. Outside code should not depend on
        // the inner workings of the YUI SWF Uploader.
        panda.log('Received unrecognized YUI uploader event', yuiEvent['type'],
                  yuiEvent);
        break;
    }
  }

  if (e) {
    panda.log('Received YUI uploader event', yuiEvent['type'], yuiEvent);
    (file || uploader).dispatchEvent(e);
  }
};


/**
 * Receive events from YUI flash and dispatch a closure upload event.
 *
 * This emulates the ExternalInterface callback used by YUIBridge.as,
 * which provides a standardized way for flash objects to call a specific
 * instance of YUI within the page.
 *
 * We can remove this ugly hack by building a custom upload.swf when
 * time permits.
 *
 * @see https://github.com/yui/yui3/blob/master/src/swf/as/com/yahoo/util/YUIBridge.as
 *
 * @param {string} yuiId (Ignored) The YUI instance id.
 * @param {string} jsHandler (Ignored) The name of the callback to execute.
 * @param {Array} args The arguments to apply to the callback.
 * @private
 */
panda.upload.FlashUploader.receiveYUIBridgeCallback_ = function(yuiId,
    jsHandler, args) {
  if (!goog.DEBUG) {
    panda.upload.FlashUploader.dispatchUploaderEvent_(args[0], args[1]);
  } else {
    // When in debug mode, allow this function to return before executing
    // the callback. This allows errors to be thrown normally, instead of
    // being silenced by Flash's internal ExternalInterface implementation.
    // When compiled, this check will be filtered out completely.
    setTimeout(function() {
      panda.upload.FlashUploader.dispatchUploaderEvent_(args[0], args[1]);
    }, 0);
  }
};
goog.exportSymbol('YUI.applyTo',
    panda.upload.FlashUploader.receiveYUIBridgeCallback_);
