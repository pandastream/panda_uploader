goog.provide('panda.upload.Uploader');

goog.require('goog.ui.Component');
goog.require('goog.events');
goog.require('goog.dom');

goog.require('panda.upload.File');


/**
 * Standard Uploader Interface.
 *
 * Implementations *must* subclass {@link goog.ui.Component}.
 *
 * This interface extends the W3C EventTarget extern to avoid compiler
 * warnings when attaching listeners to an instance of this type.
 *
 * @interface
 * @extends {EventTarget}
 */
panda.upload.Uploader = function() {};


/**
 * Uploader events.
 * @enum {string}
 */
panda.upload.Uploader.EventType = {
  /**
   * Dispatched when one or more files have been selected for upload.
   */
  FILE_SELECT: goog.events.getUniqueId('fileselect')
};


/**
 * Attach this uploader to an event-less 'browse files' button.
 * @param {Element} element Button element.
 */
panda.upload.Uploader.prototype.attachButton = function(element) {};


/**
 * Renders the component.  If a parent element is supplied, the component's
 * element will be appended to it.  If there is no optional parent element and
 * the element doesn't have a parentNode then it will be appended to the
 * document body.
 *
 * If this component has a parent component, and the parent component is
 * not in the document already, then this will not call {@code enterDocument}
 * on this component.
 *
 * Throws an Error if the component is already rendered.
 *
 * @param {Element=} opt_parentElement Optional parent element to render the
 *    component into.
 */
panda.upload.Uploader.prototype.render = function(opt_parentElement) {};


/**
 * Renders the component before another element. The other element should be in
 * the document already.
 *
 * Throws an Error if the component is already rendered.
 *
 * @param {Node} sibling Node to render the component before.
 */
panda.upload.Uploader.prototype.renderBefore = function(sibling) {};


/**
 * Return the attached 'browse files' button that sits under the
 * transparent clickable region.
 * @return {Element} Button element.
 */
panda.upload.Uploader.prototype.getButton = function() {};


/**
 * Upload the given queued file. This will dispatch a cancellable
 * BEFORE_START event and a START event.
 * @param {!panda.upload.File} file File object to upload.
 */
panda.upload.Uploader.prototype.upload = function(file) {};


/**
 * Cancels the upload of a specific file, if currently in progress,
 * and removes it from the file list.
 * @param {!panda.upload.File} file File object to upload.
 */
panda.upload.Uploader.prototype.cancel = function(file) {};


/**
 * Setter for the 'multiFiles' property.
 * @param {boolean} value The value for the 'multiFiles' property.
 */
panda.upload.Uploader.prototype.setAllowMultipleFiles = function(value) {};


/**
 * Getter for the 'multiFiles' property.
 * @return {boolean} The value for the 'multiFiles' property.
 */
panda.upload.Uploader.prototype.getAllowMultipleFiles = function() {};


/**
 * Setter for the 'fileFilters' property.
 * @param {Array} fileFilters The value for the 'fileFilters' property.
 */
panda.upload.Uploader.prototype.setFileFilters = function(fileFilters) {};


/**
 * Returns the dom helper that is being used on this component.
 * @return {!goog.dom.DomHelper} The dom helper used on this component.
 */
panda.upload.Uploader.prototype.getDomHelper = function() {};



/**
 * Dispatch the given event to map the corresponding Flash event name.
 * @param {!Array.<!panda.upload.File>} files List of selected files.
 * @constructor
 * @extends {goog.events.Event}
 */
panda.upload.Uploader.FileSelectEvent = function(files) {
  goog.events.Event.call(this, panda.upload.Uploader.EventType.FILE_SELECT);

  /**
   * A mapping of the selected files at the current moment, keyed by file ID.
   * @type {!Array.<!panda.upload.File>}
   */
  this.files = files;
};
goog.inherits(panda.upload.Uploader.FileSelectEvent, goog.events.Event);
