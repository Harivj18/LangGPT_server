const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config({ path: './config/.env' });
const llmController = require('./routes/chatRoutes');
const { connectMongo } = require('./services/connection');
const { connectProducer } = require('./broker/messageProducer')

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
}));

connectMongo();
connectProducer();
app.use(express.json());
app.use('/', llmController)

const PORT = process.env.PORT || 5000;

app.listen(PORT, (err) => {
  if (err) {
    console.error(`Error while starting server on PORT ${PORT}:`, err);
  } else {
    console.log(`Server started on http://localhost:${PORT}`);
  }
});