import os
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import pickle

# Если вы изменяете эти области, удалите файл token.pickle.
SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

def get_credentials():
    creds = None
    # Файл token.pickle хранит токены доступа и обновления пользователя
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    
    # Если нет действительных учетных данных, позволяем пользователю войти.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Сохраняем учетные данные для следующего запуска
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    
    return creds

def get_sheet_service():
    creds = get_credentials()
    service = build('sheets', 'v4', credentials=creds)
    return service.spreadsheets()

def get_nominations():
    """Получение списка номинаций из таблицы"""
    sheet = get_sheet_service()
    spreadsheet_id = os.environ.get('SPREADSHEET_ID')
    range_name = 'NewRes!A:A'
    
    result = sheet.values().get(
        spreadsheetId=spreadsheet_id,
        range=range_name
    ).execute()
    
    values = result.get('values', [])
    if not values:
        return []
    
    # Получаем уникальные номинации из первого столбца
    nominations = set()
    for row in values[1:]:  # Пропускаем заголовок
        if row and row[0]:
            nominations.add(row[0])
    
    return sorted(list(nominations))

def get_blocks():
    """Получение списка блоков из таблицы"""
    sheet = get_sheet_service()
    spreadsheet_id = os.environ.get('SPREADSHEET_ID')
    range_name = 'NewRes!B:B'
    
    result = sheet.values().get(
        spreadsheetId=spreadsheet_id,
        range=range_name
    ).execute()
    
    values = result.get('values', [])
    if not values:
        return []
    
    # Получаем уникальные блоки из второго столбца
    blocks = set()
    for row in values[1:]:  # Пропускаем заголовок
        if row and len(row) > 1 and row[1]:
            blocks.add(row[1])
    
    return sorted(list(blocks))

def fetch_final_scores(nomination=None, block=None):
    """Получение финальных оценок с фильтрацией по номинации и блоку"""
    sheet = get_sheet_service()
    spreadsheet_id = os.environ.get('SPREADSHEET_ID')
    range_name = 'NewRes!A:Z'
    
    result = sheet.values().get(
        spreadsheetId=spreadsheet_id,
        range=range_name
    ).execute()
    
    values = result.get('values', [])
    if not values:
        return []
    
    headers = values[0]
    scores = []
    
    for row in values[1:]:
        if len(row) < len(headers):
            row.extend([''] * (len(headers) - len(row)))
        
        row_data = dict(zip(headers, row))
        
        # Применяем фильтры
        if nomination and row_data.get('Номинация') != nomination:
            continue
        if block and row_data.get('Блок') != block:
            continue
        
        # Собираем оценки судей
        judge_scores = []
        for header in headers:
            if header.startswith('Судья'):
                score = row_data.get(header)
                if score and score.strip():
                    judge_scores.append({
                        'judge': header,
                        'score': float(score)
                    })
        
        if judge_scores:
            scores.append({
                'participant': row_data.get('Участник', ''),
                'scores': judge_scores
            })
    
    return scores

def get_nomination_leaders(nomination, limit=5):
    """Получение лидеров в номинации"""
    scores = fetch_final_scores(nomination)
    
    # Вычисляем средний балл для каждого участника
    participants = {}
    for score in scores:
        participant = score['participant']
        if participant not in participants:
            participants[participant] = {
                'participant': participant,
                'total_score': 0,
                'count': 0
            }
        
        for judge_score in score['scores']:
            participants[participant]['total_score'] += judge_score['score']
            participants[participant]['count'] += 1
    
    # Вычисляем средний балл и сортируем
    leaders = []
    for participant in participants.values():
        if participant['count'] > 0:
            leaders.append({
                'participant': participant['participant'],
                'average_score': participant['total_score'] / participant['count']
            })
    
    leaders.sort(key=lambda x: x['average_score'], reverse=True)
    return leaders[:limit]

def get_participants(block=None):
    """Получение списка участников с фильтрацией по блоку"""
    sheet = get_sheet_service()
    spreadsheet_id = os.environ.get('SPREADSHEET_ID')
    range_name = 'NewRes!A:C'
    
    result = sheet.values().get(
        spreadsheetId=spreadsheet_id,
        range=range_name
    ).execute()
    
    values = result.get('values', [])
    if not values:
        return []
    
    participants = []
    for row in values[1:]:  # Пропускаем заголовок
        if len(row) >= 3:
            participant_block = row[1]
            if block and participant_block != block:
                continue
                
            participants.append({
                'number': row[0],
                'name': row[2],
                'block': participant_block
            })
    
    return participants 