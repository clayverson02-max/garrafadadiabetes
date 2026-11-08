import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/meta")({
  server: { handlers: { POST: async ({ request }) => {
    const { handleMetaRequest } = await import("../../lib/meta-capi-handler.server");
    return handleMetaRequest(request);
  } } },
});
