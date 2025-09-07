const { DynamicStructuredTool } = require("langchain/tools");
const { z } = require("zod");
const nodemailer = require('nodemailer');
const { executeAgentTool } = require('../tools/agentExecutor');
const { RunnableSequence } = require("@langchain/core/runnables");
const { PromptTemplate } = require("@langchain/core/prompts");
const { resultParser, getModelLLM, outputFixer } = require("../utils/helperMethods");
const { OutputParserException } = require("@langchain/core/output_parsers");
const { sendMail } = require('../services/nodeMailer')

const mailTool = (query) => {
    return new Promise(async (resolve, reject) => {
        let mailContent = ''
        try {

            const userQuery = normalizeQuery(query)

            mailContent = await draftMail(userQuery);

            const toolSchema = await createMailTool(mailContent);

            const executeAgent = await executeAgentTool(toolSchema);

            const structuredQuery = `
                Query : ${userQuery}

                - If Mail sent, provide the final answer as Mail sent Successfully !
                - If Mail failed to sent, return 'Failed to send mail'
            `
            const response = await executeAgent.invoke({
                input: structuredQuery
            })

            console.log('Mail Tool Response 🤖', response);

            resolve(response.output)

        } catch (error) {
            if (error instanceof OutputParserException) {
                const badText =
                    error.output ||
                    error.llmOutput ||
                    error.message ||
                    "Unknown parsing error";

                console.log('mailTool.js: mailTool => Going to fix and parse the output', badText);

                const fixedOutput = await outputFixer(badText);

                if (fixedOutput) {
                    console.log('mailTool.js: mailTool => Output has been fixed successfully', fixedOutput);
                    if (fixedOutput?.action_input) {
                        const mailInfo = fixedOutput.action_input
                        const mailResponse = await sendMail(mailInfo?.to, mailInfo?.cc, mailInfo?.subject, mailContent, mailInfo?.fileUrl);
                        resolve(mailResponse)
                    } else {
                        console.log('mailTool.js: mailTool => Recepient / cc / content might missing');
                        resolve('Failed to sent mail')
                    }
                } else {
                    console.log('mailTool.js: mailTool => Unable to parse LLM output', fixedOutput);
                    reject(error)
                }
            } else {
                console.error('mailTool.js: mailTool => Error while using agent mail tool', error);
                reject(error)
            }
        }
    })
}

const createMailTool = (mailContent) => {
    try {
        return new DynamicStructuredTool({
            name: "mail",
            description: "Tool for Sending Mail",
            schema: z.object({
                to: z.string().describe('To Recepient Mail Id'),
                cc: z.string().nullable().optional().describe('CC Recepient Mail Id'),
                subject: z.string().describe("Mail Subject"),
                fileUrl: z.string().describe("Attachment File Url")
            }),
            func: async ({ to, cc, subject, fileUrl }) => {
                return await sendMail(to, cc, subject, mailContent, fileUrl)
            }
        })
    } catch (error) {
        console.error('mailTool.js: createMailTool => Unable to form tool for sending mail', error);
        return error
    }
}

const draftMail = (query) => {
    return new Promise(async (resolve, reject) => {
        try {
            const llm = await getModelLLM('flash',7);

            const prompt = PromptTemplate.fromTemplate(`
                You're an helpful AI Mail assistant, generate and provide only the mail content not any subject / email closings info

                input : {input}

                - Enhance the mail content from input

                - If the input does not contains mail content, draft the mail content based on Mail Subject.

                - Mail Content should be situational / emotional / professional based on Subject

                - and attach "Thanks & Regards,\nLangGPT".
            `)

            const parser = await resultParser('string');

            const chain = RunnableSequence.from([
                prompt,
                llm,
                parser
            ]);

            const mailContent = await chain.invoke({
                input: query
            })

            console.log('AI Mail Content', mailContent);

            resolve(mailContent)

        } catch (error) {
            console.error('mailTool.js: draftMail => Unable to draft mail content by llm', error);
            reject(error)
        }
    })
}

const normalizeQuery = (input) => {
    try {
        return input
            .replace(/\bI\b/gi, "Hari")
            .replace(/\bme\b/gi, "Hari")
            .replace(/\bmy\b/gi, "Hari's");
    } catch (error) {
        console.error('mailTool.js: normalizeQuery => Something wrong while forming self query', error);
        return error
    }
}

module.exports = { mailTool }