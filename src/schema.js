var rekuire = require('rekuire');
var jsonschema = require('jsonschema');
var shortid = require('shortid');
var Validator = require('jsonschema').Validator;



var config_schema_prototype = {
  
  // placeholders
  name: false,
  schema: false,
  data: [{}],
  validator: new Validator(),
  
  // validate an object against schema
  validate: function( obj, opts ){
    if (opts){
      if (opts.new){
        obj.id = this.genid();
      }
    }  
    var val=this.validator.validate(obj, this.schema);
    // custom validators
    for (var k in this.schema.properties) {
      var so = this.schema.properties[k]
      // unique
      if (so.unique){
        var search = {}
        search[k] = obj[k];
        var test=this.find(this.data, search);
        if (test.length > 0){
          // disable check if update
          if (opts.update && test[0].id==obj.id){
            continue;
		  } 
          val.errors.push({ property: 'instance.'+ k,  message: 'is not unique (elem with same prop allready exists)', schema: this.schema  });  
        }
      }
      // expand default values
      if (so.default && !obj[k]){
        obj[k]=so.default;
      }
    }
    // prettify valult
    var ret = { success: true, instance:{} };
    if (val.errors.length > 0){
      ret.success = false,
      ret.errors = [];
      for (var k in val.errors) {
		  var e=val.errors[k];
		  var i=val.errors[k].property.split(".");
		  var error = {};
		  error.property=i[1];
		  error.given=val[i[0]][i[1]];
		  error.message=e.message;
          ret.errors.push( error );
      }
    }
    // remove undefined props 
    for (k in obj){
	  if (val.schema.properties[k]){
        ret.instance[k]=obj[k];
      }
    }
    return ret;
  },
  
  // create new entry
  new: function( obj ) {
    var val=this.validate( obj , { new: true } );
    if (val.success){
      this.data.push(val.instance);
	}
    return val;
  },
  
  // update entry (id-based)
  update: function( obj ) {
     var search = this.find(this.data, { id: obj.id } );
     var insert = {};
     // expand missing values
     for (k in this.schema.properties){
       if (! obj[k] ){
         if (search[0]) insert[k]=search[0][k]
       }
       else {
         insert[k]=obj[k]
	   }
     }
     // validate against id
     val = this.validate(insert, {update:true} );
     if (search.length == 0){
       val.success = false;
       val.errors = [ { property: 'id', given: obj.id, message: "object with id:"+obj.id+" not found" } ]; 
     }
     // only update if validation was successfull
     if (val.success){
		this.set(obj.id, val.instance);
	 }
     return val;
  },
  
  // remove entry
  remove: function(attr, value){
    var i = this.data.length;
    while(i--){
       if( this.data[i] 
           && this.data[i].hasOwnProperty(attr) 
           && (arguments.length > 1 && this.data[i][attr] === value ) ){ 
           this.data.splice(i,1);
       }
    }
  },
  
  // update id-based, set values
  set: function(id, obj) {
    for (var i=0; i<this.data.length; i++) {
      if (this.data[i].id === id) {
        this.data[i] = obj;
        return;
      }
    }
  },

  // find entry
  find: function( obj, criteria ){
    return obj.filter(function(obj) {
      return Object.keys(criteria).every(function(c) {
        return obj[c] == criteria[c];
      });
    });
  },
  
  // generate id
  genid: function(){
    return shortid.generate();
  },
  
  
}




var schema = function(name){
  var s = rekuire("models/"+name)
  var obj = Object.create(config_schema_prototype);
  obj.data = [ {} ];
  obj.name = name;
  obj.schema = s.schema;
  obj.validator.addSchema(s, '/'+name);
  return obj
}



module.exports = schema;
