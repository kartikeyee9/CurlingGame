/*
COMP 2406 Assignment #1
(c) Louis D. Nel 2018

This is a simple static server for serving the applications files for assignment #1
It is also the POST request handler for song requests and requests to save songs.

The chords and lyric files are parsed only to an array of lines (strings)
and sent to the client.
Data exchanges are done as JSON strings.
*/

/*
Use browser to view pages at http://localhost:3000/assignment1.html

The client, via the text field can request songs
The server has a hardcoded set of song files:
"Peaceful Easy Feeling"
"Sister Golden Hair"
"Brown Eyed Girl"

*/

//Server Code
const app = require('http').createServer(handler)
const io = require('socket.io')(app) //wrap server app in socket io capability
const fs = require("fs") //need to read static files
const url = require("url") //to parse url strings 

const ROOT_DIR = "html" //dir to serve static files from

const PORT = process.env.PORT || 3001
app.listen(PORT) //start server listening on PORT


// used to hold the game data
let game = {
  players: [],
  playerTurn: 0,
  balls: [],
}

// contain all the connections 
const connections = new Map();

io.on('connection', function (socket) {
  console.log("connection size" + connections.size);

  socket.on('joinGame', function (data) {
    let user = {
      name: data.name
    }
    if (game.players.length == 1) {
      user.active = true;
      user.color = "yellow";
      game.players.push(user);
    }
    else if (game.players.length == 0) {
      user.active = true;
      user.color = "red";
      game.players.push(user);
    }
    else {
      user.active = false;
    }
    console.log("User entered : "+ user.name);
    connections.set(socket, user);
    socket.emit('gameData', {
      user: user,
      game: game
    });
  });


  socket.on('updateGame', function (data) {
    //console.log('RECEIVED BOX DATA: ' + data)
    //to broadcast message to everyone including sender:
    game.balls = data;
    var dataToSend = {
      game: game
    };

    io.emit('updateGameClient', dataToSend) //broadcast to everyone including sender
  })

  socket.on('changeTurn', function (data) {
    //console.log('RECEIVED BOX DATA: ' + data)
    //to broadcast message to everyone including sender:
    game = data;
    if (game.playerTurn == 0)
      game.playerTurn = 1;
    else
      game.playerTurn = 0;

    io.emit('updateTurnClient', game) //broadcast to everyone including sender
  })

  socket.on('playerBalls', function (data) {
    game.balls = data;
    io.emit('updatePlayerBallsClient', game);

  })


  socket.on('disconnect', function () {
    console.log("disconnect");
    // removing user on disconnect
    var player = connections.get(socket);
    if (game.players[0] && game.players[0].name == player.name) {
      game.players.splice(0, 1);
    } else if (game.players[1] && game.players[1].name == player.name){
      game.players.splice(1, 1);
    }

     console.log("User leave : "+ player.name);
    connections.delete(socket);

    // assigning sepectator as a new active user
    if (player.color) {
      for (var [key, user] of connections) {
        if (!user.color) {
          user.color = player.color;
          user.active = true;
          game.players.push(user);
          console.log("New Active User : "+ user.name);
          io.emit('updateGameClient', {game:game})
          break;
        }
      }
    }

    socket.emit('disconnected');
    // online = online - 1;

  });

})

const MIME_TYPES = {
  css: "text/css",
  gif: "image/gif",
  htm: "text/html",
  html: "text/html",
  ico: "image/x-icon",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "text/javascript", //should really be application/javascript
  json: "application/json",
  png: "image/png",
  svg: "image/svg+xml",
  txt: "text/plain"
}

function get_mime(filename) {
  //Get MIME type based on extension of requested file name
  //e.g. index.html --> text/html
  for (let ext in MIME_TYPES) {
    if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
      return MIME_TYPES[ext]
    }
  }
  return MIME_TYPES["txt"]
}

function handler(request, response) {
  var urlObj = url.parse(request.url, true, false);
  console.log("\n============================");
  console.log("PATHNAME: " + urlObj.pathname);
  console.log("REQUEST: " + ROOT_DIR + urlObj.pathname);
  console.log("METHOD: " + request.method);

  var receivedData = "";

  //attached event handlers to collect the message data
  request.on("data", function (chunk) {
    receivedData += chunk;
  });

  //event handler for the end of the message
  request.on("end", function () {
    //Handle the client POST requests
    //console.log('received data: ', receivedData);

    //If it is a POST request then we will check the data.
    if (request.method == "POST") {
      //Do this for all POST messages
      var dataObj = JSON.parse(receivedData);
      console.log("received data object: ", dataObj);
      console.log("type: ", typeof dataObj);
      console.log("USER REQUEST: " + dataObj.text);
      var returnObj = {};
      returnObj.text = "NOT FOUND: " + dataObj.text;
    } else if (request.method == "POST") {
      //Not found or unknown POST request
      var returnObj = {};
      returnObj.text = "UNKNOWN REQUEST";
      response.writeHead(200, {
        "Content-Type": MIME_TYPES["json"]
      });
      response.end(JSON.stringify(returnObj));
    } else if (request.method == "GET") {
      //handle GET requests as static file requests
      var filePath = ROOT_DIR + urlObj.pathname;
      if (urlObj.pathname === "/") filePath = ROOT_DIR + "/index.html";

      fs.readFile(filePath, function (err, data) {
        if (err) {
          //report error to console
          console.log("ERROR: " + JSON.stringify(err))
          //respond with not found 404 to client
          response.writeHead(404);
          response.end(JSON.stringify(err))
          return
        }
        response.writeHead(200, {
          "Content-Type": get_mime(filePath)
        })
        response.end(data)
      })
    }
  })
}

console.log("Server Running at PORT 3001  CNTL-C to quit")
console.log("To Test")
console.log("http://localhost:3001/assignment3.html")