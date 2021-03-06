
//Manages the state of our access token we got from the server
	  var accessManager;

	  //Our interface to the Sync service
	  var syncClient;

	  //We're going to use a single Sync document, our simplest
	  //synchronisation primitive, for this demo
	  var syncDoc;

   	  var userId = Date.now();

	  var syncMazeDoc;

	  var index;

	  var playerEl;

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

    	syncClient.document('mazeData').then(function(doc) {
    		syncMazeDoc = doc;

    		if(!syncMazeDoc.value) {
	    		syncMazeDoc.set(playState.createMaze(12, 12));
	    	} else {
	    		console.log(syncMazeDoc.value);
	    		playState.mazeMatrix = syncMazeDoc.value;
	    	}
	    	console.log("draw walls");
    		playState.displayMaze(playState.mazeMatrix);
      		//playState.spawnScareTraps();

    		syncMazeDoc.on("updated", function (mazeData) {
    			console.log(mazeData);
				playState.mazeMatrix = mazeData;
    		});

    	});

    	syncClient.document('gameData').then(function(doc) {
    		syncDoc = doc;

    		syncDoc.mutate(function (remoteValue) {
    			// remoteValue.playersMap = null;
    			// remoteValue.players = null;
	    		if (!remoteValue.playersMap){
	    			remoteValue.playersMap = new Object(); 
	    		} 
	    		remoteValue.playersMap[userId] = playState.getPlayerData();
		    		return remoteValue;
    		}).then(function() {
    			console.log(syncDoc.value.playersMap);
    			playState.renderOtherPlayers(syncDoc.value.playersMap, userId);
    		}).catch(function(err) {
    			console.log(err);
    		});


    		syncDoc.on("updated", function (gameData) {
    			playState.renderOtherPlayers(gameData.playersMap, userId);
    		});



    	});

	}).catch(function(err){
		console.log(err);
	});

   playerEl = document.getElementById("player");
   playerEl.addEventListener("playerUpdate", function(e){
   	if(syncDoc){
	   syncDoc.mutate(function (remoteValue) {
            remoteValue.playersMap[userId] = e.detail;
             return remoteValue;
         }).then(function() {
            //console.log(syncDoc.value.playersMap);
         }).catch(function(err) {
             console.log(err);
         });
	  }
   });

})();

function closingCode(){
    if (userId) {
        syncDoc.mutate(function (remoteValue) {
           delete remoteValue.playersMap[userId];
            return remoteValue;
        }).then(function() {
        }).catch(function(err) {
            console.log(err);
        });
    }
   return null;
}