$(function() {
  var sock = io.connect('/controls');

  sock.on('transport',function(data) {
    var state = parseInt(data.state, 10);
    if( state === 0 ) {
      $('#resetter').first().attr('data-toggle-state', 0);
      $('#resetter').first().removeClass('stop');
      $('#resetter').first().addClass('start');
    } else if( state === 1 ) {
      $('#resetter').first().attr('data-toggle-state', 1);
      $('#resetter').first().removeClass('start');
      $('#resetter').first().addClass('stop');
    }
  });

  $('#resetter').bind('click',function() {
    var state = parseInt($(this).attr('data-toggle-state'), 10);
    if( state === 0 ) {
      $(this).attr('data-toggle-state', 1);
      $(this).removeClass('start');
      $(this).addClass('stop');
    } else if( state === 1 ) {
      $(this).attr('data-toggle-state', 0);
      $(this).removeClass('stop');
      $(this).addClass('start');
    }
    sock.emit('transport', { state: $(this).attr('data-toggle-state') });
  });
});