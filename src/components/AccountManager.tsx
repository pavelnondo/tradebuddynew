import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Wallet, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Activity,
  AlertTriangle,
  CheckCircle,
  RotateCcw
} from 'lucide-react';
import { useAccountManagement } from '@/hooks/useAccountManagement';
import { TradingAccount } from '@/types/account';

export function AccountManager() {
  const { 
    accounts, 
    activeAccount, 
    accountStats, 
    isLoading, 
    error,
    createAccount, 
    switchAccount, 
    markAccountAsBlown 
  } = useAccountManagement();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState(10000);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) return;
    
    try {
      setIsCreating(true);
      await createAccount(newAccountName.trim(), newAccountBalance);
      setNewAccountName('');
      setNewAccountBalance(10000);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating account:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSwitchAccount = async (accountId: string) => {
    try {
      await switchAccount(accountId);
    } catch (error) {
      console.error('Error switching account:', error);
    }
  };

  const handleMarkAsBlown = async (accountId: string) => {
    if (window.confirm('Are you sure you want to mark this account as blown? This will deactivate it and you can start fresh.')) {
      try {
        await markAccountAsBlown(accountId);
      } catch (error) {
        console.error('Error marking account as blown:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse"></div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Loading accounts...</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Accounts</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {accountStats.totalAccounts}
                </p>
              </div>
              <Wallet className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Accounts</p>
                <p className="text-2xl font-bold text-green-600">
                  {accountStats.activeAccounts}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Blown Accounts</p>
                <p className="text-2xl font-bold text-red-600">
                  {accountStats.blownAccounts}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Trades</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {accountStats.totalTradesAcrossAccounts}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Account */}
      {activeAccount && (
        <Card className="card-modern border-2 border-green-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  Active Account: {activeAccount.name}
                </CardTitle>
                <CardDescription>
                  Current trading account
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  ${activeAccount.currentBalance.toLocaleString()}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Current Balance</div>
              </div>
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className={`text-lg font-bold ${activeAccount.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {activeAccount.totalPnL >= 0 ? '+' : ''}${activeAccount.totalPnL.toLocaleString()}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Total P&L</div>
              </div>
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  {activeAccount.totalTrades}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Total Trades</div>
              </div>
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  {activeAccount.winRate.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Win Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Switch Account */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center">
              <RotateCcw className="w-5 h-5 mr-2" />
              Switch Account
            </CardTitle>
            <CardDescription>
              Switch between your trading accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label htmlFor="account-select">Select Account</Label>
              <Select 
                value={activeAccount?.id || ''} 
                onValueChange={handleSwitchAccount}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter(acc => !acc.isBlown).map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{account.name}</span>
                        <Badge 
                          variant={account.isActive ? "default" : "secondary"}
                          className="ml-2"
                        >
                          {account.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Create New Account */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Create New Account
            </CardTitle>
            <CardDescription>
              Start a new trading account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Trading Account</DialogTitle>
                  <DialogDescription>
                    Start a new trading account to track your performance separately.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="account-name">Account Name</Label>
                    <Input
                      id="account-name"
                      value={newAccountName}
                      onChange={(e) => setNewAccountName(e.target.value)}
                      placeholder="e.g., Main Account, Demo Account"
                    />
                  </div>
                  <div>
                    <Label htmlFor="initial-balance">Initial Balance</Label>
                    <Input
                      id="initial-balance"
                      type="number"
                      value={newAccountBalance}
                      onChange={(e) => setNewAccountBalance(Number(e.target.value))}
                      placeholder="10000"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateAccount}
                    disabled={isCreating || !newAccountName.trim()}
                  >
                    {isCreating ? 'Creating...' : 'Create Account'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* All Accounts List */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle>All Accounts</CardTitle>
          <CardDescription>
            Manage all your trading accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {accounts.map((account) => (
              <div 
                key={account.id} 
                className={`p-4 rounded-lg border ${
                  account.isActive 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : account.isBlown
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                        {account.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Created: {new Date(account.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {account.isActive && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </Badge>
                      )}
                      {account.isBlown && (
                        <Badge variant="destructive">
                          Blown
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        ${account.currentBalance.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {account.totalTrades} trades
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {!account.isBlown && !account.isActive && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSwitchAccount(account.id)}
                        >
                          Activate
                        </Button>
                      )}
                      {!account.isBlown && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleMarkAsBlown(account.id)}
                        >
                          Mark as Blown
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
