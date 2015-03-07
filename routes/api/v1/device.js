var rekuire = require('rekuire');
var express = require('express');
var app = express();
var router = express.Router();
var answer = rekuire('src/apianswer');
var config = rekuire('src/config');


config.init()

 // device list
router.get('/', function(req, res, next) {
  answer.new();
  answer.success();
  answer.data(config.data.device);
  res.json( answer.get() );
});


// single device info
router.get('/:id', function(req, res, next) {
  answer.new();
  var device = config.device.getbyid( req.params.id  );
  if (device.id != req.params.id ){
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
  req.body.port=parseInt(req.body.port);
  ret = config.device.new( req.body )
  if (ret.success){
    config.write()
    answer.success();
    answer.data( ret.instance );
  }
  else {
    answer.error();
    answer.status(303);
    answer.data( ret.errors );
  }

  res.json(answer.get());
});

// update device
router.put('/:id', function(req, res, next) {
  answer.new()
  req.body.port=parseInt(req.body.port);
  req.body.id=req.params.id;
  ret = config.device.update( req.body );
  if (ret.success){
    config.write()
    answer.success();
    answer.data( ret.instance );
  }
  else {
    answer.error();
    answer.status(303);
    answer.data( ret.errors );
  }
  res.json( answer.get() );  

})



// delete device
router.delete('/:id', function(req, res, next) {
  answer.new()
  var ret = config.device.delete(req.params.id);
  if (ret.success){
    config.write()
    answer.success();
    answer.data( ret.instance );
  }
  else {
    answer.error();
    answer.status(303);
    answer.data( ret.errors );
  }
  res.json( answer.get() );    
})


module.exports = router,app
