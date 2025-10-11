const { jobClassifier } = require('./agentClassifier');
const { createQueue, schedulerInfo } = require('../services/bullmq');

module.exports = {
    jobScheduler: (query) => {
        return new Promise(async (resolve, reject) => {
            try {
                const agentResult = await jobClassifier(query);
                console.log('agentResult', agentResult);
                const getSchedulerInfo = await schedulerInfo(query)
                await createQueue(agentResult, query, getSchedulerInfo);
                resolve('Job Scheduled Successfully')
            } catch (error) {
                console.error("jobScheduler.js : jobScheduler => Issue while scheduling jobs", error);
                reject(error)
            }
        })
    }
}