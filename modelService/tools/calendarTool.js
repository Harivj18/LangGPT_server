const { DynamicStructuredTool } = require("langchain/tools");
const { z } = require("zod");
const { verifyAuthCredentials, OAuthClient, createEvent } = require('../services/oAuth2.0');
const fs = require('fs');
const path = require("path");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StructuredOutputParser } = require("langchain/output_parsers");
const { RunnableSequence } = require("@langchain/core/runnables");
const { getModelLLM } = require("../utils/helperMethods");
const { google } = require('googleapis');

const calendarTool = (query, tool) => {
    return new Promise(async (resolve, reject) => {
        try {
            const filePath = path.join(__dirname, '../authCredentials/user123Token.json');
            if (!fs.existsSync(filePath)) {
                const authUrl = await verifyAuthCredentials()
                resolve(`Requires Google OAuth Verification 🔐, Click and verify here: ${authUrl}`);
            }
            else {
                if (fs.existsSync(filePath)) {
                    const tokenFile = fs.readFileSync(filePath);
                    const tokenContent = JSON.parse(tokenFile);
                    if (tokenContent?.access_token) {
                        const oAuth2Client = OAuthClient()

                        oAuth2Client.setCredentials(tokenContent);

                        oAuth2Client.on("tokens", (newTokens) => {
                            if (newTokens.refresh_token || newTokens.access_token) {
                                const merged = { ...tokenContent, ...newTokens };
                                fs.writeFileSync(filePath, JSON.stringify(merged));
                            }
                        });
                        const meetingInfo = await extractMeetingInfo(query)
                        const result = await createEvent(meetingInfo, oAuth2Client, tool);
                        // const toolStructure = await calendarToolSchema(oAuth2Client, meetingInfo);

                        console.log('calendarTool.js: calendarTool => Calendar Tool Response 🗓️', result);
                        const calendarResponse = `Appointment Scheduled, ${result.meetLink}`
                        resolve(calendarResponse)
                    } else {
                        console.log('calendarTool.js: calendarTool => OAuth Verification Not Completed');
                        resolve('OAuth Verification Not Completed')
                    }
                } else {
                    console.log('calendarTool.js: calendarTool => Access Token File is missing');
                    resolve('Access Token File is missing')
                }
            }
        } catch (error) {
            console.error('calendarTool.js: calendarTool => Error while using agent calendar tool', error);
            reject(error)
        }
    })
}

const extractMeetingInfo = (query) => {
    return new Promise(async (resolve, reject) => {
        try {

            const llm = await getModelLLM('flash',6)

            const parser = StructuredOutputParser.fromZodSchema(
                z.object({
                    attendees: z.string().describe("List of attendees info"),
                    meetingDate: z.string().describe("Start Time (YYYY-MM-DD)"),
                    startTime: z.string().describe("Start Time (HH:MM)"),
                    endTime: z.string().describe("End Time (HH:MM)"),
                    title: z.string().describe("Meet Title"),
                    venue: z.string().describe("Meeting Venue"),
                    recurrence: z.string().nullable().optional().describe("Meeting Day Recurrence")
                }),
            )

            const prompt = PromptTemplate.fromTemplate(`
                You're a helpful assistant, extract the meeting info from given input and return only Valid JSON.\n{format_instructions}

                input : {input}
            `);

            const chain = RunnableSequence.from([
                prompt,
                llm,
                parser
            ])

            const extractResult = await chain.invoke({
                input: query,
                format_instructions: parser.getFormatInstructions()
            })

            console.log('calendarTool.js: extractMeetingInfo => extractResult from llm', extractResult);
            resolve(extractResult)
        } catch (error) {
            console.error('calendarTool.js: extractMeetingInfo => Unable to extract meet requirement info', error);
            reject(error)
        }
    })
}

const calendarToolSchema = (oAuth2Client, meetingInfo) =>
    new DynamicStructuredTool({
        name: "Calendar Tool",
        description: "Book appointment with User on Calendar",
        schema: z.object({
            attendees: z.string().describe("Comma-separated emails"),
            meetingDate: z.string().describe("Date YYYY-MM-DD"),
            startTime: z.string().describe("Start Time HH:MM"),
            endTime: z.string().describe("End Time HH:MM"),
            title: z.string().describe("Meeting Title"),
            venue: z.string().describe("Meeting Venue"),
        }),
        func: async () => {
            try {
                const { attendees, meetingDate, startTime, endTime, title, venue } = meetingInfo;
                const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

                const event = {
                    summary: title,
                    location: venue,
                    start: {
                        dateTime: `${meetingDate}T${startTime}:00+05:30`,
                        timeZone: "Asia/Kolkata",
                    },
                    end: {
                        dateTime: `${meetingDate}T${endTime}:00+05:30`,
                        timeZone: "Asia/Kolkata",
                    },
                    attendees: attendees.split(",").map((email) => ({ email: email.trim() })),
                    conferenceData: {
                        createRequest: { requestId: "meet-" + Date.now() },
                    },
                };

                const response = await calendar.events.insert({
                    calendarId: "primary",
                    resource: event,
                    conferenceDataVersion: 1,
                });

                return {
                    success: true,
                    meetLink: response.data.hangoutLink || "Not generated",
                    eventLink: response.data.htmlLink,
                };
            } catch (error) {
                console.error("❌ Error creating calendar event:", error);
                return { success: false, error: error.message };
            }
        },
    });

module.exports = { calendarTool }