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



module.exports = router;
