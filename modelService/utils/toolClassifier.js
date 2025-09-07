const { calendarTool } = require('../tools/calendarTool')
const { weatherTool } = require('../tools/weatherTool')
const { mailTool } = require('../tools/mailTool')
const { searchTool } = require('../tools/searchTool')
const { timeTool } = require('../tools/timeTool')
const toolClassifier = async (tool, query) => {
    try {
        tool = tool.toLowerCase()
        switch (tool) {
            case 'weather':
                return await weatherTool(query)

            case 'mail':
                return await mailTool(query)

            case 'meet':
                return await calendarTool(query, tool)

            case 'search':
                return await searchTool(query, tool)

            case 'calendar':
                return await calendarTool(query, tool)

            case 'time':
                return await timeTool(query)

            default:
                return await timeTool(query)
        }
    } catch (error) {
        console.error('toolClassifier.js: toolClassifier => Unable to classify the agent Tool', error);
        return error
    }
}

module.exports = { toolClassifier }