'use strict';
var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

var ChannelSchema = new Schema({
    channelId:          {type : String, default : '', trim : true, index: true},
    host:               {type : String, default : '', trim : true},
    name:               {type : String, default : '', trim : true},
    type:               {type : String, default : '', trim : true},  // "public", "private"
    rtc:                {   // now save rtc authorization status
        authorization:  {type : Boolean, default : true, trim : true}
    },
    drawing:            {   // now save current draw board number
        boardNum:       {type : Number, default : 1, trim : true}
    },
    msg:                {   // now save the latest msg 
        sender:         {type : String, default : '', trim : true},
        contents:       {type : String, default : '', trim : true},
        timestamp:      {type : Date,   default : Date.now }
    },

    /**
     * future support:
     */
    openStatus:         {
        status:         {type : String, default : '', trim : true},   // "open", "organization"
        info:           {type : String, default : '', trim : true},   // "orgization name"
    },
    anonymousEnter:     {type : Boolean, default : false, trim : true}, // set to "true" for anonymous login user
    anonymousPassword:  {type : String, default : '', trim : true} // passowrd for anonymous login
});

ChannelSchema.set('autoIndex', false);

Mongoose.model('Channel', ChannelSchema);
