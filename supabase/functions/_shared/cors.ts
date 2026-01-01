/**
 * CORS Headers compartilhados por todas as Edge Functions
 * Evita duplicação de código
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Responde a requisições OPTIONS (preflight)
 */
export function handleCorsPreFlight(): Response {
  return new Response(null, { 
    status: 204,
    headers: corsHeaders 
  });
}

/**
 * Cria uma resposta JSON com CORS headers
 */
export function jsonResponse(
  data: unknown, 
  status = 200
): Response {
  return new Response(
    JSON.stringify(data), 
    {
      status,
      headers: { 
        "Content-Type": "application/json", 
        ...corsHeaders 
      },
    }
  );
}

/**
 * Cria uma resposta de erro com CORS headers
 */
export function errorResponse(
  error: string, 
  status = 500
): Response {
  console.error("Error response:", error);
  return jsonResponse({ error }, status);
}
