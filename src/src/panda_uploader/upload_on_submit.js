
PandaUploader.UploadOnSubmit = function() {
    var options = arguments[0];
    this.disable_submit_button = true;
    if (options) {
        if (typeof options.disable_submit_button != 'undefined') {
            this.disable_submit_button = options.disable_submit_button;
        }
    }
    PandaUploader.BaseStrategy.apply(this, arguments);
};
PandaUploader.UploadOnSubmit.prototype = new PandaUploader.BaseStrategy();
PandaUploader.UploadOnSubmit.prototype.constructor = PandaUploader.UploadOnSubmit;

PandaUploader.UploadOnSubmit.prototype.onchange = function() {
    this.enableSubmitButton();
};

PandaUploader.UploadOnSubmit.prototype.onwidgetload = function() {
    $(this.widget.getForm()).submit(PandaUploader.bind(this, 'onsubmit'));
    if(this.disable_submit_button) {
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
