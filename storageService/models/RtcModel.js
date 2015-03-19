'use strict';
var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

/**
 * channelId, the channel's id
 * isAuth, means that members can create rtc conference or not
 *     NOTE: if "isAuth" is false, then only channel host can create conference
 */

var RtcSchema = new Schema({
    channelId:          {type : String, default : '', trim : true, index: true},
    isAuth:             {type : Boolean, default : true}
});

RtcSchema.set('autoIndex', false);

Mongoose.model('Rtc', RtcSchema);
