getPandaVideoProfiles = function () {
	var profiles = {}
	var i=0
	$('[panda_input_type=profile_input]:checked').each(function(num_input) {
		$(this).attr("disabled",true)
		profiles[num_input] = $(this).attr("profile_id")
		i++
	})
	return profiles;
}

prefix_query = function (prefix, ahash) {
	rhash = {}
	for (i in ahash) {
		rhash[prefix+'['+i+']'] = ahash[i]
	}
	return rhash;
}

