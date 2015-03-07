/**
 * API-ROUTER
 * 
 **/
var express = require('express');
var app = express();
var router = express.Router();
var answer = require('../src/apianswer');
var config = require('../src/config');
var filter = require('../src/filter');
var shortid = require('shortid');


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



/**
 * Device
 **/
 
 // device list
router.get('/device', function(req, res, next) {
  answer.new();
  answer.success();
  answer.data(config.config.devices);
  res.json( answer.get() );
});

// single device info
router.get('/device/:id', function(req, res, next) {
  answer.new();
  var device = config.filter( config.config.devices, { id: req.params.id}  );
  if (device === false ){
	answer.error();
	answer.status(405);
  }
  else {
	answer.success();
	answer.data( [ device ] );
  }
  res.json( answer.get() );
});

// new device
router.post('/device', function(req, res, next) {
  answer.new();
  
  // ckeck if given port is a number
  if ( isNaN(req.body.port) ){
	 var error = true;
	 var status = 302; 
  }
  
  // check if port allready configured
  var error = config.filter( config.config.devices, { port: parseInt(req.body.port) }  );  
  if (error) status = 301;

  if (error === false){
    device={};
    device.id = shortid.generate();
    device.name=req.body.name;
    device.port=parseInt(req.body.port);
    device.icon=req.body.icon;
    device.color=req.body.color;
    config.config.devices.push(device);
    config.write();
    answer.success();
    answer.data( [ device  ] );
  } 
  else {
	 answer.status(status);
	 answer.error();
  }
  res.json(answer.get());
});

// update device
router.put('/device/:id', function(req, res, next) {
  console.log('update');
  answer.new()
  var device = config.filter( config.config.devices, { id: req.params.id}  );
  if (device === false ){
	answer.error();
	answer.status(405);
  }
  else {
    req.params.port = parseInt(req.params.port)
    device.name=req.body.name;
    device.port=req.body.port;
    device.icon=req.body.icon;
    device.color=req.body.color;
    // config.devices.[key]=device
    answer.success();
  }
  answer.data( [ req.body ] );
  res.json( answer.get() );  
})

// delete device
router.delete('/device/:id', function(req, res, next) {
  answer.new()
  var device = config.filter( config.config.devices, { id: req.params.id}  );
  if (device === false ){
	answer.error();
	answer.status(405);
  }
  else {
    answer.success();
    var re=config.remove(config.config.devices,"id",req.body.id);
    config.config.devices=re;
    config.write();   
    answer.data( [ {id:req.body.id} ] );
  }
  res.json( answer.get() );    
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
