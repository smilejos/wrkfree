'use strict';
var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

/**
 * channelId, the channel id
 * member, the uid of this member
 * is1on1, to indicate channe is 1on1 channel or not
 * isStarred, the subscribed status on this channel
 * isHost, a flag to represent member is host or not
 * isRtc, means that member turn on/off the rtc on this channel
 * lastUsedBoard, the last draw board that member used
 * visitCounts, ths counts about how many times that member has visited
 * msgSeenTime, the last msg seen time of this member
 * lastVisitTime, the last visit time of this member
 */

var ChannelMember = new Schema({
    channelId:         {type : String, default : '', trim : true, index: true},
    member:            {type : String, default : '', trim : true, index: true},
    is1on1:            {type : Boolean,default : false, index: true},
    isStarred:         {type : Boolean,default : false},
    isHost:            {type : Boolean,default : false},
    isRtc:             {type : Boolean,default : true},
    lastUsedBoard:     {type : Number, default : 0},
    visitCounts:       {type : Number, default : 0},
    msgSeenTime:       {type : Date, default : new Date(0), trim : true},
    lastVisitTime:     {type : Date, default : new Date(0), trim : true}
});

ChannelMember.set('autoIndex', false);

Mongoose.model('ChannelMember', ChannelMember);
