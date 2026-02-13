import axios from 'axios';

const API_BASE_URL = '/api';

export const favoriteApi = {
  async getFavorites() {
    try {
      const response = await axios.get(`${API_BASE_URL}/favorites`);
      return response.data.data;
    } catch (error) {
      console.error('获取自选股失败:', error);
      throw error;
    }
  },

  async addFavorite(code, name) {
    try {
      const response = await axios.post(`${API_BASE_URL}/favorites`, { code, name });
      return response.data.data;
    } catch (error) {
      console.error('添加自选股失败:', error);
      throw error;
    }
  },

  async removeFavorite(code) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/favorites/${code}`);
      return response.data.data;
    } catch (error) {
      console.error('删除自选股失败:', error);
      throw error;
    }
  },

  async reorderFavorites(codes) {
    try {
      const response = await axios.put(`${API_BASE_URL}/favorites/reorder`, { codes });
      return response.data.data;
    } catch (error) {
      console.error('排序自选股失败:', error);
      throw error;
    }
  }
};
