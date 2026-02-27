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
  RotateCcw,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { useJournalManagement } from '@/hooks/useAccountManagement';
import { TradingJournal } from '@/types/account';

export function JournalManager() {
  const { 
    journals, 
    activeJournal, 
    journalStats, 
    isLoading, 
    error,
    createJournal, 
    switchJournal, 
    markJournalAsBlown,
    markJournalAsPassed
  } = useJournalManagement();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newJournal, setNewJournal] = useState({
    name: '',
    accountType: 'paper' as 'paper' | 'live' | 'demo',
    initialBalance: '',
    currency: 'USD'
  });

  const handleCreateJournal = async () => {
    if (!newJournal.name.trim() || !newJournal.initialBalance) {
      return;
    }

    try {
      await createJournal({
        name: newJournal.name.trim(),
        accountType: newJournal.accountType,
        initialBalance: parseFloat(newJournal.initialBalance),
        currency: newJournal.currency
      });
      
      setNewJournal({
        name: '',
        accountType: 'paper',
        initialBalance: '',
        currency: 'USD'
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Error handled by createJournal hook
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error creating journal:', error);
      }
    }
  };

  const handleSwitchJournal = (journalId: string) => {
    const journal = journals.find(j => j.id === journalId);
    if (journal) {
      switchJournal(journal);
    }
  };

  const handleMarkAsBlown = async (journalId: string) => {
      try {
        await markJournalAsBlown(journalId);
      } catch (error) {
        // Error handled by markJournalAsBlown hook
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Error marking journal as blown:', error);
        }
    }
  };

  const handleMarkAsPassed = async (journalId: string) => {
      try {
        await markJournalAsPassed(journalId);
      } catch (error) {
        // Error handled by markJournalAsPassed hook
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Error marking journal as passed:', error);
        }
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-500">
            <AlertTriangle className="h-4 w-4" />
            <span>Error loading journals: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="h-5 w-5" />
              <span>Trading Journals</span>
                </CardTitle>
                <CardDescription>
              Manage your trading accounts and journals
                </CardDescription>
              </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                New Journal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Trading Journal</DialogTitle>
                <DialogDescription>
                  Set up a new trading journal to track your performance.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Journal Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Main Trading Account"
                    value={newJournal.name}
                    onChange={(e) => setNewJournal({ ...newJournal, name: e.target.value })}
                  />
            </div>
                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select
                    value={newJournal.accountType}
                    onValueChange={(value: 'paper' | 'live' | 'demo') => 
                      setNewJournal({ ...newJournal, accountType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paper">Paper Trading</SelectItem>
                      <SelectItem value="demo">Demo Account</SelectItem>
                      <SelectItem value="live">Live Trading</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initialBalance">Initial Balance</Label>
                  <Input
                    id="initialBalance"
                    type="number"
                    placeholder="10000"
                    value={newJournal.initialBalance}
                    onChange={(e) => setNewJournal({ ...newJournal, initialBalance: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={newJournal.currency}
                    onValueChange={(value) => setNewJournal({ ...newJournal, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateJournal}>
                  Create Journal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {journals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No trading journals yet</p>
            <p className="text-sm mb-4">Create your first journal to start tracking your trades</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Journal
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active Journal Display */}
            {activeJournal && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <div>
                      <h3 className="font-semibold text-primary">{activeJournal.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {activeJournal.accountType} • ${activeJournal.currentBalance?.toLocaleString() || '0.00'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    Active
                  </Badge>
                </div>
              </div>
            )}

            {/* Journal Selection */}
            <div className="space-y-2">
              <Label>Switch Journal</Label>
              <Select value={activeJournal?.id || ''} onValueChange={handleSwitchJournal}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a journal" />
                </SelectTrigger>
                <SelectContent>
                  {journals.map((journal) => (
                    <SelectItem key={journal.id} value={journal.id}>
                      <div className="flex items-center space-x-2">
                        <Wallet className="h-4 w-4" />
                        <span>{journal.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {journal.accountType}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Journal Stats */}
            {activeJournal && journalStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Current Balance</span>
                  </div>
                  <p className="text-lg font-bold">
                    ${activeJournal.currentBalance?.toLocaleString() || '0.00'}
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Trades</span>
                  </div>
                  <p className="text-lg font-bold">
                    {journalStats.totalTrades || 0}
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Win Rate</span>
                  </div>
                  <p className="text-lg font-bold">
                    {journalStats.winRate ? `${journalStats.winRate.toFixed(1)}%` : '0%'}
                  </p>
                      </div>
                    </div>
            )}

            {/* Journal Actions */}
            {activeJournal && (
              <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline"
                          size="sm" 
                  onClick={() => handleMarkAsBlown(activeJournal.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                          Mark as Blown
                        </Button>
                        <Button 
                  variant="outline"
                          size="sm" 
                  onClick={() => handleMarkAsPassed(activeJournal.id)}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                  <CheckCircle className="h-4 w-4 mr-1" />
                          Mark as Passed
                        </Button>
              </div>
            )}
          </div>
        )}
        </CardContent>
      </Card>
  );
}