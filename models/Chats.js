const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({

    discordID: {
        type: String,
        required: true,
    },
    messageCountToday: {
        type: Number,
        default: 0,
    
    }
    
  });
  
  const Chat = mongoose.models.Task || mongoose.model("Chat", ChatSchema);
  
module.exports = {Chat};