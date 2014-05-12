'use strict';

// Disconnect clients after N seconds of no heartbeat
var clientTimeout = process.env.TS_CLIENT_TIMEOUT || (1000 * 20);

// IPV4 or IPV6
var socketType = process.env.TS_SOCKET_TYPE || 'udp4'; // udp4 or udp6

// How frequent to check for client status
var clearClientInterval = process.env.TS_CLEAR_CLIENT_INTERVAL || (1000);

// Port for sensor server
var sensorServerPort = process.env.TS_SENSOR_SERVER_PORT || 12345;

// Port for clients server
var clientsServerPort = process.env.TS_CLIENTS_SERVER_PORT || 12346;

// Max clients 
var maxClients = process.env.TS_MAX_CLIENTS || 10000;


var dgram = require('dgram');
var events = require('events');

var _ = require('lodash');
var moment = require('moment');
var sprintf = require('sprintf').sprintf;

var message = require('./message');

var sensorEventEmitter = new events.EventEmitter();
var sensorServer = dgram.createSocket(socketType);
var clientsServer = dgram.createSocket(socketType);

var clients = {};
var sensorCount = 0;

function getKey(key) {

    // TODO add ability to exchange HMAC keys via HTTPS and register them
    
    return 'test';
}


sensorServer.on('error', function (err) {

    if (_.has(err, 'stack')) {
        console.log(sprintf('sensorServer err:%s stack:\n%s', err, err.stack));
    } else {
        console.log(sprintf('sensorServer err:%s', err));
    }

    sensorServer.close();

});

sensorServer.on('message', function (msg, rinfo) {

    // A little visual indication messages are being received
    if ((sensorCount % 10000) === 0) {
        console.log(sprintf('Status - messages:%s clients:%s time:%s', 
                            sensorCount,
                            _.keys(clients).length,
                            moment().format('HH:mm:ss')));

    }

    if (message.verify(msg, getKey('sensor'))) {

        sensorCount++;

        // Push message out to all clients.
        sensorEventEmitter.emit('message', msg);

    } else {
        console.log('Bad msg:%s', JSON.stringify(msg));
    }
});

sensorServer.on('listening', function () {
    var address = sensorServer.address();
    console.log(sprintf('sensorServer listeting:%s:%s', 
                        address.address,
                        address.port));
});


clientsServer.on('error', function (err) {

    if (_.has(err, 'stack')) {
        console.log(sprintf('clientsServer err:%s stack:\n%s', err, err.stack));
    } else {
        console.log(sprintf('clientsServer err:%s', err));
    }

    clientsServer.close();

});

function clearClients() {

    _.each(clients, function(v, k) {

        if ((moment() - v.updated) > clientTimeout) {
            console.log(sprintf('Removing client:%s', k));
            sensorEventEmitter.removeListener('message', clients[k].send);
            clients[k].client.close();
            delete clients[k];
        }
    });

}



clientsServer.on('message', function (msg, rinfo) {

    var address = JSON.parse(msg);
    var key = address.address + '-' + address.port.toString();

    if (_.has(clients, key)) {
        console.log(sprintf('Refreshing client:%s', key));
        clients[key].updated = moment();
    } else if (_.keys(clients).length >= maxClients) {
        console.log(sprintf('Too many clients not adding client:%s', key));
    } else {
        console.log(sprintf('Adding client:%s', key));
        var client = dgram.createSocket(socketType);
        var send = function send(outboundMsg) {

            message.sign(outboundMsg, getKey(key));
            
            client.send(outboundMsg, 0, outboundMsg.length, address.port, address.address, function(err, bytes) {
                if (err) {

                    // TODO: If transient err keep client else clear client.
                    console.log(sprintf('Client:%s err:%s', key, err));
                }
            });

        };
            
        clients[key] = { address: address,
                         client: client,
                         updated: moment(),
                         send: send };
        

        sensorEventEmitter.on('message', clients[key].send);



    } // if

});

clientsServer.on('listening', function () {
    
    var address = clientsServer.address();

    console.log(sprintf('clientsServer listeting:%s:%s', 
                        address.address,
                        address.port));

});


// Start up servers and client clearer

sensorEventEmitter.setMaxListeners(maxClients);

setInterval(clearClients, clearClientInterval);

sensorServer.bind(sensorServerPort);

clientsServer.bind(clientsServerPort);

