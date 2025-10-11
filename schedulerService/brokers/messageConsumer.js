const { Kafka } = require('kafkajs');
const { jobScheduler } = require('../controllers/jobController')

const schedulerConsumer = async () => {
    try {
        const kafka = new Kafka({
            clientId: "scheduler",
            brokers: ["localhost:9092"]
        })

        const consumer = kafka.consumer({ groupId: "JobScheduler" });
        await consumer.connect()
        await consumer.subscribe({ topic: "jobScheduler", fromBeginning: false })

        await consumer.run({
            eachMessage: async (topic, partition, message) => {
                console.log('Message Topic', topic);
                console.log('Message partition', partition);
                console.log('Consumer offset', message?.offset);
                console.log('Consumer Key', message?.key);
                console.log('Consumer Message', JSON.parse(JSON.stringify(message)));
                const jobMessage = JSON.parse(JSON.stringify(message));
                await jobScheduler(jobMessage);
            }
        })
    } catch (error) {
        console.error('messageconsumer.js : scheduleConsumer => Something wrong while consuming job message', error);
        reject(error)
    }
}

module.exports = {
    schedulerConsumer
}