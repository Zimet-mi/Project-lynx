# Руководство по настройке Valerie

## 📋 Обзор

Файл `constants.js` содержит всю конфигурацию приложения Valerie. Теперь все настройки вынесены в отдельный файл для удобного управления.

## 🎯 Основные разделы настроек

### 1. Параметры оценки (`PARTICIPANT_PARAMETERS`)

Массив объектов, каждый из которых описывает параметр для оценки участников.

#### Структура объекта:
```javascript
{
    label: 'Костюм',           // Отображаемое название
    column: 'C',               // Столбец в Google Sheets (A, B, C, D...)
    options: 5,                // Количество баллов (1-5, 1-3, 1-10 и т.д.)
    field: 'costum',           // Уникальное поле для React
    description: 'Оценка костюма участника', // Описание (опционально)
    required: true             // Обязательный параметр (опционально)
}
```

#### Примеры добавления новых параметров:

**Добавить параметр "Музыка" (1-5 баллов):**
```javascript
{
    label: 'Музыка',
    column: 'G',
    options: 5,
    field: 'music',
    description: 'Качество музыкального сопровождения',
    required: false
}
```

**Добавить параметр "Хореография" (1-10 баллов):**
```javascript
{
    label: 'Хореография',
    column: 'H',
    options: 10,
    field: 'choreography',
    description: 'Качество хореографии и движений',
    required: true
}
```

### 2. Спецпризы (`SPECIAL_PRIZES`)

Массив объектов, описывающих специальные призы и награды.

#### Структура объекта:
```javascript
{
    label: 'Пошив',                    // Отображаемое название
    column: 'I',                       // Столбец в Google Sheets
    field: 'poshiv',                   // Уникальное поле для React
    description: 'Лучший пошив костюма', // Описание (опционально)
    active: true,                      // Активен ли спецприз
    value: 'Номинант'                  // Значение, которое записывается при активации
}
```

#### Примеры работы со спецпризами:

**Добавить новый спецприз "Лучший грим":**
```javascript
{
    label: 'Лучший грим',
    column: 'O',
    field: 'best_makeup',
    description: 'Лучший грим и макияж',
    active: true,
    value: 'Номинант'
}
```

**Отключить спецприз "Парик":**
```javascript
{
    label: 'Парик',
    column: 'L',
    field: 'parik',
    description: 'Лучший парик/прическа',
    active: false,  // ← Изменить на false
    value: 'Номинант'
}
```

### 3. Дополнительные поля (`ADDITIONAL_FIELDS`)

Объект с дополнительными полями для участников.

#### Структура объекта:
```javascript
comment: {
    label: 'Комментарий',
    column: 'G',
    field: 'comment',
    type: 'textarea',
    placeholder: 'Введите комментарий...',
    maxLength: 500,
    required: false
}
```

## 🔧 Вспомогательные функции

### Получение данных:

```javascript
// Получить только активные спецпризы
const activePrizes = getActiveSpecialPrizes();

// Получить только обязательные параметры
const requiredParams = getRequiredParameters();

// Получить все параметры
const allParams = getAllParameters();

// Получить параметр по полю
const param = getParameterByField('costum');

// Получить спецприз по полю
const prize = getSpecialPrizeByField('poshiv');
```

### Получение столбцов:

```javascript
// Получить столбцы для параметров оценки
const paramColumns = getParameterColumns(); // ['C', 'D', 'E', 'F']

// Получить столбцы для активных спецпризов
const prizeColumns = getActiveSpecialPrizeColumns(); // ['I', 'J', 'K', 'L', 'M', 'N']

// Получить все используемые столбцы
const allColumns = getAllUsedColumns(); // ['C', 'D', 'E', 'F', 'G', 'I', 'J', 'K', 'L', 'M', 'N']
```

### Валидация и статистика:

```javascript
// Проверить валидность настроек
const validation = validateSettings();
if (!validation.isValid) {
    console.error('Ошибки в настройках:', validation.errors);
}

// Получить статистику настроек
const stats = getSettingsStats();
console.log('Статистика:', stats);
// {
//     totalParameters: 4,
//     requiredParameters: 3,
//     optionalParameters: 1,
//     totalSpecialPrizes: 6,
//     activeSpecialPrizes: 6,
//     inactiveSpecialPrizes: 0,
//     additionalFields: 1,
//     totalUsedColumns: 10
// }

// Экспортировать настройки
const exportedSettings = exportSettings();
```

## 📝 Примеры практического использования

### 1. Добавление нового параметра "Креативность"

```javascript
// В массиве PARTICIPANT_PARAMETERS добавить:
{
    label: 'Креативность',
    column: 'G',
    options: 5,
    field: 'creativity',
    description: 'Оригинальность и креативность выступления',
    required: false
}
```

### 2. Добавление спецприза "Лучший дебют"

```javascript
// В массиве SPECIAL_PRIZES добавить:
{
    label: 'Лучший дебют',
    column: 'O',
    field: 'best_debut',
    description: 'Лучший дебютный показ',
    active: true,
    value: 'Номинант'
}
```

### 3. Изменение шкалы оценки

```javascript
// Изменить параметр "Аксессуар" с 3-балльной на 5-балльную шкалу:
{
    label: 'Аксессуар',
    column: 'F',
    options: 5,  // ← Изменить с 3 на 5
    field: 'aks',
    description: 'Качество аксессуаров и реквизита',
    required: false
}
```

### 4. Отключение неиспользуемого спецприза

```javascript
// Отключить спецприз "Русский источник":
{
    label: 'Русский источник',
    column: 'M',
    field: 'russian_source',
    description: 'Адаптация из русских источников',
    active: false,  // ← Изменить с true на false
    value: 'Номинант'
}
```

## ⚠️ Важные замечания

### 1. Уникальность полей
- Все поля (`field`) должны быть уникальными
- Используйте понятные имена: `costum`, `shozhest`, `vistup`, `aks`

### 2. Уникальность столбцов
- Все столбцы (`column`) должны быть уникальными
- Используйте буквы: A, B, C, D, E, F, G, H, I, J, K, L, M, N, O...

### 3. Диапазоны баллов
- Количество баллов (`options`) должно быть от 1 до 10
- Рекомендуется использовать 3, 5 или 10 баллов

### 4. Столбцы в Google Sheets
- Убедитесь, что столбцы в Google Sheets соответствуют настройкам
- Столбец A: ID участника
- Столбец B: Имя участника
- Столбцы C+: параметры оценки
- Столбцы I+: спецпризы

## 🔄 Миграция с старой системы

Старые константы `CHECKBOX_LABELS` и `CHECKBOX_COLUMNS` автоматически генерируются из новых настроек для обратной совместимости.

## 🎨 Настройки интерфейса

В разделе `UI_CONFIG` можно настроить:
- Количество колонок для чекбоксов на разных экранах
- Количество колонок для параметров оценки
- Включение/выключение анимаций
- Задержку автосохранения

## ✅ Проверка настроек

При загрузке приложения автоматически:
1. Проверяется валидность всех настроек
2. Выводится статистика в консоль
3. Предупреждается о возможных проблемах

Это гарантирует, что все настройки корректны и не конфликтуют друг с другом.
