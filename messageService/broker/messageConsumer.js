const { Kafka } = require('kafkajs');
const { messageClassifier } = require('../controllers/messageController')

const messageConsumer = async () => {
    try {
        const kafka = new Kafka({
            clientId: "messageConsumer",
            brokers: ["localhost:9092"]
        });

        const consumer = kafka.consumer({ groupId: "msg-group", allowAutoTopicCreation: true });
        await consumer.connect();
        await consumer.subscribe({ topic: "saveChat" , fromBeginning: false});

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                console.log({
                    partition,
                    offset: message.offset,
                    key: message.key?.toString(),
                    value: JSON.parse(message.value.toString())
                });
                let inputJson = JSON.parse(message.value.toString())
                await messageClassifier(inputJson)
            }
        });
    } catch (error) {
        console.log('messageConsumer.js : messageConsumer => Unable to consume broker message', error);
        return error;
    }
};

module.exports = {
    messageConsumer
};