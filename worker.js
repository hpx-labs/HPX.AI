export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);

    // =========================
    // HPX AI HEALTH CHECK
    // =========================
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(
        JSON.stringify({
          ok: true,
          service: "HPX AI",
          company: "HPX LABS",
          founder: "Harshit Patel",
          status: "online"
        }),
        { status: 200, headers: cors }
      );
    }

    // =========================
    // ONLY /chat ACCEPTS POST
    // =========================
    if (request.method !== "POST" || url.pathname !== "/chat") {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Endpoint not found. Use POST /chat."
        }),
        { status: 404, headers: cors }
      );
    }

    try {
      // =========================
      // API KEY CHECK
      // =========================
      if (!env.OPENAI_API_KEY) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "OPENAI_API_KEY is missing from Worker Secrets."
          }),
          { status: 500, headers: cors }
        );
      }

      // =========================
      // READ REQUEST
      // =========================
      let body;

      try {
        body = await request.json();
      } catch {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "Invalid JSON request."
          }),
          { status: 400, headers: cors }
        );
      }

      const message =
        typeof body?.message === "string"
          ? body.message.trim()
          : "";

      if (!message) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "Message is required."
          }),
          { status: 400, headers: cors }
        );
      }

      // =========================
      // CONVERSATION HISTORY
      // =========================
      const history = Array.isArray(body?.history)
        ? body.history
            .filter(
              item =>
                item &&
                (item.role === "user" || item.role === "assistant") &&
                typeof item.content === "string"
            )
            .
