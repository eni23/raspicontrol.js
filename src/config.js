module.exports = {
  
  fs: require('fs'),
  path: require('path'),
  jsonquery: require('json-query'),
  filter: require('./filter'),

  filename: "config.json",
  file: false,
  config: false,
  
  init: function(){
    this.file = this.path.dirname(require.main.filename)+"/"+this.filename;
    this.read();
  },
  
  read: function(){
    var content = this.fs.readFileSync(this.filename);
    this.config=JSON.parse(content);
  },
  
  
  write: function(){
    var json = JSON.stringify(this.config, null, 2);
    fs.writeFileSync(this.filename,json);
  },
  
  query: function( query ){
	var qres = this.jsonquery(query , { data: this.config });
    return qres.value
  },
  
  
}
