import express from 'express';

const app = express();

app.get('/health', (req, res) => {
  res.send('OK');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});