var rekuire = require('rekuire');
var config  = rekuire('src/config');
var util    = require("util");
var events  = require("events");








// stealed from https://github.com/BooBSD/reminder/blob/master/index.js
var reminder = function() {
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
            if(self.listeners(timeEvent).length > 0) self.emit(timeEvent, date);
            self.emit('minute', date);
            if(minutes % 2 == 0) self.emit('2 minutes', date);
            if(minutes % 3 == 0) self.emit('3 minutes', date);
            if(minutes % 4 == 0) self.emit('4 minutes', date);
            if(minutes % 5 == 0) self.emit('5 minutes', date);
            if(minutes % 6 == 0) self.emit('6 minutes', date);
            if(minutes % 10 == 0) self.emit('10 minutes', date);
            if(minutes % 12 == 0) self.emit('12 minutes', date);
            if(minutes % 15 == 0) self.emit('15 minutes', date);
            if(minutes % 20 == 0) self.emit('20 minutes', date);
            if(minutes % 30 == 0) self.emit('30 minutes', date);
            if(_hours != hours) {
                _hours = hours;
                self.emit('hour', date);
                if(hours % 2 == 0) self.emit('2 hours', date);
                if(hours % 3 == 0) self.emit('3 hours', date);
                if(hours % 4 == 0) self.emit('4 hours', date);
                if(hours % 6 == 0) self.emit('6 hours', date);
                if(hours % 8 == 0) self.emit('8 hours', date);
                if(hours % 12 == 0) self.emit('12 hours', date);
            }
        }
        clearTimeout(t);
        var t = setTimeout(tick, 60000 - (new Date().getTime() % 60000));
    }
    tick();
}

util.inherits(reminder, events.EventEmitter);
reminder.prototype.every = reminder.prototype.on;
reminder.prototype.at = function(at,cb,obj){
  this.call(this, cb, obj);
}

reminder.prototype.once;
reminder.prototype.cancel = reminder.prototype.removeListener;
reminder.prototype.forget = reminder.prototype.removeAllListeners;




module.exports = {
  
  reminder: false,
  jobs: false,
  
  init: function(){
    this.reminder = new reminder(),
    console.log("scheudler started");
    this.update();
  },
  
  update: function(){
    this.jobs=[];
    console.log('scheudler upadate');
    var res = config.switch.resolve(config.switch.data);
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
    this.jobs[obj.id] = this.reminder.at(obj.time, cb, obj )
  },
  
  add_off: function(obj){
    console.log('scheudler: add off',obj.device.port);
  },
  
  add_duration: function(obj){
    console.log('scheudler: add duration',obj.device.port);
    var cb=this.create_callback(obj.type, obj.device.port, obj.duration);
    this.jobs[obj.id] = this.reminder.at(obj.time, cb )
  },
  
  create_callback: function(type, port, duration){
    if (duration > 0){
      var cb=function(port,command){
        console.log("scheudler: duration on, port:"+port," cmd:"+this);
        console.log(JSON.stringify(this, null, 2))
        return setTimeout(function(){ console.log('scheudler: duration off, port:'+port) }, duration);
      };
    } 
    else {
      var cb=function(port,command){
        console.log("scheudler: onoff port:"+port+" cmd"+command);
      }
    }
    return cb;
  }
  
}
