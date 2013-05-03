/* global io $ console setTimeout */

// initialize everything on document ready
$(function() {
    // create a new users element for our nick
  var nickname = $.fn.cookie('nickname');

  function setupSocks() {
    var userSocket, readSocket, writeSocket;

    // **************************************** //
    // Socket objects for namespaces
    // **************************************** //
    userSocket = io.connect('http://localhost:3000/users');
    readSocket = io.connect('http://localhost:3000/read-socket');
    writeSocket = io.connect('http://localhost:3000/write-socket');

    // click handlers for machine instrument images
    $(".machine img").click(function() {
      $(".track").css("display","none");
      $("#" + $(this).attr("data-track-id")).show();
      $(".machine img").removeClass("track-selected");
      $(this).addClass("track-selected");
      $(".left-function-box").text($(this).attr("id"));
    });

    // **************************************** //
    // User Socket
    // **************************************** //
    userSocket.on('initialize', function(users) {
      for(var user in users) {
        var userData = users[user];
        console.log(userData);
        $("#users").append("<div id='" + userData.nick +"' style='background-color: " + userData.color + ";' class='user'>" + userData.nick + "</div>");
      }
    });

    userSocket.on('connected', function(user) {
      $("#users").append("<div id='" + user.nick +"' style='background-color: " + user.color + ";' class='user'>" + user.nick + "</div>");
    });

    userSocket.on('disconnected', function(user) {
      $("#" + user.nick).remove();
    });

    userSocket.on('error', function(err){
      $.fn.cookie("nickname","");

      // disconnect: ITS WEIRD, I KNOW
      io.sockets["http://localhost:3000"].disconnect();
      delete io.sockets["http://localhost:3000"];
      io.j =[];

      // hack alert: center login box :(
      $("#login-box").css("left",($("#main").width() / 2.0) - ($("#login-box").width() / 2.0));
      $("#login-box").css("top",($("#main").height() / 2.0) - ($("#login-box").height() / 2.0));
      $("#login-box").show();
      $("#overlay").show();
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

      console.log("update from: " + data.user.nick + " with color: " + data.user.color);

      // animate users token thingy
      var oldWidth = $("#" + data.user.nick).width(),
          oldHeight = $("#" + data.user.nick).height();

      $("#" + data.user.nick).css("box-shadow", "0 0 10px 10px " + data.user.color);
      $("#" + data.user.nick).css("width", (oldWidth + 10) + "px");
      setTimeout(function() {
        $("#" + data.user.nick).css("box-shadow", "");
        $("#" + data.user.nick).css("width", oldWidth + "px");
      },300);

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
  }

  // if the session already contains a nickname
  // if yes, just keep using that
  // if no, show the login box
  if(nickname == null || nickname == undefined || nickname == "") {
    // hack alert: center login box :(
    $("#login-box").css("left",($("#main").width() / 2.0) - ($("#login-box").width() / 2.0));
    $("#login-box").css("top",($("#main").height() / 2.0) - ($("#login-box").height() / 2.0));
    $("#login-box").show();
    $("#overlay").show();
  } else {
    setupSocks();
  }

  // on click see if the nick can be used and save it in session if so.
  // otherwise, warn the user.
  $("#submit-nick").click(function() {
    var nick = $("#nick-name").val();
    $.ajax({
      type: "POST",
      url: "http://localhost:3000/login",
      data: "nick="+nick,
      success: function(data, textStatus, xhr) {
        setupSocks();
        $("#login-box").hide();
        $("#overlay").hide();
      },
      error: function(xhr, ajaxOptions, thrownError) {
        alert("nick already taken :(");
      }
    });
  });
});
