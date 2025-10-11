const { generalLLM } = require('../services/generalMode');
const { ragLLM, embedUploadDoc } = require('../services/RAGMode');
const { streamAgentResponse } = require('../utils/stream');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const { setToken } = require('../services/oAuth2.0')
const { toolClassifier } = require('../utils/toolClassifier');
const { storeMessageHistory } = require('../services/chatHistory');
const { messageProducer } = require('../broker/messageProducer');
const { classifyAgent } = require('../tools/agentClassifier')

const askLLM = async (req, res) => {
    try {
        const {
            mode,
            chatId,
            message: query
        } = req.body;
        const controller = new AbortController();
        const { signal } = controller;

        req.on("close", () => {
            console.log(" Request aborted by client");
            controller.abort();
        });

        if (false) {
            const { streamData, endStream } = streamAgentResponse(req, res)
            let agentResponse = mode === 'GENERAL' ? generalLLM(query) : ragLLM(query);
            for await (const chunk of agentResponse) {
                streamData(chunk)
            }
            endStream()
        } else {
            let llmOutput =
                mode === "GENERAL" ? await collectFull(generalLLM(query)) : await collectFull(ragLLM(query));

            console.log('llmOutput', llmOutput);

            if (mode === "GENERAL" && llmOutput.trim() === "AgentTool") {
                llmOutput = await agentTool(query);
            }
            let sessionInfo = chatId ?? uuid();

            console.log('chatId', chatId);

            // let newChat = chatId ? false : true
            let newChat = chatId ? 'edit' : 'add'
            console.log('neeeee', newChat);

            await messageProducer('key1', sessionInfo, query, llmOutput, newChat)

            /* 
                const messageHistory = await storeMessageHistory(sessionInfo)
                await messageHistory.addConversation(query, llmOutput, newChat);

                await messageHistory.addUserMessage(query);
                await messageHistory.addAIMessage(llmOutput);
            */

            return res.status(200).json({
                "success": true,
                "message": "langGPT Process Success",
                "data": llmOutput,
                "chatId": sessionInfo
            })
        }
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("chatBotController.js: askLLM =>⚠️ LLM request aborted");
            return;
        }
        if (error.status === 429) {
            console.error("chatBotController.js: askLLM =>🚨 Rate limit hit:", error.errorDetails);

            return res.status(429).json({
                success: false,
                message: "Rate limit exceeded. Please wait before retrying.",
                retryAfter: error?.errorDetails?.find(d => d['@type']?.includes("RetryInfo"))?.retryDelay || "60s"
            });
        }
        console.error('chatBotController.js: askLLM => Something wrong happened on server chatbot', error);
        return res.status(500).json({
            "success": false,
            "message": error.message
        })
    }
}

const uploadUserDoc = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        const fileUrl = `${req.protocol}://${req.get("host")}/files/${req.file.filename}`;

        const extension = path.extname(req.file.filename).replace('.', '');

        console.log('extension', extension);
        console.log('req.file.path', req.file.path);


        await embedUploadDoc(req.file.path, extension);
        console.log('Embedding Completed Successfully !!');
        let sessionInfo = chatId ?? uuid()
        // let newChat = chatId ? false : true
        let newChat = chatId ? 'edit' : 'add'

        await messageProducer('key1', sessionInfo, req.file.originalname, fileUrl, newChat)

        /*
            const messageHistory = await storeMessageHistory(sessionInfo)
            await messageHistory.addConversation(req.file.originalname, fileUrl, newChat);
        */

        return res.status(200).json({
            success: true,
            message: "Document Uploaded",
            fileUrl,
            fileName: req.file.originalname,
            chatId: sessionInfo
        });
    } catch (error) {
        console.error('chatBotController.js: uploadUserDoc => UserDocument Upload Got failed', error);
        return res.status(500).json({
            "success": false,
            "message": error.message
        })
    }
}

const useThirdPartyTools = async (req, res) => {
    try {
        let {
            tool,
            message: query,
            chatId,
        } = req.body;

        const controller = new AbortController();
        const { signal } = controller;

        req.on("close", () => {
            if (!res.writableEnded) {
                // console.log("❌ Request aborted by client");
                controller.abort();
            } else {
                console.log("✅ Request finished normally");
            }
        });

        console.log('tool', tool);
        console.log('query', query);
        console.log('chatId', chatId);
        // let newChat = chatId ? false : true
        let newChat = chatId ? 'edit' : 'add'

        const executionResult = await toolClassifier(tool, query)
        console.log('executionResult', executionResult);
        let sessionInfo = chatId ?? uuid()

        await messageProducer('key1', sessionInfo, query, executionResult, newChat)

        /*
            const messageHistory = await storeMessageHistory(sessionInfo)
            await messageHistory.addConversation(query, executionResult, newChat);
        */
        return res.status(200).json({
            "success": true,
            "message": "LangGPT Tools Executed",
            "data": executionResult,
            "chatId": sessionInfo
        })
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("chatBotController.js: useThirdPartyTools => ⚠️ LLM request aborted");
            return;
        }
        if (error.status === 429) {
            console.error("chatBotController.js: useThirdPartyTools => 🚨 Rate limit hit:", err.errorDetails);

            return res.status(429).json({
                success: false,
                message: "Rate limit exceeded. Please wait before retrying.",
                retryAfter: error?.errorDetails?.find(d => d['@type']?.includes("RetryInfo"))?.retryDelay || "60s"
            });
        }
        console.error('chatBotController.js: useThirdPartyTools => Error while using third part tools', error);
        return res.status(500).json({
            "success": false,
            "message": error.message
        })
    }
}

