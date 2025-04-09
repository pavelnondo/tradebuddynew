
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SuggestionRequest {
  email: string;
  suggestion: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method must be POST' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { email, suggestion }: SuggestionRequest = await req.json();

    if (!suggestion) {
      return new Response(JSON.stringify({ error: 'Suggestion is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send email using EmailJS
    const emailjsData = {
      service_id: Deno.env.get('EMAILJS_SERVICE_ID'),
      template_id: Deno.env.get('EMAILJS_TEMPLATE_ID'),
      user_id: Deno.env.get('EMAILJS_USER_ID'),
      template_params: {
        to_email: 'pavelmozgalove@gmail.com',
        from_email: email || 'anonymous@user.com',
        suggestion: suggestion,
        reply_to: email || 'anonymous@user.com',
      },
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailjsData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending suggestion:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
