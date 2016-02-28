var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.static(__dirname + "/public"));
});

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

http.listen(3015, function() {
    console.log("Listening on port 3015");
});

io.on('connection', function(socket) {
    console.log("A user connected");
    socket.on("disconnect", function() {
        console.log("A user disconnected");
    });
    socket.on("audiobuffer", function(buf) {
        io.emit('audiobuffer', buf);
    });
});
