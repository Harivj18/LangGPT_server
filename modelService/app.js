const cluster = require('cluster')
const os = require('os')
const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const cookies = require('cookie-parser');
dotenv.config({ path: './config/.env' });
const llmController = require('./routes/chatRoutes');
const googleLoginRoutes = require('./routes/googleLoginRoutes');
const githubLoginRoutes = require('./routes/githubLoginRoutes');
const authRoutes = require('./routes/authRoutes')
const { connectMongo } = require('./services/connection');
const { connectProducer } = require('./broker/messageProducer');
const { Worker } = require('bullmq')
const { redisInfo } = require('./services/RedisConnection');
const { mailTool } = require('./tools/mailTool');
const { notifyUser } = require('./tools/notifier');
const session = require('express-session');

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    const numCPUs = os.cpus().length;
    for (let i = 0; i < 1; i++) {
        cluster.fork({ ROLE: "processor" });
    }


    app.use(cors({
        origin: process.env.CLIENT_URL1,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        credentials: true
    }));

    app.use(cookies());
    app.use(session({
        secret: process.env.JWT_SECRET_KEY,
        resave: false,
        saveUninitialized: true
    }))
    connectMongo();
    // connectProducer();
    app.use(express.json());
    app.use('/', llmController)
    app.use('/protectedRoutes',authRoutes)
    app.use('/langGPT/auth',authRoutes)
    app.use('/auth', googleLoginRoutes)
    app.use('/github', githubLoginRoutes)

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, (err) => {
        if (err) {
            console.error(`Error while starting server on PORT ${PORT}:`, err);
        } else {
            console.log(`Server started on http://localhost:${PORT}`);
        }
    });

} else {
    if (process.env.ROLE === "processor") {
        console.log(`Processor worker ${process.pid} started`);

        const worker = new Worker(
            "mailQueue",
            async job => {
                if (job?.data?.tool) {
                    let tool = job?.data?.tool;
                    if (tool.toUpperCase() === "MAIL") {
                        // await mailTool(job?.data?.query);
                    } else {
                        await notifyUser(job?.data?.query)
                    }
                } else {
                    // await mailTool(job?.data?.query);
                }
                console.log(`✅ Job ${job.id} completed for ${job?.data?.query || job?.data}`);

            },
            { connection: redisInfo() }
        )

        worker.on("completed", async job => {
            console.log(`Message Delivery ${job.id} completed for ${job?.data?.query || job?.data}`);
        });

        worker.on("failed", (job, err) => {
            console.error(`❌ Job ${job.id} failed`, err);
        });
    }
}