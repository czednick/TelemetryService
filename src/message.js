var crypto = require('crypto');

var _ = require('lodash');
var sprintf = require('sprintf').sprintf;

var MSG_TS = 4; // 4 byte timestamp
var MSG_ID = 2; // 2 byte ID
var MSG_EC = 2; // 2 byte event code
var MSG_DATA = 8; // 8 byte data
var MSG_NUMBER = 2; // 2 byte message number
var MSG_HMAC = 16; // MD5HMAC
var MSG_LENGTH = MSG_TS + MSG_ID + MSG_EC + MSG_DATA + MSG_HMAC;
var MSG_TOTAL_LENGTH = MSG_LENGTH + MSG_HMAC;

var MAX_SHORT_UINT = 65535;

function getCreate() {

    var i = 0;

    return function create(ts, id, eventCode, data)  {
    
        // TODO: Translate from host order to network order.
        var buf = new Buffer(MSG_TOTAL_LENGTH);
        var offset = 0;

        // TS
        buf.writeUInt32LE(ts, offset); 
        offset += MSG_TS;
        
        // ID
        buf.writeUInt16LE(0x1, offset); 
        offset += MSG_TS;

        // EC
        buf.writeUInt16LE(0x2, offset); 
        offset += MSG_EC;
        

        // DATA
        data.copy(buf, offset, 0, MSG_DATA);
        offset += MSG_DATA;

        // NUMBER
        buf.writeUInt16LE(i, offset);

        i = ((i <= MAX_SHORT_UINT) && (i++)) || 0;

        return buf

    };

}

function sign(buf, key) {

        
    var hmac = crypto.createHmac('md5', key);
    hmac.update(buf.slice(0, MSG_LENGTH));
    var digest = new Buffer(hmac.digest('binary'));
    digest.copy(buf, MSG_LENGTH, 0);
    return buf

}

function verify(buf, key) {

    var hmac = crypto.createHmac('md5', key);
    hmac.update(buf.slice(0, MSG_LENGTH));
    var digest = new Buffer(hmac.digest('binary'));

    var valid = _.every(_.range(MSG_HMAC), function(i) {

        return digest[i] === buf[MSG_LENGTH + i];
        
    });

    return valid;


}

function transform(message) {

    var object = {};
    var offset = 0;

    // TS
    object.ts = message.readUInt32LE(offset); 
    offset += MSG_TS;
    
    // ID
    object.id = message.readUInt16LE(offset); 
    offset += MSG_TS;
    
    // EC
    object.eventCode = message.readUInt16LE(offset); 
    offset += MSG_EC;
        

    // DATA
    var data = new Buffer(MSG_DATA);
    message.copy(data, 0, offset, offset + MSG_DATA);
    object.data = data;
    offset += MSG_DATA;

    // NUMBER
    object.number = message.readUInt16LE(offset);
    offset += MSG_NUMBER;


    return object;
    

}

exports.getCreate = getCreate;
exports.sign = sign;
exports.verify = verify;
exports.transform = transform;
