import { createFileRoute } from "@tanstack/react-router";
import { advertisingPolicy } from "../../lib/advertising-policy";

export const Route = createFileRoute("/api/advertising-policy")({
  server: {
    handlers: {
      GET: ({ request }) =>
        Response.json(advertisingPolicy(request), {
          headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
        }),
    },
  },
});
