import express from "express";
import { json } from "body-parser";
import morgan from "morgan";
import { bot, secretPath, resumeChat } from "./services/telegram";

const server = express();

// Setup trust proxy to allow non https requests
server.set("trust proxy", true);

server.use(json());

server.use(
  morgan(
    ":method :url status :status :res[content-length] - :response-time ms",
    { skip: (req, res) => req.url === "/ready" || req.url === "/live" }
  )
);

server.use(bot.webhookCallback(secretPath));

// Throw error for requests that are not part of the valid routes
server.get("/ready", (req, res) => {
  res.status(200).send();
});

server.get("/live", (req, res) => {
  res.status(200).send();
});

server.post("/complete-payment", (req, res) => {
  const { userId, lastMessage, messageId } = req.body;
  resumeChat(userId, lastMessage, messageId).then(() => {});
  res.status(200).send();
});

server.get("*", (req, res) => {
  res.status(404).send("You seems to be lost, did you try waze?");
});

process
  .on("unhandledRejection", (reason, p) => {
    console.error(reason, "Unhandled Rejection at Promise", p);
  })
  .on("uncaughtException", (err) => {
    console.error(err, "Uncaught Exception thrown");
  });

export { server };
