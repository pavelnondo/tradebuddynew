
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { toast } from "sonner";

interface InitialBalanceFormProps {
  initialBalance: number;
  onSave: (balance: number) => void;
}

export function InitialBalanceForm({ initialBalance, onSave }: InitialBalanceFormProps) {
  const [balance, setBalance] = useState(initialBalance.toString());
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    const numBalance = parseFloat(balance);
    if (isNaN(numBalance) || numBalance < 0) {
      toast.error("Please enter a valid positive number");
      return;
    }
    
    onSave(numBalance);
    setIsEditing(false);
    toast.success("Initial balance updated successfully");
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-primary" />
          Account Balance
        </CardTitle>
        <CardDescription>
          Set your initial trading balance to track P&L accurately
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {isEditing ? (
            <div className="flex flex-col space-y-2">
              <Label htmlFor="initial-balance">Initial Balance ($)</Label>
              <div className="flex gap-2">
                <Input
                  id="initial-balance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="Enter your initial balance"
                  className="flex-1"
                />
                <Button onClick={handleSave}>Save</Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setBalance(initialBalance.toString());
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <div className="text-muted-foreground text-sm">Initial Balance</div>
                <div className="text-xl font-semibold">${initialBalance.toFixed(2)}</div>
              </div>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
