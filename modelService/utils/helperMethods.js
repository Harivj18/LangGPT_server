const { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const { Pinecone } = require('@pinecone-database/pinecone');
const { PDFLoader } = require('@langchain/community/document_loaders/fs/pdf');
const { DocxLoader } = require('@langchain/community/document_loaders/fs/docx');
const { TextLoader } = require('langchain/document_loaders/fs/text');
const { CSVLoader } = require('@langchain/community/document_loaders/fs/csv');
const { CheerioWebBaseLoader } = require('@langchain/community/document_loaders/web/cheerio');
const { YoutubeLoader } = require('@langchain/community/document_loaders/web/youtube');
const { StringOutputParser, CommaSeparatedListOutputParser, JsonOutputParser } = require('@langchain/core/output_parsers');
const { StructuredOutputParser, OutputFixingParser } = require('langchain/output_parsers');
const getModelLLM = (modelName, keyId, tokenLimit, key) => {
    return new Promise((resolve, reject) => {
        try {
            modelName = modelName.toUpperCase()
            tokenLimit ?? 100
            let model;
            console.log(`llm key`,process.env.GEMINI_API_KEY4);
            let geminiKey = key ?? process.env[`GEMINI_API_KEY${keyId}`]
            if (modelName === 'FLASH') {
                model = new ChatGoogleGenerativeAI({
                    model: 'gemini-2.0-flash',
                    apiKey: geminiKey,
                    temperature: 0.5,
                    maxOutputTokens: tokenLimit,
                    maxRetries: 5
                })
            } else if (modelName === 'EMBEDDING') {
                model = new GoogleGenerativeAIEmbeddings({
                    modelName: 'embedding-001',
                    apiKey: process.env.GEMINI_API_KEY4,
                })
            }
            resolve(model);
        } catch (error) {
            console.error(`helperMethods.js: getModelLLM => Unable to intiate ${modelName} Model`, error);
            reject(error)
        }
    })
}

const vectorDB = (dbName) => {
    return new Promise((resolve, reject) => {
        try {
            const PineCone = new Pinecone({
                apiKey: process.env.PINECONE_API_KEY
            })

            const pineconeDB = PineCone.Index(dbName);

            resolve(pineconeDB)
        } catch (error) {
            console.error(`helperMethods.js: vectorDB => Error occurs while connecting Pinecone DB`, error);
            reject(error)
        }
    })
}

const documentLoader = (filePath, docType) => {
    return new Promise(async (resolve, reject) => {
        try {
            let loader;
            console.log('docType', docType);

            switch (docType) {
                case 'pdf':
                    loader = new PDFLoader(filePath);
                    break;
                case 'docx':
                    loader = new DocxLoader(filePath);
                    break;
                case 'txt':
                    loader = new TextLoader(filePath);
                    break;

                case 'web':
                    loader = new CheerioWebBaseLoader(filePath);
                    break;

                case 'youtube':
                    loader = YoutubeLoader.createFromUrl(
                        filePath,
                        { language: "en" }
                    )
                    break;

                case 'csv':
                    loader = new CSVLoader(filePath);
                    break;

                default:
                    loader = new PDFLoader(filePath);
                    break;
            }
            const document = await loader.load();
            resolve(document);
        } catch (error) {
            console.error(`helperMethods.js: documentLoader => Unable to load the user uploaded document`, error);
            reject(error)
        }
    })
}


const resultParser = (question) => {
    return new Promise((resolve, reject) => {
        try {
            question = question.toLowerCase()
            let parser;
            switch (true) {
                case question.includes('list'):
                    parser = new CommaSeparatedListOutputParser()
                    break;

                case question.includes('json'):
                    parser = new JsonOutputParser()
                    break;

                default:
                    parser = new StringOutputParser()
                    break;
            }
            resolve(parser)
        } catch (error) {
            console.error(`helperMethods.js: documentLoader => Unable to load the user uploaded document`, error);
            reject(error)
        }
    })
}

const cleanText = (text) => {
    return text
        .replace(/(\r\n|\n|\r)/gm, ' ')       // replace line breaks with space
        .replace(/[ ]{2,}/g, ' ')             // collapse multiple spaces
        .replace(/(\b\w(?:\s\w)+\b)/g, (match) => {
            // Rejoin words that are clearly split up letter by letter
            const cleaned = match.replace(/\s/g, '');
            return cleaned.length <= 25 ? cleaned : match; // avoid over-correction
        })
        .replace(/\s+/g, ' ')                 // extra safety
        .trim();
};

const outputFixer = (content) => {
    return new Promise(async (resolve, reject) => {
        try {
            const llm = await getModelLLM('flash', 8);
            const jsonParser = await resultParser('json result')
            console.log('helperMethods.js : outputFixer => Json parser', jsonParser);

            const parser = OutputFixingParser.fromLLM(llm, jsonParser);
            const fixedOutput = await parser.parse(content);

            console.log('helperMethods.js : outputFixer => Result of fixedOutput', fixedOutput);

            resolve(fixedOutput)
        } catch (error) {
            console.error('helperMethods.js : outputFixer => Unable to fix the output json', error);
            reject(error)
        }
    })
}

module.exports = {
    getModelLLM,
    vectorDB,
    documentLoader,
    cleanText,
    resultParser,
    outputFixer
}