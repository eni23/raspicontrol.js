var path = require('path');
var fs = require('fs');
var schema = require('../src/schema');



module.exports = {

  
  filename: "conf.json",
  load_schemas: [ "device" ],
  schemas: [],
  
  file: false,
  data: [{}],

  init: function(){
	this.file = path.dirname(require.main.filename)+"/"+this.filename;
    for (var k in this.load_schemas) {
      var nam=this.load_schemas[k];
      this[nam] = this.schemas[nam] = schema(nam)
    }
    this.read();
  },
  
  read: function(){
    var content = fs.readFileSync(this.file);
    this.data=JSON.parse(content);
    // update schemas
    for (var k in this.schemas) {
      this.schemas[k].data=this.data[this.schemas[k].name];
	}
  },
  
  
  write: function(){
    var json = JSON.stringify(this.data, null, 2);
    fs.writeFileSync(this.file,json,'utf8');
  },

  add_schema: function(schemaname){
	  
  },
  
  setprop: function( prop, val ) {
	  this.data[prop] = val;
  },
  
  
  
}
