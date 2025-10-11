const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: "messageProducer",
    brokers: ["localhost:9092"]
});

const producer = kafka.producer();

const messageProducer = async (key, chatId, query, llmOutput, newChat) => {
    try {
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

        console.log(`Message Delivered to Consumer - ${topic}`, msgResponse);

        await producer.disconnect();
        return "Success";
    } catch (error) {
        console.error('messageProducer.js : messageProducer => Unable to produce message to broker', error);
        return error;
    }
};

const connectProducer = async () => {
    try {
        await producer.connect();
        console.log('messageProducer.js : connectProducer => Kafka Producer has been Connected successfully 🤝');
        return
    } catch (error) {
        console.error('messageProducer.js : connectProducer => Something isn`t fine on kafka producer connection', error);
        return error;
    }
}

const disconnectProducer = async () => {
    try {
        await producer.disconnect();
        console.log('messageProducer.js : disconnectProducer => Kafka Producer disconnected successfully');
        return
    } catch (error) {
        console.error('messageProducer.js : disconnectProducer => Issue while disconnecting Kafka Broker', error);
        return error;
    }
}

module.exports = {
    messageProducer,
    disconnectProducer,
    connectProducer
};
