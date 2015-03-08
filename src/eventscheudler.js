
var EventEmitter = require( "events" ).EventEmitter;
var rekuire = require('rekuire');
var config  = rekuire('src/config');
var util = require("util");
var events = require("events");
var EventEmitter = require( "events" ).EventEmitter;


function scheudlerevent() {
    events.EventEmitter.call( this );
    this._ids={};
    return( this );
}

scheudlerevent.prototype = Object.create( events.EventEmitter.prototype );

/*
scheudlerevent.prototype.emit = function(){
  console.log('emit', this)
  scheudlerevent.prototype.emit.call(this)
};

*/


function getscheudler() {
    var self = this;
    var _hours = new Date().getHours();
    var _minutes = new Date().getMinutes();
    var tick = function() {
        var date = new Date();
        var hours = date.getHours();
        var minutes = date.getMinutes();
        if(date.getSeconds() == 0 && _minutes != minutes) {
            _minutes = minutes;
            var timeEvent = (hours <= 9 ? '0' + hours : hours) + ':' + (minutes <= 9 ? '0' + minutes : minutes);
            if(self.listeners(timeEvent).length > 0) self.emit(timeEvent, date, self);
        }
        clearTimeout(t);
        var t = setTimeout(tick, 60000 - (new Date().getTime() % 60000));
    }
    tick();
};

util.inherits(getscheudler, scheudlerevent);
scheudlerevent.prototype.every = scheudlerevent.prototype.on;
scheudlerevent.prototype.at = scheudlerevent.prototype.once;
scheudlerevent.prototype.cancel = scheudlerevent.prototype.removeListener;
scheudlerevent.prototype.forget = scheudlerevent.prototype.removeAllListeners;




module.exports = {
  
  reminder: false,
  jobs: false,
  
  init: function(){
    this.reminder = new getscheudler();
    console.log(this.reminder)
    console.log("scheudler started");
    this.update();
  },
  
  update: function(){
    //this.reminder.forget();
    this.jobs=[];
    console.log('scheudler upadate');
    var res = config.switch.resolve(config.switch.data);
    oo=res;
    if (res.length > 0 ){
      for (k in res){
        switch(res[k].type) {
          case 'on':
            this.add_on(res[k]);
            break;
          case 'off':
            this.add_off(res[k]);
            break;
          case 'duration':
            this.add_duration(res[k]);
            break;
          default:
            break;
            
        }
      }
    }
  },
  
  add_on: function(obj){
    console.log('scheudler: add on-job, port:'+obj.device.port);
    var cb=this.create_callback(obj.type, obj.device.port);
    this.jobs[obj.id] = this.reminder.at(obj.time, cb )
  },
  
  add_off: function(obj){
    console.log('scheudler: add off',obj.device.port);
  },
  
  add_duration: function(obj){
    console.log('scheudler: add duration',obj.device.port);
    var cb=this.create_callback(obj.type, obj.device.port, obj.duration);
    this.jobs[obj.id] = this.reminder.at(obj.time, cb, obj )
  },
  
  create_callback: function(type, port, duration){
    
    var that=this;
    
    if (duration > 0){
      var cb=function(port,command){
        console.log('that',that)
        console.log("scheudler: duration on, port:"+port," oo:"+oo);
        console.log(JSON.stringify(this, null, 2))
        return setTimeout(function(){ console.log('scheudler: duration off, port:'+port) }, duration);
      };
    } 
    else {
      var cb=function(port,command){
        console.log('that',that)
        console.log("scheudler: onoff port:"+port+" cmd"+command);
      }
    }
    return cb;
  }
  
}
