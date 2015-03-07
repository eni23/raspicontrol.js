var express = require('express');
var app = express();
var router = express.Router();

/* homepage */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});



/* json-api */
app.use('/api/v1', require('./api'))

/* gui */
app.use('/gui', require('./gui'))





module.exports = app,router;
