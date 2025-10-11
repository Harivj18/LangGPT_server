const mongoose = require('mongoose')

const connectMongo = async() => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('connection.js : connectMongo => Mongo Db has been connected successfully ⚡');
        return
    } catch (error) {
        console.error("connection.js : connectMongo => Something isn't fine while connecting Mongo DB",error);
        throw new Error("connection.js : connectMongo => Unable to Connect Mongo Db");
    }
}

module.exports = {
    connectMongo
}