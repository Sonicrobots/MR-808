/* global io $ console setTimeout */

// initialize everything on document ready
$(function() {
  function setupSocks() {
    var readSocket, writeSocket;

    // **************************************** //
    // Socket objects for namespaces
    // **************************************** //
    readSocket = io.connect('/read-socket');
    writeSocket = io.connect('/write-socket');

    // click handlers for machine instrument images
    $(".machine img").click(function() {
      $(".track").css("display","none");
      $("#" + $(this).attr("data-track-id")).show();
      $(".machine img").removeClass("track-selected");
      $(this).addClass("track-selected");
      $(".left-function-box").text($(this).attr("id"));
    });

    // **************************************** //
    // Read Socket
    // **************************************** //
    readSocket.on('initialize', function (pattern) {
      // for each track in the pattern
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

    // respond to clock events
    readSocket.on("clock-event", function(data) {
      $(".elipse").removeClass("current-step");
      $(".elipse#" + data.step).addClass("current-step");
    });

    // respond to group updates coming from peers (also read-only socket namespace)
    readSocket.on('group-step-update', function (data) {
      var selector = "#" + data.trackName + "-" + data.trackID + " #step-" + data.step + " .step-led";

      if(data.state == 1) {
        $(selector).addClass("step-selected");
      } else {
        $(selector).removeClass("step-selected");
      };
    });

    // **************************************** //
    // Write Socket
    // **************************************** //
    $(".box").click(function(data, fn) {
      var id = $(this).attr("id").split("-")[1],
          trackName = $(this).parent(".track").attr("id").split("-")[0],
          trackID = $(this).parent(".track").attr("id").split("-")[1];

      if(writeSocket.socket.connected) {
        // switch state
        $(this).children(".step-led").toggleClass("step-selected");

        // send update of step to server
        if( $(this).children(".step-led").hasClass("step-selected") ) {
          writeSocket.emit('client-step-update', { trackName: trackName, trackID: trackID, step: id, state: 1 });
        } else {
          writeSocket.emit('client-step-update', { trackName: trackName, trackID: trackID, step: id, state: 0 });
        }
      }
    });
  };

  setupSocks();

  // on click see if the nick can be used and save it in session if so.
  // otherwise, warn the user.
  $("#submit-nick").click(function() {
    if (screenfull.enabled) {
      screenfull.request();
    }
    $("#login").hide();
    $("#main").show();
  });
});
