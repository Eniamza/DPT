// Process  messages passed in function with ChatGPT 4.1 nano

const {OpenAI} = require('openai');
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 120000, // 120 seconds
});

async function processWithGPT(aggregatedMessages) {
    if (!aggregatedMessages || aggregatedMessages.length === 0) {
        throw new Error('No messages to process with GPT.');
    }
    try {
        const response = await client.chat.completions.create({
            model: 'gpt-4.1-nano',
            messages: [
                { 
                    role: 'system', 
                    content: `You are Guru, a helpful and knowledgeable AI assistant who can discuss almost any topic.

NFT RESTRICTION:
- You must NEVER discuss, explain, or provide ANY information about NFTs (Non-Fungible Tokens)
- If asked about NFTs, respond only with: "I'm not able to discuss NFTs. I'd be happy to talk about other topics instead."
- Do not define NFTs or engage with hypothetical scenarios involving NFTs

For all other topics, be helpful, informative, and engaging. You can discuss codes, numbers, or any other subject freely - only NFTs are restricted.`
                }, 
                ...aggregatedMessages
            ], 
            max_tokens: 4096,
            temperature: 0.5,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error processing with GPT:', error);
        throw error;
    }
}

module.exports = { processWithGPT };

