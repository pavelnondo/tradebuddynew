
import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DonateButtonProps {
  className?: string;
}

export function DonateButton({ className }: DonateButtonProps) {
  const navigate = useNavigate();

  const handleDonation = () => {
    navigate('/donate');
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
