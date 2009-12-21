function monitor_progress(video_id) {
	intv = setInterval(function() {
	  $.get("/videos/"+video_id+".json", {}, function(res, testStatus) {
			video = res['video'];
			$('#video_status').html(video['status']);
		
			if(video['status'] == 'success') {
   			encoding = res['encodings'][0];
   			$('#encoding_status').html(encoding['status']);
   			$('#bar').css('width', encoding['encoding_progress']+'%')

   			if(encoding['status'] == 'success') {
     			$('#bar').css('width', '100%');
					window.location = "/videos/"+video_id;
   				clearInterval(intv);
   			}
		  }
		}, 'json');
	}, 3000);
}