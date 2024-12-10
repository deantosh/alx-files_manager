import express from "express";

const app = express();

app.use(express.json());

// Add routes
import router from './routes/index.js';
app.use(router);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
