(function(){


jQuery.fn.pandaUploader = function(signed_params, options) {
    if (signed_params === undefined) {
        alert("There was an error setting up the upload form. (The upload parameters were not specified).");
        return false;
    }
    options = options === undefined ? {} : options;
    options = jQuery.extend({
        video_field_id: "panda-video-id",
        video_field_name: "panda_video_id",
        api_url: "http://staging.pandastream.com/v2/videos.json",
        progress_id: 'progress_bar_container'
    }, options);
    
    
    var uploader = null;

    var placeholder = this[0];
    var progress = null;
    jQuery(placeholder).after('<input type="hidden" name="' + options.video_field_name +'" id="'+ options.video_field_id +'" />');
    uploader = this.swfupload({
        upload_url: options.api_url,
        file_size_limit : 0,
        file_types : "*.*",
        file_types_description : "All Files",
        file_upload_limit : 0,
        flash_url : "/panda_js_uploader/swfupload-jquery/swfupload/swfupload.swf",
        button_image_url : '/panda_js_uploader/swfupload-jquery/swfupload/XPButtonUploadText_61x22.png',
        button_width : 61,
        button_height : 22,
        button_placeholder : placeholder,
        post_params : signed_params,
        file_post_name: "file",
        debug: true
    });
    
    var $video_field = jQuery('#' + options.video_field_id);
    uploader.bind('swfuploadLoaded', setupSubmitButton);
    uploader.bind('uploadStart', onStart);
    uploader.bind('uploadProgress', onProgress);
    uploader.bind('uploadSuccess', onSuccess);
    uploader.bind('uploadComplete', onComplete);

    function setupSubmitButton() {
        var form = $video_field.closest("form")
        form.submit(onSubmit);    
    }

    function onSubmit(event) {
        uploader.swfupload('startUpload');
        return false;
    }

    function onStart(event, file) {
        progress = new ProgressUpload(options.progress_id);
    }

    function onProgress(event, file, bytesLoaded, bytesTotal) {
        try {
            var percent = Math.ceil((bytesLoaded / bytesTotal) * 100);
            progress.setProgress(percent);
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

function ProgressUpload(progress_id) {
    jQuery('#' + progress_id).append('<div class="progress-inside"></div>');
    this.progress = jQuery('#' + progress_id).find('.progress-inside');
    this.setProgress(0);
}

ProgressUpload.prototype = {
    setProgress: function(percent) {
        console.log( percent + '%')
        $(this.progress).css('width', percent + '%');
    }
}

})();