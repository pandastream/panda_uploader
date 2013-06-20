goog.provide('panda.upload.FileDrop');

goog.require('goog.dom');
goog.require('goog.object');
goog.require('goog.events.FileDropHandler');
goog.require('goog.ui.Component');

/**
 * Add File drop feature to the uploader
 *
 * @param {!panda.upload.Uploader} uploader Html5 File uploader.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
panda.upload.FileDrop = function(uploader, opt_domHelper) {

  goog.ui.Component.call(this, opt_domHelper);

  /**
   * Uploader instance.
   * @type {!panda.upload.Uploader}
   * @private
   */
  this.uploader_ = uploader;

};
goog.inherits(panda.upload.FileDrop, goog.ui.Component);


/**
 * Listen or unlisten for upload and child events.
 * @param {boolean} attach True to attach, False to detach.
 * @private
 */
panda.upload.FileDrop.prototype.attachUploadEvents_ = function(attach) {

  goog.events.listen(this.dropHandler,
        goog.events.FileDropHandler.EventType.DROP,
        goog.bind(this.handleDrop_, this));
};

/**
 * Listen for selected files in the file input.
 */
panda.upload.FileDrop.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  this.dropHandler = new goog.events.FileDropHandler(this.getElement(), true);

  this.attachUploadEvents_(true);
};

panda.upload.FileDrop.prototype.handleDrop_ = function(e) {
  var domFiles = e.getBrowserEvent().dataTransfer.files;
  var files = [];

  for (var i=0, domFile; domFile=domFiles[i]; i++) {
    files.push(this.uploader_.newHtml5File(domFile));
  }

  this.uploader_.dispatchEvent(
    new panda.upload.Uploader.FileSelectEvent(files));
};