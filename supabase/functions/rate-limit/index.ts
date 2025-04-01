
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get the token from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }
    
    const token = authHeader.replace("Bearer ", "");
    
    // Get the user from the token
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;
    
    const userId = userData.user?.id;
    if (!userId) throw new Error("User not authenticated");

    // Get client IP address for rate limiting
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    
    // Check if the user/IP has exceeded rate limits
    const cacheKey = `${userId}:${clientIp}`;
    
    // Simple in-memory rate limiting
    // In a production environment, you would use a Redis cache or similar
    const { data: requestCount } = await supabaseClient
      .from("rate_limits")
      .select("count")
      .eq("key", cacheKey)
      .single();
    
    const MAX_REQUESTS = 100; // Requests per time period
    const TIME_PERIOD = 60 * 60; // 1 hour in seconds
    
    if (requestCount && requestCount.count >= MAX_REQUESTS) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please try again later.",
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Update or insert the rate limit record
    if (requestCount) {
      await supabaseClient
        .from("rate_limits")
        .update({ 
          count: requestCount.count + 1,
          updated_at: new Date().toISOString()
        })
        .eq("key", cacheKey);
    } else {
      await supabaseClient
        .from("rate_limits")
        .insert({
          key: cacheKey,
          count: 1,
          expires_at: new Date(Date.now() + TIME_PERIOD * 1000).toISOString()
        });
    }
    
    // Process the actual request here
    // This is where you would handle the protected API functionality
    
    return new Response(
      JSON.stringify({
        message: "Request processed successfully",
        requestsRemaining: MAX_REQUESTS - ((requestCount?.count || 0) + 1),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
