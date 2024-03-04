import express from "express";
import * as bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors";

import {
  userRouter,
  //chatBotRouter,
  analyticsRouter,
  promotionsRouter,
  paymentRouter,
} from "./routes";

const server = express();

// Setup trust proxy to allow non https requests
server.set("trust proxy", true);

//server.use(json());
server.use((req, res, next) => {
  if (req.originalUrl.includes('/stripe-webhook')) {
    next();
  } else {
    bodyParser.json()(req, res, next);
  }
});
server.use(cors());

server.use(
  morgan(
    ":method :url status :status :res[content-length] - :response-time ms",
    { skip: (req, res) => req.url === "/ready" || req.url === "/live" }
  )
);

server.use([
  userRouter,
  //chatBotRouter,
  analyticsRouter,
  promotionsRouter,
  paymentRouter,
]);

// Throw error for requests that are not part of the valid routes
server.get("/ready", (req, res) => {
  res.status(200).send();
});

server.get("/live", (req, res) => {
  res.status(200).send();
});

server.get("*", (req, res) => {
  res.status(404).send("You seems to be lost, did you try waze?");
});

export { server };
