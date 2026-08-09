# API для мобильного приложения — ИНДИГО

## Общая информация

- Единого домена вида `https://сайт.рф/api/...` нет — у каждого раздела свой отдельный адрес вида `https://functions.poehali.dev/...`.
- Сайт самописный (не WordPress, не 1С-Битрикс). Frontend — React, backend — независимые облачные функции на Python.
- Все запросы и ответы — в формате JSON.
- CORS открыт (`Access-Control-Allow-Origin: *`), поэтому обращаться можно напрямую с мобильного приложения.

## Ключ доступа (X-Api-Key)

Часть операций защищена ключом доступа. Он передаётся в заголовке запроса:

```
X-Api-Key: h99NJWtXVBQ59CqsSyxnIOZI-KwMC1ZpwzohKcM-WkA
```

**НЕ** через `Authorization: Bearer ...`.

- **Без ключа доступны:** чтение публичных данных — список конкурсов, отзывы, товары магазина, партнёры, новости, программа мероприятий, подача заявки участником, вход/регистрация участника, оплата заказов.
- **С ключом:** создание/редактирование/удаление конкурсов, заявок (админом), товаров, жюри, результатов и т.п. — то есть всё, что делает администратор сайта.

⚠️ Ключ секретный — не публикуйте его в открытом клиентском коде мобильного приложения (например, не зашивайте в APK как обычную строку без обфускации), так как через него можно менять данные на сайте.

## Токен участника (сессия)

При входе или регистрации участника (`participant-auth`) в ответе приходит поле `token` — это персональный токен сессии участника (срок жизни 30 дней). Используется для последующих запросов от имени этого участника (просмотр своих заявок, чат с администрацией).

## Список разделов API

| Раздел | Адрес |
|---|---|
| Конкурсы (список, создание/редактирование — с ключом) | `https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3` |
| Заявки участников (подача, редактирование) | `https://functions.poehali.dev/065d2b6a-5112-4a26-a642-211398843a75` |
| Заявки — админка (список всех, смена статуса) | `https://functions.poehali.dev/27d46d11-5402-4428-b786-4d2eb3aace8b` |
| Вход / регистрация участника, чат, личный кабинет | `https://functions.poehali.dev/52234468-777f-4edf-ba7a-985257092904` |
| Магазин: товары и категории | `https://functions.poehali.dev/eddcb40d-3bae-4f75-9c69-390ad1190d83` |
| Магазин: заказы и оплата | `https://functions.poehali.dev/b020db38-8100-400d-9e53-2dbfcafd5f48` |
| Жюри (список, создание/редактирование — с ключом) | `https://functions.poehali.dev/29a5a3ab-7964-41f0-baf5-d85b81b743bc` |
| Оценивание жюри (вход жюри через `X-Jury-Token`) | `https://functions.poehali.dev/e399905c-0871-434d-90ae-850d12af1c0d` |
| Проверка диплома по номеру | `https://functions.poehali.dev/1806f979-38b3-442e-b8ef-fa6827104251` |
| Программа конкурса, номинации, шаблоны дипломов | `https://functions.poehali.dev/9fcbf70c-fd6d-4489-bc77-1e4bcd6f1cb1` |
| Партнёры / новости / отзывы / настройки сайта | `https://functions.poehali.dev/7b3c1e0e-bd68-4b73-9377-740689560912` |
| Афиша концертов | `https://functions.poehali.dev/de057f50-7d1e-49bc-a61f-f23335190f32` |
| Итоги конкурсов (PDF с результатами) | `https://functions.poehali.dev/7ff9bf2f-1648-49f2-9137-02fe1da936eb` |
| Загрузка файлов (фото, документы) | `https://functions.poehali.dev/cfc99bc2-daff-4110-b9e4-c9699841a7d3` |

## Примеры запросов

### Получить список конкурсов (публично, без ключа)
```
GET https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3
```

### Вход участника
```
POST https://functions.poehali.dev/52234468-777f-4edf-ba7a-985257092904
Content-Type: application/json

{ "email": "user@example.com", "password": "••••••" }
```
Ответ содержит `participant`, `applications`, `token`.

