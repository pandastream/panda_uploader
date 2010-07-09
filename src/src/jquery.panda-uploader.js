function PandaUploader(){}

PandaUploader.supportAjaxUpload = function() {
    var fi = document.createElement('INPUT');
    fi.type = 'file';
    return 'files' in fi;
};

PandaUploader.supportAjaxProgressEvents = function() {
    if (typeof XDomainRequest != 'undefined') {
        return true;
    }
    else if (typeof XMLHttpRequest != 'undefined') {
        var ret = new XMLHttpRequest()
        return 'withCredentials' in ret;
    }
    else {
        return null;
    }
};

PandaUploader.supportHTML5Widget = function() {
    return PandaUploader.supportAjaxUpload() && PandaUploader.supportAjaxProgressEvents();
}

PandaUploader.createXRequestObject = function() {
    if (typeof XDomainRequest != 'undefined') {
        return new XDomainRequest();
    }
    else if (typeof XMLHttpRequest != 'undefined') {
        var ret = new XMLHttpRequest()
        return 'withCredentials' in ret ? ret : null;
    }
    else {
        return null;
    }
};

PandaUploader.createWidget = function() {
    if (PandaUploader.supportHTML5Widget()) {
        return new PandaUploader.HTML5Widget();
    }
    else {
        return new PandaUploader.FlashWidget();
    }
};

PandaUploader.bind = function(object, method_name) {
    return function() {
        var method = object[method_name];
        if (method) {
            return method.apply(object, arguments);
        }
    }
};


PandaUploader.alert = function(msg) {
    return alert(msg);
};

PandaUploader.BaseWidget = function() {
};
PandaUploader.BaseWidget.prototype = {
    init: function(query, signed_params, options) {
        this.query = query;
        this.signed_params = signed_params;
        this.options = options;
        this.upload_strategy = this.options.upload_strategy;
    },
    
    getForm: function() {
        throw "Unimplemented method getForm()";
    },
    
    getSignedParams: function() {
        return this.signed_params.call ? this.signed_params() : this.signed_params;
    },
    
    start: function() {
        throw "Unimplemented method start()";
    },
    
    disable: function() {
        throw "Unimplemented method disable()";
    },
    
    enable: function() {
        throw "Unimplemented method enable()";
    },
    
    cancel: function() {
        throw "Unimplemented method cancel()";
    },
    
    setValue: function(value) {
        throw "Unimplemented method setValue()";
    },
    
    getValue: function() {
        throw "Unimplemented method getValue()";
    }
};

PandaUploader.FlashWidget = function(swfupload_options) {
    this.swfupload_options = swfupload_options === undefined ? {} : swfupload_options;
}

PandaUploader.FlashWidget.prototype = new PandaUploader.BaseWidget();
PandaUploader.FlashWidget.prototype.constructor = PandaUploader.FlashWidget;

PandaUploader.FlashWidget.prototype.init = function() {
    PandaUploader.BaseWidget.prototype.init.apply(this, arguments);

    var field_id = this.query.attr('id');
    var placeholder_id = field_id + '_pandauploader-flashwidget-placeholder';
    this.query.after('<span id="' + placeholder_id + '"></span>');
    $('#' + placeholder_id).after('<input type="text" disabled="disabled" id="' + field_id + '_orig-filename" />');

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

    this.swfupload.bind('swfuploadLoaded', PandaUploader.bind(this.upload_strategy, 'onwidgetload'));
    this.swfupload.bind('fileQueued', PandaUploader.bind(this, 'fileQueued'));
    this.swfupload.bind('uploadStart', PandaUploader.bind(this, 'uploadStart'));
    this.swfupload.bind('uploadProgress', PandaUploader.bind(this, 'uploadProgress'));
    this.swfupload.bind('uploadSuccess', PandaUploader.bind(this, 'uploadSuccess'));
    this.swfupload.bind('uploadError', PandaUploader.bind(this.upload_strategy, 'onerror'));
};


