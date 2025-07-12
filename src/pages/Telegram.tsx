import { TelegramBotCard } from '@/components/TelegramBotCard';

export default function Telegram() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Telegram Bot</h1>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <TelegramBotCard />
      </div>
    </div>
  );
} 