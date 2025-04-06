
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';

interface InitialBalanceControlProps {
  initialBalance: number;
  onBalanceChange: (balance: number) => void;
  currentBalance?: number;
  percentageReturn?: number;
  showCurrentBalance?: boolean;
}

export function InitialBalanceControl({
  initialBalance,
  onBalanceChange,
  currentBalance,
  percentageReturn,
  showCurrentBalance = true
}: InitialBalanceControlProps) {
  const [inputBalance, setInputBalance] = useState(initialBalance);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBalanceChange(inputBalance);
    toast.success("Initial balance updated successfully");
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-4 md:items-end">
        <div className="flex-1">
          <Label htmlFor="initial-balance">Initial Account Balance</Label>
          <div className="flex items-center mt-1">
            <Input
              id="initial-balance"
              type="number"
              min="0"
              step="0.01"
              value={inputBalance}
              onChange={(e) => setInputBalance(Number(e.target.value))}
              placeholder="Enter your initial balance"
              className="flex-1"
            />
            <Button 
              type="submit"
              className="ml-2"
            >
              Update
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Set your initial trading balance to accurately calculate returns and drawdowns
          </p>
        </div>
        
        {showCurrentBalance && typeof currentBalance !== 'undefined' && typeof percentageReturn !== 'undefined' && (
          <div className="flex space-x-4">
            <div className="text-center p-3 bg-muted rounded-md">
              <div className="text-muted-foreground text-xs">Current Balance</div>
              <div className={`text-xl font-semibold ${currentBalance >= initialBalance ? 'text-green-500' : 'text-red-500'}`}>
                ${currentBalance.toFixed(2)}
              </div>
            </div>
            
            <div className="text-center p-3 bg-muted rounded-md">
              <div className="text-muted-foreground text-xs">Total Return</div>
              <div className={`text-xl font-semibold ${percentageReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {percentageReturn.toFixed(2)}%
              </div>
            </div>
          </div>
        )}
      </form>
    </Card>
  );
}
