const { PromptTemplate } = require("@langchain/core/prompts");
const { RunnableSequence } = require("@langchain/core/runnables");
const { StructuredOutputParser } = require("langchain/output_parsers");
const notifier = require("node-notifier");
const { getModelLLM } = require('../utils/helperMethods')
const { z } = require('zod');
const path = require('path')

module.exports = {
    notifyUser: async (query) => {
        try {
            const extractNotifation = await extractInfo(query)

            console.log('extractNotifation',extractNotifation);
            
            await triggerNotification(extractNotifation)

            return
        } catch (error) {
            console.error("notifier.js : notifyUser => something wrong while notifying user", error);
            return error
        }
    }
}

const extractInfo = (query) => {
    return new Promise(async (resolve, reject) => {
        try {
            let llm = await getModelLLM('flash', 1);
            const prompt = PromptTemplate.fromTemplate(`
                You're a helpful AI assistant, provide a title and message from the given context in json format

                \n{format_instructions}

                context: {context}
            `)
            const parser = StructuredOutputParser.fromZodSchema(
                z.object({
                    title: z.string().describe("Title for the input"),
                    message: z.string().describe("Context of the input")
                })
            )

            const chain = RunnableSequence.from([
                prompt,
                llm,
                parser
            ])
            const info = await chain.invoke({
                context: query,
                format_instructions: parser.getFormatInstructions()
            })

            console.log('Notification Info for remainder :', info);

            resolve(info)

        } catch (error) {
            console.error("notifier.js : extractInfo => Unable to extract the user notification detail", error);
            reject(error)
        }
    })
}

const triggerNotification = (info) => {
    return new Promise((resolve, reject) => {
        try {
            notifier.notify({
                title: info?.title || "Remainder",
                message: info?.message || "Notification Remainder",
                sound: "Ping",
                timeout: 10,
                icon: path.join(__dirname + '../assets', 'logo.png')
            })
            resolve('Success')
        } catch (error) {
            console.error("notifier.js : triggerNotification => Issue while Remainder Notification Trigger", error);
            reject(error)
        }
    })
}