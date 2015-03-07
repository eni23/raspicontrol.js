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
          if (opts.update && test[0].id==obj.id) continue;
          // otherwise report error
          val.errors.push({ property: 'instance.'+ k,  message: 'is not unique (elem with same prop allready exists)', schema: this.schema  });  
        }
      }      
      // expand default values
      if (so.default && !obj[k]){
        obj[k]=so.default;
      }
      // references resolving
      if (so.rev && opts.resolve != false ){
        var parts=so.rev.split(".");
        var rs=this.parent[parts[0]];
        if (rs){
          var search = {};
          search[parts[1]]=obj[k];
          var result = rs.find( rs.data, search )
          if ( result.length == 0 ) {
            val.errors.push({ property: 'instance.'+ k,  message: 'cannot resolve '+so.rev+':'+obj[k], schema: this.schema  });
          }
        }
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
    if (val.success) this.data.push(val.instance);
    return val;
  },
  
  // update entry (id-based)
  update: function( obj ) {
     var search = this.getbyid( obj.id )
     var insert = {};
     // expand missing values
     for (k in this.schema.properties){
       if (! obj[k] ){
         if (search) insert[k]=search[k]
       }
       else insert[k]=obj[k]
     }
     // validate against id
     val = this.validate(insert, {update:true} );
     if (search.id != obj.id){
       val.success = false;
       val.errors = [ { property: 'id', given: obj.id, message: "object with id:"+obj.id+" not found" } ]; 
     }
     // only update if validation was successfull
     if (val.success) this.set(obj.id, val.instance);
     return val;
  },
  
  // delete instance by id
  delete: function(id){
    var ret={ success:true, instance:{ id: id }, message:false  };
    var search = this.getbyid( id )
    if (search.id != id) {
      ret.success = false;
      ret.errors = [ { property: 'id', given: id, message: "object with id:"+id+" not found" } ]; 
    }
    else {
      this.remove("id",id);
    }
    return ret;
  },
  
  // remove entry by attr & val
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
  
  // resolve objects (mready)
  resolve: function( obj ){
    var result=this.find( this.data, obj );
    if (result.length > 0){
      // resolve references
      for (key in result){
        for (subkey in result[key]){
          if (this.schema.properties[subkey].rev && this.parent[subkey]){
            var part=this.schema.properties[subkey].rev.split(".");
            var ref=this.parent[subkey];
            if ( ref.schema.properties[part[1]] ){
              var search={};
              search[part[1]]=result[key][subkey];
              var subres=this.find(ref.data, search);
              if (subres.length>0){
                result[key][subkey]=subres[0];
              }
            }
          }
        }
      }
    }
    return result;
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

  // find entry (mready)
  find: function( obj, criteria ){
    // multiple query
    if (criteria.length>0){
      var retarr=[];
      for (key in criteria){
       var subres=this.find( obj, criteria[key] );
       if (subres.length>0){
          for (subkey in subres){
            retarr.push(subres[subkey]);
          }
        }
      }
      return retarr;
    }
    // single search
    return obj.filter(function(obj) {
      return Object.keys(criteria).every(function(c) {
        return obj[c] == criteria[c];
      });
    });
  },
  
  // get instance by id
  getbyid: function( id ) {
    var search = this.find(this.data, { id: id } );
    if (search[0]) return search[0];
    return false;
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
  obj.parent = module.parent.exports;
  obj.schema = s.schema;
  obj.validator.addSchema(s, '/'+name);
  return obj
}



module.exports = schema;
