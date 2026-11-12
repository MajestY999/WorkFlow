interface ApiErrorShape {
  statusCode?: number;
  statusMessage?: string;
  message?: string;
  data?: {
    statusMessage?: string;
  };
}

function isApiErrorShape(value: unknown): value is ApiErrorShape {
  return typeof value === "object" && value !== null;
}

export function getApiErrorMessage(error: unknown) {
  if (!isApiErrorShape(error)) {
    return "Проверьте подключение к интернету и попробуйте ещё раз.";
  }

  const statusCode = error.statusCode;
  if (statusCode === 429) {
    return "Слишком много запросов. Подождите немного и повторите.";
  }
  if (statusCode !== undefined && statusCode >= 500) {
    return "Сервис временно недоступен. Попробуйте загрузить данные ещё раз.";
  }
  return (
    error.data?.statusMessage ??
    error.statusMessage ??
    error.message ??
    "Не удалось получить данные. Попробуйте ещё раз."
  );
}

export function getApiErrorStatus(error: unknown) {
  return isApiErrorShape(error) ? error.statusCode : undefined;
}
