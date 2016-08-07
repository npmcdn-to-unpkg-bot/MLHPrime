
var socket = io.connect();

socket.on('new_command', function(data){
	playState.setCommand(data);
});