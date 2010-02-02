(function(){


jQuery.fn.pandaUploader = function(signed_params, options, swfupload_options) {
    if (signed_params === undefined) {
        alert("There was an error setting up the upload form. (The upload parameters were not specified).");
        return false;
    }
    options = options === undefined ? {} : options;
    swfupload_options = swfupload_options === undefined ? {} : swfupload_options;
    
    if (options.upload_button_id === undefined) {
        alert("You have to specify the button id");
        return false;
    }
    
    options = jQuery.extend({
        upload_filename_id: null,
        upload_progress_id: null,
        api_url: "http://staging.pandastream.com/v2/videos.json",
        progress_handler: null
    }, options);
    
    if ( ! options.progress_handler) {
        options.progress_handler = new ProgressUpload(options);
    }
    
    var uploader = this.swfupload(jQuery.extend({
        upload_url: options.api_url,
        file_size_limit : 0,
        file_types : "*.*",
        file_types_description : "All Files",
        file_upload_limit : 0,
        flash_url : "/panda_js_uploader/swfupload-jquery/swfupload/swfupload.swf",
        button_image_url : '/panda_js_uploader/swfupload-jquery/swfupload/XPButtonUploadText_61x22.png',
        button_width : 61,
        button_height : 22,
        button_placeholder_id : options.upload_button_id,
        post_params : signed_params,
        file_post_name: "file",
        debug: true
    }, swfupload_options));
    
    var $video_field = this;
    uploader.bind('swfuploadLoaded', setupSubmitButton);
    uploader.bind('fileQueued', onFileQueued);
    uploader.bind('uploadStart', onStart);
    uploader.bind('uploadProgress', onProgress);
    uploader.bind('uploadSuccess', onSuccess);
    uploader.bind('uploadComplete', onComplete);

    function setupSubmitButton() {
        var form = $video_field.closest("form");
        form.submit(onSubmit);
    }

    function onFileQueued(event, file) {
        var $field = $('#' + options.upload_filename_id);
        if ($field.size() == 0) {
            return;
        }
        $field.val(file.name);
    }

    function onSubmit(event) {
        uploader.swfupload('startUpload');
        return false;
    }

    function onStart(event, file) {
        if (options.progress_handler) {
            options.progress_handler.start(file);
        }
    }

    function onProgress(event, file, bytesLoaded, bytesTotal) {
        try {
            if (options.progress_handler) {
                options.progress_handler.setProgress(file, bytesLoaded, bytesTotal);
            }
            
        } catch (ex) {
        }
    }

    function onSuccess(event, file, response) {
        $video_field.val(eval('(' + response + ')').id);
    }

    function onComplete() {
        var form =  $video_field.closest("form")[0];
        var tmpForm = document.createElement('FORM');
        tmpForm.submit.apply(form);
    }
}

function ProgressUpload(options) {
    this.options = options;
}

ProgressUpload.prototype = {
    start: function(file) {
        var $p = jQuery('#' + this.options.upload_progress_id);
        if ($p.size() == 0) {
            return;
        }
        $p.append('<div class="progress-inside"></div>');
        this.progress = $p.find('.progress-inside');
        this.setProgress(file, 0, file.size);
    },
    
    setProgress: function(file, bytesLoaded, bytesTotal) {
        if ( ! this.progress) {
            return;
        }
        var percent = Math.ceil((bytesLoaded / bytesTotal) * 100);
        $(this.progress).css('width', percent + '%');
    }
}

})();