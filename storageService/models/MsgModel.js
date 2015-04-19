'use strict';
var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

/**
 * channelId, the channel's id
 * message, the message content
 * from, the sender uid 
 * sentTime, the timestamp of this message
 */
var MsgSchema = new Schema({
    channelId:          {type : String, default : '', trim : true, index: true},
    message:            {type : String, default : '', trim : true},
    from:               {type : String, default : '', trim : true},
    sentTime:           {type : Date, default : Date.now },
});

MsgSchema.set('autoIndex', false);

Mongoose.model('Msg', MsgSchema);
