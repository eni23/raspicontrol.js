var config = require('./src/config');
var scheudler = require('./src/eventscheudler');

config.init();
scheudler.init();
console.log(scheudler.reminder)
