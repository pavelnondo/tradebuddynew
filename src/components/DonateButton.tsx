
import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

interface DonateButtonProps {
  className?: string;
}

export function DonateButton({ className }: DonateButtonProps) {
  const handleDonation = () => {
    // In a real implementation, this would call an edge function to create a Stripe checkout session
    // For now, we'll open a simulated Stripe checkout URL
    window.open('https://buy.stripe.com/test_XXXXXXXX', '_blank');
  };

  return (
    <Button 
      onClick={handleDonation} 
      variant="outline" 
      size="sm" 
      className={`flex items-center gap-1.5 ${className}`}
    >
      <Heart className="h-4 w-4 text-red-500" />
      <span>Support Us</span>
    </Button>
  );
}
