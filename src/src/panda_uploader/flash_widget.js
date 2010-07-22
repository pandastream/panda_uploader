
PandaUploader.FlashWidget = function(options) {
  options = typeof options == 'undefined' ? {} : options;
  this.add_filename_field = true;
  if (typeof options.add_filename_field != 'undefined') {
    this.add_filename_field = options.add_filename_field;
  }
  this.swfupload_options = options === undefined ? {} : options;
}

PandaUploader.FlashWidget.prototype = new PandaUploader.BaseWidget();
PandaUploader.FlashWidget.prototype.constructor = PandaUploader.FlashWidget;

PandaUploader.FlashWidget.prototype.init = function() {
    PandaUploader.BaseWidget.prototype.init.apply(this, arguments);

    var field_id = this.query.attr('id');
    var placeholder_id = field_id + '_pandauploader-flashwidget-placeholder';
    this.filename_field_id = field_id + '_orig-filename';
    this.query.after('<span id="' + placeholder_id + '"></span>');
    if (this.add_filename_field) {
      $('#' + placeholder_id).after('<input type="text" style="position: relative; top: -8px; margin-left: .5em;" disabled="disabled" id="' + this.filename_field_id + '" />');
    }

    this.swfupload = this.query.swfupload(jQuery.extend({
        upload_url: this.options.api_url + '/videos.json',
        file_size_limit : 0,
        file_types : "*.*",
        file_types_description : "All Files",
        file_upload_limit : 0,
        flash_url : this.options.uploader_dir + "/swfupload.swf",
        button_image_url : this.options.uploader_dir + "/choose_file_button.png",
        button_width : 87,
        button_height : 27,
        button_placeholder_id: placeholder_id,
        file_post_name: "file",
        debug: false
    }, this.swfupload_options));

    this.swfupload.bind('swfuploadLoaded', this.boundHandler('onwidgetload'));
    this.swfupload.bind('fileQueued', PandaUploader.bind(this, 'fileQueued'));
    this.swfupload.bind('uploadStart', PandaUploader.bind(this, 'uploadStart'));
    this.swfupload.bind('uploadProgress', PandaUploader.bind(this, 'uploadProgress'));
    this.swfupload.bind('uploadSuccess', PandaUploader.bind(this, 'uploadSuccess'));
    this.swfupload.bind('uploadError', this.boundHandler('onerror'));
};


PandaUploader.FlashWidget.prototype.fileQueued = function(evt, file) {
    this.file = file;
    $('#' + this.filename_field_id).val(file.name);
    this.triggerEvent('onchange');
};
PandaUploader.FlashWidget.prototype.uploadStart = function(_file) {
    this.swfupload.data('__swfu').setPostParams(this.getSignedParams());
    this.triggerEvent('onloadstart');
};
PandaUploader.FlashWidget.prototype.uploadProgress = function(evt, _file, bytesLoaded, bytesTotal) {
    evt.loaded = bytesLoaded;
    evt.total = bytesTotal;
    this.triggerEvent('onprogress', [evt]);
};
PandaUploader.FlashWidget.prototype.uploadSuccess = function(evt, file, response) {
    var resObj = jQuery.parseJSON(response);
    this.setValue(resObj.id);

    var event = {
        target: {
            status: '200',
            responseText: response
        }
    };
    this.triggerEvent('onreadystatechange', [event]);
    this.triggerEvent('onsuccess', [event]);
};

PandaUploader.FlashWidget.prototype.getFile = function() {
    return this.file;
};

PandaUploader.FlashWidget.prototype.start = function() {
    return this.swfupload.swfupload('startUpload');
};

PandaUploader.FlashWidget.prototype.disable = function() {
    return this.swfupload.swfupload('setButtonDisabled', true);
};

PandaUploader.FlashWidget.prototype.enable = function() {
    return this.swfupload.swfupload('setButtonDisabled', false);
};

PandaUploader.FlashWidget.prototype.cancel = function() {
    return this.swfupload.swfupload('cancelUpload', '', false);
};

PandaUploader.FlashWidget.prototype.setValue = function(value) {
    return this.swfupload.val(value);
};

PandaUploader.FlashWidget.prototype.getValue = function() {
    return this.swfupload.val();
};
