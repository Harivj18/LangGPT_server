const { DynamicStructuredTool } = require("langchain/tools");
const { z } = require("zod");
const { executeAgentTool } = require('../tools/agentExecutor')

const timeTool = (query) => {
    return new Promise(async (resolve, reject) => {
        try {
            const createTool = await createTimeTool();

            const executeAgent = await executeAgentTool(createTool);

            const agentResponse = await executeAgent.invoke({
                input: query
            })

            console.log('Time Tool Agent Response 🤖', agentResponse);

            resolve(agentResponse.output)
            
        } catch (error) {
            console.error('timeTool.js: timeTool => Error while using agent time tool', error);
            reject(error)
        }
    })
}

const createTimeTool = () => {
    try {
        return new DynamicStructuredTool({
            name: "Time Tool",
            description: "Time of the global cities",
            schema: z.object({
                city: z.string().describe("Name of the city")
            }),
            func: async ({ city }) => {
                try {
                    const timeApiKey = process.env.IPGEOLOCATION_API_KEY;

                    if (!timeApiKey) {
                        return "API key missing. Please set IPGEOLOCATION_API_KEY in environment variables.";
                    }

                    const url = `https://api.ipgeolocation.io/timezone?apiKey=${timeApiKey}&location=${city}`;

                    const res = await fetch(url);

                    if (!res.ok) {
                        return `Failed to fetch Time of ${city}`;
                    }

                    const data = await res.json();
                    console.log('Time of the city', data);

                    return `Time in ${city} : ${data.time_12}`;
                } catch (error) {
                    console.error('timeTool.js: createTimeTool => Unable to get time from time tool', error);
                    return `Error while fetching time for ${city}: ${error.message}`;
                }
            }
        })
    } catch (error) {
        console.error('timeTool.js: createTimeTool => something went wrong while calling time tool', error);
        reject(error)
    }
}

module.exports = { timeTool }