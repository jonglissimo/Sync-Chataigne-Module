var sequenceStates = [];
var resyncTrigger = local.parameters.resyncAllSequences;


function init() {
	script.setUpdateRate(15);
	initSequenceState();
}

function update(deltaTime) {
	updateSequenceState(deltaTime);
}

function moduleParameterChanged(param){    
	if (param.is(resyncTrigger)) {
		resync();
	}
}

function initSequenceState() {
	sequenceStates = [];
	var items = root.sequences.getItems();

	for (var i = 0; i < items.length; i++) {
		var seq = items[i];

		var state = {
			"name": seq.name,
			"isPlaying": seq.isPlaying.get(),
			"time": seq.currentTime.get()
		};

		sequenceStates.push(state);
	}
}

function updateSequenceState(deltaTime) {
	var items = root.sequences.getItems();

	for (var i = 0; i < items.length; i++) {
		var seq = items[i];
		updatePlayState(seq.name, seq.isPlaying.get(), seq.currentTime.get(), deltaTime);
	}

	initSequenceState();
}

function updatePlayState(sequenceName, isPlaying, currentTime, deltaTime) {
	var last = getLastState(sequenceName);

	if (isPlaying && !last.isPlaying) {
		sendSequenceTime(sequenceName, currentTime);
		sendSequencePlay(sequenceName);
	} else if (!isPlaying && last.isPlaying) {
		sendSequenceTime(sequenceName, currentTime);
		sendSequencePause(sequenceName);
	} else { // try to detect seek
		var expectedTime = (isPlaying) ? last.time + deltaTime : last.time;
		var delta = currentTime - expectedTime;

		if (delta > 0.1 || delta < -0.1) { 
			sendSequenceTime(sequenceName, currentTime);
		}
	}
}

function resync() {
	var items = root.sequences.getItems();

	for (var i = 0; i < items.length; i++) {
		var seq = items[i];
		
		sendSequenceTime(seq.name, seq.currentTime.get());

		if (seq.isPlaying.get()) {
			sendSequencePlay(seq.name);
		} else {
			sendSequencePause(seq.name);
		}
	}

	initSequenceState();
}


//////////////////////////////////////////////////////
// OSC methods
//////////////////////////////////////////////////////

function sendSequenceTime(sequenceName, time) {
	var address = "/sequences/" + sequenceName + "/currentTime";
	local.send(address, time);
}

function sendSequencePlay(sequenceName) {
	var address = "/sequences/" + sequenceName + "/play";
	local.send(address);	
}

function sendSequencePause(sequenceName) {
	var address = "/sequences/" + sequenceName + "/pause";
	local.send(address);	
}


//////////////////////////////////////////////////////
// Helpers
//////////////////////////////////////////////////////

function getLastState(sequenceName) {
	for (var i = 0; i < sequenceStates.length; i++) {
		var cur = sequenceStates[i];
		if (cur.name == sequenceName) return cur;
	}
	
	return null;
}