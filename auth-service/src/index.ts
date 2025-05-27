import express from 'express';

const app = express();
const port = 3000;

app.get('/', (req: express.Request, res: express.Response) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(port, () => console.log(`Auth service running on port ${port}`));
