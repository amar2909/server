const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const messageRoute = require("./routes/messagesRoute");
const app = express(); // Import express
const socket = require("socket.io");
const dotenv = require("dotenv"); // Import dotenv module

dotenv.config(); // Load environment variables from .env file

const MONGO_CRED = process.env.MONGO_CRED; // Access environment variable

app.use(cors());

// Add options to the CORS middleware
const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(express.json());
app.use("/api/auth", cors(corsOptions), userRoutes);
app.use("/api/messages", cors(corsOptions), messageRoute);

mongoose
  .connect(MONGO_CRED)
  .then(() => {
    console.log("DB connected");
  })
  .catch((err) => {
    console.log(err.message);
  });

const server = app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});

const io = socket(server, {
  cors: corsOptions, // Pass the same CORS options to socket.io
});

global.onlineUsers = new Map();

io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-receive", data.message);
    }
  });
});