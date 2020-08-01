var ssiframe = document.getElementById('ssembed').contentWindow;
var midiin = document.getElementById("midiin");
var midiout = document.getElementById("midiout");
var midiinputs = {};
var midioutputs = {};

function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}
// unique logging ID for this session/window
var uuid = uuidv4();
console.log('my uuid: '+uuid);

function format(log) {
  log.level = log.level.label;
  log.windowid = uuid;
  return log;
}
// enable remote logging
remote.apply(log, {
  format: format,
  url: "/3/loglevel/strap",
  // TODO fix me ?? what does this do?? how does it relate with the uuid
  token: "1EpP1BXoLQmscEvA4lM01M7pwxBF-jbX"
});

// log info and above
log.setLevel("info");

function load() {
  // console.log("load event detected!");
  navigator.requestMIDIAccess()
  .then(function(access) {
     // Get lists of available MIDI controllers
     const inputs = access.inputs.values();
     for (let input of inputs) {
       // console.log('MIDI input:', input);
       var option = document.createElement("option");
       option.text = input.name;
       option.setAttribute('value', input.id);
       midiin.add(option);
       midiinputs[input.id] = input;
     }

    const outputs = access.outputs.values();
      for (let output of outputs) {
        // console.log('MIDI output:', output);
       var option = document.createElement("option");
       option.text = output.name;
       option.setAttribute('value', output.id);
       midiout.add(option);
       midioutputs[output.id] = output;
     }
  });
}

window.onload = load;
//Handle inbound messages
var callbacks = [];
window.addEventListener('message', function(event){
  var message = JSON.parse(event.data);
  for (var i=0; i<callbacks.length; i++) {
    var callback = callbacks[i];
    if (callback.method == message.method) {
      callback.callback(message.arg);
      callbacks.splice(i, 1);
      i--;
    }
  }

document.onkeydown = keyDown;
  function keyDown(e) {
    var event = window.event ? window.event : e;
      if (event.keyCode == '32' && message.method =='ssPlay') {
        log.info('Space bar has been pressed to play');
      }

      if (event.keyCode == '32' && message.method =='ssPause') {
        log.info('Space bar has been pressed to pause');
      }

      if (event.keyCode == '37' && message.method =='ssSeek') {
        log.info('Left arrow has been pressed to rewind to ' + message.arg + ' seconds.');
      }
      if (event.keyCode == '39' && message.method =='ssSeek') {
        log.info('Right arrow has been pressed to fast forward to ' + message.arg + ' seconds.');
      }
  }

      if (message.method == 'ssLoopChange') {
        log.info('Loop has changed to ' + message.arg);
      }

      if (message.method == 'ssSpeed') {
        log.info('Speed is ' + (message.arg * 100) + ' percent.');
      }
  });

function withCurrentTime(callback) {
    callbacks.push({method:"ssCurrentTime", callback: callback});
    ssiframe.postMessage('{"method": "getCurrentTime"}', 'https://www.soundslice.com');
  }

function handleMIDIIN() {
  var midiid = midiin.options[midiin.selectedIndex].value;
  if ( ! midiid ) {
    alert('Please select MIDI input');
    return;
    }
  // console.log('use MIDI input '+midiid);
  midiinputs[midiid].onmidimessage = handleMidiMessage;
  }

function handleMIDIOUT() {
  var midiid = midiout.options[midiout.selectedIndex].value;
  if ( ! midiid ) {
    alert('Please select MIDI output');
    return;
  }
  // console.log('use MIDI input '+midiid);
  midioutputs[midiid].onmidimessage = handleMidiMessage;
}

//Front threshold
function handleLow() {
  var midiid = midiout.options[midiout.selectedIndex].value;
  if ( ! midiid ) {
    alert('Please select MIDI output');
    return;
  }
  lowMIDI( midiid );
  log.info('Front threshold decremented');
  var value = parseFloat(document.getElementById('fThreshold').value, 10);
  value = isNaN(value) ? 0 : value;
  value -= 0.01;
  document.getElementById('fThreshold').value = value.toPrecision(2);
}
function lowMIDI( portID ) {
  var noteOnMessage = [0xB0, 09, 0x00];
  var output = midioutputs[portID];
  output.send( noteOnMessage );
}

function handleMedium() {
  var midiid = midiout.options[midiout.selectedIndex].value;
  if ( ! midiid ) {
    alert('Please select MIDI output');
    return;
  }
  mediumMIDI( midiid );
  log.info('Front threshold reset');
  document.getElementById("fThreshold").value = "0.23";
}

function mediumMIDI( portID ) {
  var noteOnMessage = [0xB0, 10, 0x00];
  var output = midioutputs[portID];
  output.send( noteOnMessage );
}

function handleHigh() {
  var midiid = midiout.options[midiout.selectedIndex].value;
  if ( ! midiid ) {
    alert('Please select MIDI output');
    return;
  }
  highMIDI( midiid );
  log.info('Front threshold incremented');
  var value = parseFloat(document.getElementById('fThreshold').value, 10);
  value = isNaN(value) ? 0 : value;
  value += 0.01;
  document.getElementById('fThreshold').value = value.toPrecision(2);
}

function highMIDI( portID ) {
  var noteOnMessage = [0xB0, 11, 0x00];
  var output = midioutputs[portID];
  output.send( noteOnMessage );
}


