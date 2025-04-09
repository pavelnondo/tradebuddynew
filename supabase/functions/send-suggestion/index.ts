
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

    // Get EmailJS credentials from environment variables
    const serviceId = Deno.env.get('EMAILJS_SERVICE_ID');
    const templateId = Deno.env.get('EMAILJS_TEMPLATE_ID');
    const userId = Deno.env.get('EMAILJS_USER_ID');

    // Validate that all required credentials are present
    if (!serviceId || !templateId || !userId) {
      console.error('Missing EmailJS credentials:', { serviceId, templateId, userId });
      return new Response(JSON.stringify({ error: 'Email service configuration is incomplete' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send email using EmailJS
    const emailjsData = {
      service_id: serviceId,
      template_id: templateId,
      user_id: userId,
      template_params: {
        to_email: 'pavelmozgalove@gmail.com',
        from_email: email || 'anonymous@user.com',
        suggestion: suggestion,
        reply_to: email || 'anonymous@user.com',
        year: new Date().getFullYear(),
      },
    };

    console.log('Sending email with data:', JSON.stringify(emailjsData, null, 2));

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
