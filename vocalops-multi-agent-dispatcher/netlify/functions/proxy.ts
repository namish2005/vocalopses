import { Handler } from "@netlify/functions";

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { webhook_url, ...payload } = body;
    
    const finalWebhookUrl = webhook_url || process.env.VITE_N8N_WEBHOOK_URL;

    if (!finalWebhookUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No webhook URL configured." }),
      };
    }

    console.log(`[Proxy] Forwarding request to: ${finalWebhookUrl}`);
    const response = await fetch(finalWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = `n8n error! status: ${response.status}`;
      if (response.status === 404) {
        errorMessage = `n8n endpoint not found (404). This usually means the workflow is not "Active" in n8n or you need to use the /webhook-test/ path.`;
      }
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: "Communication failure with n8n.",
          details: errorMessage,
          status: response.status
        }),
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("[Proxy] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Internal server error during proxy request.",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
    };
  }
};
