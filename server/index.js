require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const favoriteRoutes = require('./routes/favorites');
const analysisRoutes = require('./routes/analysis');
const stockRoutes = require('./routes/stock');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/favorites', favoriteRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/stock', stockRoutes);

app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
