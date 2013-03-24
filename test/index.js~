
var Monitor = require('../lib/monitor');


// monitor should emit up
var ping = new Monitor({website: 'http://www.rflab.co.za', timeout: 0.2});

ping.on('up', function (res) {
    console.log(res.website + ' is up');
    ping.stop();
});

ping.on('down', function (res) {
    console.log(res.website + ' is down');
    ping.stop();
});

ping.on('error', function (res) {
    console.log('Oh Shit!! An unexpected error occured trying to load ' + res.website + '!');
    ping2.stop();
});


// website does now exist, monitor should emit down
var ping2 = new Monitor({website: 'http://www.rflabb.co.za', timeout: 0.2});

ping2.on('up', function (res) {
    console.log(res.website + ' is up');
    ping2.stop();
});

ping2.on('down', function (res) {
    console.log(res.website + ' is down');
    ping2.stop();
});

ping2.on('error', function (res) {
    console.log('Oh Shit!! An unexpected error occured trying to load ' + res.website + '!');
    ping2.stop();
});

