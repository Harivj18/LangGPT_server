const { RunnableSequence } = require("@langchain/core/runnables");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { StateGraph } = require('@langchain/langgraph');
const { getModelLLM, resultParser } = require('../utils/helperMethods');
const { PromptTemplate } = require("@langchain/core/prompts");

const classifyAgent = async (query) => {
    try {
        const llm = await getModelLLM('flash', 8)

        console.log('llm',llm);
        
        const prompt = PromptTemplate.fromTemplate(
            `
                You're a classifier assistant, Classify the given context into one of the following categories:

                - if the context is about weather conditions, forecasts, or climate, reply only with 'weather'
                - if the context is about time or date (current time, timezone, conversions, etc.), reply only with 'time'
                - if the context is about calendar events, schedules, or reminders, reply only with 'calendar'
                - if the context is about meetings, calls, or appointments, reply only with 'meet'
                - if the context is about email messages, sending, or receiving mail, reply only with 'mail'

                context: {context}
            `
        )
        const parser = await resultParser(query)

        const chain = RunnableSequence.from([
            prompt,
            llm,
            parser
        ])

        const tool = await chain.invoke({
            context: query
        })

        console.log('tool result', tool);

        return tool.trim()
    } catch (error) {
        console.error('agentClassifier.js : classifyAgent => Unable to specify agent tool', error);
        throw error;
    }
}

const jobClassifier = (query) => {
    return new Promise(async(resolve, reject) => {
        try {
            const llm = await getModelLLM('flash', 8)
            
            const prompt = PromptTemplate.fromTemplate(
                `
                    You're a classifier assistant, Classify the given context into one of the following categories:

                    - if the context is about email messages, sending, or receiving mail, reply only with 'mail'
                    - if the context is about events, schedules, or reminders, reply only with 'notify'

                    context: {context}
                `
            )
            const parser = await resultParser(query)

            const chain = RunnableSequence.from([
                prompt,
                llm,
                parser
            ])

            const tool = await chain.invoke({
                context: query
            })

            console.log('tool result', tool);

            resolve(tool.trim())
        } catch (error) {
            console.error('agentClassifier.js : jobClassifier => Something wrong while classifying job context', error);
            reject(error);
        }
    })
}

module.exports = { classifyAgent, jobClassifier }