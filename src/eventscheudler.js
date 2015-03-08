var rekuire       = require('rekuire');
var config        = rekuire('src/config');
var util          = require("util");
var events        = require("events");



// scheudler (main control function)
function scheudler() {
    var self = this;
    var _hours = new Date().getHours();
    var _minutes = new Date().getMinutes();
    var tick = function() {
        console.log('tikk');
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

// is child of EventEmitter
util.inherits(scheudler, events.EventEmitter);
scheudler.prototype.every   = scheudler.prototype.on;
scheudler.prototype.at      = scheudler.prototype.once;
scheudler.prototype.cancel  = scheudler.prototype.removeListener;
scheudler.prototype.forget  = scheudler.prototype.removeAllListeners;




// jobs class, gets created for every scheudle 
function scheudlerjob(){
  
  var data        = false;
  var durationcb  = false;
  
  
  
  this.init = function(_data){
    data = _data;
    console.log("scheudler("+data.id+") added job (time:"+data.time+" port:"+data.device.port+" type:"+data.type+")");
  }
  
  function afterduration(){
    console.log('scheudler('+data.id+'): duration done');
    control(data.device.port,0);
  }
  
  function control(port,status){
    console.log("HW("+data.id+"): set port:"+port+" to="+status)
  }
  
  this.run = function(){
    console.log('scheudler('+data.id+')  running job ');
    switch(data.type) {
      case 'on':
        control(data.device.port,1);
        break;
      
      case 'off':
        control(data.device.port,0);
        break;
        
      case 'duration':
        control(data.device.port,1);
        var dur=parseInt(data.duration);
        durationcb = setTimeout(afterduration, (dur*1000));
        console.log('scheudler('+data.id+') durationcallback created run after:'+data.duration);
        break;
        
      default:
        break;
    }
  }
  
}



// object accessible for other modules
module.exports = {
  
  jobs: false,
  
  init: function(){
    this.scheudler = new scheudler();
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
        this.scheudle(res[k]);
      }
    }
  },
  
  scheudle: function( obj ){
    this.jobs[obj.id]={};
    this.jobs[obj.id].callback = new scheudlerjob();
    this.jobs[obj.id].callback.init(obj);
    this.jobs[obj.id].event = this.scheudler.at(obj.time, this.jobs[obj.id].callback.run )
  },
  
  
}
