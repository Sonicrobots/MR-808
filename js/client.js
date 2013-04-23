// initialize everything on document ready
$(function() {
  $(".machine img").click(function() {
    $(".track").css("display","none");
    $("#" + $(this).attr("data-track-id")).show();
    $(".machine img").removeClass("track-selected");
    $(this).addClass("track-selected");
    $(".left-function-box").text($(this).attr("id"));
  });

  var socket = io.connect('http://localhost');

  socket.on('initialize', function (pattern) {
    // for each track in the patter
    for(track = 0; track < pattern.tracks.length; track++) {
      var steps = pattern.tracks[track].steps;
      for(step = 0; step < steps.length; step++) {
        var selector = "#" + pattern.tracks[track].name + "-" + pattern.tracks[track].id + " #step-" + step + " .step-led";
        if(steps[step] > 0) {
          $(selector).addClass("step-selected");
        } else {
          $(selector).removeClass("step-selected");
        }
      }
    }
  });

  socket.on("clock-event", function(data) {
    $(".elipse").removeClass("current-step");
    $(".elipse#" + data.step).addClass("current-step");
  });

  socket.on('group-step-update', function (data) {
    var selector = "#" + data.trackName + "-" + data.trackID + " #step-" + data.step + " .step-led";

    if(data.state == 1) {
      $(selector).addClass("step-selected");
    } else {
      $(selector).removeClass("step-selected");
    };
  });

  $(".box").click(function(data, fn) {
    var id = $(this).attr("id").split("-")[1],
        trackName = $(this).parent(".track").attr("id").split("-")[0],
        trackID = $(this).parent(".track").attr("id").split("-")[1];

    // switch state
    $(this).children(".step-led").toggleClass("step-selected");

    if( $(this).children(".step-led").hasClass("step-selected") ) {
      socket.emit('client-step-update', { trackName: trackName, trackID: trackID, step: id, state: 1 });
    } else {
      socket.emit('client-step-update', { trackName: trackName, trackID: trackID, step: id, state: 0 });
    }
  });
});
