var path = require('path');
var express = require('express');
var socketio = require('socket.io');
var http = require('http');



var app = express();

app.configure(function() {
    app.use(express.static(path.join(__dirname, "../src")));
    app.use(express.static(path.join(__dirname, "../lib")));
    app.use(express.static(path.join(__dirname, "../assets")));
});


var server = http.createServer(app);
var io = socketio.listen(server, { log: false});



var port = 3000;
server.listen(3000, function () {
    console.log(' - listening on port ' + port + 'dirname ' + __dirname);
});

