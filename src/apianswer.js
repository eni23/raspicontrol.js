module.exports = {
  
  _answer: false,

  answertemplate: {
    identifier: "",
    statuscode: false,
    statustext: false,
    error: true,
    success: false,
    data: false,
    changed: 0,
  },
  
  errortext: {
	200: "success",
	300: "unknown error",
	404: "not found",
	405: "device does not exists",
	406: "switch does not exists",
	500: "internal application error",
	501: "unauthorized",
  },
  
  new: function(){
    this._answer=JSON.parse( JSON.stringify( this.answertemplate ) );
  },
  
  get: function(){
	this.maketext();
	return this._answer;  
  },
  
  status: function( statuscode ){
	  this._answer.statuscode=statuscode;
  },
  
  
  maketext: function(){
	if (typeof this.errortext[data.statuscode] != undefined) {
	  this._answer.statustext = this.errortext[this._answer.statuscode];
	}
  }
  ,
  count: function(obj){
    this._answer.changed=obj.length;
  },
  
  success: function(){
	 this._answer.statuscode=statuscode;
	 this._answer.error=false;
	 this._answer.success=true;
  },

  error: function(){
	  this._answer.error=true;
	  this._answer.success=false;
	  this._answer.changed=false;
  },
  
  
  
  
}
