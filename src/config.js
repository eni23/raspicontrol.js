module.exports = {
  
  fs: require('fs'),
  path: require('path'),
  schema: require('../src/schema'),
  jsonquery: require('json-query'),

  filename: "config.json",
  file: false,
  config: false,
  
  device: schema('device'),
  
  
  
  init: function(){
    this.file = this.path.dirname(require.main.filename)+"/"+this.filename;
    this.read();
  },
  
  read: function(){
    var content = this.fs.readFileSync(this.file);
    this.config=JSON.parse(content);
  },
  
  
  write: function(){
    var json = JSON.stringify(this.config, null, 2);
    this.fs.writeFileSync(this.file,json,'utf8');
  },
  
  query: function( query ){
	var qres = this.jsonquery(query , { data: this.config });
    return qres.value
  },
  
  filter: function( obj, filter ){
	  var res = this.find(obj,filter);
	  if (res.length===0) return false;
	  if (res.length===1) return res[0];
	  return res;
  },
  
  find: function( obj, criteria ){
    return obj.filter(function(obj) {
      return Object.keys(criteria).every(function(c) {
        return obj[c] == criteria[c];
      });
    });
  },
  
  remove: function(obj, attr, value){
    var i = obj.length;
    while(i--){
       if( obj[i] 
           && obj[i].hasOwnProperty(attr) 
           && (arguments.length > 2 && obj[i][attr] === value ) ){ 
           obj.splice(i,1);
       }
    }
    return obj;
  }
  
  
  
}
