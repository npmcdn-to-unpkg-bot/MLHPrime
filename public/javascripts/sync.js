
//Manages the state of our access token we got from the server
	  var accessManager;

	  //Our interface to the Sync service
	  var syncClient;

	  //We're going to use a single Sync document, our simplest
	  //synchronisation primitive, for this demo
	  var syncDoc;

	  var index;

(function () {
	  var getDeviceId = function() {
	    return 'browser-' + 
	      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	         var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	         return v.toString(16);
	       });
	  }

	axios.get('/token', {params: {deviceId: getDeviceId()}}).then(function(response) {

		//create syncClient using token sent by the server
		accessManager = new Twilio.AccessManager(response.data.token);
    	syncClient = new Twilio.Sync.Client(accessManager);

    	syncClient.document('gameData').then(function(doc) {
    		syncDoc = doc;
    		syncDoc.mutate(function (remoteValue) {
    			
	    		if (!remoteValue.players){
	    			remoteValue.players = [playState.getPlayerData()];
	    		} else {
	    			remoteValue.players.push(playState.getPlayerData());
	    		}
	    		index = remoteValue.players.length - 1;
	    		return remoteValue;
    		}).then(function() {
    			console.log(syncDoc.value.players);
    		}).catch(function(err) {
    			console.log(err);
    		});


    		syncDoc.on("updated", function (gameData) {
    			console.log(gameData);
    		});



    	});

	}).catch(function(err){
		console.log(err);
	});
})();