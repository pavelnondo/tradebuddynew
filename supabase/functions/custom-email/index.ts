
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

    if (type === "signup") {
      // This is sent when a user signs up
      const emailHtml = `
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
              <div class="logo">Trade Buddy</div>
            </div>
            <div class="content">
              <h2>Confirm Your Email</h2>
              <p>Thank you for signing up with Trade Buddy. Please confirm your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${url}" class="button">Confirm Email</a>
              </div>
              <p>If you didn't sign up for Trade Buddy, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Trade Buddy. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

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
      const emailHtml = `
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
              <div class="logo">Trade Buddy</div>
            </div>
            <div class="content">
              <h2>Login to Your Account</h2>
              <p>Click the button below to sign in to your Trade Buddy account:</p>
              <div style="text-align: center;">
                <a href="${url}" class="button">Sign In</a>
              </div>
              <p>If you didn't request this login link, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Trade Buddy. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

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
      const emailHtml = `
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
              <div class="logo">Trade Buddy</div>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>You recently requested to reset your password for your Trade Buddy account. Click the button below to reset it:</p>
              <div style="text-align: center;">
                <a href="${url}" class="button">Reset Password</a>
              </div>
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Trade Buddy. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

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
