const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const port = process.env.PORT || 8082
const connectMongo = require('./service/connection');
const { schedulerConsumer } = require('./brokers/messageConsumer');

app.use(cors({
    origin: "*",
    methods: ["POST", "GET", "PUT", "DELETE", "PATCH"]
}))

connectMongo()
schedulerConsumer()

app.listen(port, (err) => {
    if (err) {
        console.error(`app.js => Unable to Start app on port : ${port}`);
    }
    console.log(`app.js : Server is listening on port :${port}`);
})