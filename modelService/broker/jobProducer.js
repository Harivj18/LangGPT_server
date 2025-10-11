const { Kafka } = require('kafkajs');

const produceJobs = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            const kafka = new Kafka({
                clientId: "jobScheduler",
                brokers: ["localhost:9092"]
            })

            const producer = kafka.producer()
            await producer.connect()

            const result = await producer.send({
                topic: "jobScheduler",
                messages: [{
                    key: "job1",
                    value: JSON.stringify({
                        
                    })
                }]
            })
        } catch (error) {
            console.error('jobProducer.js : produceJobs => Unable to schedule job via producer', error);
            reject(error)
        }
    })
}