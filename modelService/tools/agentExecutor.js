const { AgentExecutor, createStructuredChatAgent } = require('langchain/agents')
const { DynamicStructuredTool } = require('langchain/tools');
const { getModelLLM } = require('../utils/helperMethods');
const { pull } = require('langchain/hub');
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');

const executeAgentTool = (toolSchema) => {
    return new Promise(async (resolve, reject) => {
        try {
            const llm = await getModelLLM('flash',5)
            const prompt = await pull("hwchase17/structured-chat-agent");
            
            const agent = await createStructuredChatAgent({
                llm,
                tools: [toolSchema],
                prompt
            })

            const agentExecutor = new AgentExecutor({
                agent,
                tools: [toolSchema],
                verbose: false
            })

            resolve(agentExecutor)
        } catch (error) {
            console.error('agentExecutor.js: executeAgentTool => Unable to create agent executor for tool execution', error);
            reject(error)
        }
    })
}


module.exports = {
    executeAgentTool
}