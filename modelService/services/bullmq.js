const { Queue } = require('bullmq');
const { redisInfo } = require('./RedisConnection');
const { getModelLLM, resultParser } = require('../utils/helperMethods');
const { PromptTemplate } = require('@langchain/core/prompts');
const { RunnableSequence } = require('@langchain/core/runnables');
module.exports = {
    createQueue: (tool, query, timing) => {
        return new Promise(async (resolve, reject) => {
            try {
                const queue = new Queue(`${tool}Queue`, { connection: redisInfo() });

                const msgData = {
                    query,
                    tool,
                    timing
                };

                const job = await queue.add(`${tool}Job`, msgData, {
                    repeat: { every: timing },
                    removeOnComplete: true,
                    removeOnFail: true
                })

                console.log(`✅ Job created in ${tool}Queue with ID: ${job.id}`);
                resolve();
            } catch (error) {
                console.error("bullmq.js : createQueue => Unable to create the job queue", error);
                reject(error)
            }
        })
    },

    schedulerInfo: (query) => {
        return new Promise(async (resolve, reject) => {
            try {
                const llm = await getModelLLM('flash', 11);
                const prompt = PromptTemplate.fromTemplate(
                    `
                        You're a helpful AI assistant. 
                        Extract the scheduler timing from the given context 
                        and convert it into milliseconds (ms). 
                        Return only the multiplication formula (do not evaluate it).

                        Conversions:
                        - 1 second = 1000
                        - 1 minute = 60 * 1000
                        - 1 hour   = 60 * 60 * 1000
                        - 1 day    = 24 * 60 * 60 * 1000
                        - 1 week   = 7 * 24 * 60 * 60 * 1000
                        - 1 year   = 365 * 24 * 60 * 60 * 1000

                        context: {context}
                    `
                )
                const parser = await resultParser(query);
                const chain = RunnableSequence.from([
                    prompt,
                    llm,
                    parser
                ])
                const timing = await chain.invoke({
                    context: query
                })

                console.log('Agent Scheduler timing', timing);
                resolve(timing)
            } catch (error) {
                console.error("bullmq.js : schedulerInfo => Something isn`t fine while getting job timing", error);
                reject(error)
            }
        })
    }
}