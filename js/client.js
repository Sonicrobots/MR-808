// initialize everything on document ready
$(function() {
  // hack alert: center login box :(
  $("#login-box").css("left",($("#main").width() / 2.0) - ($("#login-box").width() / 2.0));
  $("#login-box").css("top",($("#main").height() / 2.0) - ($("#login-box").height() / 2.0));

  // click handlers for machine instrument images
  $(".machine img").click(function() {
    $(".track").css("display","none");
    $("#" + $(this).attr("data-track-id")).show();
    $(".machine img").removeClass("track-selected");
    $(this).addClass("track-selected");
    $(".left-function-box").text($(this).attr("id"));
  });

  var readSocket = io.connect('http://localhost/read-socket'),
      writeSocket = io.connect('http://localhost/write-socket');

  readSocket.on('initialize', function (pattern) {
    // for each track in the patter
    for(var track = 0; track < pattern.tracks.length; track++) {
      var steps = pattern.tracks[track].steps;
      for(var step = 0; step < steps.length; step++) {
        var selector = "#" + pattern.tracks[track].name + "-" + pattern.tracks[track].id + " #step-" + step + " .step-led";
        if(steps[step] > 0) {
          $(selector).addClass("step-selected");
        } else {
          $(selector).removeClass("step-selected");
        }
      }
    }
  });

  readSocket.on("clock-event", function(data) {
    $(".elipse").removeClass("current-step");
    $(".elipse#" + data.step).addClass("current-step");
  });

  readSocket.on('group-step-update', function (data) {
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
      writeSocket.emit('client-step-update', { trackName: trackName, trackID: trackID, step: id, state: 1 });
    } else {
      writeSocket.emit('client-step-update', { trackName: trackName, trackID: trackID, step: id, state: 0 });
    }
  });
});
