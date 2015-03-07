/**
 * API-ROUTER
 * 
 **/
var express = require('express');
var app = express();
var router = express.Router();
var answer = require('../src/apianswer');
var config = require('../src/config');

config.init()

// global: resolve errortext before sending
router.use(function (req, res, next) {
  var json = res.json;
  res.json = function (data) {
	if (typeof req.query.identifier != undefined) {
	  data.identifier = req.query.identifier;
	}
	if (typeof req.body.identifier != undefined) {
	  data.identifier = req.body.identifier;
	}
    json.call(this, data);
  };
  next();
});

// global: check for valid api-key

router.use(function (req, res, next) {
  var valid = key = false;
  if ( req.body.apikey != undefined ) key = req.body.apikey
  if ( req.query.apikey != undefined ) key = req.query.apikey
  for (var k in config.data.apikeys) {
	  if (config.data.apikeys[k] == key) valid=true;
  }
  if (valid){
    next();
  }
  else {
    answer.new();
    answer.error();
	answer.status(501);
    res.send( answer.get() );
  }
})


// routes
app.use(router)
app.use("/device", require('./api/v1/device') );
app.use("/switch", require('./api/v1/switch') );
//app.use("/control", require('./api/v1/control') );

module.exports = app







