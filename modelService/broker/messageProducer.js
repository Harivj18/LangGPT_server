const { Kafka } = require('kafkajs');

const messageProducer = async (chatId, query, llmOutput, newChat) => {
    try {
        const kafka = new Kafka({
            clientId: "messageProducer",
            brokers: ["localhost:9092"]
        });

        const producer = kafka.producer();
        await producer.connect();

        console.log('messageProducer.js : messageProducer => Kafka Model Service Producer Connected Succcessfully')

        const msgResponse = await producer.send({
            topic: 'saveChat',
            messages: [{
                key: "key1",
                value: JSON.stringify({
                    chatId, 
                    query, 
                    llmOutput, 
                    newChat
                })
            }]
        });

        console.log('Message Delivered to Consumer:', msgResponse);

        await producer.disconnect();
        return "Success";

    } catch (error) {
        console.error('messageProducer.js : messageProducer => Unable to produce message to broker', error);
        return error;
    }
};

module.exports = {
    messageProducer
};