//Back threshold
function handleLowB() {
  var midiid = midiout.options[midiout.selectedIndex].value;
  if ( ! midiid ) {
    alert('Please select MIDI output');
    return;
  }
  lowMIDIB( midiid );
    log.info('Back threshold decremented');
    var value = parseFloat(document.getElementById('bThreshold').value, 10);
    value = isNaN(value) ? 0 : value;
    value -= 0.01;
    document.getElementById('bThreshold').value = value.toPrecision(2);
}
function lowMIDIB( portID ) {
  var noteOnMessage = [0xB0, 12, 0x00];
  var output = midioutputs[portID];
  output.send( noteOnMessage );
}

function handleMediumB() {
  var midiid = midiout.options[midiout.selectedIndex].value;
  if ( ! midiid ) {
    alert('Please select MIDI output');
    return;
  }
  mediumMIDIB( midiid );
  log.info('Back threshold reset');
  document.getElementById("bThreshold").value = "0.26";
}

function mediumMIDIB( portID ) {
  var noteOnMessage = [0xB0, 13, 0x00];
  var output = midioutputs[portID];
  output.send( noteOnMessage );
}

function handleHighB() {
  var midiid = midiout.options[midiout.selectedIndex].value;
  if ( ! midiid ) {
    alert('Please select MIDI output');
    return;
  }
  highMIDIB( midiid );
  log.info('Back threshold incremented');
  var value = parseFloat(document.getElementById('bThreshold').value, 10);
  value = isNaN(value) ? 0 : value;
  value += 0.01;
  document.getElementById('bThreshold').value = value.toPrecision(2);
}

function highMIDIB( portID ) {
  var noteOnMessage = [0xB0, 14, 0x00];
  var output = midioutputs[portID];
  output.send( noteOnMessage );
}

function participantID() {
  var participantID = document.getElementById("participant").value;
  if ( ! participantID ) {
    alert('Please enter your name');
    return;
  }
  log.info('Participant: '+participantID);
}

//Parse basic information out of a MIDI message.
function parseMidiMessage(message) {
  return {
    command: message.data[0] >> 4,
    channel: message.data[0] & 0xf,
    note: message.data[1],
    velocity: message.data[2] / 127
  }
}

function handleMidiMessage(message) {
  // Parse the MIDIMessageEvent.
  const {command, channel, note, velocity} = parseMidiMessage(message)
  // console.log('midi message', message);
  if (command === 11) {

    if (note === 0){
      handlePlay();
    }

    if (note === 1) {
      handlePause();
    }

    if (note === 2) {
      handleLoop();
    }

    if (note === 3) {
      // handleForward();
      // handleRewind();
    }

    if (note === 4) {
      // handleRewind();
      handleForward();
    }

    if (note === 5) {
      // handleSpeed100();
      // handleRestart();
      handleRewind();

    }

    if (note === 6) {
      clearLoop();
    }

    if (note === 7) {
      // handleSpeed50();
    }

    if (note === 8) {
      // handleSpeed25();
    }
  }
}

function handlePlay() {
  log.info('Play event triggered by strap');
  ssiframe.postMessage('{"method": "play"}', 'https://www.soundslice.com');
}

function handlePause() {
  log.info('Pause event triggered by strap');
  ssiframe.postMessage('{"method": "pause"}', 'https://www.soundslice.com');
}

function handleLoop() {
    withCurrentTime(function(currentTime) {
        log.info('Loop event triggered by strap');
        ssiframe.postMessage(JSON.stringify({"method": "setLoop", "arg": [currentTime, 74]}), 'https://www.soundslice.com');
      })
}

function clearLoop(){
  ssiframe.postMessage('{"method": "clearLoop"}', 'https://www.soundslice.com');
  log.info('Loop cancel by strap');
}

function handleForward() {
    withCurrentTime(function(currentTime) {
      log.info('Seek to fast forward event triggered by strap');
      ssiframe.postMessage(JSON.stringify({"method": "seek", "arg": currentTime + 1}), 'https://www.soundslice.com');
    })
}

function handleRewind() {
    withCurrentTime(function(currentTime) {
      log.info('Seek to rewind event triggered by strap');
      ssiframe.postMessage(JSON.stringify({"method": "seek", "arg": currentTime - 1}), 'https://www.soundslice.com');
    })
}

function handleRestart() {
  ssiframe.postMessage(JSON.stringify({"method": "seek", "arg": 0.0}), 'https://www.soundslice.com');
}

function handleSpeed100() {
  log.info('Speed set to 100 by strap');
  ssiframe.postMessage('{"method": "setSpeed", "arg": 1}', 'https://www.soundslice.com');
}

function handleSpeed75() {
  log.info('Speed set to 75 by strap');
  ssiframe.postMessage('{"method": "setSpeed", "arg": 0.75}', 'https://www.soundslice.com');
}

function handleSpeed50() {
  log.info('Speed set to 50 by strap');
  ssiframe.postMessage('{"method": "setSpeed", "arg": 0.5}', 'https://www.soundslice.com');
}

function handleSpeed25() {
  log.info('Speed set to 25 by strap');
  ssiframe.postMessage('{"method": "setSpeed", "arg": 0.25}', 'https://www.soundslice.com');
}
