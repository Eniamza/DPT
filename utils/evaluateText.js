const mongoose = require('mongoose');
const { Chat } = require('../models/Chats');

const dbConnect = require('../utils/dbConnect');



async function evaluateLimit(userID) {
  try {

        // Connect to the database
        await dbConnect();

        // Get the current date
        const currentDate = new Date();
        // Find the chat document for the user
        const chat = await Chat.findOne({ discordID: userID });
    
        if (!chat) {
            // If no chat document exists, create one
            const newChat = new Chat({ discordID: userID });
            await newChat.save();
            return { messageCountToday: 0, lastResetDate: currentDate, isEligible: true };
        }
    
        // Check if the last reset date is today
        const lastResetDate = chat.lastResetDate;
        const isSameDay = lastResetDate.toDateString() === currentDate.toDateString();
        if (!isSameDay) {
            // If it's a new day, reset the message count
            chat.messageCountToday = 0;
            chat.lastResetDate = currentDate;
            await chat.save();
        }
    
        // Check if the user is eligible to send a message
        const isEligible = chat.messageCountToday < 5; // Assuming the limit is 5 messages per day
        if (isEligible) {
            // Increment the message count
            chat.messageCountToday += 1;
            await chat.save();
        }
    
        return {
            messageCountToday: chat.messageCountToday,
            lastResetDate: chat.lastResetDate,
            isEligible
        };
    
  } catch (error) {
    console.error("Error evaluating limit:", error);
    throw error;
    
  }

}

module.exports = {evaluateLimit};