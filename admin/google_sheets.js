const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Если вы изменяете эти области, удалите файл token.json
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

/**
 * Получение и обновление учетных данных для доступа к API
 */
async function getCredentials() {
  let credentials = null;
  const tokenPath = path.join(__dirname, 'token.json');
  
  // Проверяем, есть ли сохраненный токен
  if (fs.existsSync(tokenPath)) {
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    credentials = google.auth.fromJSON(token);
  }
  
  // Если нет действительных учетных данных, запускаем процесс авторизации
  if (!credentials || !credentials.valid) {
    if (credentials && credentials.refreshToken) {
      await credentials.refreshAccessToken();
    } else {
      const credentialsPath = path.join(__dirname, 'credentials.json');
      const content = fs.readFileSync(credentialsPath, 'utf8');
      const { client_secret, client_id, redirect_uris } = JSON.parse(content).installed;
      
      const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]
      );
      
      // Открываем браузер для авторизации
      console.log('Authorize this app by visiting this url:');
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      console.log(authUrl);
      
      // Здесь следует добавить код для получения кода авторизации
      // В реальном приложении нужно реализовать веб-сервер для обработки callback
      // В этом примере мы ожидаем ввод кода пользователем
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      
      const code = await new Promise((resolve) => {
        rl.question('Enter the code from that page here: ', (code) => {
          rl.close();
          resolve(code);
        });
      });
      
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);
      credentials = oAuth2Client;
      
      // Сохраняем токен для следующего запуска
      fs.writeFileSync(tokenPath, JSON.stringify(tokens));
    }
  }
  
  return credentials;
}

/**
 * Получение сервиса для работы с Google Sheets
 */
async function getSheetService() {
  const auth = await getCredentials();
  const sheets = google.sheets({ version: 'v4', auth });
  return sheets.spreadsheets;
}

/**
 * Получение списка номинаций из таблицы
 */
async function getNominations() {
  try {
    const sheets = await getSheetService();
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const range = 'NewRes!A:A';
    
    const response = await sheets.values.get({
      spreadsheetId,
      range,
    });
    
    const rows = response.data.values || [];
    if (rows.length === 0) {
      return [];
    }
    
    // Получаем уникальные номинации из первого столбца
    const nominationsSet = new Set();
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row && row[0]) {
        nominationsSet.add(row[0]);
      }
    }
    
    return Array.from(nominationsSet).sort();
  } catch (error) {
    console.error('Error fetching nominations:', error);
    throw error;
  }
}

/**
 * Получение списка блоков из таблицы
 */
async function getBlocks() {
  try {
    const sheets = await getSheetService();
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const range = 'NewRes!B:B';
    
    const response = await sheets.values.get({
      spreadsheetId,
      range,
    });
    
    const rows = response.data.values || [];
    if (rows.length === 0) {
      return [];
    }
    
    // Получаем уникальные блоки из второго столбца
    const blocksSet = new Set();
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row && row.length > 0 && row[0]) {
        blocksSet.add(row[0]);
      }
    }
    
    return Array.from(blocksSet).sort();
  } catch (error) {
    console.error('Error fetching blocks:', error);
    throw error;
  }
}

/**
 * Получение финальных оценок с фильтрацией по номинации и блоку
 */
async function fetchFinalScores(nomination = null, block = null) {
  try {
    const sheets = await getSheetService();
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const range = 'NewRes!A:Z';
    
    const response = await sheets.values.get({
      spreadsheetId,
      range,
    });
    
    const rows = response.data.values || [];
    if (rows.length === 0) {
      return [];
    }
    
    const headers = rows[0];
    const scores = [];
    
    for (let i = 1; i < rows.length; i++) {
      let row = rows[i];
      
      // Дополняем строку пустыми значениями, если не хватает столбцов
      if (row.length < headers.length) {
        row = [...row, ...Array(headers.length - row.length).fill('')];
      }
      
      // Создаем объект с данными строки
      const rowData = {};
      for (let j = 0; j < headers.length; j++) {
        rowData[headers[j]] = row[j] || '';
      }
      
      // Применяем фильтры
      if (nomination && rowData['Номинация'] !== nomination) {
        continue;
      }
      if (block && rowData['Блок'] !== block) {
        continue;
      }
      
      // Собираем оценки судей
      const judgeScores = [];
      for (const header of headers) {
        if (header.startsWith('Судья')) {
          const score = rowData[header];
          if (score && score.trim()) {
            judgeScores.push({
              judge: header,
              score: parseFloat(score)
            });
          }
        }
      }
      
      if (judgeScores.length > 0) {
        scores.push({
          participant: rowData['Участник'] || '',
          scores: judgeScores
        });
      }
    }
    
    return scores;
  } catch (error) {
    console.error('Error fetching scores:', error);
    throw error;
  }
}

/**
 * Получение лидеров в номинации
 */
async function getNominationLeaders(nomination, limit = 5) {
  try {
    const scores = await fetchFinalScores(nomination);
    
    // Вычисляем средний балл для каждого участника
    const participants = {};
    for (const score of scores) {
      const participant = score.participant;
      if (!participants[participant]) {
        participants[participant] = {
          participant,
          totalScore: 0,
          count: 0
        };
      }
      
      for (const judgeScore of score.scores) {
        participants[participant].totalScore += judgeScore.score;
        participants[participant].count++;
      }
    }
    
    // Вычисляем средний балл и сортируем
    const leaders = [];
    for (const participantId in participants) {
      const participant = participants[participantId];
      if (participant.count > 0) {
        leaders.push({
          participant: participant.participant,
          averageScore: participant.totalScore / participant.count
        });
      }
    }
    
    leaders.sort((a, b) => b.averageScore - a.averageScore);
    return leaders.slice(0, limit);
  } catch (error) {
    console.error('Error getting nomination leaders:', error);
    throw error;
  }
}

/**
 * Получение списка участников с фильтрацией по блоку
 */
async function getParticipants(block = null) {
  try {
    const sheets = await getSheetService();
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const range = 'NewRes!A:C';
    
    const response = await sheets.values.get({
      spreadsheetId,
      range,
    });
    
    const rows = response.data.values || [];
    if (rows.length === 0) {
      return [];
    }
    
    const participants = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 3) {
        const participantBlock = row[1];
        if (block && participantBlock !== block) {
          continue;
        }
        
        participants.push({
          number: row[0],
          name: row[2],
          block: participantBlock
        });
      }
    }
    
    return participants;
  } catch (error) {
    console.error('Error fetching participants:', error);
    throw error;
  }
}

module.exports = {
  getNominations,
  getBlocks,
  fetchFinalScores,
  getNominationLeaders,
  getParticipants,
  getSheetService
}; 