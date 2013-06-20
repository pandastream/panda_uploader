goog.provide('panda.upload.ProgressBar');

goog.require('goog.dom');
goog.require('goog.object');
goog.require('goog.ui.Component');
goog.require('panda.upload.Uploader');

/**
 * Add a Progress Bar to the uploader
 *
 * @param {!panda.upload.Uploader} uploader Html5 File uploader.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Component}
 */
panda.upload.ProgressBar = function(uploader, opt_domHelper) {
    goog.ui.Component.call(this, opt_domHelper);

  /**
   * Uploader instance.
   * @type {!panda.upload.Uploader}
   * @private
   */
  this.uploader_ = uploader;

};
goog.inherits(panda.upload.ProgressBar, goog.ui.Component);

/**
 *
 * XXX: Must be called after decoration.
 * @param {Number} percent Progress in percent.
 */
panda.upload.ProgressBar.prototype.setProgress = function(percent) {
  this.getElement().style.width = percent + '%';

  if (percent == 100) {
    goog.dom.classes.add(this.getElement().parentNode, 'panda-progress-bar-complete');
  }
};

/** @inheritDoc */
panda.upload.ProgressBar.prototype.decorateInternal = function(element) {
  goog.base(this, 'decorateInternal', element);

  this.setProgress(0);
};

panda.upload.ProgressBar.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
};