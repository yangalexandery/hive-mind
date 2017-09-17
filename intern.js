var sleep = require('sleep');
console.log("why is this printing");

console.log(process.argv);
// var 
var phaseOneDelay = 10;
var phaseTwoDelay = 5;
console.log(process.argv[2]);

if (process.argv[2] === 'phase-one') {
	sleep.sleep(phaseOneDelay);
	process.send({a: 'a'});

	process.on('message', (m) => {
		console.log("Phase one done");
	});
} else {
	var stop_condition = true;
	while(stop_condition) {
		sleep.sleep(phaseTwoDelay);
		process.send({a: 'b'});
	};

	process.on('message', (m) => {
		console.log("Phase two done");
		stop_condition = false;
	});
}

// module.exports = function(options) {
// 	console.log("test            --------------------");
// 	return {};
// };