### Создать конкурс (требует ключ)
```
POST https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3
Content-Type: application/json
X-Api-Key: h99NJWtXVBQ59CqsSyxnIOZI-KwMC1ZpwzohKcM-WkA

{ "title": "...", "start_date": "...", "end_date": "..." }
```

## Динамическая форма заявки на конкурс

У каждого конкурса организатор может назначить свою форму заявки (набор дополнительных вопросов). Приложению нужно запросить структуру формы и построить её на лету — вопросы у разных конкурсов разные.

### 1. Получить форму, назначенную конкурсу (публично, без ключа)
```
GET https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3?action=contest_form&contest_id=42
```

Ответ:
```json
{
  "fields": [
    {
      "field_name": "sys_age_category",
      "field_label": "Возрастная категория",
      "field_type": "select",
      "options": "от 4 до 6 лет, от 7 до 9 лет, от 10 до 12 лет",
      "is_required": true,
      "sort_order": 1,
      "system_key": "age_category"
    },
    {
      "field_name": "custom_question_1",
      "field_label": "Какой у вас стаж?",
      "field_type": "text",
      "options": "",
      "is_required": false,
      "sort_order": 6,
      "system_key": null
    },
    {
      "field_name": "recording_file",
      "field_label": "Загрузить запись видео",
      "field_type": "file",
      "options": "",
      "is_required": false,
      "sort_order": 7,
      "system_key": null
    }
  ],
  "nominations": [
    { "id": 101, "name": "Инструментальное творчество классическое" }
  ]
}
```

Если у конкурса нет назначенной формы — `fields` придёт пустым массивом, показывать доп. вопросы не нужно.

### 2. Типы полей (`field_type`) и как их отрисовать

| field_type | Что показать | Как хранить значение |
|---|---|---|
| `text`, `number`, `email`, `tel`, `date` | обычное поле ввода (тип соответствует полю) | строка |
| `textarea` | многострочное поле | строка |
| `select` | выпадающий список, варианты — `options` через запятую | выбранный текст варианта |
| `checkbox` | переключатель да/нет | строка `"true"` или `"false"` |
| `file` | загрузка документа/фото, до 15 МБ | ссылка на файл после загрузки (см. ниже) |
| `audio` | загрузка фонограммы, до 50 МБ | ссылка на файл после загрузки (см. ниже) |

Особый случай: если у поля `system_key: "nomination"` — вместо `options` нужно показать список из массива `nominations` (`{id, name}`), а не текстовые options.

Поля сортируются по `sort_order`. Обязательные (`is_required: true`) нельзя оставлять пустыми при отправке.

### 3. Как отправить заполненную форму

Все ответы участника собираются в объект `customFields`, где ключ — это `field_name` поля:

```
POST https://functions.poehali.dev/065d2b6a-5112-4a26-a642-211398843a75
Content-Type: application/json

{
  "fullName": "Иванов Иван",
  "email": "user@example.com",
  "phone": "+79990000000",
  "city": "Москва",
  "contestId": 42,
  "nominationId": 101,
  "customFields": {
    "sys_age_category": "от 10 до 12 лет",
    "custom_question_1": "12 лет",
    "recording_file": "https://cdn.poehali.dev/projects/.../video.mp4"
  }
}
```

`nominationId` — это `id` выбранной номинации из массива `nominations` (заполняется только если в форме есть поле с `system_key: "nomination"`).

### 4. Загрузка файлов из формы (типы `file` и `audio`)

**Поле типа `file`** — загрузить одним запросом, файл в base64:
```
POST https://functions.poehali.dev/cfc99bc2-daff-4110-b9e4-c9699841a7d3
Content-Type: application/json

{
  "files": [
    { "fileName": "документ.pdf", "fileType": "application/pdf", "fileSize": 123456, "fileData": "<base64>" }
  ]
}
```
Ответ: `{ "files": [{ "fileUrl": "https://cdn.poehali.dev/..." }] }` — эту ссылку положить в `customFields` под тем же `field_name`. Лимит 15 МБ.

