const express = require('express');
const path = require('path');
const { 
  fetchFinalScores, 
  getNominationLeaders, 
  getParticipants, 
  getNominations, 
  getBlocks 
} = require('./google_sheets');

const app = express();
const PORT = process.env.PORT || 3000;

// Статические файлы
app.use(express.static(path.join(__dirname)));

// Конфигурация
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key';
const ADMIN_IDS = (process.env.ADMIN_IDS || '').split(',')
  .filter(id => id)
  .map(id => parseInt(id));

// Проверка админских прав
function isAdmin(userId) {
  return ADMIN_IDS.includes(parseInt(userId));
}

// Middleware для проверки авторизации
function authMiddleware(req, res, next) {
  const userId = req.query.user_id;
  if (!userId || !isAdmin(parseInt(userId))) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
}

// Получение фильтров (номинации и блоки)
app.get('/api/filters', async (req, res) => {
  try {
    const nominations = await getNominations();
    const blocks = await getBlocks();
    res.json({
      nominations,
      blocks
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получение оценок с фильтрацией
app.get('/api/scores', authMiddleware, async (req, res) => {
  const nomination = req.query.nomination;
  const block = req.query.block;
  
  try {
    const scores = await fetchFinalScores(nomination, block);
    res.json({ scores });
  } catch (error) {
    console.error('Error fetching scores:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получение лидеров в номинации
app.get('/api/leaders', authMiddleware, async (req, res) => {
  const nomination = req.query.nomination;
  const limit = parseInt(req.query.limit) || 5;
  
  try {
    const leaders = await getNominationLeaders(nomination, limit);
    res.json({ leaders });
  } catch (error) {
    console.error('Error fetching leaders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получение списка участников с фильтрацией по блоку
app.get('/api/participants', authMiddleware, async (req, res) => {
  const block = req.query.block;
  
  try {
    const participants = await getParticipants(block);
    res.json({ participants });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: error.message });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 