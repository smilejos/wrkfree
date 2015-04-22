'use strict';
var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

/**
 * channelId, the channel's id
 * boardId, the drawboard id
 * isUndo, mark this record is during user undo or not
 * isArchived, mark this record is archived or not
 * record, an array of drawing raw data
 * drawTime, the time that this record drawed
 */
var DrawRecordSchema = new Schema({
    channelId:          {type : String, default : '', trim : true, index: true},
    boardId:            {type : Number, default : 999, trim : true},
    isUndo:             {type : Boolean, default : false},
    isArchived:         {type : Boolean, default : false},
    record:             {type : Array, default: [] , trim: true},
    drawTime:           {type : Date  , default : Date.now }
});

DrawRecordSchema.set('autoIndex', false);

Mongoose.model('DrawRecord', DrawRecordSchema);
