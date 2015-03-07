var rekuire = require('rekuire');
var express = require('express');
var app = express();
var router = express.Router();
var answer = rekuire('src/apianswer');
var config = rekuire('src/config');
var shortid = require('shortid');

config.init()

 
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




module.exports = app,router
