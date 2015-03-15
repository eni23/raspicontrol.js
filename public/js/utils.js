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