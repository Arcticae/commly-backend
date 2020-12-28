import express from 'express';
import logger from 'morgan';
import * as dotenv from 'dotenv';
import apiRouter from './routes/api';

dotenv.config();
const app = express();
app.use(logger('dev'));
const port = process.env.PORT || 3000;

app.use('/api', apiRouter);

app.listen(port, () => logger(`App listening on port ${port}!`));
