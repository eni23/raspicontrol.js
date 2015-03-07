var rekuire = require('rekuire');
var express = require('express');
var app = express();
var router = express.Router();
var answer = rekuire('src/apianswer');
var config = rekuire('src/config');



// list
router.get('/', function(req, res, next) {
  answer.new();
  answer.success();
  answer.data(config.data.switch);
  res.json( answer.get() );
});


// single info
router.get('/:id', function(req, res, next) {
  answer.new();
  var sw = config.switch.getbyid( req.params.id  );
  if (sw.id != req.params.id ){
	  answer.error();
	  answer.status(405);
  }
  else {
	  answer.success();
	  answer.data( [ sw ] );
  }
  res.json( answer.get() );
});

// new switch
router.post('/', function(req, res, next) {
  answer.new();
  ret = config.switch.new( req.body )
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

// update switch
router.put('/:id', function(req, res, next) {
  answer.new()
  req.body.id=req.params.id;
  ret = config.switch.update( req.body );
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

// delete switch
router.delete('/:id', function(req, res, next) {
  answer.new()
  var ret = config.switch.delete(req.params.id);
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





module.exports = router
