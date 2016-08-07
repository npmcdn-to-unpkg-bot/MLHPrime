(function () {
	axios.get('/token').then(function(response) {
		console.log(response);
	}).catch(function(err){
		console.log(err);
	});
})();