var express = require("express"); // http://expressjs.com/
var app = express();
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // change to only allow certain domains to use server
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
    next();
});
var http = require("http").Server(app); // https://nodejs.org/api/http.html

// SOCKET IO

var io = require("socket.io")(http); 


// app.get('/', function(req, res){
//   res.sendFile('index.html');
// });

var userCount = [];
var closeCount = [];
var userObj = {};

io.of("/").on("connection", function(socket){
    console.log("SERVER CONNECTED");

    //join room, increase count
    socket.on('joinRoom', function(joinData) {

        closeCount.push(socket.id);

        if (closeCount.length < 5) {

            userCount.push(socket.id);

            if (userCount.length == 1) {

                socket.join('room');

                userObj[socket.id] = {id: socket.id, leader: true, name: joinData.name, room: "room", length: userCount.length, kicked: false}

                console.log("from joined: "+userCount.length);

                socket.emit('join', userObj);

            } else if (userCount.length < 5) {

                socket.join('room');

                userObj[socket.id] = {id: socket.id, leader: false, name: joinData.name, room: "room", length: userCount.length, kicked: false}

                console.log("from joined: "+userCount.length);

                socket.emit('join', userObj);   
            } 

        } else {

            var userData = {name:"NO ROOM FOR YOU", length: 100};
            socket.emit('join', userData);
            console.log(closeCount.length);
        }   
    });

    socket.on('ready', function(userObj) {
        io.emit('ready', userObj);
    });

    socket.on('kickUser', function(nameID) {
        userObj[nameID].kicked = true;
        var kickedID = nameID;
        io.in('room').emit('kickFinished', userObj, kickedID);
    });

    socket.on('reset', function() {
        io.emit('resetReturn', userObj);
    });

    socket.on('chat message', function(msgPack){
        var name = userObj[msgPack.id].name;
        var msgDeliver = {name: name, msg: msgPack.msg}
        io.emit('chat', msgDeliver);
    });

    //leave room
    socket.on('disconnect', function() {
        userCount.pop(socket.id);
        delete userObj[socket.id];
        if (userCount.length == 0) {
            closeCount.length = 0;
        }
        io.in('room').emit('exitNotify', userCount.length);
        console.log("from left: "+userCount.length);
    });

});


http.listen(3000, function(){
  console.log('listening on PORT:3000');
});

