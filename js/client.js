// initialize everything on document ready
$(function() {

  var socket = io.connect('http://localhost');

  socket.on('initialize', function (pattern) {
    // for each track in the patter
    for(track = 0; track < pattern.tracks.length; track++) {
      var steps = pattern.tracks[track].steps;
      for(step = 0; step < steps.length; step++) {
        var selector = "#" + pattern.tracks[track].name + "-" + pattern.tracks[track].id + " #step-" + step;
        if(steps[step] > 0) {
          $(selector).addClass("selected");
        } else {
          $(selector).removeClass("selected"); 
        }
      }
    }
  });

  socket.on('group-step-update', function (data) {
    var selector = "#" + data.trackName + "-" + data.trackID + " #step-" + data.step;

    if(data.state == 1) {
      $(selector).addClass("selected");
    } else {
      $(selector).removeClass("selected");
    };
  });

  $(".box").click(function(data, fn) {
    var id = $(this).attr("id").split("-")[1],
        trackName = $(this).parent(".track").attr("id").split("-")[0],
        trackID = $(this).parent(".track").attr("id").split("-")[1];

    // switch state
    $(this).toggleClass("selected");

    if( $(this).hasClass("selected") ) {
      socket.emit('client-step-update', { trackName: trackName, trackID: trackID, step: id, state: 1 });
    } else {
      socket.emit('client-step-update', { trackName: trackName, trackID: trackID, step: id, state: 0 });
    }
  });  
});

