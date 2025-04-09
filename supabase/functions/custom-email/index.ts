
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { type, email, url } = await req.json();

    // Define a common logo URL - using a placeholder for now
    const logoUrl = "https://urciudgceezbggqxspap.supabase.co/storage/v1/object/public/logos/tradebuddy-logo.png";
    
    // Common email template structure with logo
    const getEmailTemplate = (title, content, buttonText) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #7c3aed;
            padding: 20px;
            text-align: center;
          }
          .logo {
            margin-bottom: 10px;
          }
          .logo-text {
            color: white;
            font-size: 24px;
            font-weight: bold;
          }
          .content {
            padding: 20px;
            background-color: #f9f9f9;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #7c3aed;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <img src="${logoUrl}" alt="Trade Buddy Logo" width="120" height="auto" />
            </div>
            <div class="logo-text">Trade Buddy</div>
          </div>
          <div class="content">
            <h2>${title}</h2>
            ${content}
            <div style="text-align: center;">
              <a href="${url}" class="button">${buttonText}</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Trade Buddy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (type === "signup") {
      // This is sent when a user signs up
      const signupContent = `
        <p>Thank you for signing up with Trade Buddy. You're now part of our community of traders who track, analyze, and improve their trading performance.</p>
        <p>Please confirm your email address by clicking the button below to activate your Trade Buddy account:</p>
        <p>If you didn't sign up for Trade Buddy, you can safely ignore this email.</p>
      `;
      
      const emailHtml = getEmailTemplate(
        "Welcome to Trade Buddy!",
        signupContent,
        "Confirm Email & Activate Account"
      );

      return new Response(
        JSON.stringify({ html: emailHtml }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (type === "magiclink") {
      // This is sent when a user signs in with magic link
      const magiclinkContent = `
        <p>Click the button below to sign in to your Trade Buddy account:</p>
        <p>If you didn't request this login link, you can safely ignore this email.</p>
      `;
      
      const emailHtml = getEmailTemplate(
        "Login to Your Account",
        magiclinkContent,
        "Sign In"
      );

      return new Response(
        JSON.stringify({ html: emailHtml }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (type === "recovery") {
      // This is sent when a user requests a password reset
      const recoveryContent = `
        <p>You recently requested to reset your password for your Trade Buddy account. Click the button below to reset it:</p>
        <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
      `;
      
      const emailHtml = getEmailTemplate(
        "Reset Your Password",
        recoveryContent,
        "Reset Password"
      );

      return new Response(
        JSON.stringify({ html: emailHtml }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unsupported email type" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