PandaUploader.FlashWidget.prototype.fileQueued = function(evt, file) {
    this.file = file;
    this.upload_strategy.onchange();
};
PandaUploader.FlashWidget.prototype.uploadStart = function(_file) {
    this.swfupload.data('__swfu').setPostParams(this.getSignedParams());
    this.upload_strategy.onloadstart();
};
PandaUploader.FlashWidget.prototype.uploadProgress = function(evt, _file, bytesLoaded, bytesTotal) {
    evt.loaded = bytesLoaded;
    evt.total = bytesTotal;
    this.upload_strategy.onprogress(evt);
};
PandaUploader.FlashWidget.prototype.uploadSuccess = function(evt, file, response) {
    var event = {
        target: {
            status: '200',
            responseText: response
        }
    };
    this.upload_strategy.onreadystatechange(event);
};

PandaUploader.FlashWidget.prototype.getFile = function() {
    return this.file;
};

PandaUploader.FlashWidget.prototype.getForm = function() {
    return this.swfupload.parents('form').get(0);
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

PandaUploader.HTML5Widget = function() {
};

PandaUploader.HTML5Widget.prototype = new PandaUploader.BaseWidget();
PandaUploader.HTML5Widget.prototype.constructor = PandaUploader.HTML5Widget;

PandaUploader.HTML5Widget.prototype.init = function() {
    PandaUploader.BaseWidget.prototype.init.apply(this, arguments);
    
    this.xhr = PandaUploader.createXRequestObject();
    this.xhr.upload.addEventListener('loadstart', PandaUploader.bind(this.upload_strategy, 'onloadstart'), false);
    this.xhr.upload.addEventListener('progress', PandaUploader.bind(this.upload_strategy, 'onprogress'), false);
    this.xhr.upload.addEventListener('load', PandaUploader.bind(this.upload_strategy, 'onload'), false);
    this.xhr.upload.addEventListener('error', PandaUploader.bind(this.upload_strategy, 'onerror'), false);
    this.xhr.upload.addEventListener('abort', PandaUploader.bind(this.upload_strategy, 'onabort'), false);
    this.xhr.addEventListener('readystatechange', PandaUploader.bind(this.upload_strategy, 'onreadystatechange'), false);

    this.query.after('<input type="file" />');
    $(this.getField()).change(PandaUploader.bind(this.upload_strategy, 'onchange'));
    
    this.upload_strategy.onwidgetload();
};

PandaUploader.HTML5Widget.prototype.getForm = function() {
    return this.query.parents('form').get(0);
};

PandaUploader.HTML5Widget.prototype.start = function() {
    var file = this.getFile();
    var params = this.getSignedParams();
    var json_string = '{"access_key":"' + params.access_key + '", "cloud_id":"' + params.cloud_id + '", "timestamp":"' + params.timestamp + '", "signature":"' + params.signature + '"}';
    this.xhr.open('POST', this.options.api_url + '/videos.json', true);
    this.xhr.setRequestHeader("Cache-Control", "no-cache");
    this.xhr.setRequestHeader("Content-Type", "application/octet-stream");
    this.xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    this.xhr.setRequestHeader("X-File-Name", file.fileName);
    this.xhr.setRequestHeader("X-Panda-Params", json_string);
    this.xhr.send(file);
};

PandaUploader.HTML5Widget.prototype.getFile = function() {
    return $(this.getField()).get(0).files[0];
};

PandaUploader.HTML5Widget.prototype.setValue = function(value) {
    return this.query.val(value);
};

PandaUploader.HTML5Widget.prototype.disable = function() {
    $(this.getField()).attr('disabled', true);
};

PandaUploader.HTML5Widget.prototype.enable = function() {
    $(this.getField()).removeAttr('disabled');
};

PandaUploader.HTML5Widget.prototype.getField = function() {
    return this.query.next().get(0);
};





//
// BaseStrategy
//

PandaUploader.BaseStrategy = function() {
};
PandaUploader.BaseStrategy.prototype = {
    setUploadWidget: function (upload_widget) {
        this.widget = upload_widget;
    },
    
    disableSubmitButton: function(){
        $(this.getSubmitButton()).attr('disabled', true);
    },

    enableSubmitButton: function(){
        return $(this.getSubmitButton()).removeAttr('disabled');
    },
    
    getSubmitButton: function() {
        return $(this.widget.getForm()).find('input[type=submit]');
    },
    
    
    // The widget has been set, about to return control to caller
    onwidgetload: function() {
    },
    
    // A file has been selected and the widget is ready to upload it
    onchange: function() {
    },
    
    // Upload commences
    onloadstart: function() {
    },
    
    // Upload progresses. Called zero or more times
    onprogress: function(event) {
        try {
            if (this.widget.options.progress_handler) {
                this.widget.options.progress_handler.setProgress(this.widget.getFile(), event.loaded, event.total);
            }
        } catch (ex) {
        }
    },

    // Upload succeeded
    onload: function() {
    },
    
    // Upload failed
    onerror: function() {
    },
    
    // Upload was aborted by the user
    onabort: function() {
    },
    
    // Containing form is being submitted
    onsubmit: function() {
    }
};


//
// UploadOnSubmit
//

PandaUploader.UploadOnSubmit = function() {
    PandaUploader.BaseStrategy.apply(this, arguments);
};
PandaUploader.UploadOnSubmit.prototype = new PandaUploader.BaseStrategy();
PandaUploader.UploadOnSubmit.prototype.constructor = PandaUploader.UploadOnSubmit;

PandaUploader.UploadOnSubmit.prototype.onchange = function() {
    this.enableSubmitButton();
};

PandaUploader.UploadOnSubmit.prototype.onwidgetload = function() {
    $(this.widget.getForm()).submit(PandaUploader.bind(this, 'onsubmit'));
    if(this.widget.options.disable_submit_button) {
        this.disableSubmitButton();
    }
};

PandaUploader.UploadOnSubmit.prototype.onloadstart = function() {
    this.widget.disable();
    this.widget.options.progress_handler.reset();
    this.disableSubmitButton();
    if (this.widget.options.progress_handler) {
        this.widget.options.progress_handler.start(this.widget.getFile());
    }
};

PandaUploader.UploadOnSubmit.prototype.onreadystatechange = function(event) {
    var status = null;

    try {
        status = event.target.status;
    }
    catch(e) {
        return;
    }

    if (status == '200' && event.target.responseText) {
        var response = jQuery.parseJSON(event.target.responseText);
        this.widget.setValue(response.id);
        this.widget.getForm().submit();
    }
};

PandaUploader.UploadOnSubmit.prototype.onerror = function() {
    this.widget.options.progress_handler.reset();
};

PandaUploader.UploadOnSubmit.prototype.onabort = function() {
    this.widget.cancel();
    this.widget.enable();
    
    this.widget.options.progress_handler.reset();
    if (this.widget.options.disableSubmitButton) {
        this.disableSubmitButton();
    }
};

PandaUploader.UploadOnSubmit.prototype.onsubmit = function(event) {
    this.widget.start();
    return false;
};


//
// UploadOnSelect
//

PandaUploader.UploadOnSelect = function() {
    PandaUploader.BaseStrategy.apply(this, arguments);
};
PandaUploader.UploadOnSelect.prototype = new PandaUploader.BaseStrategy();
PandaUploader.UploadOnSelect.prototype.constructor = PandaUploader.UploadOnSelect;

PandaUploader.UploadOnSelect.prototype.onchange = function(event, file) {
    this.widget.start();
};

PandaUploader.UploadOnSelect.prototype.onloadstart = function() {
    this.widget.options.progress_handler.reset();

    this.disableSubmitButton();
    if (this.widget.options.progress_handler) {
        this.widget.options.progress_handler.start(this.widget.getFile());
    }
};

PandaUploader.UploadOnSelect.prototype.onabort = function(event) {
    this.cancel();
    this.enable();

    this.widget.options.progress_handler.reset();
    if (this.widget.options.disableSubmitButton) {
        this.disableSubmitButton();
    }
};

PandaUploader.UploadOnSelect.prototype.onerror = function(event, file, code, message, more) {
    this.widget.options.progress_handler.reset();
};

PandaUploader.UploadOnSelect.prototype.onreadystatechange = function(event) {
    var status = null;

    try {
        status = event.target.status;
    }
    catch(e) {
        return;
    }

    if (status == '200' && event.target.responseText) {
        var response = jQuery.parseJSON(event.target.responseText);
        this.widget.setValue(response.id);
        this.enableSubmitButton();
    }
};



(function(){

UPLOADING=0
STOP=1

jQuery.fn.checkPandaUploaderOptions = function(signed_params, options) {
    var form = this.parents("form")[0];
    
    if (signed_params === undefined) {
        PandaUploader.alert("There was an error setting up the upload form. (The upload parameters were not specified).");
        return false;
    }
    
    if (this.size() == 0) {
        PandaUploader.alert("The jQuery element is empty. Method pandaUploader() cannot be executed");
        return false;
    }
    
    if ( ! form) {
        PandaUploader.alert("Could not find a suitable form. Please place the call to pandaUploader() after the form, or to be executed onload().");
        return false;
    }
    
    if ($(form).find('[name=submit], #submit').length != 0) {
        PandaUploader.alert("An element of your video upload form is incorrect (most probably the submit button). Neither NAME nor ID can be set to \"submit\" on any field.");
        return false;
    }
    
    return true;
}

jQuery.fn.pandaUploader = function(signed_params, options, widget_options) {
    options = options === undefined ? {} : options;
    if ( ! this.checkPandaUploaderOptions(signed_params, options)) {
        return false;
    }
    
    options = jQuery.extend({
        upload_progress_id: null,
        api_host: 'api.pandastream.com',
        progress_handler: null,
        uploader_dir: "/panda_uploader",
        disable_submit_button: true,
        upload_strategy: null,
        widget: null
    }, options);
    options['api_url'] = options['api_url'] || 'http://' + options['api_host'] + '/v2';
    
    if ( ! options.progress_handler) {
        options.progress_handler = new ProgressUpload(options);
    }
    
    var widget = options.widget;
    if ( ! widget) {
        widget = PandaUploader.createWidget();
    }
    console.log(options.upload_strategy)
    if ( ! options.upload_strategy) {
        options.upload_strategy = new PandaUploader.UploadOnSubmit();
    }
    options.upload_strategy.setUploadWidget(widget)
    
    widget.init(this, signed_params, options);
    
    var $cancel_button = jQuery('#' + options.upload_cancel_button_id);
    if ($cancel_button) {
        $cancel_button.click(PandaUploader.bind(this.upload_strategy, 'onCancel'));
    }
    
    return this;
};


//
// A simple progress bar
//

function ProgressUpload(options) {
    this.options = options;
    this.$p = jQuery('#' + this.options.upload_progress_id);
    this.$p.css('display', 'none');
    this.count = 0;
};

ProgressUpload.prototype = {
    start: function(file) {
        this.count = 0
        if (this.$p.size() == 0) {
            return;
        }
        
        if (this.$p.find('.progress-inside').size() == 0) {
            this.$p.append('<div class="progress-inside"></div>');
        }
        
        this.progress = this.$p.find('.progress-inside');
        this.setProgress(file, 0, file.size);
        this.$p.css('display', 'block');
        var self = this;
        this.timer = setInterval(function(){ self.animateBarBg() }, 20);
    },
    
    setProgress: function(file, loaded, total) {
        if ( ! this.progress) {
            return;
        }
        var percent = Math.ceil(loaded*100/total);
        $(this.progress).css('width', percent + '%');
    },
    
    animateBarBg: function() {
        this.count++;
        var bpos = this.$p.css("background-position");
        var currentOffset = bpos ? bpos.split(' ') : 0;
        if (this.count == 37) {
            this.count = 0;
            this.$p.css("background-position", (currentOffset + 36) + "px 0px");
        }
        else {
            this.$p.css("background-position", (currentOffset - 1) + "px 0px");
        }
    },
    
    reset: function(){
        clearInterval(this.timer)
        $(this.progress).css('width', '0%');
        this.$p.css('display', 'none');
    }
};


})();