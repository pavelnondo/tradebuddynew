/**
 * Settings Page - COMPLETELY REFACTORED
 * Features:
 * - All tabs functional
 * - Theme switcher (light/dark) - syncs with ThemeContext
 * - Display settings (date format, currency, number precision, P&L colors)
 * - Notifications management
 * - Data export/import via API
 * - Security settings (password change, logout)
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useUIStore } from '@/stores/useUIStore';
import { NeonCard } from '@/components/ui/NeonCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAccountManagement } from '@/hooks/useAccountManagement';
import { Button } from '@/components/ui/button';
import { useUserSettings } from '@/hooks/useUserSettings';
import { API_BASE_URL } from '@/config';
import { PageContainer } from '@/components/layout/PageContainer';
import { tradeApi } from '@/services/tradeApi';
import { 
  Palette,
  Monitor,
  Bell,
  Shield,
  Database,
  Download,
  Upload,
  RefreshCw,
  Moon,
  Sun,
  Trash2,
  Key,
  Loader2,
  Plus,
  Pencil,
  X,
  Wallet,
} from 'lucide-react';

export default function Settings() {
  const { currentTheme, setTheme, themeConfig } = useTheme();
  const { settings: apiSettings, updateSettings } = useUserSettings();
  
  const {
    theme: uiTheme,
    accentColor,
    dateFormat,
    currencyFormat,
    numberPrecision,
    pnlColorScheme,
    notifications,
    setTheme: setUITheme,
    setAccentColor,
    setDateFormat,
    setCurrencyFormat,
    setNumberPrecision,
    setPnLColorScheme,
    setNotification,
  } = useUIStore();

  const { toast } = useToast();
  const {
    journals,
    activeJournal,
    createJournal,
    updateJournal,
    deleteJournal,
  } = useAccountManagement();

  const [newJournalName, setNewJournalName] = useState('');
  const [newJournalBalance, setNewJournalBalance] = useState(10000);
  const [editJournalId, setEditJournalId] = useState<string | null>(null);
  const [editJournalName, setEditJournalName] = useState('');
  const [editJournalBalance, setEditJournalBalance] = useState(10000);
  const [deleteJournalDialogOpen, setDeleteJournalDialogOpen] = useState(false);
  const [journalToDelete, setJournalToDelete] = useState<string | null>(null);

  const handleCreateJournal = async () => {
    if (!newJournalName.trim()) return;
    try {
      const name = newJournalName.trim();
      await createJournal(name, newJournalBalance);
      setNewJournalName('');
      setNewJournalBalance(10000);
      toast({ title: 'Journal created', description: `${name} has been created.` });
    } catch (error) {
      toast({ title: 'Failed to create journal', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    }
  };

  const handleEditJournalClick = (journal: { id: string; name: string; initialBalance?: number }) => {
    setEditJournalId(journal.id);
    setEditJournalName(journal.name);
    setEditJournalBalance(journal.initialBalance ?? 10000);
  };

  const handleEditJournalSave = async () => {
    if (!editJournalId || !editJournalName.trim()) return;
    try {
      await updateJournal(editJournalId, { name: editJournalName.trim(), initialBalance: editJournalBalance });
      setEditJournalId(null);
      toast({ title: 'Journal updated', description: 'Changes saved successfully.' });
    } catch (error) {
      toast({ title: 'Failed to update journal', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    }
  };

  const handleDeleteJournalClick = (id: string) => {
    if (journals.length <= 1) {
      toast({ title: 'Cannot delete', description: 'You must have at least one journal.', variant: 'destructive' });
      return;
    }
    setJournalToDelete(id);
    setDeleteJournalDialogOpen(true);
  };

  const handleDeleteJournalConfirm = async () => {
    if (!journalToDelete) return;
    const id = journalToDelete;
    setJournalToDelete(null);
    setDeleteJournalDialogOpen(false);
    try {
      await deleteJournal(id);
      toast({ title: 'Journal deleted', description: 'The journal has been removed.' });
    } catch (error) {
      toast({ title: 'Failed to delete journal', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    }
  };

  const inputStyle = {
    backgroundColor: themeConfig.card,
    borderColor: themeConfig.border,
    color: themeConfig.foreground,
  };
  const labelStyle = { color: themeConfig.foreground };

  // Sync API settings to UI store when loaded (one-time hydrate)
  const hasHydrated = useRef(false);
  useEffect(() => {
    if (apiSettings && !hasHydrated.current) {
      hasHydrated.current = true;
      if (apiSettings.date_format) setDateFormat(apiSettings.date_format as 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD');
      if (apiSettings.currency) setCurrencyFormat(apiSettings.currency as 'USD' | 'EUR' | 'GBP' | 'JPY');
      const prefs = apiSettings.preferences;
      if (prefs) {
        if (prefs.numberPrecision !== undefined) setNumberPrecision(prefs.numberPrecision as 0 | 1 | 2 | 3 | 4);
        if (prefs.pnlColorScheme) setPnLColorScheme(prefs.pnlColorScheme);
        if (prefs.notifications) {
          Object.entries(prefs.notifications).forEach(([k, v]) => setNotification(k as keyof typeof notifications, !!v));
        }
      }
    }
  }, [apiSettings]);

  const persistDisplaySettings = useCallback((overrides?: { date_format?: string; currency?: string; numberPrecision?: number; pnlColorScheme?: string; notifications?: typeof notifications }) => {
    updateSettings({
      date_format: overrides?.date_format ?? dateFormat,
      currency: overrides?.currency ?? currencyFormat,
      preferences: {
        numberPrecision: overrides?.numberPrecision ?? numberPrecision,
        pnlColorScheme: (overrides?.pnlColorScheme ?? pnlColorScheme) as 'green-red' | 'red-green',
        notifications: overrides?.notifications ?? notifications,
      },
    }).catch(() => {
      toast({ title: 'Could not save preferences', variant: 'destructive' });
    });
  }, [dateFormat, currencyFormat, numberPrecision, pnlColorScheme, notifications, updateSettings, toast]);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleThemeClick = useCallback((themeKey: string) => {
    setTheme(themeKey);
    setUITheme(themeKey === 'system' ? 'system' : themeKey as 'light' | 'dark');
  }, [setTheme, setUITheme]);

  const handleExportData = useCallback(async () => {
    setExporting(true);
    try {
      const response = await tradeApi.getTrades({ limit: 10000 });
      const trades = response.trades || [];
      const data = {
        trades,
        settings: {
          theme: uiTheme,
          dateFormat,
          currencyFormat,
          numberPrecision,
          pnlColorScheme,
          notifications,
        },
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tradebuddy-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: `Exported ${trades.length} trades.`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export data.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  }, [dateFormat, currencyFormat, numberPrecision, pnlColorScheme, notifications, uiTheme, toast]);

  const handleImportData = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const trades = data.trades;
        if (!Array.isArray(trades) || trades.length === 0) {
          toast({
            title: 'Import Failed',
            description: 'No trades found in file.',
            variant: 'destructive',
          });
          setImporting(false);
          return;
        }

        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/trades/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ trades }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Import failed');
        }
        const result = await res.json();
        toast({
          title: 'Import Successful',
          description: `Imported ${result.imported || trades.length} trades.`,
        });
        window.location.reload();
      } catch (error) {
        toast({
          title: 'Import Failed',
          description: error instanceof Error ? error.message : 'Invalid file format.',
          variant: 'destructive',
        });
      } finally {
        setImporting(false);
      };
      event.target.value = '';
    };
    reader.readAsText(file);
  }, [toast]);

  const handleChangePassword = useCallback(async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    setChangingPassword(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/user/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword: oldPassword, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

    toast({
      title: 'Password Changed',
      description: 'Your password has been updated successfully.',
    });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  }, [oldPassword, newPassword, confirmPassword, toast]);

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [resetDataDialogOpen, setResetDataDialogOpen] = useState(false);

  const handleLogoutAllSessionsClick = () => setLogoutDialogOpen(true);
  const handleLogoutConfirm = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const handleResetDataClick = () => setResetDataDialogOpen(true);
  const handleResetDataConfirm = () => {
      localStorage.clear();
    window.location.href = '/';
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-center justify-between pb-8 border-b" style={{ borderColor: themeConfig.border }}>
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: themeConfig.foreground }}>Settings</h1>
          <p style={{ color: themeConfig.mutedForeground }}>
            Customize your trading journal experience
          </p>
        </div>
      </div>

      <Tabs defaultValue="theme" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 gap-1" style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="journals" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Journals
          </TabsTrigger>
          <TabsTrigger value="display" className="flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Display
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Data
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Theme Tab */}
        <TabsContent value="theme" className="space-y-6">
          <NeonCard className="p-6" hover={false}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: themeConfig.foreground }}>
              <Palette className="w-5 h-5" style={{ color: themeConfig.accent }} />
              Theme Selection
            </h3>
            <p className="text-sm mb-6" style={{ color: themeConfig.mutedForeground }}>
              Choose your preferred visual theme
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <NeonButton
                variant={currentTheme === 'light' ? 'primary' : 'secondary'}
                className="h-20 flex-col"
                onClick={() => handleThemeClick('light')}
              >
                <Sun className="w-6 h-6 mb-2" />
                Light
              </NeonButton>
              <NeonButton
                variant={currentTheme === 'dark' ? 'primary' : 'secondary'}
                className="h-20 flex-col"
                onClick={() => handleThemeClick('dark')}
              >
                <Moon className="w-6 h-6 mb-2" />
                Dark
              </NeonButton>
                  </div>

                    <div>
              <Label htmlFor="accentColor" className="text-sm font-medium" style={labelStyle}>Accent Color</Label>
              <div className="flex items-center gap-4 mt-1.5">
                <Input
                  id="accentColor"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-20 h-10 rounded-xl"
                  style={inputStyle}
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1 rounded-xl"
                  style={inputStyle}
                />
                    </div>
                  </div>
          </NeonCard>
        </TabsContent>

        {/* Journals Tab */}
        <TabsContent value="journals" className="space-y-6">
          <NeonCard className="p-6" hover={false}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: themeConfig.foreground }}>
              <Wallet className="w-5 h-5" style={{ color: themeConfig.accent }} />
              Trading Journals
            </h3>
            <p className="text-sm mb-6" style={{ color: themeConfig.mutedForeground }}>
              Create, edit, and manage your trading journals. Edit the starting balance or delete journals you no longer need.
            </p>

            <div className="space-y-4 mb-6">
              <h4 className="text-sm font-medium" style={{ color: themeConfig.foreground }}>Create New Journal</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-sm font-medium" style={labelStyle}>Name</Label>
                  <Input
                    value={newJournalName}
                    onChange={(e) => setNewJournalName(e.target.value)}
                    placeholder="e.g. Main Account"
                    className="mt-1.5 rounded-xl"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium" style={labelStyle}>Starting Balance</Label>
                  <Input
                    type="number"
                    value={newJournalBalance}
                    onChange={(e) => setNewJournalBalance(Number(e.target.value) || 0)}
                    placeholder="10000"
                    className="mt-1.5 rounded-xl"
                    style={inputStyle}
                  />
                </div>
                <div className="flex items-end">
                  <NeonButton onClick={handleCreateJournal} disabled={!newJournalName.trim()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Journal
                  </NeonButton>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3" style={{ color: themeConfig.foreground }}>Existing Journals</h4>
              <div className="space-y-2">
                {journals.map((journal) => (
                  <div
                    key={journal.id}
                    className="flex items-center justify-between p-4 rounded-xl border"
                    style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}
                  >
                    <div className="flex items-center gap-3">
                      {journal.isActive && (
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: themeConfig.accent }} />
                      )}
                      <div>
                        <span className="font-medium block" style={{ color: themeConfig.foreground }}>{journal.name}</span>
                        <span className="text-sm" style={{ color: themeConfig.mutedForeground }}>
                          ${(journal.initialBalance ?? 0).toLocaleString()} starting balance
                          {journal.isActive && ' • Active'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditJournalClick(journal)}
                        className="p-2"
                        aria-label={`Edit ${journal.name}`}
                      >
                        <Pencil className="w-4 h-4" style={{ color: themeConfig.accent }} />
                      </Button>
                      {journals.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteJournalClick(journal.id)}
                          className="p-2 text-red-500 hover:text-red-700"
                          aria-label={`Delete ${journal.name}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {editJournalId && (
                <div className="mt-4 p-4 rounded-xl border" style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
                  <h5 className="text-sm font-medium mb-3" style={{ color: themeConfig.foreground }}>Edit Journal</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium" style={labelStyle}>Name</Label>
                      <Input
                        value={editJournalName}
                        onChange={(e) => setEditJournalName(e.target.value)}
                        placeholder="Journal name"
                        className="mt-1.5 rounded-xl"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium" style={labelStyle}>Starting Balance</Label>
                      <Input
                        type="number"
                        value={editJournalBalance}
                        onChange={(e) => setEditJournalBalance(Number(e.target.value) || 0)}
                        placeholder="10000"
                        className="mt-1.5 rounded-xl"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <NeonButton size="sm" onClick={handleEditJournalSave} disabled={!editJournalName.trim()}>
                      Save Changes
                    </NeonButton>
                    <NeonButton size="sm" variant="ghost" onClick={() => setEditJournalId(null)}>
                      Cancel
                    </NeonButton>
                  </div>
                </div>
              )}
            </div>
          </NeonCard>
        </TabsContent>

        {/* Display Tab */}
        <TabsContent value="display" className="space-y-6">
          <NeonCard className="p-6" hover={false}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: themeConfig.foreground }}>
              <Monitor className="w-5 h-5" style={{ color: themeConfig.accent }} />
              Display Settings
            </h3>
            <p className="text-sm mb-6" style={{ color: themeConfig.mutedForeground }}>
              Customize how data is displayed
            </p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="dateFormat" className="text-sm font-medium" style={labelStyle}>Date Format</Label>
                <select
                  id="dateFormat"
                  value={dateFormat}
                  onChange={(e) => {
                    const v = e.target.value as 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
                    setDateFormat(v);
                    persistDisplaySettings({ date_format: v });
                  }}
                  className="mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm"
                  style={inputStyle}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div>
                <Label htmlFor="currencyFormat" className="text-sm font-medium" style={labelStyle}>Currency Format</Label>
                <select
                  id="currencyFormat"
                  value={currencyFormat}
                  onChange={(e) => {
                    const v = e.target.value as 'USD' | 'EUR' | 'GBP' | 'JPY';
                    setCurrencyFormat(v);
                    persistDisplaySettings({ currency: v });
                  }}
                  className="mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm"
                  style={inputStyle}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="numberPrecision" className="text-sm font-medium" style={labelStyle}>Number Precision (decimals)</Label>
                <select
                  id="numberPrecision"
                  value={numberPrecision}
                  onChange={(e) => {
                    const n = parseInt(e.target.value) as 0 | 1 | 2 | 3 | 4;
                    setNumberPrecision(n);
                    persistDisplaySettings({ numberPrecision: n });
                  }}
                  className="mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm"
                  style={inputStyle}
                >
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>

              <div>
                <Label htmlFor="pnlColorScheme" className="text-sm font-medium" style={labelStyle}>P&L Color Scheme</Label>
                <select
                  id="pnlColorScheme"
                  value={pnlColorScheme}
                  onChange={(e) => {
                    const v = e.target.value as 'green-red' | 'red-green';
                    setPnLColorScheme(v);
                    persistDisplaySettings({ pnlColorScheme: v });
                  }}
                  className="mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm"
                  style={inputStyle}
                >
                  <option value="green-red">Green for Profit, Red for Loss</option>
                  <option value="red-green">Red for Profit, Green for Loss</option>
                </select>
              </div>
            </div>
          </NeonCard>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <NeonCard className="p-6" hover={false}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: themeConfig.foreground }}>
              <Bell className="w-5 h-5" style={{ color: themeConfig.accent }} />
              Notification Preferences
            </h3>
            <p className="text-sm mb-6" style={{ color: themeConfig.mutedForeground }}>
              Choose how you want to be notified
            </p>

                  <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Daily Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive daily trading summary
                  </p>
                </div>
                <Switch
                  checked={notifications.dailySummary}
                  onCheckedChange={(checked) => {
                setNotification('dailySummary', checked);
                persistDisplaySettings({ notifications: { ...notifications, dailySummary: checked } });
              }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Weekly Report</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly performance report
                  </p>
                </div>
                <Switch
                  checked={notifications.weeklyReport}
                  onCheckedChange={(checked) => {
                setNotification('weeklyReport', checked);
                persistDisplaySettings({ notifications: { ...notifications, weeklyReport: checked } });
              }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Goal Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminders about your goals
                  </p>
                </div>
                <Switch
                  checked={notifications.goalReminders}
                  onCheckedChange={(checked) => {
                setNotification('goalReminders', checked);
                persistDisplaySettings({ notifications: { ...notifications, goalReminders: checked } });
              }}
                    />
                  </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Habit Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminders about your habits
                  </p>
                </div>
                <Switch
                  checked={notifications.habitReminders}
                  onCheckedChange={(checked) => {
                setNotification('habitReminders', checked);
                persistDisplaySettings({ notifications: { ...notifications, habitReminders: checked } });
              }}
                    />
                    </div>
                  </div>
          </NeonCard>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-6">
          <NeonCard className="p-6" hover={false}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: themeConfig.foreground }}>
              <Database className="w-5 h-5" style={{ color: themeConfig.accent }} />
              Data Management
            </h3>
            <p className="text-sm mb-6" style={{ color: themeConfig.mutedForeground }}>
              Manage your trading data and backups
            </p>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NeonButton onClick={handleExportData} variant="secondary" className="w-full" disabled={exporting}>
                        {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  {exporting ? 'Exporting...' : 'Export Data (JSON)'}
                </NeonButton>
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                    disabled={importing}
                  />
                  <NeonButton
                    variant="secondary"
                    className="w-full"
                    type="button"
                    disabled={importing}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    {importing ? 'Importing...' : 'Import Data'}
                  </NeonButton>
                </>
                    </div>
                    
              <NeonButton
                variant="destructive"
                onClick={handleResetDataClick}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Reset All Data
              </NeonButton>
            </div>
          </NeonCard>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <NeonCard className="p-6" hover={false}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: themeConfig.foreground }}>
              <Shield className="w-5 h-5" style={{ color: themeConfig.accent }} />
              Security Settings
            </h3>
            <p className="text-sm mb-6" style={{ color: themeConfig.mutedForeground }}>
              Protect your account and data
            </p>

                  <div className="space-y-4">
              <div>
                <Label htmlFor="oldPassword" className="text-sm font-medium" style={labelStyle}>Current Password</Label>
                <Input
                  id="oldPassword"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="mt-1.5 rounded-xl"
                  style={inputStyle}
                    />
              </div>

              <div>
                <Label htmlFor="newPassword" className="text-sm font-medium" style={labelStyle}>New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1.5 rounded-xl"
                  style={inputStyle}
                    />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium" style={labelStyle}>Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1.5 rounded-xl"
                  style={inputStyle}
                    />
                  </div>

              <NeonButton onClick={handleChangePassword} className="w-full" disabled={changingPassword}>
                {changingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                      {changingPassword ? 'Updating...' : 'Change Password'}
              </NeonButton>
            </div>
          </NeonCard>

          <NeonCard className="p-6" hover={false}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: themeConfig.foreground }}>Active Sessions</h3>
            <p className="text-sm mb-4" style={{ color: themeConfig.mutedForeground }}>
              Manage your active login sessions
            </p>
            <NeonButton variant="secondary" className="w-full" onClick={handleLogoutAllSessionsClick}>
                      <RefreshCw className="w-4 h-4 mr-2" />
              Logout All Sessions
            </NeonButton>
          </NeonCard>
        </TabsContent>
      </Tabs>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>
              This will log you out. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteJournalDialogOpen} onOpenChange={setDeleteJournalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete journal?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this journal? All trades in this journal will be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteJournalConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetDataDialogOpen} onOpenChange={setResetDataDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all data?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all local data and log out? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetDataConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear and log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