const oAuthVerification = async (req, res) => {
    try {
        console.log("Query Params:", req.query);
        let fileContent = {}
        const filePath = path.join(__dirname, '../authCredentials/user123Token.json');
        if (fs.existsSync(filePath)) {
            fileContent = JSON.parse(fs.readFileSync(filePath))
        }
        fileContent['secretCode'] = req?.query?.code
        fs.writeFileSync(filePath, JSON.stringify(fileContent), null, 2);

        await setToken()
        const redirectUrl = "http://localhost:3000/?auth=success";
        return res.send(`
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Redirecting...</title>
                <meta http-equiv="refresh" content="2;url=${redirectUrl}" />
                <style>
                  body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                    color: #fff;
                    text-align: center;
                  }
                  .card {
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(10px);
                    padding: 2rem 3rem;
                    border-radius: 16px;
                    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
                    animation: fadeIn 1s ease-in-out;
                  }
                  h2 {
                    margin-bottom: 0.5rem;
                    font-size: 1.8rem;
                  }
                  p {
                    margin: 0.5rem 0 1.5rem;
                    font-size: 1rem;
                  }
                  a {
                    display: inline-block;
                    background: #fff;
                    color: #0078ff;
                    text-decoration: none;
                    padding: 0.6rem 1.2rem;
                    border-radius: 8px;
                    font-weight: 600;
                    transition: background 0.3s;
                  }
                  a:hover {
                    background: #f0f0f0;
                  }
                  @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                </style>
              </head>
              <body>
                <div class="card">
                  <h2>✅ Authentication Successful</h2>
                  <p>You will be redirected shortly...</p>
                  <a href="${redirectUrl}">Go to App Now</a>
                </div>
              </body>
            </html>
        `);
    } catch (error) {
        console.error('chatBotController.js: oAuthVerification => Unable to make OAUTH Verification', error);
        return res.send(`
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Authentication Failed</title>
                <script>
                  // Show alert once page loads
                  window.onload = function() {
                    alert("Authentication failed. Please try again.");
                    // Redirect to your app after alert
                    window.location.href = "http://localhost:3000/?auth=failed";
                  }
                </script>
              </head>
              <body>
              </body>
            </html>
          `);

    }
}

const chatHistory = (req, res) => {
    try {
        let {
            chatId
        } = req.params;
        console.log('chatHistory', chatId);

        setTimeout(async () => {
            const messageHistory = await storeMessageHistory(chatId);
            const message = await messageHistory.getMessages()
            console.log('message', message);
            return res.json({
                success: true,
                message: 'Messages Retrieved',
                data: message
            })
        }, 10000);

    } catch (error) {
        console.error('chatBotController.js: chatHistory => Unable to retrieve chat history', error);
        return res.status(500).json({
            "success": false,
            "message": error.message
        })
    }

}

const chatTitles = async (req, res) => {
    try {
        let sessionInfo = uuid()
        const messageHistory = await storeMessageHistory(sessionInfo)
        const message = await messageHistory.getTitles();
        console.log('message', message);

        return res.json({
            success: true,
            message: 'Titles Fetched',
            data: message
        })
    } catch (error) {
        console.error('chatBotController.js: chatTitles => Unable to retrieve chat titles', error);
        return res.status(500).json({
            "success": false,
            "message": error.message
        })
    }
}

const editTitle = async (req, res) => {
    try {
        const { chatId, title } = req.body;
        console.log('edit', chatId, title);

        // await messageProducer(chatId, '', title, 'edit')

        const messageTitles = await storeMessageHistory(chatId);
        const editedInfo = await messageTitles.updateTitle(title);
        console.log('editedInfo', editedInfo);

        return res.json({
            success: true,
            message: "Title Updated",
            data: editedInfo
        })
    } catch (error) {
        console.error('chatBotController.js: updateChatTitle => Something isn`t right while updating title', error);
        return res.status(500).json({
            "success": false,
            "message": error.message
        })
    }
}

const deleteChat = async (req, res) => {
    try {
        const { chatId } = req.params;

        const messageHistory = await storeMessageHistory(chatId);
        await messageHistory.deleteThread()

        return res.json({
            success: true,
            message: "Chat Deleted Successfully"
        })
    } catch (error) {
        console.error('chatBotController.js: deleteChatTitle => Unable to delete message title thread', error);
        return res.status(500).json({
            "success": false,
            "message": error.message
        })
    }
}


async function collectFull(stream) {
    let text = "";
    for await (const chunk of stream) {
        if (typeof chunk === "string") {
            text += chunk;
        } else if (chunk.content) {
            text += chunk.content;
        } else if (chunk.response) {
            text += chunk.response;
        } else if (chunk.text) {
            text += chunk.text;
        } else if (chunk.delta) {
            text += chunk.delta;
        } else {
            console.log("Unknown chunk format:", chunk);
        }
    }
    return text;
}

const agentTool = async (query) => {
    try {
        let agentInfo = await classifyAgent(query)
        const executionResult = await toolClassifier(agentInfo, query)
        return executionResult
    } catch (error) {
        console.error('agentClassifier.js : agentTool => Something wrong while executing agent', error);
        return error;
    }
}


module.exports = {
    askLLM,
    uploadUserDoc,
    chatHistory,
    useThirdPartyTools,
    oAuthVerification,
    chatTitles,
    editTitle,
    deleteChat
}
