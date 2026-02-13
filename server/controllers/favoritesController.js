const favoritesService = require('../services/favoritesService');

const getFavorites = (req, res) => {
  try {
    const favorites = favoritesService.getFavorites();
    res.json({ success: true, data: favorites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addFavorite = (req, res) => {
  try {
    const { code, name } = req.body;
    
    if (!code || !name) {
      return res.status(400).json({ success: false, message: '股票代码和名称不能为空' });
    }
    
    const favorites = favoritesService.addFavorite(code, name);
    res.json({ success: true, data: favorites, message: '添加成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const removeFavorite = (req, res) => {
  try {
    const { code } = req.params;
    const favorites = favoritesService.removeFavorite(code);
    res.json({ success: true, data: favorites, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const reorderFavorites = (req, res) => {
  try {
    const { codes } = req.body;
    
    if (!codes || !Array.isArray(codes)) {
      return res.status(400).json({ success: false, message: '股票代码列表不能为空' });
    }
    
    const favorites = favoritesService.reorderFavorites(codes);
    res.json({ success: true, data: favorites, message: '排序成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  reorderFavorites
};
