const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favoritesController');

router.get('/', favoritesController.getFavorites);
router.post('/', favoritesController.addFavorite);
router.delete('/:code', favoritesController.removeFavorite);
router.put('/reorder', favoritesController.reorderFavorites);

module.exports = router;
