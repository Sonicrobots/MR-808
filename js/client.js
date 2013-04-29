/* global console */

// initialize everything on document ready
$(function() {
  // if the session already contains a nickname
  // if yes, just keep using that
  // if no, show the login box
  var nickname = $.fn.cookie("nickname");
  if(nickname == null || nickname == undefined || nickname == "") {
    // hack alert: center login box :(
    $("#login-box").css("left",($("#main").width() / 2.0) - ($("#login-box").width() / 2.0));
    $("#login-box").css("top",($("#main").height() / 2.0) - ($("#login-box").height() / 2.0));
    $("#login-box").show();
    $("#overlay").show();
  }

  // on click see if the nick can be used and save it in session if so.
  // otherwise, warn the user.
  $("#submit-nick").click(function() {
    var nick = $("#nick-name").val();
    $.ajax({
      type: "POST",
      url: "/login",
      data: "nick="+nick,
      success: function(data, textStatus, xhr) {
        $("#login-box").hide();
        $("#overlay").hide();
      },
      error: function(xhr, ajaxOptions, thrownError) {
        alert("nick already taken :(");
      }
    });
  });

  // click handlers for machine instrument images
  $(".machine img").click(function() {
    $(".track").css("display","none");
    $("#" + $(this).attr("data-track-id")).show();
    $(".machine img").removeClass("track-selected");
    $(this).addClass("track-selected");
    $(".left-function-box").text($(this).attr("id"));
  });

  // the web socket objects
  var readSocket = io.connect('http://localhost/read-socket'),
      writeSocket = io.connect('http://localhost/write-socket');

  // initialize the read-only socket and thus the pattern on the client
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
