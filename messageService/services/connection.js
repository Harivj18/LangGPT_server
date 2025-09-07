const mongoose = require('mongoose')

const connectMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('Mongo DB has been connected successfully ⚡');
        return
    } catch (error) {
        console.error('connection.js : connectMongo => Unable to reach Mongo db', error);
        throw error   
    }
}

module.exports = { connectMongo }