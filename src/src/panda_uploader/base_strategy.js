
PandaUploader.BaseStrategy = function() {
};
PandaUploader.BaseStrategy.prototype = {
    setUploadWidget: function (upload_widget) {
        this.widget = upload_widget;
    },

    init: function () {
        return true;
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
