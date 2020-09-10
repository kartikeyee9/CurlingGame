/*
Client-side javascript for 2406 assignment 1
COMP 2406 (c) Louis D. Nel 2018

*/

//leave this moving word for fun and for using it to
//provide status info to client.
//NOT part of assignment requirements

//connect to server and retain the socket
let player = {};
let socket = null;
var balls = [];

var game = {}

var isMovingBall = false;
var radius = 13;


let timer //timer for animation of moving string etc.
let BallBeingMoved //word being dragged by the mouse
let deltaX, deltaY //location where mouse is pressed relative to word origin
let canvas = document.getElementById('canvas1') //our drawing canvas

// calculating the distance of two circle
function pointInCircle(x, y, cx, cy, radius) {
  var distancesquared = (x - cx) * (x - cx) + (y - cy) * (y - cy);
  return distancesquared <= radius * radius;
}

function getBallAtLocation(aCanvasX, aCanvasY) {

  //locate the word near aCanvasX,aCanvasY co-ordinates
  //aCanvasX and aCanvasY are assumed to be X,Y loc
  //relative to upper left origin of canvas

  //used to get the word mouse is clicked on

  let context = canvas.getContext('2d')

  for (let i = 0; i < balls.length; i++) {
    let wordWidth = context.measureText(balls[i]).width
    if (pointInCircle(balls[i].x, balls[i].y, aCanvasX, aCanvasY, radius)) {

      balls[i].index = i;
      return balls[i]
    } //return the bal; found
  }
  return null //no ball found at location
}


// making a ball on the cncas
function make_ball(x, y, color, player, name) {

  var ball = {
    x: x,
    y: y,
    preX: x,
    preY: y,
    velX: 0,
    velY: 0,
    color: color,
    player: player,
    isDrag: false,
    name: name
  };
  return ball;
}


function drawCircle(context, x, y, radius, color) {
  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI);
  context.fillStyle = color;
  context.fill();
  context.stroke();
}

function drawLine(context, x, y, x2, y2) {
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x2, y2);
  context.fillStyle = 'blue';
  context.fill();
  context.stroke();
}

function drawCanvas() {

  let context = canvas.getContext('2d')
  let lyricFillColor = 'cornflowerblue'
  let lyricStrokeColor = 'blue'
  let chordFillColor = 'green'
  let chordStrokeColor = 'green'

  context.fillStyle = 'white'
  context.fillRect(0, 0, canvas.width, canvas.height) //erase canvas

  context.fillStyle = 'cornflowerblue'
  context.strokeStyle = 'blue'


  drawCircle(context, 800, 100, 80, "blue");
  drawCircle(context, 800, 100, 60, "white");
  drawCircle(context, 800, 100, 40, "red");
  drawCircle(context, 800, 100, 20, "white");


  drawLine(context, 660, 0, 660, 600);
  drawLine(context, 960, 0, 960, 600);

  drawLine(context, 660, 550, 960, 550);


  for (let i = 0; i < balls.length; i++) {
    let data = balls[i];
    if (!balls[i].isDrag) {
      balls[i].x += balls[i].velX;
      balls[i].y += balls[i].velY;
      checkForBoundries(balls[i]);
      balls[i].velX *= 0.95;
      balls[i].velY *= 0.95;
    }
    for (var j = 0; j < balls.length; j++) {
      if (j != i) {
        checkCollision(balls[i], balls[j]);
      }
    }

    //console.log(balls[i]);
    context.beginPath();
    context.arc(data.x, data.y, radius, 0, 2 * Math.PI);
    context.fillStyle = data.color;
    context.fill();
    context.stroke();
  }

  // for the close up view 
  var graph = $('#canvas1');
  var l = graph[0].getContext('2d');
  l.drawImage(
    graph[0], // Canvas
    700, // sourceX
    10, // sourceY
    250, // sourceW
    250, // sourceH

    150, // destX
    100, // destY
    500, // destW
    500 // destH
  );

}

function getCanvasMouseLocation(e) {
  //provide the mouse location relative to the upper left corner
  //of the canvas

  /*
  This code took some trial and error. If someone wants to write a
  nice tutorial on how mouse-locations work that would be great.
  */
  let rect = canvas.getBoundingClientRect()

  //account for amount the document scroll bars might be scrolled
  let scrollOffsetX = $(document).scrollLeft()
  let scrollOffsetY = $(document).scrollTop()

  let canX = e.pageX - rect.left - scrollOffsetX
  let canY = e.pageY - rect.top - scrollOffsetY

  return {
    canvasX: canX,
    canvasY: canY
  }

}

