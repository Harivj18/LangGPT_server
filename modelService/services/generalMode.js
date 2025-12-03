const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const { PromptTemplate } = require('@langchain/core/prompts')
const {
    resultParser
} = require('../utils/helperMethods');
const { getModelLLM } = require('../utils/helperMethods');
const generalLLM = async function* (query) {
    try {

        const model = await getModelLLM('flash', 9);

        const parser = await resultParser(query)

        const prompt = PromptTemplate.fromTemplate(`
            You're a helpful AI assistant.
             - If the user general question, answer directly
             - If the user ask's real time information like (e.g: weather / time of city, Book calendar, Schedule meet, Sending mail), reply only with 'AgentTool'
             - Always provide concise and meaningful answer

            question : {question}
        `)

        const chain = RunnableSequence.from([
            prompt,
            model,
            parser
        ])

        const response = await chain.stream({
            question: query
        })

        for await (let chunk of response) {
            console.log('response', chunk);
            yield chunk
        }

    } catch (error) {
        console.log('GeneralMode.js: generalLLM => Error while reaching llm', error);
        return error
    }
}

module.exports = { generalLLM }