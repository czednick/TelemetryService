'use strict';

var assert = require('assert');

var moment = require('moment');

var message = require('../src/message');

var TEST_EPOC = 1399929067;

suite('Message', function(){


    test('End to End', function() {

        var key = 'test';
        var ts = moment(TEST_EPOC).unix();

        var create = message.getCreate(key);
        
        var id = 1;
        var eventCode = 2;
        var data = new Buffer('test');
        
        var msg = create(ts, id, eventCode, data);
        assert(msg);

        var signed = message.sign(msg, key);
        assert(signed);

        assert(message.verify(msg, key));

        var badHMAC = new Buffer(msg.length);
        msg.copy(badHMAC);
        badHMAC[0] = 10; // Value not in current data;
        
        assert.equal(message.verify(badHMAC, key), false);
        

        var object = message.transform(msg);


        assert.equal(object.ts, ts);
        assert.equal(object.id, id);
        assert.equal(object.eventCode, eventCode);
        assert.equal(object.data.toString('utf8', 0, data.length), 
                     data.toString());

        assert.equal(object.number, 0); // First in series.

        
    });

});
