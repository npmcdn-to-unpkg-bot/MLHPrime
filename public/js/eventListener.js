
var socket = io.connect('http://localhost');

socket.on('new_command', function(data){
	playState.setCommand(data);
});