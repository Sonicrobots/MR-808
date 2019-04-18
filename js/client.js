/* global io $ console setTimeout */

// initialize everything on document ready
$(function() {
  var bpm = 128;

  function playStepSequence(step) {
    $('.elipse').removeClass('current-step');
    $('#step-' + step).addClass('current-step');

    var delta = (1 / (bpm/60) * 1000) / 4;

    if( step < 15 )
      setTimeout(function () { playStepSequence((step + 1) % 16) }, delta);
  }

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
      bpm = pattern.tempo;
      // for each track in the pattern
      for(var track = 0; track < pattern.tracks.length; track++) {
        var steps = pattern.tracks[track].steps;
        for(var step = 0; step < steps.length; step++) {
          var selector = "#" + pattern.tracks[track].name + "-" + pattern.tracks[track].id + " #step-" + step + " .step-led";
          if(steps[step] > 0) {
            $(selector).addClass("step-selected");
            if(pattern.tracks[track].name === 'clap') {
              disableButtons($(selector).parent(), "" + step);
            }
          } else {
            $(selector).removeClass("step-selected");
          }
        }
      }
    });

    function getNeighbors(arr, idx, num) {
      var out = [];
      arr.forEach(function(item, iidx) {
        if(iidx >= (idx - num) &&
           iidx <  (idx + num))
          out.push(item);
      });
      return out;
    }

    function anySelected($els) {
      var out = false;
      $els.forEach(function(item) {
        if($(item).children(".step-led").hasClass('step-selected'))
          out = true;
      });
      return out;
    }

    var NUM_NEIGHBORS = 3;

    function canSetStep($el, step) {
      var id = parseInt(step, 10);
      var neighbors = getNeighbors($el.siblings(), id, NUM_NEIGHBORS);
      return !anySelected(neighbors);
    }

    function resetStates($el, step) {
      $el.siblings().forEach(function(sib) {
        $(sib).removeClass('disabled');
      });

      $el.siblings().forEach(function(sib) {
        if($(sib).children('.step-led').hasClass('step-selected')) {
          var id = $(sib).attr("id").split("-")[1];
          disableButtons($(sib), id);
        }
      });
    }

    function disableButtons($el, id) {
      var neighbors = getNeighbors($el.siblings(), parseInt(id,10), NUM_NEIGHBORS);
      neighbors.forEach(function(item) {
        $(item).addClass('disabled');
      });
    }

    // respond to clock events
    readSocket.on("clock-event", function(data) {
      var step = parseInt(data.step.split("-")[1], 10);
      if( step === 0 )
        playStepSequence(step);
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
      var $el       = $(this);
      var $led      = $el.children(".step-led");
      var id        = $el.attr("id").split("-")[1];
      var trackName = $el.parent(".track").attr("id").split("-")[0];
      var trackID   = $el.parent(".track").attr("id").split("-")[1];

      if(writeSocket.connected) {
        // switch if off in any event
        if($led.hasClass("step-selected")) {
          $led.toggleClass("step-selected");

          // send update of step to server
          writeSocket.emit('client-step-update', {
            step:      id,
            trackID:   trackID,
            trackName: trackName,
            state: 0
          });

          resetStates($el, id);
        } else if(trackName != 'clap' || canSetStep($el, id)) {
          $led.toggleClass("step-selected");

          writeSocket.emit('client-step-update', {
            step:      id,
            trackID:   trackID,
            trackName: trackName,
            state:     1
          });

          if(trackName === 'clap') {
            disableButtons($el, id);
          }
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
