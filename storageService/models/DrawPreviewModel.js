'use strict';
var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

/**
 * channelId, the channel's id
 * boardId, the board id of this snapshot
 * contentType, the content type of base image
 * encode, the encode of base image
 * chunks, the raw data of base image
 * updatedTime, the last time for updating model
 */
var DrawPreviewSchema = new Schema({
    channelId:        {type: String, default: '', trim: true, index: true},
    boardId:          {type: Number, default: 0, trim: true},
    contentType:      {type: String, default: 'image/png'},
    encode:           {type: String, default: 'base64'},
    chunks:           Buffer,
    updatedTime:      {type : Date  , default : Date.now }
});

DrawPreviewSchema.set('autoIndex', false);

Mongoose.model('DrawPreview', DrawPreviewSchema);
