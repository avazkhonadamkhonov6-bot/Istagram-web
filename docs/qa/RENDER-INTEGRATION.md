# Интеграция фронтенда с Render — 2026-10-22

Источники: коммиты партнёра `ee14dd2`…`c85c5e7`, Spec 14–16,
[живой Swagger](https://istagram-web.onrender.com/swagger),
`https://istagram-web.onrender.com/swagger-json` (143 маршрута).

## Что добавил партнёр

- Spec 14: приватность и заявки на подписку; block/mute/restrict/close friends;
  геолокация, теги, редактирование/архив/закрепление постов, коллекции;
  лайки комментариев, Highlights; расширенный Direct (группы, ответы,
  реакции, голосовые сообщения, пересылка Stories).
- Spec 15: Favorites и их лента, удаление подписчика, Reels пользователя,
  закрепление комментариев, редактирование сообщений, Notes, Active now.
- Spec 16: backend звонков WebRTC, аудио/видео сообщений и Live.
- Render: общий PostgreSQL, постоянное хранение медиа в БД, seed при пустой
  базе, deployment конфигурация. Существующие изменения партнёра уже в ветке.

## Что адаптировано в нашем фронтенде

- HTTP BFF и Socket.IO используют общий Render; `.env.local` настроен,
  default backend согласован, mock включается только явно для QA.
- Исправлена передача ответов Render: `fetch` распаковывает сжатый ответ,
  поэтому исходный `Content-Length` не пересылается браузеру. Иначе JSON
  не загружался и появлялся `ERR_CONTENT_LENGTH_MISMATCH` при HTTP 200.
- Range/If-Range и Content-Range/Accept-Ranges проходят через BFF; HEAD
  поддерживается. Возможность ответа 206 зависит от upstream backend.
- Статические логотип и фотографии Login доступны без сессии.
- Состояние текущего пользователя в первом клиентском рендере совпадает
  с серверным HTML, даже если профиль уже находится в кэше.
- Login/Signup и прежний дизайн сохранены; logout закрывает Socket.IO,
  чтобы соединение старого пользователя не оставалось активным.
- Profile Reels — отдельный endpoint и пагинация, а не фильтрация POSTS.
  Приватный профиль показывает закрытое содержимое и статус Requested.
- Followers владельца — Remove; Following/Favorites — отдельные ленты
  с согласованными лайками и rollback между вкладками.
- Публикация передаёт Location; Stories — CloseFriends. Зелёное кольцо
  Close Friends и отправка ответа на Story подключены к API.
- Комментарии: like/pin/unpin, индикатор pinned; учитываются hideLikeCount
  и commentsDisabled. Геолокация поста ведёт на существующую страницу.
- Заявки в Notifications — Confirm/Delete. Новые страницы privacy,
  favorites, activity, archive и списки отношений доступны в навигации.

## Проверки

- Production build и TypeScript проходят.
- 25 MSW Playwright-сценариев проходят: 18 прежних и 7 новых. Все записи,
  удаления подписок, комментарии и публикации в этой проверке изолированы
  в MSW и не изменяют общую базу Render.
- Реальный контракт: login, профиль, Following feed, Reels, User Reels,
  Favorites feed, пользователи, Stories, Direct, Notes, Favorites,
  заявки, коллекции и медиа проверены по shared Zod-схемам.
- Скрипт: `pnpm --filter web test:render:contract`.
- Production UI smoke с Render проходит: настоящий Login через BFF,
  httpOnly cookie, JSON-ответы ленты/Stories/Direct/Notes, Favorites feed,
  профиль Reels, privacy и inbox; ошибок сетевой передачи/React нет.
  Команда: `pnpm --filter web test:render:ui` (production web на localhost:3001).

## Границы этой адаптации

Backend партнёра, миграции, seed и Render deployment не изменялись.
Наличие API не означает готовность всех новых экранов: интерфейсы звонков
и Live (FE-30/31), Highlights, полный post menu/collections и прочие
неподключённые элементы FE-26/29 остаются отдельными задачами.
Это проверка подключения и перечисленных сценариев, а не заявление
о 100% реализации Spec 14–16 или визуальном совпадении с Instagram.
