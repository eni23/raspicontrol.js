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



/**
 * Rainbowmaker
 *
 * @author Cyrill von Wattenwyl
 *
 * @param {int}  Number of Steps
 * @returns none
 */
var rainbow_maker = function(size) {

  this.num=100;
  this.step=0;
  this.hue=0;
  this.rotation=360;
  this.divider=60;

  /**
   * Generates a color from hue
   *
   * @param {float} hue   hue to convert
   * @returns string      hex-color
   */
  this.color_from_hue = function(hue){
    var h = hue/this.divider;
    var c = 255;
    var x = (1 - Math.abs(h%2 - 1))*255;
    var color;
    var i = Math.floor(h);
    if (i == 0) color = this.rgb_to_hex(c, x, 0);
    else if (i == 1) color = this.rgb_to_hex(x, c, 0);
    else if (i == 2) color = this.rgb_to_hex(0, c, x);
    else if (i == 3) color = this.rgb_to_hex(0, x, c);
    else if (i == 4) color = this.rgb_to_hex(x, 0, c);
    else color = this.rgb_to_hex(c, 0, x);
    return color;
  }

  /**
   * Generates a color from hue
   *
   * @type: main-func
   * @returns string hex-color
   */
  this.rgb_to_hex = function(red, green, blue){
    var h = ((red << 16) | (green << 8) | (blue)).toString(16);
    while (h.length < 6) h = '0' + h;
    return '#' + h;
  }

  /**
   * Get next Color-Step
   *
   * @returns string      hex-color
   */
  this.next = function(){
    this.step = this.rotation / this.num;
    var col = this.color_from_hue(this.hue);
    this.hue += this.step;
    return col;
  }

  /**
   * Get Specific Step of rainbow
   *
   * @param {int} stepnum   Step-Number
   * @returns string        hex-color
   */
  this.getstep = function(stepnum){
    var step = this.rotation / this.num;
    var hue =  (step * stepnum);
    return this.color_from_hue(hue);
  }

  if (size > 0) this.num=size;

}



var rgb_to_hex = function(rgb){
  this.hexdigits = new Array("0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f");
  this.hex = function(x){
    return isNaN(x) ? "00" : this.hexdigits[(x - x % 16) / 16] + this.hexdigits[x % 16];
  }
  rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  return "#" + this.hex(rgb[1]) + this.hex(rgb[2]) + this.hex(rgb[3]);
}


/*
var hexDigits = new Array("0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"); 

//Function to convert hex format to a rgb color
function rgb2hex(rgb) {
 rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
 return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}

function hex(x) {
  return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
 }*/
