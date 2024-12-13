import express from 'express';
import router from './routes/index';

const app = express();

app.use(express.json());
app.use(router);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
