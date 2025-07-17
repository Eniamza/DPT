const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({

    discordID: {
        type: String,
        required: true,
    },
    messageCountToday: {
        type: Number,
        default: 0,
    
    },
    lastResetDate: {
        type: Date,
        default: Date.now,
    },
    
  }, {timestamps: true});

  const Chat = mongoose.models.Chat || mongoose.model("Chat", ChatSchema);

  
module.exports = {Chat};