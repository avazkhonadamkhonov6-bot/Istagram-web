"use client";

/** Xato dar root layout — sahifai xudash bo html/body (stilhoi umumi dastras nestand) */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          fontFamily: "system-ui, sans-serif",
          colorScheme: "light dark",
        }}
      >
        <title>Error</title>
        <p style={{ fontSize: 20, fontWeight: 600 }}>Something went wrong</p>
        <button type="button" onClick={() => retry()} style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
