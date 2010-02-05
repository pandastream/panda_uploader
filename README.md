Panda uploader
==============

Panda uploader allows you to upload videos from your applications to Panda.

It works as a jQuery plugin, and requires requires JQuery version 1.3.

First of all
------------

Copy the `panda_uploader` directory to your app's public path.

And don't forget to include the following declarations in your page, normally in your `<HEAD>` element:

    <script src="/panda_uploader/jquery.panda-uploader.min.js" type="text/javascript"></script> 
    <link href="/panda_uploader/panda-uploader.css" media="screen" rel="stylesheet" type="text/css" /> 

The above will load the necessary JavaScript code and CSS styles.


Simplest example
----------------

The following is the simplest working form to upload a video:

    <form action="/path/to/action">
        <!-- file selector -->
        <span id="upload_button"></span>

        <!-- field where the video ID will be stored after the upload -->
        <input type="hidden" name="panda_video_id" id="returned_video_id" />

        <!-- a submit button -->
        <input type="submit" value="Upload video" />

        <script>
        var panda_access_details = {
            'access_id': 'your-access-id',
            'cloud_id': 'your-cloud-id',
            'timestamp': '2010-02-02T17:04:46+00:00',
            'signature': 'dC/M34sNc7v+oyhFRfVLEKpkVMNyhhyuyCECAQiR6nrUw='
        };
        jQuery("#returned_video_id").pandaUploader(panda_access_details, { upload_button_id: 'upload_button' });
        </script>
    </form>

This will render a fairly ugly form. We'll worry about the looks later. For now:

1. Click on "Choose file". You will be shown a file selection dialog.
2. Select a file to upload.
3. Click "Upload video" and the upload will start.

After the upload, Panda returns a unique ID that identifies your video. This will be automatically set as the value of the hidden field `#returned_video_id`, which was specified in the jQuery call. Then, the form will be finally submitted so your application can read this value and use it to reference the video later.


Showing the current selection
-----------------------------

The example above is minimal, and has a very poor interface. It would be useful if at least we could see the name of the file we selected, as a means of feedback. See the following example to see how to do this easily.

First, add a text field that will contain the name of the selected file:

    <!-- filename of the selected file (optional) -->
    <input type="text" id="upload_filename" class="panda_upload_filename" disabled="true" />

Then, use the `upload_filename_id` option of the pandaUploader() function:

    jQuery("#returned_video_id").pandaUploader(panda_access_details, { upload_button_id: 'upload_button', upload_filename_id: 'upload_filename' });

The full example would be like follows:

    <form action="/player.php">
        <!-- file selector -->
        <span id="upload_button"></span>

        <!-- filename of the selected file (optional) -->
        <input type="text" id="upload_filename" class="panda_upload_filename" disabled="true" />

        <!-- field where the video ID will be stored after the upload -->
        <input type="hidden" name="panda_video_id" id="returned_video_id" />

        <!-- a submit button -->
        <p><input type="submit" value="Upload video" /></p>

        <script>
        var panda_access_details = {
            'access_id': 'your-access-id',
            'cloud_id': 'your-cloud-id',
            'timestamp': '2010-02-02T17:04:46+00:00',
            'signature': 'dC/M34sNc7v+oyhFRfVLEKpkVMNyhhyuyCECAQiR6nrUw='
        };
        jQuery("#returned_video_id").pandaUploader(panda_access_details, {
            upload_button_id: 'upload_button',
            upload_filename_id: 'upload_filename', // Optional
        });
        </script>
    </form>

Adding a progress bar
---------------------

One last thing that would make this much more usable is an upload bar. At the moment, the user doesn't know how the upload process is going, or if it is working at all. A progress bar would be very appropriate here, and one is included by default.

To enable it, first create a DIV that will contain the bar:

    <!-- upload progress bar (optional) -->
    <div id="upload_progress" class="panda_upload_progress"></div>

And then let pandaUploader() know about it:

    jQuery("#returned_video_id").pandaUploader(panda_access_details, { upload_button_id: 'upload_button', upload_progress_id: 'upload_progress' });

Finally, the full example with all the controls would be:

    <form action="/player.php">
        <!-- file selector -->
        <span id="upload_button"></span>

        <!-- filename of the selected file (optional) -->
        <input type="text" id="upload_filename" class="panda_upload_filename" disabled="true" />

        <!-- upload progress bar (optional) -->
        <div id="upload_progress" class="panda_upload_progress"></div>

        <!-- field where the video ID will be stored after the upload -->
        <input type="hidden" name="panda_video_id" id="returned_video_id" />

        <!-- a submit button -->
        <p><input type="submit" value="Upload video" /></p>

        <script>
        var panda_access_details = {
            'access_id': 'your-access-id',
            'cloud_id': 'your-cloud-id',
            'timestamp': '2010-02-02T17:04:46+00:00',
            'signature': 'dC/M34sNc7v+oyhFRfVLEKpkVMNyhhyuyCECAQiR6nrUw='
        };
        jQuery("#returned_video_id").pandaUploader(panda_access_details, {
            upload_button_id: 'upload_button',
            upload_filename_id: 'upload_filename', // Optional
            upload_progress_id: 'upload_progress'  // Optional
        });
        </script>
    </form>

Advanced usage
--------------

### Additional arguments

At the moment, the following arguments are supported:

* **`upload_button_id`**: REQUIRED. The ID of an HTML element that will be replaced by the file selector.
* **`upload_filename_id`**: the ID of an text input field. It will be filled out with the name of the selected file.
* **`upload_progress_id`**: the ID of DIV that will contain the progress bar.
* **`api_url`**: alternative URL for the Panda API. Should not be necessary to change.
* **`uploader_dir`**: path were the uploader files are located in the web server. By default "`/panda_uploader`"

### Multiple uploads

Upload of multiple files is supported. Just make sure to replicate the necessary HTML elements, giving them different IDs.

As for error handling, the default behaviour is that the form is submitted as long as one of the many uploads is successful. If this does not do the trick for you, you'll have to modify the code yourself. (It should be fairly simple).

### SWFUpload arguments

pandaUploader() accepts a third argument: a hash with parameters that will be passed on to the SWFUpload constructor. This can be useful in many ways. For example, if you want the selector to use a different button, do this:

    jQuery("#returned_video_id").pandaUploader(panda_access_details, {
        upload_button_id: 'upload_button',
        upload_filename_id: 'upload_filename',
        upload_progress_id: 'upload_progress'
    }, {
        button_image_url : "/my-cool-button.png",
        button_width : 70,
        button_height : 30
    });

All available arguments are documented at the [SWFUpload site](http://demo.swfupload.org/Documentation).

### Events

This script works on top of [Adam Royle's swfupload-jquery-plugin](http://github.com/ifunk/swfupload-jquery-plugin). This means you can bind SWFUpload events to the returned object like follows:

    jQuery("#returned_video_id")
        .pandaUploader(panda_access_details, options)
        .bind('uploadStart', function(){ alert("Stuff"); });


Notes
-----

This code uses [Adam Royle's swfupload-jquery-plugin](http://github.com/ifunk/swfupload-jquery-plugin), which is in turn an interface to [SWFUpload](http://www.swfupload.org). Code is minified using the [Google Compiler](http://code.google.com/closure/compiler/).


Copyright (c) 2010 New Bamboo. Distributed under the terms of the MIT License. See LICENSE file for details