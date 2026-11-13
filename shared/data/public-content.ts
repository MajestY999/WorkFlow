export interface HelpCategory {
  slug: string;
  title: string;
  description: string;
}

export interface HelpArticle {
  slug: string;
  title: string;
  categorySlug: string;
  categoryTitle: string;
  readingTime: number;
  updatedAt: string;
  introduction: string;
  steps: Array<{ title: string; description: string }>;
}

export const helpCategories: HelpCategory[] = [
  {
    slug: "getting-started",
    title: "Начало работы",
    description: "Вход, профиль и первая заявка",
  },
  {
    slug: "requests",
    title: "Работа с заявками",
    description: "Статусы, комментарии и результат",
  },
  {
    slug: "priorities",
    title: "Сроки и приоритеты",
    description: "Как устроены SLA и эскалации",
  },
];

export const helpArticles: HelpArticle[] = [
  {
    slug: "create-first-request",
    title: "Как создать первую заявку",
    categorySlug: "getting-started",
    categoryTitle: "Начало работы",
    readingTime: 3,
    updatedAt: "5 октября 2026",
    introduction:
      "Для создания заявки войдите в аккаунт клиента. Подготовьте описание проблемы и ожидаемый результат.",
    steps: [
      {
        title: "Откройте раздел «Заявки»",
        description: "Нажмите «Создать заявку».",
      },
      {
        title: "Опишите проблему",
        description:
          "Укажите понятное название, выберите категорию и добавьте подробности: что произошло и как повторить ошибку.",
      },
      {
        title: "Отправьте обращение",
        description:
          "Проверьте данные и нажмите «Создать». Заявка появится в списке со статусом «Новая».",
      },
      {
        title: "Следите за обновлениями",
        description:
          "Откройте карточку заявки, чтобы читать комментарии и проверять статус.",
      },
    ],
  },
  {
    slug: "track-request-status",
    title: "Как отслеживать статус обращения",
    categorySlug: "requests",
    categoryTitle: "Работа с заявками",
    readingTime: 3,
    updatedAt: "5 октября 2026",
    introduction:
      "Текущий статус помогает понять, на каком этапе находится обращение.",
    steps: [
      {
        title: "Откройте список заявок",
        description: "Найдите обращение по названию или номеру.",
      },
      {
        title: "Посмотрите статус",
        description: "Статус заявки отображается в списке и в её карточке.",
      },
      {
        title: "Проверьте историю",
        description: "В карточке доступны комментарии и история изменений.",
      },
    ],
  },
  {
    slug: "add-comment",
    title: "Как добавить комментарий",
    categorySlug: "requests",
    categoryTitle: "Работа с заявками",
    readingTime: 3,
    updatedAt: "5 октября 2026",
    introduction:
      "Добавьте подробности в карточку заявки, чтобы команда могла продолжить работу.",
    steps: [
      {
        title: "Перейдите в карточку",
        description: "Откройте нужное обращение из списка заявок.",
      },
      {
        title: "Напишите комментарий",
        description: "Введите сообщение в поле комментария.",
      },
      {
        title: "Отправьте сообщение",
        description: "Нажмите «Добавить комментарий».",
      },
    ],
  },
  {
    slug: "confirm-resolution",
    title: "Как подтвердить решение",
    categorySlug: "requests",
    categoryTitle: "Работа с заявками",
    readingTime: 3,
    updatedAt: "5 октября 2026",
    introduction:
      "Когда работа завершена, проверьте результат и подтвердите решение по заявке.",
    steps: [
      {
        title: "Откройте решённую заявку",
        description: "Проверьте описание выполненной работы и комментарии.",
      },
      {
        title: "Подтвердите результат",
        description: "Нажмите «Подтвердить решение» в карточке обращения.",
      },
    ],
  },
  {
    slug: "sla-and-priorities",
    title: "Сроки реакции и приоритеты",
    categorySlug: "priorities",
    categoryTitle: "Сроки и приоритеты",
    readingTime: 3,
    updatedAt: "5 октября 2026",
    introduction:
      "Приоритет заявки помогает команде определить, в каком порядке разбирать обращения.",
    steps: [
      {
        title: "Укажите приоритет",
        description:
          "При создании заявки выберите приоритет, соответствующий влиянию проблемы на работу.",
      },
      {
        title: "Следите за сроком",
        description:
          "Срок реакции и решения можно посмотреть в карточке обращения.",
      },
      {
        title: "Проверьте причину ожидания",
        description:
          "Если работа приостановлена, откройте историю заявки и посмотрите, какая информация нужна команде.",
      },
    ],
  },
];

export const frequentlyAskedQuestions = [
  {
    question: "Как создать заявку?",
    answer:
      "Войдите в аккаунт, откройте «Заявки» и нажмите «Создать заявку». Укажите название, описание и категорию проблемы.",
  },
  {
    question: "Где посмотреть статус обращения?",
    answer: "В разделе «Мои заявки» или в карточке обращения.",
  },
  {
    question: "Что означает «Ожидание»?",
    answer:
      "Для продолжения работы нужна дополнительная информация или действие. Причину ожидания можно посмотреть в заявке.",
  },
  {
    question: "Как подтвердить решение?",
    answer: "Откройте решённую заявку и нажмите «Подтвердить решение».",
  },
  {
    question: "Что такое SLA?",
    answer: "Это установленные сроки реакции на обращение и решения проблемы.",
  },
];
