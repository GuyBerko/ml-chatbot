import bodyParser from "body-parser";
import express from "express";
import Bot, { bottender } from "bottender";
import dotenv from "dotenv";
import morgan from "morgan";
import { sendPaymentSuccessfulMessage, sendTest } from './index';
import { userRouter } from './routes/user'

dotenv.config();

const app = bottender({
  dev: process.env.NODE_ENV !== "production",
});

const port = Number(process.env.PORT) || 4004;

// the request handler of the bottender app
const handle = app.getRequestHandler();

process
  .on("unhandledRejection", (reason, p) => {
    console.error(reason, "Unhandled Rejection at Promise", p);
  })
  .on("uncaughtException", (err) => {
    console.error(err, "Uncaught Exception thrown");
  });

app.prepare().then(() => {
  const server = express();

  server.use(
    bodyParser.json({
      verify: (req, _, buf) => {
        (req as any).rawBody = buf.toString();
      },
    })
  );

  server.use(
    morgan(
      ":method :url status :status :res[content-length] - :response-time ms",
      { skip: (req, res) => req.url === "/ready" || req.url === "/live" }
    )
  );

  server.use(userRouter);

  server.get("/ready", (req, res) => {
    res.status(200).send();
  });

  server.get("/live", (req, res) => {
    res.status(200).send();
  });

  server.get("/test", async (req, res) => {
    try{
      await sendTest();
      res.status(200).send();
    }
    catch(err){
      console.log('in catch');
      console.log(err.stack);
      res.status(500).send('error');
    }
  });

  server.post("/complete-payment", (req, res) => {
    const { userId } = req.body;
    sendPaymentSuccessfulMessage(userId).then(() => {});
    res.status(200).send();
  });

  server.post("/follow-up", async (req, res) => {
    //await followUp();
    res.status(200).send();
  });

  // route for webhook request
  server.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, () => {
    console.log(`> Ready on ${port}`);
  });
});
