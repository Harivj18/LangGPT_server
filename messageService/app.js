const express = require('express');
const app = express()
const cors = require('cors');
const dotenv = require('dotenv');
const { messageConsumer } = require('./broker/messageConsumer');
const { connectMongo } = require('./services/connection')

dotenv.config({ path: './config/.env' })

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
}))

connectMongo()
messageConsumer()

app.listen(process.env.PORT, (err) => {
    if (err) {
        console.error('app.js => Unable to run application on Port :', process.env.PORT);
        throw err
    }
    console.info('app.js => Application is listening on Port :', process.env.PORT);
})