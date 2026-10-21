let started = false;

export async function initMocks() {
  if (typeof window === "undefined") return;
  if (process.env.NEXT_PUBLIC_API_MOCKING !== "on") return;
  if (started) return;
  started = true;

  const { setupWorker } = await import("msw/browser");
  const { handlers } = await import("./handlers");
  await setupWorker(...handlers).start({ onUnhandledRequest: "bypass" });
}