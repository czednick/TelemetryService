'use strict';

// IPV4 or IPV6
var socketType = process.env.TS_SOCKET_TYPE || 'udp4'; // udp4 or udp6

// Port for clients server
var clientsServerPort = process.env.TS_CLIENTS_SERVER_PORT || 12346;

// Address for clients server
var clientsServerAddress = process.env.TS_CLIENTS_SERVER_ADDRESS || 'localhost';

// Port for client server (default to OS assigned port)
var clientServerPort = process.env.TS_CLIENT_SERVER_PORT || null;

// Address for client server
var clientServerAddress = process.env.TS_CLIENT_SERVER_ADDRESS || 'localhost';

// How frequently to send data to server
var heartbeatRate = process.env.TS_HEARTBEAT_RATE || 1000 * 10;


var dgram = require('dgram');

var moment = require('moment');
var sprintf = require('sprintf').sprintf;

var message = require('./message');

var clientServer = dgram.createSocket(socketType);
var messageCount = 0;

function getKey(key) {

    // TODO add ability to exchange HMAC keys via HTTPS and register them
    
    return 'test';
}


function sendHeartbeat(address) {

    console.log('Sending heartbeat...');


    var message = new Buffer(JSON.stringify({address:address.address,
                                             port:address.port}));
    var client = dgram.createSocket(socketType);
    client.send(message, 
                0, 
                message.length, 
                clientsServerPort, 
                clientsServerAddress, 
                function(err, bytes) {
                    client.close();
                });


}

clientServer.on('error', function (err) {

    if (_.has(err, 'stack')) {
        console.log(sprintf('clientServer err:%s stack:\n%s', err, err.stack));
    } else {
        console.log(sprintf('clientServer err:%s', err));
    }

    clientServer.close();

});

clientServer.on('message', function (msg, rinfo) {

    
    
    if ((messageCount % 1000) === 0) {

        console.log(sprintf('Status - messages:%s time:%s', 
                            messageCount,
                            moment().format('HH:mm:ss')));

    }

    if (message.verify(msg, getKey('me'))) {

        messageCount++;

    } else {
        console.log('Bad msg:%s', JSON.stringify(msg));
    }

    


});

clientServer.on('listening', function () {

    var address = clientServer.address();

    console.log(sprintf('clientServer listeting:%s:%s', 
                        address.address,
                        address.port));

    setInterval(function() { sendHeartbeat(address); }, heartbeatRate);

    // Establish connection right away
    sendHeartbeat(address);



});

clientServer.bind(clientServerPort, clientServerAddress);

