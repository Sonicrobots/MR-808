// initialize everything on document ready
$(function() {

  var socket = io.connect('http://localhost');

  socket.on('group-step-update', function (data) {
    if(data.state == "on") {
      $("#" + data.no).addClass("selected");
    } else {
      $("#" + data.no).removeClass("selected");
    };
  });

  $(".box").click(function(data, fn) {
    var id = $(this).attr("id");

    // switch state
    $(this).toggleClass("selected");

    if( $(this).hasClass("selected") ) {
      socket.emit('client-step-update', { no: id, state: "on" });
    } else {
      socket.emit('client-step-update', { no: id, state: "off" });
    }
  });  
});

