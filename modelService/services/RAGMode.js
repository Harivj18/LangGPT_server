const {
    getModelLLM,
    vectorDB,
    documentLoader,
    cleanText,
    resultParser
} = require('../utils/helperMethods');
const { ChatPromptTemplate } = require('@langchain/core/prompts')
const { v4: uuid } = require('uuid');
const { MessagesPlaceholder } = require('@langchain/core/prompts');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { ConversationChain } = require('langchain/chains');
const { BufferMemory } = require('langchain/memory');
const _ = require('lodash')


/* 
    RAG Q&A for already uploaded Document Knowledge Base
*/

const ragLLM = async function* (query) {
    try {
        const RAGresult = await embedandRetrieve(query);

        const context = await cleanRetrievedDoc(RAGresult);

        // const llmResponse = await summarizeContext(context, query);

        for await (const llmResponse of summarizeContext(context, query)) {
            console.log('llmResponse', llmResponse);

            yield llmResponse
        }

        // resolve(llmResponse)

    } catch (error) {
        console.error('RAGMode.js: ragLLM => Error while using rag with llm', error);
        throw error;
    }
}

const embedandRetrieve = (query) => {
    return new Promise(async (resolve, reject) => {
        try {
            const pineconeDB = await vectorDB(process.env.PINECONE_INDEX_NAME)

            const embedModel = await getModelLLM('embedding', 2);

            const userInput = await embedModel.embedQuery(query);

            const retrieveData = await pineconeDB.query({
                topK: 3,
                vector: userInput,
                includeMetadata: true
            })

            resolve(retrieveData)
        } catch (error) {
            console.error('RAGMode.js: embedandRetrieve => Issue occurs while embedding user query', error);
            reject(error)
        }
    })
}

const cleanRetrievedDoc = (ragData) => {
    return new Promise((resolve, reject) => {
        try {
            const cleanDocument = ragData.matches.map(data => data?.metadata?.text).join('\n\n');

            resolve(cleanDocument)
        } catch (error) {
            console.error('RAGMode.js: cleanRetrievedDoc => Something wrong while cleaning retrieved Data', error);
            reject(error)
        }
    })
}

const summarizeContext = async function* (context, question) {
    try {
        const model = await getModelLLM('flash',10);

        const memory = new BufferMemory({
            returnMessages: true,
            memoryKey: "chat_history"
        });

        const parser = await resultParser(question)

        const prompt = ChatPromptTemplate.fromMessages([
            ["system", `You are a helpful AI assistant. 
                Use the provided context to answer the user's question with a clear and meaningful response.
                - If the context is relevant to the question, answer directly using it.  
                - If the context is not relevant or does not contain enough information, summarize the context briefly and then provide the best possible answer.`],
            new MessagesPlaceholder('chat_history'),
            ["human", "context : {input}"]
        ])

        const chain = new ConversationChain({
            prompt,
            llm: model,
            memory,
            parser
        });

        const combinedInput = `Context: \n${context}\nQuestion: \n${question}`;


        const response = await chain.stream({
            input: combinedInput
        })

        for await (let chunk of response) {
            console.log('Summarize chunk response', chunk);
            yield chunk
        }
    } catch (error) {
        console.error('RAGMode.js: summarizeContext => Unable to summarize vector result context', error);
        throw error
    }
}

/* 
    Service call for Uploading Document for Knowledge Base - RAG
*/

const embedUploadDoc = (filePath, docType) => {
    return new Promise(async (resolve, reject) => {
        try {
            const pineconeDB = await vectorDB(process.env.PINECONE_INDEX_NAME)

            const loadDocs = await documentLoader(filePath, docType)

            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 400,
                chunkOverlap: 50
            })

            const splitDocs = await splitter.createDocuments(loadDocs.map(val => val.pageContent));

            const cleanDocument = splitDocs.map((doc) => ({
                ...doc,
                pageContent: cleanText(doc.pageContent)
            }))

            const embedDocument = await embedUserDocument(cleanDocument, docType, filePath);


            if (embedDocument.length > 0) {
                console.log('RAGMode.js: embedUploadDoc => Uploaded document was embedded successfully ');
                await pineconeDB.upsert(embedDocument);
                resolve('Success')
            } else {
                console.info('RAGMode.js: embedUploadDoc => Unable to embed the Document, Invalid Document or not machine Friendly');
                resolve('Invalid Document Structure')
            }


        } catch (error) {
            console.error('RAGMode.js: embedUploadDoc => Unable to insert embedding into vector db', error);
            if (error.message.includes("dimension 0")) {
                console.error("🚨 Embedding dimension mismatch. Skipping bad vectors.");
                reject('Uploaded Document Structure is not good')
            } else {
                reject(error)
            }
        }
    })
}

function chunkArray(data, size) {
    const chunks = [];
    for (let i = 0; i < data.length; i += size) {
        chunks.push(data.slice(i, i + size));
    }
    return chunks;
}

const embedUserDocument = (doc, fileType, fileName) => {
    return new Promise(async (resolve, reject) => {
        try {
            const embedModel = await getModelLLM('embedding',4);
            const chunks = chunkArray(doc, 5);
            let allEmbeddings = [];

            for (const chunk of chunks) {
                const texts = chunk.map(val => val.pageContent);

                const vectors = await embedModel.embedDocuments(texts);

                const filteredVectors = vectors.filter(v => Array.isArray(v) && v.length > 0);

                console.log(`✅ Keeping ${filteredVectors.length} valid embeddings, skipping ${vectors.length - filteredVectors.length} empty ones`);

                if (filteredVectors.length > 0) {
                    
                    const formVectorDoc = filteredVectors.map((val, i) => {
                        const metaData = chunk[i].metadata || {};
                        return {
                            id: `vectorData_${uuid()}`,
                            values: val,
                            metadata: {
                                text: chunk[i].pageContent,
                                source: fileName,
                                category: fileType,
                                // ...metaData
                            }
                        };
                    });
    
                    allEmbeddings = allEmbeddings.concat(formVectorDoc);
                }

            }

            resolve(allEmbeddings)
        } catch (error) {
            console.error('RAGMode.js: embedUserDocument => Error while embedding userDocument', error);
            reject(error)
        }
    })
}


module.exports = { ragLLM, embedUploadDoc }