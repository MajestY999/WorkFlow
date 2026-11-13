# WorkFlow

WorkFlow — приложение для учёта сервисных заявок. В проекте используются Nuxt 4, Nitro и PostgreSQL.

## Запуск локально

Нужны Node.js 20.6 или новее, npm и Docker Compose. Скопируйте пример настроек, установите зависимости и запустите PostgreSQL:

```bash
npm install
cp .env.example .env
npm run db:up
docker compose ps
```

Дождитесь, пока сервис `postgres` получит статус `healthy`, затем заполните базу тестовыми данными и запустите приложение:

```bash
npm run db:seed
npm run dev
```

Nuxt выведет адрес приложения; обычно это `http://localhost:3000`. Строка подключения из `.env.example` рассчитана на локальную базу из `docker-compose.yml`.

Заполнение базы создаёт демонстрационные учётные записи и заявки. Для локального входа можно использовать:

| Роль | Электронная почта | Пароль |
| --- | --- | --- |
| Администратор | `admin@workflow.local` | `Admin123!` |
| Оператор | `operator@workflow.local` | `Operator123!` |
| Исполнитель | `agent.brungilda@workflow.local` | `Agent123!` |
| Клиент | `client1@workflow.local` | `Client123!` |

Чтобы заменить демонстрационные пароли, задайте `WORKFLOW_ADMIN_PASSWORD`, `WORKFLOW_OPERATOR_PASSWORD`, `WORKFLOW_AGENT_PASSWORD` и/или `WORKFLOW_CLIENT_PASSWORD` перед `npm run db:seed`. Заполнять базу в режиме `NODE_ENV=production` нельзя. Не используйте демонстрационные учётные данные вне локальной разработки.

`npm run db:down` останавливает PostgreSQL, не удаляя том с данными.

## Страницы

Публичная часть доступна без входа:

- `/` — главная страница;
- `/faq` — частые вопросы;
- `/help` — центр помощи и категории инструкций;
- `/articles` — список статей;
- `/articles/:slug` — статья.

Публичные страницы рендерятся на сервере. Отчёт о замерах и выбранных оптимизациях находится в [docs/PERFORMANCE.md](./docs/PERFORMANCE.md).

Для работы с заявками войдите в аккаунт и откройте `/requests`. Клиент видит свои заявки, исполнитель — назначенные ему; оператор и администратор работают с заявками команды. Раздел `/admin` доступен только администратору.

## Проверка

Для ручной проверки интерфейса войдите под оператором и попробуйте найти заявку, изменить её статус или приоритет и добавить комментарий. Затем проверьте `/admin` под администратором и клиентом, а также доступ к `/requests` после выхода.

Для проверки адаптивной вёрстки используйте ширину 360, 768 и 1280 пикселей. Страницы `/faq`, `/help`, `/articles` и отдельную статью можно открыть без авторизации.

Команды проекта:

```bash
npx nuxi typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

E2E-тесты требуют запущенную PostgreSQL, заполненную демонстрационными данными базу и Chromium для Playwright. Установить браузер можно командой `npx playwright install chromium`. По умолчанию тесты входят под `operator@workflow.local` с паролем `Operator123!`; значения можно переопределить через `WORKFLOW_E2E_EMAIL` и `WORKFLOW_E2E_PASSWORD`.

## API

Для приватных маршрутов API нужна сессионная cookie `workflow_session`.

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/session`
- `GET /api/requests`, `POST /api/requests`
- `GET /api/requests/:id`, `PATCH /api/requests/:id`
- `GET /api/requests/:id/comments`, `POST /api/requests/:id/comments`
- `GET /api/users`, `PATCH /api/users/:id` (только администратор)
- `GET /api/customers`, `GET /api/categories`

Список заявок принимает параметры `q`, `status`, `priority`, `assignee`, `sort`, `page` и `pageSize`. Права на просмотр и изменение заявок проверяются на сервере.
