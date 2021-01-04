import express from 'express';
import logger from 'morgan';
import * as dotenv from 'dotenv';
import http from 'http';
import WebSocket from 'ws';
import apiRouter from './routes/api';
import { handleWebsocketMessages } from './wsMessaging';

dotenv.config();
const app = express();
app.use(logger('dev'));
const port = process.env.PORT || 3000;

app.use('/api', apiRouter);

const httpServer = http.createServer(app);
const wss = new WebSocket.Server({ server: httpServer });
wss.on('connection', (ws) => {
  handleWebsocketMessages(ws);
});

httpServer.listen(port, () => logger(`App listening on port ${port}!`));
