
var Monitor = require('../lib/monitor');


// website has a redirect, should emit down and show status message
var ping = new Monitor({website: 'http://www.rflab.co.za', timeout: 0.2});

ping.on('up', function (res) {
    console.log(res.website + " is up \n");
    ping.stop();
});

ping.on('down', function (res) {
    console.log(res.statusMessage + "\n");
    ping.stop();
});

ping.on('error', function (res) {
    console.log('Oh Shit!! An unexpected error occured trying to load ' + res.website + "! \n");
    ping2.stop();
});

ping.on('stop', function (website) {
    console.log(website + " monitor has stopped. \n");
});





// website does now exist, monitor should emit down
var ping2 = new Monitor({website: 'http://www.rflabb.co.za', timeout: 0.2});

ping2.on('up', function (res) {
    console.log(res.website + " is up \n");
    ping2.stop();
});

ping2.on('down', function (res) {
    console.log(res.statusMessage + "\n");
    ping2.stop();
});

ping2.on('error', function (res) {
    console.log('Oh Shit!! An unexpected error occured trying to load ' + res.website + "! \n");
    ping2.stop();
});

ping2.on('stop', function (website) {
    console.log(website + " monitor has stopped. \n");
});





// monitor should emit up
var ping3 = new Monitor({website: 'http://www.ragingflame.co.za', timeout: 0.2});

ping3.on('up', function (res) {
    console.log(res.website + " is up \n");
    ping3.stop();
});

ping3.on('down', function (res) {
    console.log(res.statusMessage + "\n");
    ping3.stop();
});

ping3.on('error', function (res) {
    console.log('Oh Snap!! An unexpected error occured trying to load ' + res.website + "! \n");
    ping3.stop();
});

ping3.on('stop', function (website) {
    console.log(website + " monitor has stopped. \n");
});

