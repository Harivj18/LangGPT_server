const {Queue, QueueScheduler, Worker} = require('bullmq');

const scheduleJob = () => {
    return new Promise((resolve, reject) => {
        try {
            
        } catch (error) {
            console.error('bullmq.js : scheduleJob => Unable to schedule a job at the moment',error);
            reject(error)
        }
    })
}