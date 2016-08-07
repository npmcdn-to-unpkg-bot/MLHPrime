var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var pyshell = require('python-shell');
var config = require('./config');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var osc = require('osc');
var udpPort = new osc.UDPPort({
    localAddress: "127.0.0.1",
    localPort: 5002,
});

udpPort.open();

const randomUsername = require('./randos');
const AccessToken = require('twilio-temp').AccessToken;
const SyncGrant = AccessToken.SyncGrant;
const SAMPLE_SIZE = 200;

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.get('/test', function(req, res) {
  res.send("test");
});

app.get('/token', (request, response) => {
  var appName = 'TwilioSyncDemo';
  var identity = randomUsername();
  console.log(request.query);
  var deviceId = request.query.deviceId;
  console.log("deviceId:", deviceId);

  // Create a unique ID for the client on their current device
  var endpointId = `${appName}:${identity}:${deviceId}`;

  // Create a "grant" which enables a client to use Sync as a given user,
  // on a given device
  var syncGrant = new SyncGrant({
    serviceSid: config.serviceSid,
    endpointId: endpointId
  });

  // Create an access token which we will sign and return to the client,
  // containing the grant we just created
  var token = new AccessToken(
    config.accountSid,
    config.apiKey,
    config.apiSecret
  );
  token.addGrant(syncGrant);
  token.identity = identity;

  // Serialize the token to a JWT string and include it in a JSON response
  response.send({
    identity: identity,
    token: token.toJwt()
  });
});


// FIXME: UTKARSH THIS WILL BREAK IF THERE ARE MULTIPLE PLAYERS
var trainMode = false;
var trainRes = null;
var modeName = null;
var trainData = []
// FIXME: PLS ADD MULTIPLAYER SUPPORT. THANX

app.post('/startTrain/:name', function(req, res){
  trainMode = true;
  modeName = req.params.name;
  trainRes = res;
});


app.post('/predict', function(req, res){
  eegData = req.body.data; // STRING IN THE FORM OF [[float, float, float, float] * 200]> <SERIALIZED ANN RECEIVED FROM TRAIN
  serializedANN = req.body.serializedANN; // This is what was received from train
  var options = {
    args: [JSON.stringify(eegData), JSON.stringify(serializedANN)]
  }
  pyshell.run('./ml/predict.py', options, function(err, results){
    if (err){
      console.log(err);
      res.status(500).json({});
    } else{
      console.log(results);
      res.json(results);
    }
  });
})

/*
    FORMAT: {
        label: [
            [
                Number,
                Number,
                Number,
                Number,
            ]
        ]
    }
*/
app.post('/trainANN', function(req, res){
  samples = req.body.samples; // This should be a JSON in the form of [float, float, float, float]
  var options = {
    args: [JSON.stringify(samples)]
  }
  pyshell.run('./ml/train.py', options, function(err, serialized) {
    if (err){
      console.log(err);
      res.status(500).json({});
    } else{
      console.log(serialized);
      res.json(serialized);
    }
  });
});


var stopTrain = function(){
  trainMode = false;
  json = {
    label: modeName,
    data: trainData,
  };
  modeName = null;
  trainRes.json(trainData);
  trainData = [];
};

// FIXME: Add support for multiple training at the same time. This will break if more than a single person uses this at a time
var counter = 0;
udpPort.on("message", function (oscData) {
  if (trainMode && oscData.address == "/muse/eeg"){
    if (counter == 4){
      trainData.push([
        oscData.args[0],
        oscData.args[1],
        oscData.args[2],
        oscData.args[3],
      ]);
      if (trainData.length == SAMPLE_SIZE / 4){
        stopTrain()
      }
      counter = 0;
    }
    counter++;
  }
});



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send(err);
    next();
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send(err);
  next();
});

/*
Generate an Access Token for a sync application user - it generates a random
username for the client requesting a token, and takes a device ID as a query
parameter.
*/

module.exports = {
  app: app,
  server: server
}
