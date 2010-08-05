
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

PandaUploader.UploadOnSubmit.prototype.init = function() {
    var form = this.widget.query.parents("form")[0];

    if ( ! form) {
        PandaUploader.alert("Could not find a suitable form. Please place the call to pandaUploader() after the form, or to be executed onload().");
        return false;
    }

    if (jQuery(form).find('[name=submit], #submit').length != 0) {
        PandaUploader.alert("An element of your video upload form is incorrect (most probably the submit button). Neither NAME nor ID can be set to \"submit\" on any field.");
        return false;
    }

    return PandaUploader.BaseStrategy.prototype.init.apply(this, arguments);
};

PandaUploader.UploadOnSubmit.prototype.disableSubmitButton = function(){
    jQuery(this.getSubmitButton()).attr('disabled', true);
};

PandaUploader.UploadOnSubmit.prototype.enableSubmitButton = function(){
    return jQuery(this.getSubmitButton()).removeAttr('disabled');
};

PandaUploader.UploadOnSubmit.prototype.getSubmitButton = function() {
    return jQuery(this.getForm()).find('input[type=submit]');
};

PandaUploader.UploadOnSubmit.prototype.getForm = function() {
    return this.widget.query.parents('form').get(0);
};


PandaUploader.UploadOnSubmit.prototype.onchange = function() {
    this.enableSubmitButton();
};

PandaUploader.UploadOnSubmit.prototype.onwidgetload = function() {
    if ( ! this.widget) {
      return;
    }

    var form = this.getForm();

    if ( ! form) {
      return;
    }

    jQuery(form).submit(PandaUploader.bind(this, 'onsubmit'));

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

PandaUploader.UploadOnSubmit.prototype.onsuccess = function(event) {
    this.getForm().submit();
};

PandaUploader.UploadOnSubmit.prototype.onerror = function() {
    this.widget.options.progress_handler.reset();
};

PandaUploader.UploadOnSubmit.prototype.onabort = function() {
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
