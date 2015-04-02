'use strict';
var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

/**
 * channelId, the channel id
 * member, the uid of this member
 * channelType, the type of the channel
 * channelName, the fullname of the channel, ex: 'bamoo456@gmail.com#test'
 * isSubscribed, the subscribed status on this channel
 * isHost, a flag to represent member is host or not
 * isRtc, means that member turn on/off the rtc on this channel
 * lastUseBoard, the last draw board that member used
 * visitCounts, ths counts about how many times that member has visited
 * msgSeenTime, the last msg seen time of this member
 * lastVisitTime, the last visit time of this member
 */

var ChannelMember = new Schema({
    channelId:         {type : String, default : '', trim : true, index: true},
    member:            {type : Schema.Types.ObjectId, default : null, index: true},
    channelType:       {type : String, default : '', trim : true},
    channelName:       {type : String, default : '', trim : true},
    isSubscribed:      {type : Boolean,default : false, trim : true},
    isHost:            {type : Boolean,default : false, trim : true},
    isRtc:             {type : Boolean,default : true, trim : true},
    lastUseBoard:      {type : Number, default : 0, trim : true},
    visitCounts:       {type : Number, default : 0, trim : true},
    msgSeenTime:       {type : Date, default : new Date(0), trim : true},
    lastVisitTime:     {type : Date, default : new Date(0), trim : true}
});

ChannelMember.set('autoIndex', false);

Mongoose.model('ChannelMember', ChannelMember);
