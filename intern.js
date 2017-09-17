var sleep = require('system-sleep');
console.log("why is this printing");

console.log(process.argv);
// var 
var phaseOneDelay = 30000;
var phaseTwoDelay = 10000;
console.log(process.argv[2]);

process.on('message', (m) => {
	console.log("MESSAGE RECEIVED");
});
if (process.argv[2] === 'phase-one') {
	sleep(phaseOneDelay);
	process.send({a: 'a'});

	process.on('message', (m) => {
		console.log("Phase one done");
	});
} else {
	var stop_condition = true;

	process.on('message', (m) => {
		console.log("Phase two done");
		stop_condition = false;
	});
	while(stop_condition) {
		sleep(phaseTwoDelay);
		process.send({a: 'b'});
	};

}

// module.exports = function(options) {
// 	console.log("test            --------------------");
// 	return {};
// };