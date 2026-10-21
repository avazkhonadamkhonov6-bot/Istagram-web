let starting: Promise<void> | undefined;

/** Share startup across Strict Mode effects so no request outruns the worker. */
export function initMocks(): Promise<void> {
  if (
    typeof window === "undefined" ||
    process.env.NEXT_PUBLIC_API_MOCKING !== "on"
  )
    return Promise.resolve();
  starting ??= (async () => {
    const { setupWorker } = await import("msw/browser");
    const { handlers } = await import("./handlers");
    await setupWorker(...handlers).start({ onUnhandledRequest: "bypass" });
  })().catch((error) => {
    starting = undefined;
    throw error;
  });
  return starting;
}
