/**
 * API-ROUTER
 * 
 **/
var express = require('express');
var app = express();
var router = express.Router();
var api = require('../src/api');
var config = require('../src/config');
var shortid = require('shortid');


config.init()

// global: resolve errortext before sending
router.use(function (req, res, next) {
  var json = res.json;
  res.json = function (data) {
    if (typeof api.errortexts[data.statuscode] != undefined) {
	  data.statustext = api.errortexts[data.statuscode];
	}
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



/**
 * Device
 **/
 
 // device list
router.get('/device', function(req, res, next) {
  var answer = api.get_template();
  answer.statuscode = 200;
  answer.data = config.config.devices;
  res.json(answer);
});

// single device info
router.get('/device/:id', function(req, res, next) {
  var answer = api.get_template();
  var device = config.query( "devices[id="+req.params.id+"]" )
  if (device == null ){
	answer.statuscode = 405;
	res.json(answer);
  }
  else {
	answer.error=false;
	answer.success=true;
	answer.statuscode = 200;
	answer.data = [ device ];
	res.json(answer);
  }
});

// new device
router.post('/device', function(req, res, next) {
  console.log('new device');
  
  var answer = api.get_template();
  var newid = shortid.generate();
  answer.error = false;
  answer.success = true;
  answer.statuscode = 200;
  answer.changed = 1;
  answer.data = [ { id:newid } ];
  answer.body = req.body;
  res.json(answer);
});

// update device
router.put('/device/:id', function(req, res, next) {
  console.log('update');
  
  var answer = api.get_template();
  answer.statuscode = 300;
  answer.body = req.body;
  res.json(answer);
  
})

// delete device
router.delete('/device/:id', function(req, res, next) {
  console.log('update');
  var answer = api.get_template();
  answer.statuscode = 300;
  answer.body = req.body;
  res.json(answer);
  
})





/**
 * Switch
 **/
 
router.get('/switch', function(req, res, next) {
  var answer = api.get_template();
  answer.statuscode = 200;
  answer.data = config.config.devices;
  res.json(answer);
});

router.get('/switch/:id', function(req, res, next) {
  var answer = api.get_template();
  var sw = config.query( "switches[id="+req.params.id+"]" )
  if (sw == null ){
	answer.statuscode = 406;
	res.json(answer);
  }
  else {
	answer.error=false;
	answer.success=true;
	answer.statuscode = 200;
	answer.data = [ sw ];
	res.json(answer);
  }
});













module.exports = router,app;
