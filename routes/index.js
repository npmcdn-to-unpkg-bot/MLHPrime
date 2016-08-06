var express = require('express');
var router = express.Router();

const AccessToken = require('twilio-temp').AccessToken;
const SyncGrant = AccessToken.SyncGrant;
const randomUsername = require('../randos');
const config = require('../config.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/*
Generate an Access Token for a sync application user - it generates a random
username for the client requesting a token, and takes a device ID as a query
parameter.
*/
router.get('/token', (request, response) => {
  var appName = 'TwilioSyncDemo';
  var identity = randomUsername();
  var deviceId = request.query.device;

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

module.exports = router;
