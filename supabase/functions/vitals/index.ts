import { createClient } from "jsr:@supabase/supabase-js@2";

function corsHeaders(req: Request) {
  // Echo the request origin back — '*' is rejected when credentials mode is 'include',
  // which happens when the browser has an active Supabase session on the same domain.
  return {
    "Access-Control-Allow-Origin": req.headers.get("Origin") ?? "*",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  };
}

Deno.serve(async (req) => {
  // sendBeacon sends application/json which triggers a CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const metric = await req.json();

    // SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supabase.from("rum_metrics").insert({
      metric_id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      navigation_type: metric.navigationType,
      timestamp: metric.timestamp,
    });

    if (error) throw error;

    return new Response(null, { status: 204, headers: corsHeaders(req) });
  } catch (err) {
    console.error("vitals insert failed:", err);
    return new Response(null, { status: 500, headers: corsHeaders(req) });
  }
});
