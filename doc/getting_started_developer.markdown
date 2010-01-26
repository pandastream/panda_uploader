Integrate Panda Cloud into a Rails application
================================================

*** Install Panda Gem

Install panda gem from github and use the Sinatra branch
git://github.com/newbamboo/panda_gem.git

Look at Panda Gem documentation	for more information

*** Authentication
To authenticate to Panda Cloud you have to provide the following hash:

auth_hash = { 
	'access_key' => 'myaccesskey',  
	'secret_key' => "mysecretkey", 
	'api_host' => "myapihost",
	'api_port' => "myapiport"
}

The Hash can be load from a YAML file.

connection_params = Panda.connect!(auth_hash)

*** Get Video details
Use Panda get video details

Get Video details – JSON:
video_json = Panda.get("/videos/#{your_video_id}.json")

Get Encodings details – JSON:
encodings_json = Panda.get("/videos/#{your_video_id}/encodings.json")

Get all your profiles – JSON:
profiles_json = Panda.get("/profiles.json")

Looks to the API to know more details

*** Video Uploader
Panda cloud video uploader use SwfUpload.

For a Rails application just install the plugin on github
script/plugin install git://github.com/newbamboo/panda_uploader.git

rake panda_uploader:scripts:install
Javascript files, images and the Flash widget will be installed

In your layouts insert the helper method to load all javascript files required.
<head>
	....
	<%= javascript_include_panda_uploader %>
</head>

In your page you will need to generate the SwfUploader Javascript Object with the helper:

<%= js_panda_uploader_init %>

or <%= js_panda_uploader_init :server_data_id => "server_data_video" %>


You can define some options
- :server_data_id 				Input id where is returned the server data (JSON dump of the video record)
								"video" is by default 
- :submit_id					Submit input id to start the upload
- :debug 						(sfwUpload debug mode)
- :button_image_url 	 		Image Button
- :button_width					Button width
- :button_height				Button height
- :flash_url					Url of your swfupload flash object (swfupload.swf)

<%= js_panda_uploader_init %>

Then in your form you need to add your file selector inside your form with

<form>

<%= panda_uploader_file_selector %>

<input type="hidden" name="video" id="server_data_video" value="" />

</form>

*** For other frameworks

Include the following Javascript files:

'panda_uploader/fileprogress'
'panda_uploader/swfupload'
'panda_uploader/handlers'
'panda_uploader/swfupload.swfobject'

Load the PandaUploaderHelper class

<form>
PandaUploaderHelper::panda_uploader_file_selector
PandaUploaderHelper::panda_uploader_filename_container
</form>


*** Upload Success

For a custom behaviour after the uploader has succeeded you will need to override the javascript function called :
function uploadDone(file);

Look at panda_uploader_helper.rb to see the default behaviour.

When the upload ends the hidden input "#video" contains the json of the new created video
value = "{'id' : '12345678', 'status':'processing', .....}"