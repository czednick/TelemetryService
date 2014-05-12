'use strict';

// IPV4 or IPV6
var socketType = process.env.TS_SOCKET_TYPE || 'udp4'; // udp4 or udp6

// Port for sensor server
var sensorServerPort = process.env.TS_SENSOR_SERVER_PORT || 12345;

// Address for sensor server
var sensorServerAddress = process.env.TS_SENSOR_SERVER_ADDRESS || 'localhost';

// How frequently to send data to server
var sampleRate = process.env.TS_SENSOR_SAMPLE_RATE || 1;



var dgram = require('dgram');

var moment = require('moment');
var sprintf = require('sprintf').sprintf;

var message = require('./message');

var client = dgram.createSocket(socketType);
var create = message.getCreate();

function getKey() {

    // TODO: HTTPS call to server to get key for HMAC
    return 'test';

}

function send() {


    var id = 1;
    var eventCode = 2;
    var data = new Buffer('test');
    
    var msg = create(moment().unix(), id, eventCode, data);
    message.sign(msg, getKey());

    client.send(msg, 
                0, 
                msg.length, 
                sensorServerPort, 
                sensorServerAddress, 
                function(err, bytes) {

                    if (err) {
                        // TODO: If transient err keep client else clear
                        // client.
               
                    }
                });

}


// Send data 
setInterval(send, sampleRate);

