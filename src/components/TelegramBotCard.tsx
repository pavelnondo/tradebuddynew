import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Smartphone, Zap, Brain } from "lucide-react";

export function TelegramBotCard() {
  const botUsername = "TBTradebuddy_bot"; // Updated bot username
  const telegramUrl = `https://t.me/${botUsername}`;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <MessageCircle className="h-5 w-5" />
          Personal AI Trading Assistant
        </CardTitle>
        <CardDescription className="text-blue-600">
          Get instant trade analysis, voice commands, and AI insights via Telegram
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-blue-700">
            <Zap className="h-4 w-4" />
            Voice Commands
          </div>
          <div className="flex items-center gap-2 text-blue-700">
            <Brain className="h-4 w-4" />
            AI Analysis
          </div>
          <div className="flex items-center gap-2 text-blue-700">
            <Smartphone className="h-4 w-4" />
            Mobile Access
          </div>
          <div className="flex items-center gap-2 text-blue-700">
            <MessageCircle className="h-4 w-4" />
            Instant Feedback
          </div>
        </div>
        
        <Button 
          onClick={() => window.open(telegramUrl, '_blank')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Open Telegram Bot
        </Button>
        
        <p className="text-xs text-blue-600 text-center">
          Send voice messages, text descriptions, or CSV files for instant processing
        </p>
      </CardContent>
    </Card>
  );
} 