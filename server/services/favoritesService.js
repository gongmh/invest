const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/favorites.json');

const defaultFavorites = [
  { code: '600000', name: '浦发银行' },
  { code: '000001', name: '平安银行' },
  { code: '600036', name: '招商银行' },
  { code: '000002', name: '万科A' },
  { code: '600519', name: '贵州茅台' }
];

const ensureDataFile = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultFavorites, null, 2));
  }
};

const getFavorites = () => {
  ensureDataFile();
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(data);
};

const addFavorite = (code, name) => {
  ensureDataFile();
  const favorites = getFavorites();
  
  if (favorites.some(f => f.code === code)) {
    throw new Error('该股票已在自选列表中');
  }
  
  favorites.push({ code, name });
  fs.writeFileSync(DATA_FILE, JSON.stringify(favorites, null, 2));
  return favorites;
};

const removeFavorite = (code) => {
  ensureDataFile();
  let favorites = getFavorites();
  favorites = favorites.filter(f => f.code !== code);
  fs.writeFileSync(DATA_FILE, JSON.stringify(favorites, null, 2));
  return favorites;
};

const reorderFavorites = (codes) => {
  ensureDataFile();
  const favorites = getFavorites();
  const reordered = [];
  
  for (const code of codes) {
    const stock = favorites.find(f => f.code === code);
    if (stock) {
      reordered.push(stock);
    }
  }
  
  fs.writeFileSync(DATA_FILE, JSON.stringify(reordered, null, 2));
  return reordered;
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  reorderFavorites
};
