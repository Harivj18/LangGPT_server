const { DynamicStructuredTool } = require('langchain/tools');
const { executeAgentTool } = require('../tools/agentExecutor');
const { z } = require('zod');
const { resultParser } = require('../utils/helperMethods')


const weatherTool = (query) => {
    return new Promise(async (resolve, reject) => {
        try {

            const toolSchema = await createWeatherTool();

            const executeAgent = await executeAgentTool(toolSchema);

            let agentResponse = await executeAgent.invoke({
                input: query
            })

            console.log('🤖 AI Agent Response :', agentResponse);

            resolve(agentResponse.output)
        } catch (error) {
            console.error('weatherTool.js: weatherTool => Error while using agent weather tool', error);
            reject(error)
        }
    })
}

const createWeatherTool = () => {
    try {
        return new DynamicStructuredTool({
            name: "Weather Tool",
            description: "Tool to get the weather forecast of the Cities",
            schema: z.object({
                city: z.string().describe("City name for weather forecast")
            }),
            func: async ({ city }) => {
                try {
                    const weatherApiKey = process.env.OPENWEATHER_API_KEY;

                    if (!weatherApiKey) {
                        return "API key missing. Please set weather api key in environment variables.";
                    }

                    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric`;

                    const res = await fetch(url);

                    if (!res.ok) {
                        return `Failed to fetch weather for ${city}`;
                    }

                    const data = await res.json();

                    return `In ${city}, it is ${data.main.temp}°C with ${data.weather[0].description}`;
                } catch (error) {
                    console.error('weatherTool.js: createWeatherTool => Unable to get weather info from openweather api', error);
                    return error
                }
            }
        })
    } catch (error) {
        console.error('weatherTool.js: createWeatherTool => Error due to creating tool structure', error);
        return error
    }
}

module.exports = {
    weatherTool
}