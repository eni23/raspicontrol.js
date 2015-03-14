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



  init: function(){
    this.render(demodata);
    this.init_timeline();
    this.update_background();
    

    $(document).on('click touch tap',this.update_clickpos);

    // edit popover change type
    $(".popover-edit-type > div > label").click(this.edit_change_type);
    $(".popover-edit input").on("input", this.edit_change_form);
    $(".colorsel").on('click touch tap',function(){
      scheduler.popover('#popover-color',$(this))
    });
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
        /*onAdd: addItem,*/
        onMoving: scheduler.drag_item
    };
    this.timeline = new vis.Timeline(container);
    this.timeline.setOptions(options);
    this.timeline.setGroups(this.visGroups);
    this.timeline.setItems(this.visItems);
    this.timeline.on('select',this.edit_item);
    //this.timeline.on('rangechange',scheduler.update_timeline_background)
    //setTimeout(scheduler.testcb,1500)
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
        /*content:item.name,*/
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

  //
  visTimesort: function(a,b){
    return new Date(a.start).getTime() - new Date(b.start).getTime();
  },

  get_group_items: function(group){
    var items = scheduler.visItems.get({
            filter: function (item) {
              return item.group == group;
            }
          });
    return items;
  },


  drag_item: function(item){
    scheduler.visItems.update(item)
    scheduler.update_group_background(item.group)
    //scheduler.api.save(item);
  },

  update_background: function(){
    this.visGroups.get().forEach(function(group){
      scheduler.update_group_background(group.id);
    });
  },

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

    last=background[background.length-1];
    if (!last.end){
      last.end=today+" "+"24:00";
    }
    this.visItems.remove(delitems);
    this.visItems.update(background);
    return true;
  },



  // gets called if user doubleclicks on a new
  // TODO: better popover placement
  edit_item: function(evt){
  
    if (evt.items.length == 1 ){
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
      $
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
    else if (evt.items.length == 0){
      scheduler.editid=false;
      $('#popover-edit').popoverX('hide');
    } 
  },


  edit_change_type: function(evt){


    var item=$("#popover-edit").data();
    if ($(this).hasClass("duration")){
        $(".edit-row-duration").show();
    }
    else {
      $(".edit-row-duration").hide();
    }

  },

  edit_change_form: function(evt){
    var item=$("#popover-edit").data();
    if ( $(this).hasClass('item-form-duration') ){
      var end=moment(item.start).add( parseInt($(this).val()) , 'seconds').format('HH:mm');
      item.end=today+" "+end;
      //scheduler.visItems.update(item);
      scheduler.drag_item(item);
    }
  },



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
    return elem;
  },

  // gets called if user tries to add new entry
  new_item: function(){

  },


  clickpos: {},
  update_clickpos: function(evt){
    scheduler.clickpos={ top: evt.pageY, left: evt.pageX };
  }


}




$(document).ready(function () {
    scheduler.init();
    //$('.main-tooltip').popoverClosable({ html: true });
});
