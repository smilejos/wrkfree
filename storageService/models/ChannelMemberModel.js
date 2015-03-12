'use strict';
var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

/**
 * channelId, the channel id
 * member, the uid of this member
 * channelType, the type of the channel
 * channelName, the fullname of the channel, ex: 'bamoo456@gmail.com#test'
 * subscribed, the subscribed status on this channel
 * rtcStatus, the rtc status means that member turn on/off the rtc on this channel
 * lastUseBoard, the last draw board that member used
 * visitCounts, ths counts about how many times that member has visited
 * msgSeenTime, the last msg seen time of this member
 * lastVisitTime, the last visit time of this member
 */

var ChannelMember = new Schema({
    channelId:         {type : String, default : '', trim : true, index: true},
    member:            {type : String, default : '', trim : true, index: true},
    channelType:       {type : String, default : '', trim : true},
    channelName:       {type : String, default : '', trim : true},
    subscribed:        {type : Boolean,default : false, trim : true},
    rtcStatus:         {type : Boolean,default : true, trim : true},
    lastUseBoard:      {type : Number, default : 0, trim : true},
    visitCounts:       {type : Number, default : 0, trim : true},
    msgSeenTime:       {type : Date, default : new Date(0), trim : true},
    lastVisitTime:     {type : Date, default : new Date(0), trim : true}
});

ChannelMember.set('autoIndex', false);

Mongoose.model('MemberStatus', ChannelMember);
