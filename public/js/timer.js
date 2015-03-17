/**
 * raspicontrol.js
 * https://github.com/eni23/raspicontrol.js
 *
 * Timer-App GUI 
 * edit timers via rich graphical interface
 *
 * @author  Cyrill von Wattenwyl < eni@e23.ch >
 * @date    2015-03-15
 *
 * @license
 * WHATEVER, MAN 
 *
 */

var timer = {

  // placeholder for visDatasets
  groups: [],
  timers: [],

  /**
   * init()
   * main entry point
   *
   * @type: main-func
   * @returns none
   */
  init: function(){
    
    // set date to today
    this.set_date_today();

    // init timeline & fetch data
    this.render(demodata);
    this.init_timeline();
    this.update_background();


    // set event hanlers
    // store click/touch-position for popover:new 
    $(document).on('click tap',this.update_clickpos);

    // edit/new-popover: change type
    $(".popover-edit-type > div > label").click(this.edit_change_type);

    //popover:edit change input value
    $(".popover-edit input").on("change", this.edit_change_form);

    // popover:edit delete item button
    $("#edit-item-delbutton").click(this.delete_item);

    // popover:new add new item button
    $("#edit-item-addbuton").click(this.add_new_item);

    // color sel TODO: move to own file
    this.colorselector_init();

  },



  // color sel TODO: move to own file
  colorselector_init: function(){
    
    //make colors
    rainbow = new rainbow_maker(110);
    for (i=0;i<rainbow.num;i++){
        var color=rainbow.next();
        $('.popover-color ul.color-sel')
         .append('<li>'+color+'</li>')
         .children(':last')
         .css('background-color',color)
         .css('color',modcolor(color,70));
    }

    // init scroll-area
    $('.popover-color ul.color-sel').slimScroll({ 
      height: 'auto',
      size: 5,
      wheelStep: 1,
      touchScrollStep: 1,
      allowPageScroll: false
    });

    // device click on small round color-button
    $(".colorsel").on('click tap',function(evt){
      var lastcolor = $(this).css('background-color');
      var color = rgb2hex(lastcolor);
      var active = $('.popover-color ul.color-sel > li:contains('+color+')');    
      timer.colorsel_elem=this;
      timer.popover('#popover-color',$(this))
      if (active.length==0) return
      $('.popover-color ul.color-sel > li').removeClass('active');
      active.addClass('active');
      $('.popover-color ul.color-sel').slimScroll({ scrollTo: active.get(0).offsetTop });
      return;
    });

    // user selects color
    $(".popover-color ul.color-sel > li").click(function(){
      var color=$(this).html();
      var group=timer.colorsel_elem.className.split(' ')[1].split('_')[1];
      var darker=modcolor(color,-25);
      timer.popover_hide('#popover-color');
      var style = '.vis.timeline .group_'+group+' .item, .bg-group_'+group+' {'
                + '  background-color:'+color+'; '
                + '} .vis.timeline .group_'+group+' .item.selected  { '
                + '  background-color:'+darker+'; '
                + '}'
                ;
      $("#_devices-generated-styles").append(style);
      
      console.log(color);
      // save
      //timer.api.device.color(group,color)

    });

  },

  colorsel_elem: false,



  /**
   * set date today
   *
   * @returns none
   */
  set_date_today: function(){
    this.today = moment().startOf('day').format("YYYY-MM-DD");
    this.today_start = moment().startOf('day').format("YYYY-MM-DD HH:mm:ss");
    this.today_end = moment().endOf('day').format("YYYY-MM-DD HH:mm:ss");
  },

  // placeholders for date today yyyy-mm-dd (hh:mm:ss)
  today: false,
  today_start: false,
  today_end: false,


  /**
   * API-Wrapper
   * high level functions for timer-based updates
   *
   */
   api: {
    queue:[],
    call_timeout:false,
    clear_rate_callback: function(){

    },
    run: function(){

    },
    queue: function(item){

    },
    dequeue: function(){

    },
    save: function(item){
      var rate=50;
      //console.log('api-save');
    },
    add: function(item){
      var rate=0;
      //console.log('api-add');
    },
    delete: function(item){
      var rate=0;
      //console.log('api-remove');
    },
  },


  /**
   * prepare visjs-Timeline
   *
   * @returns none
   */
  init_timeline: function(){
    var container = document.getElementById('visualization');
    var options = {
      min: timer.today_start,
      max: timer.today_end,
      orientation: top,
      editable: {
        add: true,
        updateTime: true,
        updateGroup: false,
        remove: false
      },
      format: {
        minorLabels: {
          weekday: '',
          day: ' '
        }
      },
      // callback for adding new item
      onAdd: timer.new_item,
      // callback for re-calculate background
      onMoving: timer.drag_item
    };

    // init visJs-timeline
    this.timeline = new vis.Timeline(container);
    this.timeline.setOptions(options);
    this.timeline.setGroups(this.groups);
    this.timeline.setItems(this.timers);

    // calback for opening edit-popover after twice klick/tap item
    this.timeline.on('select',this.edit_item);
    // callback for moving open edit-popover on drag/zoom
    this.timeline.on('rangechange',this.drag_timeline);

  },
  
  // placeholder for timeline-object
  timeline: false,


  /**
   * render data from api
   *
   * @param  {object} data      data to render: { devices: [..] , timers: [...] } 
   * @returns none
   */
  render: function(data){

    var timers=[];
    var devices=[];

    // insert placeholder for stlyes
    $("<style>").prop("type", "text/css")
                .attr("id","_devices-generated-styles")
                .html('/* generated */')
                .appendTo('head');

    // loop over all groups (aka devices)
    for(var k in data.devices) {
      var item = data.devices[k];
      var content = '<div class="timetable-device">'
                  + ' <div class="icon">'
                  + '  <span class="glyphicon glyphicon-'+item.icon+'" aria-hidden="true"></span>'
                  + ' </div>'
                  + ' <div class="devicename">'+item.name+'</div>'
                  + ' <div class="colorsel bg-group_'+item.id+'"></div>'
                  + '</div>'
                  ;

      var visItem={
        id: item.id,
        className: 'group_'+item.id,
        content: content
      };
      // generate css-classes for group
      var darker=modcolor(item.color,-25);
      var g=item.id;
      var style = '.vis.timeline .group_'+g+' .item, .bg-group_'+g+' {'
                + '  background-color:'+item.color+'; '
                + '} .vis.timeline .group_'+item.id+' .item.selected  { '
                + '  background-color:'+darker+'; '
                + '}'
                ;

      $("#_devices-generated-styles").append(style);
      devices.push(visItem);
    }
    // loop over all timers and generate visItems
    for(var k in data.timers) {
      var item=data.timers[k];
      var visItem={
        id:item.id,
        content:'',
        start: timer.today + ' ' + item.time,
        group: item.device,
        className: item.type,
        type: 'box',
        origData:item
      }
      if (item.type=='duration'){
       var end=moment(timer.today+' '+item.time).add( parseInt(item.duration) , 'seconds').format('HH:mm');
       visItem.end=timer.today+' '+end;
       visItem.type='range';
       visItem.className=item.type+' bg-group_'+item.device;
     }
     timers.push(visItem);
    }

    // genetate timeline datasets
    this.groups = new vis.DataSet(devices);
    this.timers = new vis.DataSet(timers);
  },


  /**
   * function for sorting timers by time
   *
   * @type filter-function
   * @param {*} a             date a
   * @param {*} b             date b
   * @returns {int}           bigger or smaller
   */
  sort_by_time: function(a,b){
    return new Date(a.start).getTime() - new Date(b.start).getTime();
  },


  /**
   * get all items of a group
   *
   * @param {string}  group     group name
   * @returns {visItems}        array of visItems
   */
  get_group_items: function(group){
    var items = timer.timers.get({
      filter: function (item) {
        return item.group == group;
      }
    });
    return items;
  },


  /**
   * gets called if user zooms and drags timeline
   *
   * @type event-callback
   * @returns none
   */
  drag_timeline: function(evt){
    //console.log(moment(evt.start),evt.end); 
    timer.move_open_popover(); 
  },


  /**
   * gets called when a user drags an item around
   *
   * @type event-callback
   * @param {visItem} item    visDataset-item which is currently moving
   * @returns {boolean}       allways true
   */ 
  drag_item: function(item){

    // if type is duration calculate secounds
    if ( item.origData.type=='duration'){
      var dur_calc=( item.end-item.start ) / 1000;
      item.origData.duration = dur_calc;
    }
    timer.timers.update(item)
    timer.update_group_background(item.group)

    // if edit-tooltip is open, update time and move tooltip too
    if ( $("#popover-edit").is(":visible") ) {
      var newtime=moment(item.start).format('HH:mm');
      $("#edit-start").val(newtime);
      $("#popover-edit").data(item)
      // is duration
      if ( item.origData.type=='duration'){
        $("#edit-duration").val(dur_calc);
      }
      timer.popover_move("#popover-edit");
    }

    timer.api.save(item);
    return true;
  },


  /**
   * update background of all groups
   *
   * @returns none
   */
  update_background: function(){
    this.groups.get().forEach(function(group){
      timer.update_group_background(group.id);
    });
  },


  /**
   * update background of specific group
   *
   * @param {string} group      the name of the group/deivce
   * @returns {boolean}         allways true
   */
  // 
  update_group_background: function(group){

    var groupitems=this.get_group_items(group);
    var sorted=groupitems.sort(this.sort_by_time);
    var background=[];
    var delitems=[];
    var groupstr='group_'+group;

    // simulate timer: 
    // loop over all group items sorted by time and create bg-array
    var is_on=false;
    for (k in sorted){

      var item=sorted[k];
      var last=background[background.length-1];
      var bgtemplate={
        id:  groupstr+item.id,
        type: 'background',
        group: group
      };
      // if item is background, add to delete candidates and skip this item
      if (item.type=='background'){
        delitems.push(item.id);
        continue;
      }

      if (item.origData.type=='on'){
        // if 'device' is allready on, skip the item
        if (is_on) continue;
        is_on=true;
        bgtemplate.start=item.start;
        background.push(bgtemplate);
      }
      else if (item.origData.type=='off'){
        // if 'device' is not turned skip the item 
        if (!is_on) continue;
        if (last.end) continue;
        is_on=false;
        last.end=item.start;
      }

      else if (item.origData.type=='toggle'){
        // if 'device' is on, turn off  
        if (is_on){
          last.end=item.start;
          is_on=false;
        }
        //else turn device on
        else {
          is_on=true;
          bgtemplate.start=item.start;
          background.push(bgtemplate);
        }
      }
      else if (item.origData.type=='duration'){
        //is_on=true;
        bgtemplate.start=item.start;
        bgtemplate.end=item.end;
        background.push(bgtemplate);
      }

    }

    // loop over background-array 
    for (k in background){
      // fix missing end
      if (!background[k].end){
        background[k].end=timer.today_end;
      }
      // update delete-array, only delete unused backgrounds
      var index = delitems.indexOf( background[k].id );
      if ( index > -1 ){
        delitems.splice(index,1);
      }
    }

    this.timers.remove(delitems);
    this.timers.update(background);
    return true;
  },


  /**
   * edit item open popover
   * gets called if click/tap twice on existing item
   *
   * @type event-callback
   * @param {visItem} evt       visItem object of selected item
   * @returns none
   */
  edit_item: function(evt){

    if (evt.items.length == 1 ){

      timer.edit_new_item=false;
      var requested_item=timer.timers.get(evt.items[0]);
      
      // open on secound click
      if (timer.editid===false){
        timer.editid=requested_item;
        return true;
      }

      // click on a different item
      if (timer.editid.id != requested_item.id ){
        $('#popover-edit').popoverX('hide');
        timer.editid=requested_item;
        return true;
      }

      var item=timer.timers.get(evt.items[0]);
      var start=moment(item.start).format('HH:mm');

      $("#popover-edit").data(item);
      $("#edit-type-"+item.origData.type).trigger('click');
      $("#edit-start").val(start);
      $("#edit-popover-title").html('Edit');
      $(".edit-item-delarea").show();
      $(".edit-item-addarea").hide();
      $("#edit-duration").val(item.origData.duration)
      $('#edit-start').timepicker({
        showMeridian: false,
        showSeconds: false,
        showInputs: false,
        minuteStep: 1,
      });

      var timeline_elem=$(".item.selected > .content").parent();
      timer.popover('#popover-edit',timeline_elem)
      timer.editid=false;

    }

    // hide popover if no item selected
    //else if (evt.items.length == 0){
    //  timer.editid=false;
    //  $('#popover-edit').popoverX('hide');
    //} 

  },

  // placeholder for edititem
  editid: false,


  /**
   * edit item: change type
   * gets called when user changes type in edit popover
   *
   * @type event-callback
   * @returns {boolean}      allways true
   */
  edit_change_type: function(evt){

    var item=$("#popover-edit").data();
    if ($(this).hasClass("duration")){
      $(".edit-row-duration").show();
    }
    else {
      $(".edit-row-duration").hide();
    }

    if (timer.edit_new_item) return true;

    // TODO: better type detection
    var type=this.className.split(' ')[3]
    if (type==item.origData.type) return true;

    item.origData.type=type;
    item.className=type;
    //item.end=null;
    item.type='box';

    if (item.origData.type=='duration'){
      var duration_val=$('#edit-duration').val();
      if (isNaN(duration_val) || !duration_val){
        duration_val=300;
      }
      var d_end=moment(item.start).add( parseInt(duration_val) , 'seconds');
      item.end=d_end;
      item.type='range';
      item.origData.duration=duration_val;
      $("#edit-duration").val(duration_val);
    }

    timer.timers.update(item);
    timer.update_group_background(item.group);
    timer.timeline.setSelection(item.id);
    timer.popover_recalc("#popover-edit", $(".item.selected > .content").parent() );
    
    timer.api.save(item)

    return true;
  },


  /**
   * edit item: change form value
   * gets called for every formupdate
   *
   * @type event-callback
   * @returns {boolean}      allways true
   */
  edit_change_form: function(evt){
    // only on edit
    if (timer.edit_new_item) return true;
    // discard first 2 events 
    timer.edit_change_count++;
    if (timer.edit_change_count<3) return;

    var formid=evt.delegateTarget.id;
    var item=$("#popover-edit").data();

    if (formid=="edit-duration"){
      var end = moment(item.start).add( parseInt($(this).val()) , 'seconds').format('HH:mm');
      item.end = timer.today + " " + end;
      item.origData.duration = $("#edit-duration").val();
      timer.drag_item(item);
      return true;
    }

    else if (formid=="edit-start"){
      var dat=moment(timer.today+" "+$("#edit-start").val());
      item.origData.time = dat.format('HH:mm');
      item.start=dat;
      // only save and update bg, no move, uncomment for move
      //timer.drag_item(item);
      //return true;
      timer.timers.update(item);
      timer.update_group_background(item.group);
      timer.api.save(item);
      return true;
    }
    return true;
  },

  //placeholder for edit count
  edit_change_count: 0,


  /**
   * delete item
   * gets called if user clicks delete button on edit popover
   * 
   * @type event-callback
   * @returns none
   */
  delete_item: function(){
    var item=$("#popover-edit").data();
    timer.timers.remove(item);
    $("#popover-edit").data(false);
    timer.popover_hide("#popover-edit");
    timer.update_group_background(item.group);
    timer.api.delete(item);
  },


  /**
   * open new item popover
   * gets called if user doublecklicks in timeline (no item selected)
   *
   * @type event-callback
   * @returns {boolean}       allways false
   */
  new_item: function(evt){
    var start=moment(evt.start).format('HH:mm');
    timer.edit_new_item=true;
    $("#edit-popover-title").html('New Item');
    $(".edit-item-delarea").hide();
    $(".edit-item-addarea").show();
    timer.popover("#popover-edit");
    $("#edit-type-on").trigger('click');
    $("#edit-duration").val('300');
    $("#edit-start").val(start)
    $("#popover-edit").data(evt);
    return false;
  },
  
  // flag for popover
  edit_new_item: false,
  

  /**
   * create new item
   * gets called if user clicks 'add new item' in new item dialog
   *
   * @type event-callback
   * @returns none;
   */
  add_new_item: function(){

    var item=$("#popover-edit").data();

    // TODO: better type detection
    var type=$(".popover-edit-type label.active").get(0).className.split(' ')[3];
    
    // TODO: get id from api
    var origData={
      "id": '_new-item-'+timer.lastid,
      "device": item.group,
      "type": type,
      "time": $("#edit-start").val(),
      "duration": false
    };

    var visItem={
      content:'',
      id: '_new-item-'+ timer.lastid,
      start: timer.today + ' ' + $("#edit-start").val(),
      group: item.group,
      className: type,
      type: 'box',
      origData:origData
    }

    if (type=='duration'){
      var end=moment(timer.today+' '+origData.time).add( parseInt($("#edit-duration").val()) , 'seconds').format('HH:mm');
      visItem.end=timer.today+' '+end;
      visItem.type='range';
      origData.duration=parseInt($("#edit-duration").val());
    }

    timer.lastid++;

    timer.timers.add(visItem);
    timer.update_group_background(visItem.group);
    timer.popover_hide("#popover-edit");
    timer.timeline.setSelection(visItem.id);

    timer.api.add(visItem);

    timer.edit_new_item=false;
    $("#popover-edit").data(false);

  },

  // new item: counter for temporary new id 
  lastid:0,


  /**
   * create new popover
   * TODO: move to utils.js
   *
   * @param {string}  selector        jQuery-Selector with popover-content
   * @param {object}  target          jQuery/DOM-element to bind popover
   * @param {string}  placement       top, bottom, bottom-left etc,,
   * @param {boolean} no_positioning  do not positioning popover
   * @returns {object} jQuery-object
   */
  popover: function(selector, target, placement, no_positioning){
    var elem=$(selector);
    if (typeof target == 'undefined') {
     var target=$('#popover-placement');
     var newpos={
      top: timer.clickpos.top,
      left: timer.clickpos.left - ( elem.width() / 2)
      };
    } 
    else {
      var offset=target.offset();
      var newpos={
        top: offset.top + (target.height() * 2),
        left: offset.left - ( elem.width() / 2) + ( target.width() * 0.75 ) 
      }
    } 
    if (typeof placement == 'undefined') {
      placement='bottom';
    }

    elem.popoverX({ target:target, placement:placement });
    elem.popoverX('show')
    if (typeof no_positioning != 'undefined'){
      if (no_positioning==true) return elem;
    }
    elem.offset(newpos);
    timer.popover_recalc(selector,target);
    return elem;
  },

  // placeholder for popover-positions
  _popovers: [],


  /**
   * calculate popover & target width & height. when moving, the data doesnt need to be refreshed
   *
   * @param {string} selector jQuery-Selector
   * @returns none
   */
  popover_recalc: function(selector, target){
    var elem=$(selector);
    timer._popovers[selector]=elem;
    timer._popovers[selector]._target=target;
    timer._popovers[selector]._width=elem.width();
    timer._popovers[selector]._height=elem.height();
    timer._popovers[selector]._targetwidth=target.width();
    timer._popovers[selector]._targetheight=target.height();
    timer._popovers[selector]._hidden=false;
  },


  /**
   * move popover. since the values are precalculated, its quite fast
   *
   * @param {string} selector jQuery-Selector
   * @returns none
   */
  popover_move: function(selector){

    var offset = timer._popovers[selector]._target.offset();
    if (offset.top==0) return;

    if (timer._popovers[selector]._hidden == true){
      if (offset.left > 86) {
        timer._popovers[selector].css('visibility','visible');
        timer._popovers[selector]._hidden = false;
      }
      else return;
    }
    var newpos={
      top: offset.top + (timer._popovers[selector]._targetheight * 2),
      left: offset.left - ( timer._popovers[selector]._width / 2) + ( timer._popovers[selector]._targetwidth * 0.75 ) 
    }
    timer._popovers[selector].offset(newpos);
    if (offset.left< 86 ) {
      timer._popovers[selector].css('visibility','hidden');
      timer._popovers[selector]._hidden=true;
    }
    return;
  },


  /**
   * hide popover and destroy calculated data
   *
   * @param {string} selector jQuery-Selector
   * @returns {object}  jQuery-object
   */
  popover_hide: function(selector){
    timer._popovers[selector]=false;
    return $(selector).popoverX('hide');
  },


  /**
   * popover-move-ratelimit 
   * speed-optimised, can be called when popup is closed whith time impact
   * rate=action triggered only every n millisecounds
   *
   * @returns {boolean}       allways true
   */
  move_open_popover: function(){
    var rate=20;
    if (timer.move_open_popover_timeout==false){
      timer.move_open_popover_timeout=setTimeout(timer.move_open_popover_cb,rate);
      timer.move_open_popover_action()
    }
    return true;
  },

  // placeholder fot popover-move-ratelimit-timeout
  move_open_popover_timeout: false,


  /**
   * popover-move-ratelimit: clear limit
   *
   * @type timeout-function
   * @returns none
   */
  move_open_popover_cb: function(){
    clearTimeout(timer.move_open_popover_timeout);
    timer.move_open_popover_timeout=false;
  },


  /**
   * popover-move-ratelimit: really move popup
   *
   * @returns {boolean}       allways true
   */ 
  move_open_popover_action: function(){
    if ( $("#popover-edit").is(":visible") && timer.edit_new_item==false ) {
      timer.popover_move("#popover-edit");
    }
    return true;
  },



  /**
   * store touch/cklick-position, gets triggered on every elem on document
   * ? TODO: move to utils.js
   *
   * @type event-callback
   * @param {Event} event   the triggered event
   * @returns none
   */
  update_clickpos: function(evt){
    // is click
    if (evt.pageX && evt.pageX){
      timer.clickpos={ top: evt.pageY, left: evt.pageX };
    } 
    // is touch or tap
    else {
      if (typeof evt.originalEvent == 'undefined') return;
      if (typeof evt.originalEvent.gesture.touches[0] == 'undefined') return;
      var touch=evt.originalEvent.gesture.touches[0];
      timer.clickpos={ top: touch.pageY, left: touch.pageX };
    }
    return;
  },

  // placeholder for click-position
  clickpos: {},


}; 


/**
 * start timer app after document is ready
 * TODO: move to requirejs main app file
 **/
$(document).ready(function () {
    timer.init();
});
// EOF