// TODO: move to own file
// darken or lighten a color  amt- for darken and amt+ for lighten
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

// TODO: replace with moment.js
Date.prototype.yyyymmdd = function () {
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth() + 1).toString();
    var dd = this.getDate().toString();
    return yyyy + '-' + (mm[1] ? mm : '0' + mm[0]) + '-' + (dd[1] ? dd : '0' + dd[0]);
};
var d = new Date();
var today = d.yyyymmdd();
var todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);
var todayEnd = new Date();
todayEnd.setHours(24, 0, 0, 0);






// client editor 
var scheduler = {

  
  self: this,

  // placeholders
  devices: [],
  schedules: [],
  editid: false,
  timeline: false,
  visGroups: [],
  visItems: [],
  lastid: 8,


  // main entry point gets called after document.ready is triggered
  init: function(){
    this.render(demodata);
    this.init_timeline();
    this.update_background();
    

    $(document).on('click tap',this.update_clickpos);

    // edit popover change type
    $(".popover-edit-type > div > label").click(this.edit_change_type);
    $(".popover-edit input").on("change", this.edit_change_form);
    
    //$(".colorsel").on('click touch tap',function(){
    //  scheduler.popover('#popover-color',$(this))
    //});
    
    // delete item button
    $("#edit-item-delbutton").click(this.delete_item);

    // add new item button
    $("#edit-item-addbuton").click(this.add_new_item);


  },

  // init visjs timeline
  init_timeline: function(){
    this.visGroups = new vis.DataSet(this.devices);
    this.visItems = new vis.DataSet(this.schedules);
    var container = document.getElementById('visualization');
    var options = {
        /*height: 300,*/
        min: todayStart,
        max: todayEnd,
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
        onAdd: scheduler.new_item,
        onMoving: scheduler.drag_item
    };
    this.timeline = new vis.Timeline(container);
    this.timeline.setOptions(options);
    this.timeline.setGroups(this.visGroups);
    this.timeline.setItems(this.visItems);
    this.timeline.on('select',this.edit_item);
    this.timeline.on('rangechange',this.drag_timeline);

  },


  // render data from api
  render: function(data){

    // groups (aka devices)
    for(var k in data.devices) {
      var item=data.devices[k];
      var visItem={
        id: item.id,
        className: 'group_'+item.id,
        content: '<div class="timetable-device"><div class="icon"><span class="glyphicon glyphicon-'+item.icon+'" aria-hidden="true"></span></div><div class="devicename">'+item.name+'</div><div class="colorsel bg-group_'+item.id+' bg-gradient-group_'+item.id+'"></div></div>'
      };
      //style stuff
      var darker=modcolor(item.color,-25);
      $("<style>").prop("type", "text/css").html('.vis.timeline .group_'+item.id+' .item, .bg-group_'+item.id+' { background-color:'+item.color+'; } .vis.timeline .group_'+item.id+' .item.selected  { background-color:'+darker+'; } .bg-gradient-group_'+item.id+' { linear-gradient(to bottom,#fff 0,'+item.color+' 100%); }').appendTo('head');
      this.devices.push(visItem);
    }
    // schedules
    for(var k in data.schedules) {
      var item=data.schedules[k];
      var visItem={
        id:item.id,
        content:'',
        start: today + ' ' + item.time,
        group: item.device,
        className: item.type,
        type: 'box',
        origData:item
      }
      if (item.type=='duration'){
       var end=moment(today+' '+item.time).add( parseInt(item.duration) , 'seconds').format('HH:mm');
       visItem.end=today+' '+end;
       visItem.type='range';
      }
      this.schedules.push(visItem);
    }

  },

  // function for sorting visItems by time
  visTimesort: function(a,b){
    return new Date(a.start).getTime() - new Date(b.start).getTime();
  },

  // get all items of a group
  get_group_items: function(group){
    var items = scheduler.visItems.get({
            filter: function (item) {
              return item.group == group;
            }
          });
    return items;
  },

  // move popover 
  // gets called when user zooms and moves timeline, moving item
  // simple rate-limiting
  move_open_popover_timeout: false,
  move_open_popover: function(){
    var rate=20;
    if (scheduler.move_open_popover_timeout==false){
      scheduler.move_open_popover_timeout=setTimeout(scheduler.move_open_popover_cb,rate);
      scheduler.move_open_popover_action()
    }
    return true;
  },
  // gets called by drag-timeline-timeout to reset rate limiting to zero
  move_open_popover_cb: function(){
    clearTimeout(scheduler.move_open_popover_timeout);
    scheduler.move_open_popover_timeout=false;
  },
  // the real moving
  move_open_popover_action: function(){
    if ( $("#popover-edit").is(":visible") && scheduler.edit_new_item==false ) {
      scheduler.popover_move("#popover-edit");
    }
    return true;
  },

  // gets called if user zooms and drags timeline
  drag_timeline: function(){ scheduler.move_open_popover(); },

  // gets called when a user drags an item around
  drag_item: function(item){

    // if type is duration calculate secounds
    if ( item.origData.type=='duration'){
      var dur_calc=( item.end-item.start ) / 1000;
      item.origData.duration = dur_calc;
    }
    scheduler.visItems.update(item)
    scheduler.update_group_background(item.group)

    // if edit-tooltip is open, update time and move tooltip too
    if ( $("#popover-edit").is(":visible") ) {
      var newtime=moment(item.start).format('HH:mm');
      $("#edit-start").val(newtime);
      $("#popover-edit").data(item)
      // is duration
      if ( item.origData.type=='duration'){
        $("#edit-duration").val(dur_calc);
      }
      scheduler.popover_move("#popover-edit");
    }

    //scheduler.api.save(item);
    return true;
  },


  // update background of all groups
  update_background: function(){
    this.visGroups.get().forEach(function(group){
      scheduler.update_group_background(group.id);
    });
  },


  // update background of specific group
  update_group_background: function(group){

    var groupitems=this.get_group_items(group);
    var sorted=groupitems.sort(this.visTimesort);
    var background=[];
    var delitems=[];
    var groupstr='group_'+group;

    var is_on=false;
    for (k in sorted){

      var item=sorted[k];
      var last=background[background.length-1];
      var bgtemplate={
        id:  groupstr+item.id,
        type: 'background',
        group: group
      };

      if (item.type=='background'){
        delitems.push(item.id);
        continue;
      }

      if (item.origData.type=='on'){
        if (is_on) continue;
        is_on=true;
        bgtemplate.start=item.start;
        background.push(bgtemplate);
      }

      else if (item.origData.type=='off'){
        if (!is_on) continue;
        if (last.end) continue;
        is_on=false;
        last.end=item.start;
      }

      else if (item.origData.type=='toggle'){
        if (is_on){
          last.end=item.start;
          is_on=false;
        }
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

    // fill up ends
    for (k in background){
      if (!background[k].end){
        background[k].end=today+" "+"24:00";
      }
    }

    this.visItems.remove(delitems);
    this.visItems.update(background);

    return true;
  },


  // open edit popover
  // gets called if click/tap twice on existing item
  edit_item: function(evt){
  
    if (evt.items.length == 1 ){

      scheduler.edit_new_item=false;
      var requested_item=scheduler.visItems.get(evt.items[0]);
      
      // open on secound click
      if (scheduler.editid===false){
        scheduler.editid=requested_item;
        return true;
      }

      // click on a different item
      if (scheduler.editid.id != requested_item.id ){
        $('#popover-edit').popoverX('hide');
        scheduler.editid=requested_item;
        return true;
      }

      var item=scheduler.visItems.get(evt.items[0]);
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
      scheduler.popover('#popover-edit',timeline_elem)
      scheduler.editid=false;

    }

    // hide popover if no item selected
    //else if (evt.items.length == 0){
    //  scheduler.editid=false;
    //  $('#popover-edit').popoverX('hide');
    //} 

  },


  // gets called when user changes type in edit popover
  edit_change_type: function(evt){

    var item=$("#popover-edit").data();
    if ($(this).hasClass("duration")){
        $(".edit-row-duration").show();
    }
    else {
      $(".edit-row-duration").hide();
    }

    if (scheduler.edit_new_item) return true;

    // TODO: better type detection
    var type=this.className.split(' ')[3]
    if (type==item.origData.type) return true;

    item.origData.type=type;
    item.className=type;
    item.end=null;
    item.type='box';

    if (item.origData.type=='duration'){
      var duration_val=$('#edit-duration').val();
      if (isNaN(duration_val) || !duration_val){
        duration_val=300;
      }
      var end=moment(item.start).add( parseInt(duration_val) , 'seconds').format('HH:mm');
      item.end=end;
      item.type='range';
      item.origData.duration=duration_val;
      $("#edit-duration").val(duration_val);
    }

    scheduler.visItems.update(item)
    scheduler.update_group_background(item.group)

    //scheduler.api.save(item)

  },

  // gets called if user changes values in edit-popover input fields
  edit_change_count:0,
  edit_change_form: function(evt){
    // only on edit
    if (scheduler.edit_new_item) return true;
    // discard first 2 events 
    scheduler.edit_change_count++;
    if (scheduler.edit_change_count<3) return;

    var formid=evt.delegateTarget.id;
    var item=$("#popover-edit").data();

    if (formid=="edit-duration"){
      var end = moment(item.start).add( parseInt($(this).val()) , 'seconds').format('HH:mm');
      item.end = today + " " + end;
      item.origData.duration = $("#edit-duration").val();
      scheduler.drag_item(item);
      return true;
    }

    else if (formid=="edit-start"){
      var dat=moment(today+" "+$("#edit-start").val());
      item.origData.time = dat.format('HH:mm');
      item.start=dat;
      // only save and update bg, no move
      scheduler.visItems.update(item);
      scheduler.update_group_background(item.group);
      return true;
    }
    return true;
  },


  // delete item
  // gets called if user clicks delete button on edit popover
  delete_item: function(){
    var item=$("#popover-edit").data();
    scheduler.visItems.remove(item);
    $("#popover-edit").data(false);
    scheduler.popover_hide("#popover-edit");
    scheduler.update_group_background(item.group);
    //scheduler.api.delete(item)
  },



  // gets called if user tries to add new entry
  edit_new_item: false,
  new_item: function(evt){
    
    var start=moment(evt.start).format('HH:mm');

    scheduler.edit_new_item=true;
    $("#edit-popover-title").html('New Item');
    $(".edit-item-delarea").hide();
    $(".edit-item-addarea").show();
    scheduler.popover("#popover-edit");
    $("#edit-type-on").trigger('click');
    $("#edit-duration").val('300');
    $("#edit-start").val(start)
    $("#popover-edit").data(evt);

  },

  // gets called if user clicks 'add new item' in new item dialog
  add_new_item: function(){

    var item=$("#popover-edit").data();

    // TODO: better type detection
    var type=$(".popover-edit-type label.active").get(0).className.split(' ')[3];
    
    // TODO: get id from api
    var origData={
        "id": scheduler.lastid,
        "device": item.group,
        "type": type,
        "time": $("#edit-start").val(),
        "duration": false
    };

    var visItem={
      content:'',
      id: scheduler.lastid,
      start: today + ' ' + $("#edit-start").val(),
      group: item.group,
      className: type,
      type: 'box',
      origData:origData
    }

    if (type=='duration'){
     var end=moment(today+' '+origData.time).add( parseInt($("#edit-duration").val()) , 'seconds').format('HH:mm');
     visItem.end=today+' '+end;
     visItem.type='range';
     origData.duration=parseInt($("#edit-duration").val());
    }

    scheduler.lastid++;

    scheduler.visItems.add(visItem);
    scheduler.update_group_background(visItem.group);
    scheduler.popover_hide("#popover-edit");
    scheduler.timeline.setSelection(visItem.id);
    //scheduler.api.save(visItem)

    scheduler.edit_new_item=false;
    $("#popover-edit").data(false);

  },


  _popovers: [],
  popover: function(selector, target, placement, no_positioning){
    var elem=$(selector);
    if (typeof target == 'undefined') {
     var target=$('#popover-placement');
     var newpos={
      top: scheduler.clickpos.top,
      left: scheduler.clickpos.left - ( elem.width() / 2)
      }
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
    // store for faster moving
    scheduler._popovers[selector]=elem;
    scheduler._popovers[selector]._target=target;
    scheduler._popovers[selector]._width=elem.width();
    scheduler._popovers[selector]._height=elem.height();
    scheduler._popovers[selector]._targetwidth=target.width();
    scheduler._popovers[selector]._targetheight=target.height();
    return elem;
  },

  popover_move: function(selector){
    var offset = scheduler._popovers[selector]._target.offset();
    var newpos={
      top: offset.top + (scheduler._popovers[selector]._targetheight * 2),
      left: offset.left - ( scheduler._popovers[selector]._width / 2) + ( scheduler._popovers[selector]._targetwidth * 0.75 ) 
    }
    scheduler._popovers[selector].offset(newpos);
    return;
  },

  popover_hide: function(selector){
    scheduler._popovers[selector]=false;
    return $(selector).popoverX('hide');
  },



  // store touch/cklick-position, gets triggered on every elem on document
  clickpos: {},
  update_clickpos: function(evt){
    // is click
    if (evt.pageX && evt.pageX){
      scheduler.clickpos={ top: evt.pageY, left: evt.pageX };
    } 
    // is touch or tap
    else {
      if (typeof evt.originalEvent == 'undefined') return;
      if (typeof evt.originalEvent.gesture.touches[0] == 'undefined') return;
      var touch=evt.originalEvent.gesture.touches[0];
      scheduler.clickpos={ top: touch.pageY, left: touch.pageX };
    }
    return;
  }



}




$(document).ready(function () {
    scheduler.init();
});
