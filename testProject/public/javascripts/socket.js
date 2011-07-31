var socket = io.connect('http://localhost');
socket.on('connected', function (data) {
	console.log(data);
	socket.send('Connected to room!');
});
socket.on('message', function(msg){
	$("#chat").append("<p>" + msg +"</p>");
});

function onKeyChange() {
    var key = window.event.keyCode;
    // If the user has pressed enter
    if (key == 13) {
        socket.send(document.getElementById("txtarea").value);
        document.getElementById("txtarea").value = "";
        return false;
    }
    else {
        return true;
    }
}

function validateField() {
	if (document.getElementById("txtarea").value == "\n") {
		document.getElementById("txtarea").value = "";
	}
}

$(function(){
	$('button').click(function(){
		socket.emit('vote', this.value);
	});
});