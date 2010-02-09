(function(){

var num_files = 0;
var num_pending = 0;
var num_errors = 0

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
    
    if ($(this).size() == 0) {
        alert("The jQuery element is empty. Method pandaUploader() cannot be executed");
        return false;
    }
    
    options = jQuery.extend({
        upload_filename_id: null,
        upload_progress_id: null,
        api_url: "http://api.pandastream.com/v2",
        progress_handler: null,
        uploader_dir: "/panda_uploader"
    }, options);
    
    if ( ! options.progress_handler) {
        options.progress_handler = new ProgressUpload(options);
    }
    
    var uploader = this.swfupload(jQuery.extend({
        upload_url: options.api_url + '/videos.json',
        file_size_limit : 0,
        file_types : "*.*",
        file_types_description : "All Files",
        file_upload_limit : 0,
        flash_url : options.uploader_dir + "/swfupload.swf",
        button_image_url : options.uploader_dir + "/choose_file_button.png",
        button_width : 87,
        button_height : 27,
        button_placeholder_id : options.upload_button_id,
        post_params : signed_params,
        file_post_name: "file",
        debug: false
    }, swfupload_options));
    
    var $video_field = this;
    uploader.bind('swfuploadLoaded', onLoad);
    uploader.bind('fileQueued', onFileQueued);
    uploader.bind('uploadStart', onStart);
    uploader.bind('uploadProgress', onProgress);
    uploader.bind('uploadSuccess', onSuccess);
    uploader.bind('uploadError', onError);
    uploader.bind('uploadComplete', onComplete);
    
    return uploader;
    
    
    //
    // Event handlers
    //
    
    function onLoad() {
        var form = $video_field.closest("form");
        form.submit(onSubmit);
    }

    function onFileQueued(event, file) {
        num_files++;
        num_pending++;
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
        num_pending--;
    }

    function onError(event, file, code, message, more) {
        alert("There was an error uploading the file.\n\nHTTP error code " + message);
        num_pending--;
        num_errors++;
    }

    function onComplete(event, num_uploads) {
        if (num_pending > 0 && num_files != num_errors || num_files == num_errors) {
            return;
        }
        if ( ! $video_field.val()) {
            alert('The video ID was not stored on the form');
            return;
        }
        var form =  $video_field.closest("form")[0];
        var tmpForm = document.createElement('FORM');
        tmpForm.submit.apply(form);
    }
}


//
// A simple progress bar
//

function ProgressUpload(options) {
    this.options = options;
}

ProgressUpload.prototype = {
    start: function(file) {
        var $p = jQuery('#' + this.options.upload_progress_id);
        if ($p.size() == 0) {
            return;
        }
        
        if ($p.find('.progress-inside').size() == 0) {
            $p.append('<div class="progress-inside"></div>');
        }
        this.progress = $p.find('.progress-inside');
        this.setProgress(file, 0, file.size);
        $p.show();
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