function rotate(x, y, sin, cos, reverse) {
  return {
    x: (reverse) ? (x * cos + y * sin) : (x * cos - y * sin),
    y: (reverse) ? (y * cos - x * sin) : (y * cos + x * sin)
  };
}

function checkCollision(ball0, ball1) {
  var dx = ball1.x - ball0.x,
    dy = ball1.y - ball0.y,
    dist = Math.sqrt(dx * dx + dy * dy);

  //collision handling code here
  if (dist < radius + radius) {
    //calculate angle, sine, and cosine
    var angle = Math.atan2(dy, dx),
      sin = Math.sin(angle),
      cos = Math.cos(angle),

      //rotate ball0's position
      pos0 = {
        x: 0,
        y: 0
      }, //point

      //rotate ball1's position
      pos1 = rotate(dx, dy, sin, cos, true),

      //rotate ball0's velocity
      vel0 = rotate(ball0.velX, ball0.velY, sin, cos, true),

      //rotate ball1's velocity
      vel1 = rotate(ball1.velX, ball1.velY, sin, cos, true),

      //collision reaction
      velXTotal = vel0.x - vel1.x;
    // vel0.x = ((ball0.mass - ball1.mass) * vel0.x + 2 * ball1.mass * vel1.x) /
    //          (ball0.mass + ball1.mass);
    vel1.x = velXTotal + vel0.x;

    //update position
    pos0.x += vel0.x;
    pos1.x += vel1.x;

    //rotate positions back
    var pos0F = rotate(pos0.x, pos0.y, sin, cos, false),
      pos1F = rotate(pos1.x, pos1.y, sin, cos, false);

    //adjust positions to actual screen positions
    ball1.x = ball0.x + pos1F.x;
    ball1.y = ball0.y + pos1F.y;
    ball0.x = ball0.x + pos0F.x;
    ball0.y = ball0.y + pos0F.y;

    //rotate velocities back
    var vel0F = rotate(vel0.x, vel0.y, sin, cos, false),
      vel1F = rotate(vel1.x, vel1.y, sin, cos, false);
    ball0.velX = vel0F.x;
    ball0.velY = vel0F.y;
    ball1.velX = vel1F.x;
    ball1.velY = vel1F.y;
  }
}

function handleMouseDown(e) {

  if (!player.active) {
    alert("You are not registerd/Players already playing game");
    return;
  }

  isMovingBall = true;
  let canvasMouseLoc = getCanvasMouseLocation(e)
  let canvasX = canvasMouseLoc.canvasX
  let canvasY = canvasMouseLoc.canvasY
  console.log("mouse down:" + canvasX + ", " + canvasY)

  BallBeingMoved = getBallAtLocation(canvasX, canvasY)
  if (BallBeingMoved != null) {
    deltaX = BallBeingMoved.x - canvasX
    deltaY = BallBeingMoved.y - canvasY
    $("#canvas1").mousemove(handleMouseMove)
    $("#canvas1").mouseup(handleMouseUp)

  }

  // Stop propagation of the event and stop any default
  //  browser action

  e.stopPropagation()
  e.preventDefault()

  drawCanvas()
}

function handleMouseMove(e) {

  //console.log("mouse move");

  let canvasMouseLoc = getCanvasMouseLocation(e)
  let canvasX = canvasMouseLoc.canvasX
  let canvasY = canvasMouseLoc.canvasY

  // console.log("move: " + canvasX + "," + canvasY)

  // updatePosition(BallBeingMoved);
  BallBeingMoved.isDrag = true;
  BallBeingMoved.preX = BallBeingMoved.x;
  BallBeingMoved.preY = BallBeingMoved.y;

  BallBeingMoved.x = canvasX + deltaX;
  BallBeingMoved.y = canvasY + deltaY;
  checkForBoundries(BallBeingMoved);
  BallBeingMoved.velX = (BallBeingMoved.x - BallBeingMoved.preX);
  BallBeingMoved.velY = (BallBeingMoved.y - BallBeingMoved.preY);

  e.stopPropagation()

  drawCanvas()
}

function checkForBoundries(ball) {
  var realX = ball.x + radius;
  var realY = ball.y + radius;

  if ((ball.x - radius) < 660)
    ball.x = 660 + radius;
  if ((ball.x + radius) > 960)
    ball.x = 960 - radius;

  if ((ball.y + radius) > 550)
    ball.y = 550 - radius;
  if ((ball.y - radius) < 0)
    ball.y = radius;
}

