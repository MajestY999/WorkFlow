export function createSingleFlight<TArgs extends unknown[], TResult>(
  task: (...args: TArgs) => Promise<TResult>,
) {
  let inFlight: Promise<TResult> | undefined;

  return (...args: TArgs): Promise<TResult> => {
    if (inFlight) return inFlight;

    const request = Promise.resolve().then(() => task(...args));
    const tracked = request.finally(() => {
      if (inFlight === tracked) inFlight = undefined;
    });
    inFlight = tracked;
    return tracked;
  };
}
