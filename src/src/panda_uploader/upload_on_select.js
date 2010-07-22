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
    if (this.widget.options.progress_handler) {
        this.widget.options.progress_handler.start(this.widget.getFile());
    }
};

PandaUploader.UploadOnSelect.prototype.onabort = function(event) {
    this.cancel();
    this.enable();

    this.widget.options.progress_handler.reset();
};

PandaUploader.UploadOnSelect.prototype.onerror = function(event, file, code, message, more) {
    this.widget.options.progress_handler.reset();
};
