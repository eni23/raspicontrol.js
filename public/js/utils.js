/**
 * raspicontrol.js
 * https://github.com/eni23/raspicontrol.js
 *
 * utils.js 
 * misc gui-utils
 *
 * @author  Cyrill von Wattenwyl < eni@e23.ch >
 * @date    2015-03-15
 *
 * @license
 * WHATEVER, MAN 
 *
 */


/**
 * darken or lighten a color
 *
 * @param {sting} color     color in format #ff0011
 * @param {int}   amt       amout to darken / lighten, positive for lighten, negative for darken, range -100 to + 100
 * @returns {string}        modified color in format #aa0011
 */
var modcolor = function (col, amt) {
  var usePound = false;
  if (col[0] == "#") {
    col = col.slice(1);
    usePound = true;
  }
  var num = parseInt(col, 16);
  var r = (num >> 16) + amt;
  if (r > 255) {
    r = 255;
  } else if (r < 0) {
    r = 0;
  }
  var b = ((num >> 8) & 0x00FF) + amt;
  if (b > 255) {
    b = 255;
  } else if (b < 0) {
    b = 0;
  }
  var g = (num & 0x0000FF) + amt;
  if (g > 255) {
    g = 255;
  } else if (g < 0) {
    g = 0;
  }
  return (usePound?"#":"") + String("000000" + (g | (b << 8) | (r << 16)).toString(16)).slice(-6);
}


var rainbow_maker = function() {
  
  this.num=25;
  this.act_num=0;
  this.center=128;
  this.width=127;
  this.phase=0;
  this.factor_red= 30;
  this.factor_green=6;
  this.factor_blue=2;
  this.freq=false;

  var self = this;

  this.RGB2Color = function(r,g,b){
    return '#' + this.byte2Hex(r) + this.byte2Hex(g) + this.byte2Hex(b);
  };

  this.byte2Hex = function(n){
    var nybHexString = "0123456789ABCDEF";
    return String(nybHexString.substr((n >> 4) & 0x0F,1)) + nybHexString.substr(n & 0x0F,1);
  };

  this.next = function(){
    if (!this.freq) { this.freq = Math.PI*2/this.num; }
    var i=this.act_num;
    var red   = Math.sin(this.freq*i+this.factor_red+this.phase) * this.width + this.center;
    var green = Math.sin(this.freq*i+this.factor_green+this.phase) * this.width + this.center;
    var blue  = Math.sin(this.freq*i+this.factor_blue+this.phase) * this.width + this.center;
    this.act_num++;
    return this.RGB2Color(red,green,blue);
  };

}


var hexDigits = new Array
        ("0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"); 

//Function to convert hex format to a rgb color
function rgb2hex(rgb) {
 rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
 return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}

function hex(x) {
  return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
 }
