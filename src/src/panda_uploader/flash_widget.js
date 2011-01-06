
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
      jQuery('#' + placeholder_id).after('<input type="text" style="position: relative; top: -8px; margin-left: .5em;" disabled="disabled" id="' + this.filename_field_id + '" />');
    }

    this.swfupload = this.query.swfupload(jQuery.extend({
        upload_url: this.options.api_url + '/videos.json',
        file_size_limit : this.options.file_size_limit,
        file_types: this.allowedFileTypes(),
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
    this.swfupload.bind('uploadError', PandaUploader.bind(this, 'uploadError'));
};


PandaUploader.FlashWidget.prototype.fileQueued = function(evt, file) {
    this.file = file;
    jQuery('#' + this.filename_field_id).val(file.name);
    this.triggerEvent('onchange');
};
PandaUploader.FlashWidget.prototype.uploadStart = function(_file) {
    PandaUploader.log('Flash widget: start event: file ', _file.name)
    
    this.swfupload.data('__swfu').setPostParams(this.getSignedParams());
    this.triggerEvent('onloadstart');
};
PandaUploader.FlashWidget.prototype.uploadProgress = function(evt, _file, bytesLoaded, bytesTotal) {
    evt.loaded = bytesLoaded;
    evt.total = bytesTotal;
    this.triggerEvent('onprogress', [evt]);
};
PandaUploader.FlashWidget.prototype.uploadSuccess = function(evt, file, response) {
    var resObj = PandaUploader.parseJSON(response);
    this.setValue(resObj.id);

    PandaUploader.log('Flash widget: success event: status ', 200)
    PandaUploader.log('Flash widget: success event: response ', response)
    
    var event = {
        target: {
            status: '200',
            responseText: response
        }
    };
    this.triggerEvent('onreadystatechange', [event]);
    this.triggerEvent('onsuccess', [event]);
};

PandaUploader.FlashWidget.prototype.uploadError = function(evt, file, swfCode, httpCode) {
    this.triggerEvent('onerror', [createW3CEvent(evt, httpCode), createW3CFile(file)]);

    PandaUploader.log('Flash widget: error event: status ', httpCode)
    PandaUploader.log('Flash widget: error event: response unavailable with flash')
    
    function createW3CEvent(evt) {
        var httpMsg  = PandaUploader.getHttpStatusText(httpCode);
        var pandaMsg = PandaUploader.getPandaError(httpCode);
        return {
            target: {
                status: httpCode,
                statusText: httpMsg,
                responseText: '{"message":"' + httpMsg + '",error:"' + pandaMsg + '"}'
            }
        }
    }
    
    function createW3CFile(file) {
        return {
            name: file.name,
            size: file.size,
            type: file.type
        }
    }
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

PandaUploader.FlashWidget.prototype.abort = function() {
    this.swfupload.swfupload('cancelUpload', '', false);
    if (this.add_filename_field) {
      jQuery('#' + this.filename_field_id).val('');
    }
    
    PandaUploader.log('Flash widget: abort event')
    this.triggerEvent('onabort');
};

PandaUploader.FlashWidget.prototype.setValue = function(value) {
    return this.swfupload.val(value);
};

PandaUploader.FlashWidget.prototype.getValue = function() {
    return this.swfupload.val();
};

PandaUploader.FlashWidget.prototype.getFilename = function() {
    if(this.file)
        return this.file.name;
    else
        return null;
};

PandaUploader.FlashWidget.prototype.allowedFileTypes = function() {
    if (! this.options.allowed_extensions) {
        return '*.*';
    }
    var ret = '';
    return jQuery.map(this.options.allowed_extensions, function(e){
        return '*.' + e;
    }).join(';');
};
