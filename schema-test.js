var config = require('./src/config');

config.init();

//config.device.remove("id","QyMkeHhd");


var obj =  {
      "id": "QJebv7H2_",
      "device": "X17ylBhu",
      "type": "on",
      "time": "08:30",
      "duration": false
};

var query1 = { id:"QJebv7H2_" }
var query2 = [ { id:"QJebv7H2_",}, { id:"Qy-PmrhO" } ]
var query3 = { }

res=config.switch.resolve( query3 )
console.log(res)

//console.log(config.data)