function handleMouseUp(e) {
  //console.log("mouse up")
  e.stopPropagation()

  //remove mouse move and mouse up handlers but leave mouse down handler
  $("#canvas1").off("mousemove", handleMouseMove) //remove mouse move handler
  $("#canvas1").off("mouseup", handleMouseUp) //remove mouse up handler
  if (BallBeingMoved != null) {
    BallBeingMoved.isDrag = false;
    if (isMovingBall)
      setTimeout(function () {
        game.balls = balls;
        // socket.emit("changeTurn",game );
        isMovingBall = false;
      }, 2000);
  }


  drawCanvas() //redraw the canvas
}


function handleTimer() {

  requestAnimationFrame(handleTimer, canvas);
  drawCanvas();

  if (isMovingBall)
    socket.emit("updateGame", balls)

}

//KEY CODES
//should clean up these hard coded key codes
const ENTER = 13
const RIGHT_ARROW = 39
const LEFT_ARROW = 37
const UP_ARROW = 38
const DOWN_ARROW = 40


function handleKeyDown(e) {

  //console.log("keydown code = " + e.which );
  let keyCode = e.which
  if (keyCode == UP_ARROW | keyCode == DOWN_ARROW) {
    //prevent browser from using these with text input drop downs
    e.stopPropagation()
    e.preventDefault()
  }

}

function handleKeyUp(e) {
  //console.log("key UP: " + e.which);
  if (e.which == RIGHT_ARROW | e.which == LEFT_ARROW | e.which == UP_ARROW | e.which == DOWN_ARROW) {
    //do nothing for now
  }

  if (e.which == ENTER) {
    handleSubmitButton() //treat ENTER key like you would a submit
    $('#userTextField').val('') //clear the user text field
  }

  e.stopPropagation()
  e.preventDefault()

}



function handleSubmitButton() {


  let userText = $('#userTextField').val()
  if (userText != '') {
    socket = io('http://' + window.document.location.host);
    socket.on('connect', function (msg) {
      socket.emit('joinGame', {
        name: userText
      });

      socket.on("gameData", function (data) {

        player = data.user;
        game = data.game;
        balls = game.balls;

        if (balls.length != 6 && player.color == 'yellow') {
          balls.push(make_ball(820, 530, player.color, player.name, "ball_1"));
          balls.push(make_ball(860, 530, player.color, player.name, "ball_1"));
          balls.push(make_ball(900, 530, player.color, player.name, "ball_1"));
          socket.emit("playerBalls", balls);
        }

        if (balls.length != 6 && player.color == 'red') {
          balls.push(make_ball(680, 530, player.color, player.name, "ball_1"));
          balls.push(make_ball(720, 530, player.color, player.name, "ball_1"));
          balls.push(make_ball(760, 530, player.color, player.name, "ball_1"));
          socket.emit("playerBalls", balls);
        }
        if (game.players[0])
          $('#p1').text(game.players[0].name + " Color: " + game.players[0].color);
        if (game.players[1])
          $('#p2').text(game.players[1].name + " Color: " + game.players[1].color);
      });

      socket.on('updateGameClient', function (data) {
        if (!isMovingBall) {
          game = data.game;
          balls = game.balls;

        }
        if (game.players[0] && game.players[0].name == player.name) {
          player.active = true;
        }
        if (game.players[1] && game.players[1].name == player.name) {
          player.active = true;
        }

        if (game.players[0])
          $('#p1').text(game.players[0].name + " Color: " + game.players[0].color);
        if (game.players[1])
          $('#p2').text(game.players[1].name + " Color: " + game.players[1].color);

      });

      socket.on('updateTurnClient', function (data) {
        game = data;
        if (data.players[data.playerTurn].name == player.name) {
          // isMovingBall = true;
        }

      });

      socket.on('updatePlayerBallsClient', function (data) {
        game = data;
        balls = game.balls;

        if (game.players[0])
          $('#p1').text(game.players[0].name + " Color: " + game.players[0].color);
        if (game.players[1])
          $('#p2').text(game.players[1].name + " Color: " + game.players[1].color);
      });

    });
  }

}

function handleLeave() {

  if (socket) {

    socket.disconnect();
    socket = null;
  }


  player.active = false;

}


$(document).ready(function () {
  //This is called after the broswer has loaded the web page

  //add mouse down listener to our canvas object
  $("#canvas1").mousedown(handleMouseDown)

  //add key handler for the document as a whole, not separate elements.
  $(document).keydown(handleKeyDown)
  $(document).keyup(handleKeyUp)

  handleTimer();

  // timer = setInterval(handleTimer, 100) //animation timer
  //clearTimeout(timer); //to stop timer

  drawCanvas();

})