**Поле типа `audio`** (фонограмма) — грузится напрямую на Яндекс.Диск в 3 шага:
```
1) POST .../cfc99bc2-daff-4110-b9e4-c9699841a7d3
   { "target": "yandex", "contestTitle": "Название конкурса, Город, дата", "fileName": "фонограмма.mp3" }
   → { "uploadUrl": "...", "path": "/..." }

2) PUT <uploadUrl>
   Body: <бинарные данные файла>

3) POST .../cfc99bc2-daff-4110-b9e4-c9699841a7d3
   { "target": "yandex", "step": "finalize", "path": "/..." }
   → { "fileUrl": "https://disk.yandex.ru/..." }
```
Полученный `fileUrl` кладётся в `customFields`. Лимит 50 МБ.

### Итоговая последовательность в приложении
1. Участник выбирает конкурс → запросить форму (`action=contest_form&contest_id=...`).
2. Построить экран с вопросами по `field_type`, отметить обязательные.
3. Если есть файлы — загрузить их первыми, получить ссылки.
4. Отправить `POST` на адрес заявок с собранным `customFields`.

## Push-уведомления (Expo)

Раздел: `https://functions.poehali.dev/52234468-777f-4edf-ba7a-985257092904` (тот же адрес, что вход/регистрация участника).

### 1. Сохранить push-токен участника

Вызывается после входа в аккаунт, когда приложение сгенерировало Expo Push Token. Требует токен сессии участника (тот, что пришёл в поле `token` при входе/регистрации) — передаётся в заголовке `Authorization`.

```
POST https://functions.poehali.dev/52234468-777f-4edf-ba7a-985257092904?action=save_push_token
Content-Type: application/json
Authorization: Bearer <session_token>

{ "pushToken": "ExponentPushToken[abc123...]" }
```

Ответ: `{ "success": true }`. Без валидного токена сессии — `401`.

### 2. Получить список токенов для рассылки (для админки/сервера)

Защищено ключом администратора — вызывается только с серверной стороны (не из мобильного приложения).

```
GET https://functions.poehali.dev/52234468-777f-4edf-ba7a-985257092904?action=list_push_tokens
X-Api-Key: h99NJWtXVBQ59CqsSyxnIOZI-KwMC1ZpwzohKcM-WkA
```

Ответ:
```json
{ "tokens": ["ExponentPushToken[abc123...]", "ExponentPushToken[def456...]"] }
```

### 3. Отправка уведомления — напрямую через Expo Push Service

Отправка не идёт через мой backend — уведомления шлются прямо в Expo (свой push-сервер не нужен):

```
POST https://exp.host/--/api/v2/push/send
Content-Type: application/json
Accept: application/json

{
  "to": "ExponentPushToken[abc123...]",
  "title": "Новый конкурс открыт!",
  "body": "Регистрация на «Таланты Нягань 2025» уже началась",
  "data": { "screen": "FestivalDetail", "contestId": 42 }
}
```

Массовая рассылка — до 100 токенов за один запрос (список объектов вместо одного):
```json
[
  { "to": "ExponentPushToken[aaa...]", "title": "...", "body": "..." },
  { "to": "ExponentPushToken[bbb...]", "title": "...", "body": "..." }
]
```

### Как это работает в связке

1. Мобильное приложение при входе участника получает `token` сессии → генерирует Expo Push Token → отправляет его на `action=save_push_token` с `Authorization: Bearer <token>`.
2. Когда нужно разослать уведомление всем (например, при публикации нового конкурса), сервер/админка сайта запрашивает `action=list_push_tokens` с `X-Api-Key`, разбивает список на пачки по 100 и шлёт их в `https://exp.host/--/api/v2/push/send`.
3. Один и тот же push-токен просто перезаписывается при повторном входе/переустановке — хранится по одному на участника.
5. Успешный ответ: `{ "success": true, "applicationId": 45, "status": "pending" }`.