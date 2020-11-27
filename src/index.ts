import express from 'express';
const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (req, res) => res.send('Hello World!'));

app.listen(port, () => console.log(`App listening on port ${port}!`));
