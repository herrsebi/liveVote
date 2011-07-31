
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'Express'
  });
});

app.get('/overview', function(req, res){
	var readClient = redis.createClient();
	var multi = readClient.multi();
	var data = {title: 'Overview'};
	multi.get('none', function(err,reply){
		data.none = reply;
	}),
	multi.get('Eclipse', function(err,reply){
		data['eclipse'] = reply;
	}),
	multi.get('Storm', function(err,reply){
		data['storm'] = reply;
	}),
	multi.get('Netbeans', function(err,reply){
		data['netbeans'] = reply;
	});
	multi.exec(function(err, replies) {
		console.log(data);
		console.log(replies);
		res.render('overview', data);
		readClient.quit();
	});
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

// Socket for the live communication
var io = require('socket.io').listen(app);
var redis = require('redis');
io.sockets.on('connection', function (socket) {
	// Connect the socket to the Redis channel
	  var readClient = redis.createClient();
	  readClient.subscribe('chat'),
	// Post all messages to client
	  readClient.on("message", function (channel, message) {
		 socket.send(message); 
	  });
	  var writeClient = redis.createClient();
	// Increase
	  writeClient.incr('none');
	  socket.set('writeClient', writeClient, function(){
		  socket.emit('connected');
	  });
	// Publish messages on channel
	  socket.on('message', function (data) {
	    console.log(data);
	    socket.get('writeClient', function(err,writeClient){
	    	writeClient.publish('chat',data);
	    });
	  });
	// Publish vote event on channel
	socket.on('vote', function (data) {
		socket.get('writeClient', function(err,writeClient){
			socket.get('currentVote', function(err,currentVote){
				writeClient.decr(currentVote);
			});
			writeClient.incr(data);
			writeClient.publish('chat','Vote for :' + data);
		});
		socket.set('currentVote', data);
	});
});