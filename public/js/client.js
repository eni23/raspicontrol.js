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
var scheudler = {

  
  self: this,

  // placeholders
  devices: [],
  scheudles: [],
  editid: false,
  timeline: false,
  visGroups: [],
  visItems: [],



  init: function(){
    this.render(demodata);
    this.init_timeline();
    this.update_timeline_background();
  },

  // init visjs timeline
  init_timeline: function(){
    this.visGroups = new vis.DataSet(this.devices);
    this.visItems = new vis.DataSet(this.scheudles);
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
        /*select: select_item*/
        onMoving: scheudler.update_timeline_background
    };
    this.timeline = new vis.Timeline(container);
    this.timeline.setOptions(options);
    this.timeline.setGroups(this.visGroups);
    this.timeline.setItems(this.visItems);
    this.timeline.on('select',this.edit_item);
    //this.timeline.on('rangechange',scheudler.update_timeline_background)
    //setTimeout(scheudler.testcb,1500)
  },


  // render data from api
  render: function(data){

    // groups (aka devices)
    for(var k in data.devices) {
      var item=data.devices[k];
      var visItem={
        id: item.id,
        className: 'group_'+item.id,
        content: '<div class="timetable-device"><div class="icon"><span class="glyphicon glyphicon-'+item.icon+'" aria-hidden="true"></span></div><div class="devicename">'+item.name+'</div></div>'
      };
      //style stuff
      var darker=modcolor(item.color,-25);
      $("<style>").prop("type", "text/css").html('.vis.timeline .group_'+item.id+' .item { background-color:'+item.color+'; } .vis.timeline .group_'+item.id+' .item.selected  { background-color:'+darker+'; }').appendTo('head');
      this.devices.push(visItem);
    }
    // scheudles
    for(var k in data.scheudles) {
      var item=data.scheudles[k];
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
      this.scheudles.push(visItem);
    }

  },

  //
  visTimesort: function(a,b){
    return new Date(a.start).getTime() - new Date(b.start).getTime();
  },


  update_counter: 0,
  update_timeline_background: function(items){
    
    // if triggered by callback, update item fires
    // TODO: seperate function for dragging
    if (typeof items=='object'){
      scheudler.visItems.update(items)
    };

    // loop over all groups
    var bgarr=[];
    scheudler.visGroups.get().forEach(function(group){

      // order items by date
      var items = scheudler.visItems.get({
        filter: function (item) {
          return item.group == group.id;
        }
      });

      var sorted=items.sort(scheudler.visTimesort)
      var groupstr='group_'+group.id;
      
      // loop over all items and determine status of port aka timeline visualisation
      var is_on=false;
      
      for (k in sorted){
        var item=sorted[k];
        var last=bgarr[bgarr.length-1];
        if (item.type=='background') continue;
        if (item.origData.type=='on'){
          is_on=true;
          var add={
            id:  groupstr+item.id,
            start: item.start,
            type: 'background',
            group: group.id
          }
          bgarr.push(add);
        }
        
        else if (item.origData.type=='off'){
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
            var add={
              id:  groupstr+item.id,
              start: item.start,
              type: 'background',
              group: group.id
            }
            bgarr.push(add);
          }
        }


      }
    });

    scheudler.visItems.update(bgarr);
    return true;

  },


  // gets called if user doubleclicks on a new
  // TODO: replace scheudler. with self.
  // TODO: better popover placement
  edit_item: function(evt){
  
    if (evt.items.length == 1 ){
      var requested_item=scheudler.visItems.get(evt.items[0]);

      // open on secound click
      if (scheudler.editid===false){
        scheudler.editid=requested_item;
        return true;
      }

      // click on a different item
      if (scheudler.editid.id != requested_item.id ){
        $('#popover2').popoverX('hide');
        scheudler.editid=requested_item;
        return true;
      }

      var edititem=$(".item.selected > .content").eq(0);
      $('#popover2').popoverX({ target:edititem,placement:'bottom bottom-left' });
      var offset=edititem.offset(),
          top=edititem.height()+offset.top+15,
          left=offset.left -( $('#popover2').width() *0.45),
          newo={top:top,left:left};
      $('#popover2').popoverX('show').offset(newo);
      
      // todo: edit dialog
      $('div.popover-content').html('<pre>'+JSON.stringify(scheudler.editid.origData,false,2)+'</pre>');

      //scheudler.editid=false;
    }
    // hide popover if no item selected
    else if (evt.items.length == 0){
      scheudler.editid=false;
      $('#popover2').popoverX('hide');
    } 
  },


  // gets called if user tries to add new entry
  new_item: function(){

  }


}




$(document).ready(function () {
    scheudler.init();
    //$('.main-tooltip').popoverClosable({ html: true });
});
