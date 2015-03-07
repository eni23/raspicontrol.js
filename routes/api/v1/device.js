var rekuire = require('rekuire');
var express = require('express');
var app = express();
var router = express.Router();
var answer = rekuire('src/apianswer');
var config = rekuire('src/config');
var shortid = require('shortid');


config.init()


 // device list
router.get('/', function(req, res, next) {
  answer.new();
  answer.success();
  answer.data(config.config.devices);
  res.json( answer.get() );
});

// single device info
router.get('/:id', function(req, res, next) {
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
router.post('/', function(req, res, next) {
  answer.new();
  
  var port = parseInt(req.body.port)
  
  // check if port allready configured
  var error = config.filter( config.config.devices, { port: port }  );  
  if (error) status = 301;
  
  // ckeck if given port is a number
  if ( isNaN(port) ){
	 var error = true;
	 var status = 302; 
  }
  
  if (error === false){
    device={};
    device.id = shortid.generate();
    device.name=req.body.name;
    device.port=port;
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
router.put('/:id', function(req, res, next) {
  console.log('update');
  answer.new()
  var device = config.filter( config.config.devices, { id: req.params.id }  );
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
router.delete('/:id', function(req, res, next) {
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


module.exports = router,app
