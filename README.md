Panda uploader
==============

Panda uploader allows you to upload videos from your applications to Panda.

It works as a jQuery plugin, and requires requires JQuery version 1.3.

Lets write a simple example

html
-----
    <script src="/panda_js_uploader/jquery.panda-uploader.min.js" type="text/javascript"></script> 
    <link href="/panda_js_uploader/panda-uploader.css" media="screen" rel="stylesheet" type="text/css" /> 

    <form>
        <p>
            <label for="upload_button">File</label>

            <!-- file selector -->
            <span id="upload_button"></span>      

            <!-- filename of the selected file (optional) -->
            <input type="text" id="upload_filename" disabled="true" />
        </p>
    
        <p>
            <!-- upload progress bar (optional) -->
            <div id="upload_progress"></div>
        </p>
    
        <p>
            <!-- field where the video ID will be stored after the upload -->
            <input type="hidden" name="panda_video_id" id="returned_video_id" />

            <input type="submit" value="Upload video" id="submit_button" />
        </p>

        <script>
        jQuery("#returned_video_id").pandaUploader({
            'access_id': 'your-access-id',
            'cloud_id': 'your-cloud-id',
            'timestamp': '2010-02-02T17:04:46+00:00',
            'signature': 'dC/M34sNc7v+oyhFRfVLEKpkVMNyhhyuyCECAQiR6nrUw='
        }, {
          upload_button_id: 'upload_button',
          upload_filename_id: 'upload_filename',
          upload_progress_id: 'upload_progress'
        });
        </script>
    </form>
    
Add some parameters to SWFUpload
================================

You can customise the swfupload object by passing an hash as a third argument:
jQuery("#returned_video_id").pandaUploader({...}, {}, { button_image_url: "my-image.png" })
