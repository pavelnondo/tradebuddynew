import React, { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  LayoutDashboard, 
  BarChart3, 
  Calendar, 
  CheckSquare, 
  Target, 
  Settings, 
  Menu, 
  X, 
  Search, 
  Bell, 
  LogOut,
  TrendingUp,
  Calculator,
  BookOpen,
  Plus,
  GraduationCap,
  Pencil,
  FileText
} from 'lucide-react';
import { useJournalManagement } from '../hooks/useAccountManagement';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { FloatingActionPanel } from './ui/floating-action-panel';
import { NavLinkWithParticles } from './NavLinkWithParticles';
import { AppLogo } from './AppLogo';
import { SkyToggle } from './ui/sky-toggle';
import { useToast } from '@/hooks/use-toast';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

const navGroups = [
  {
    label: 'Main',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { name: 'Trades', href: '/trades', icon: TrendingUp, label: 'Trades' },
      { name: 'Add Trade', href: '/add-trade', icon: Plus, label: 'Add Trade' },
      { name: 'No Trade Day', href: '/add-no-trade-day', icon: FileText, label: 'No Trade Day' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { name: 'Analysis', href: '/analysis', icon: BarChart3, label: 'Analysis' },
      { name: 'Risk Calculator', href: '/risk-calculator', icon: Calculator, label: 'Risk Calculator' },
      { name: 'Calendar', href: '/calendar', icon: Calendar, label: 'Calendar' },
    ],
  },
  {
    label: 'Planning',
    items: [
      { name: 'Checklists', href: '/checklists', icon: CheckSquare, label: 'Checklists' },
      { name: 'Goals', href: '/planning-goals', icon: Target, label: 'Goals' },
      { name: 'Education', href: '/education', icon: GraduationCap, label: 'Education' },
    ],
  },
  {
    label: null,
    items: [
      { name: 'Settings', href: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [deleteJournalDialogOpen, setDeleteJournalDialogOpen] = useState(false);
  const [journalToDelete, setJournalToDelete] = useState<string | null>(null);
  const [editJournalId, setEditJournalId] = useState<string | null>(null);
  const [editJournalName, setEditJournalName] = useState('');
  const [editJournalBalance, setEditJournalBalance] = useState(10000);
  const [newJournalName, setNewJournalName] = useState('');
  const [newJournalBalance, setNewJournalBalance] = useState(10000);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentTheme, themeConfig } = useTheme();
  const [headerSearch, setHeaderSearch] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Sync header search from URL when on trade-history (e.g. from direct link)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search') ?? '';
    if (location.pathname === '/trade-history' && q && q !== headerSearch) {
      setHeaderSearch(q);
    }
  }, [location.pathname, location.search]);

  const handleHeaderSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const q = headerSearch.trim();
      if (q) {
        navigate(`/trade-history?search=${encodeURIComponent(q)}`);
        setHeaderSearch('');
      } else {
        navigate('/trade-history');
      }
    }
  }, [headerSearch, navigate]);
  const { journals, activeJournal, switchJournal, createJournal, updateJournal, deleteJournal, fetchJournals } = useJournalManagement();
  useKeyboardShortcuts();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleJournalSwitch = async (value: string) => {
    setSwitching(true);
    try {
      await switchJournal(value);
      window.location.reload();
    } catch (error) {
      // Error handled by switchJournal hook
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Failed to switch journal:', error);
      }
    } finally {
      setSwitching(false);
    }
  };

  const handleCreateJournal = async () => {
    if (!newJournalName.trim()) return;
    try {
      const name = newJournalName.trim();
      await createJournal(name, newJournalBalance);
      setNewJournalName('');
      setNewJournalBalance(10000);
      setShowJournalModal(false);
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

  const handleDeleteJournalClick = (journalId: string) => {
    if (journals.length <= 1) {
      toast({ title: 'Cannot delete', description: 'You must have at least one journal.', variant: 'destructive' });
      return;
    }
    setJournalToDelete(journalId);
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

  return (
    <div className="min-h-screen bg-background flex">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] px-4 py-2 rounded-lg opacity-0 focus:opacity-100 focus:outline-none focus:ring-2 transition-opacity"
        style={{ backgroundColor: themeConfig.accent, color: themeConfig.accentForeground || '#fff' }}
      >
        Skip to main content
      </a>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-[280px] transform transition-all duration-300 ease-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-screen flex-col overflow-hidden backdrop-blur-xl" style={{ 
          borderRight: `1px solid ${themeConfig.border}`,
          background: `${themeConfig.bg}ee`
        }}>
          {/* Logo */}
          <div className="group flex items-center gap-3 p-6 border-b flex-shrink-0" style={{ borderColor: themeConfig.border }}>
            <AppLogo size="md" />
          </div>

          {/* Journal Switcher - Improved */}
          <div className="p-4 border-b" style={{ borderColor: themeConfig.border }}>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-3.5 h-3.5" style={{ color: themeConfig.mutedForeground }} />
              <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: themeConfig.mutedForeground }}>
                Journal
              </span>
            </div>
            <Select 
              value={activeJournal?.id || ''} 
              onValueChange={async (value) => {
                const journal = journals.find(j => j.id === value);
                if (journal) {
                  setSwitching(true);
                  switchJournal(value);
                  window.location.reload();
                }
              }}
              disabled={switching}
            >
              <SelectTrigger 
                className="w-full h-10 rounded-lg font-medium"
                disabled={switching}
                style={{ 
                  backgroundColor: themeConfig.card,
                  borderColor: themeConfig.border,
                  color: themeConfig.foreground
                }}
              >
                <SelectValue placeholder="Select journal">
                  {switching ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: themeConfig.accent, borderTopColor: 'transparent' }} />
                      <span>Switching...</span>
                    </div>
                  ) : (
                    activeJournal?.name || 'No journal selected'
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent 
                className="bg-background border z-[100] rounded-xl"
                style={{ 
                  backgroundColor: themeConfig.bg,
                  borderColor: themeConfig.border,
                  minWidth: '250px'
                }}
                position="popper"
                sideOffset={5}
              >
                {journals.map((journal) => (
                  <SelectItem 
                    key={journal.id} 
                    value={journal.id}
                    className="hover:bg-card rounded-lg mx-1 my-0.5 transition-colors"
                    style={{ 
                      backgroundColor: journal.isActive ? `${themeConfig.accent}15` : 'transparent',
                      color: journal.isActive ? themeConfig.accent : themeConfig.foreground
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {journal.isActive && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: themeConfig.accent }} />}
                      <span className="font-medium">{journal.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Journal Management */}
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowJournalModal(true)}
                className="w-full h-8 text-xs font-medium"
              >
                <Plus className="w-3 h-3 mr-1.5" />
                New Journal
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 overflow-y-auto space-y-4">
            {navGroups.map((group) => (
              <div key={group.label ?? 'settings'}>
                {group.label && (
                  <p 
                    className="px-3 mb-1.5 text-[11px] font-medium uppercase tracking-wider"
                    style={{ color: themeConfig.mutedForeground }}
                  >
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                      <NavLinkWithParticles
                        key={item.name}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: isActive ? `${themeConfig.accent}10` : 'transparent',
                          color: isActive ? themeConfig.accent : themeConfig.mutedForeground,
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = `${themeConfig.card}`;
                            e.currentTarget.style.color = themeConfig.foreground;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = themeConfig.mutedForeground;
                          }
                        }}
                      >
                        <Icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                        <span className="flex-1">{item.label}</span>
                      </NavLinkWithParticles>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User section - FloatingActionPanel */}
          <div className="p-4 border-t" style={{ borderColor: themeConfig.border }}>
            <FloatingActionPanel
              align="start"
              side="top"
              panelClassName="min-w-[220px]"
              actions={[
                {
                  id: 'settings',
                  label: 'Settings',
                  icon: <Settings className="w-4 h-4" />,
                  onClick: () => navigate('/settings'),
                },
                {
                  id: 'logout',
                  label: 'Log out',
                  icon: <LogOut className="w-4 h-4" />,
                  onClick: handleLogout,
                  variant: 'destructive',
                },
              ]}
              trigger={
                <div 
                  className="flex items-center gap-3 p-3 rounded-lg w-full transition-colors hover:bg-card"
                  style={{ backgroundColor: themeConfig.card }}
                >
                  <div 
                    className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0"
                    style={{ 
                      backgroundColor: themeConfig.accent,
                      color: themeConfig.accentForeground || '#fff',
                    }}
                  >
                    T
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold truncate" style={{ color: themeConfig.foreground }}>Trader</p>
                    <span className="text-xs" style={{ color: themeConfig.mutedForeground }}>
                      Active journal
                    </span>
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-[280px]">
        {/* Header - Modern */}
        <header 
          className="sticky top-0 z-30 backdrop-blur-xl border-b"
          style={{ 
            backgroundColor: `${themeConfig.bg}ee`,
            borderColor: themeConfig.border
          }}
        >
          <div className="flex items-center justify-between px-6 py-4">
            {/* Mobile: compact logo + menu button */}
            <div className="lg:hidden flex items-center gap-2 flex-1 min-w-0">
              <AppLogo compact size="sm" className="flex-shrink-0" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                style={{ color: themeConfig.foreground }}
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </div>

            {/* Current page title - Desktop: icon badge + label */}
            <div className="hidden lg:flex items-center gap-3 min-w-0">
              {(() => {
                const flatItems = navGroups.flatMap(g => g.items);
                let currentNav = flatItems.find(item => item.href === location.pathname);
                if (!currentNav) {
                  if (location.pathname === '/trade-history' || location.pathname.startsWith('/trade/')) {
                    currentNav = flatItems.find(item => item.href === '/trades');
                  }
                  if (!currentNav && location.pathname.startsWith('/edit-trade/')) {
                    currentNav = flatItems.find(item => item.href === '/add-trade');
                  }
                }
                const Icon = currentNav?.icon;
                return (
                  <>
                    {Icon && (
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{ 
                          backgroundColor: `${themeConfig.accent}12`,
                          border: `1px solid ${themeConfig.border}`,
                          color: themeConfig.accent
                        }}
                      >
                        <Icon className="w-5 h-5" strokeWidth={2} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold tracking-tight truncate" style={{ color: themeConfig.foreground }}>
                        {currentNav?.label || 'Dashboard'}
                      </h2>
                      <p className="text-xs truncate" style={{ color: themeConfig.mutedForeground }}>
                        {activeJournal?.name || 'No active journal'}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Search bar - Modern */}
            <div className="flex-1 max-w-md mx-4">
              <div className="relative group">
                <Search 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors pointer-events-none" 
                  style={{ color: themeConfig.mutedForeground }}
                />
                <Input
                  type="text"
                  placeholder="Search trades, analysis..."
                  value={headerSearch}
                  onChange={(e) => setHeaderSearch(e.target.value)}
                  onKeyDown={handleHeaderSearchKeyDown}
                  className="w-full h-10 pl-10 pr-4"
                  style={{ 
                    backgroundColor: `${themeConfig.card}60`,
                    borderColor: themeConfig.border,
                    color: themeConfig.foreground
                  }}
                />
              </div>
            </div>

            {/* Actions - Improved */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-9 h-9 rounded-lg"
                    style={{ color: themeConfig.foreground }}
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80" style={{ backgroundColor: themeConfig.popover, borderColor: themeConfig.border }}>
                  <div className="p-4 space-y-4">
                    <h4 className="font-semibold" style={{ color: themeConfig.foreground }}>Notifications</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      <p className="text-sm" style={{ color: themeConfig.mutedForeground }}>
                        Goal and habit reminders will appear here when enabled in Settings.
                      </p>
                      <div className="text-xs pt-2 border-t" style={{ borderColor: themeConfig.border, color: themeConfig.mutedForeground }}>
                        <p>• Daily summary: enabled in Settings → Display</p>
                        <p>• Weekly report: enabled in Settings → Display</p>
                        <p>• Goal reminders: enabled in Settings → Display</p>
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Light/Dark Toggle */}
              <SkyToggle className="origin-right" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 overflow-auto" role="main" style={{ backgroundColor: themeConfig.bg }}>
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
      
      {/* Journal Management Modal */}
      {showJournalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setShowJournalModal(false)}
          />
          <div 
            className="relative w-full max-w-md mx-4 rounded-2xl border p-6 shadow-2xl"
            style={{ 
              backgroundColor: themeConfig.bg,
              borderColor: themeConfig.border
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: themeConfig.foreground }}>
                Manage Journals
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowJournalModal(false)}
                style={{ color: themeConfig.mutedForeground }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Create New Journal */}
            <div className="space-y-4 mb-6">
              <h4 className="text-sm font-medium" style={{ color: themeConfig.foreground }}>
                Create New Journal
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium" style={{ color: themeConfig.mutedForeground }}>
                    Journal Name
                  </label>
                  <Input
                    value={newJournalName}
                    onChange={(e) => setNewJournalName(e.target.value)}
                    placeholder="Enter journal name"
                    className="mt-1"
                    style={{ 
                      backgroundColor: themeConfig.card,
                      borderColor: themeConfig.border,
                      color: themeConfig.foreground
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: themeConfig.mutedForeground }}>
                    Initial Balance
                  </label>
                  <Input
                    type="number"
                    value={newJournalBalance}
                    onChange={(e) => setNewJournalBalance(Number(e.target.value))}
                    placeholder="10000"
                    className="mt-1"
                    style={{ 
                      backgroundColor: themeConfig.card,
                      borderColor: themeConfig.border,
                      color: themeConfig.foreground
                    }}
                  />
                </div>
                <Button
                  onClick={handleCreateJournal}
                  disabled={!newJournalName.trim()}
                  className="w-full"
                  style={{ 
                    backgroundColor: themeConfig.accent,
                    color: themeConfig.accentForeground
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Journal
                </Button>
              </div>
            </div>
            
            {/* Existing Journals */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium" style={{ color: themeConfig.foreground }}>
                Existing Journals
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {journals.map((journal) => (
                  <div
                    key={journal.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                    style={{ 
                      backgroundColor: themeConfig.card,
                      borderColor: themeConfig.border
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {journal.isActive && (
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: themeConfig.accent }} />
                      )}
                      <div className="min-w-0">
                        <span className="text-sm font-medium block truncate" style={{ color: themeConfig.foreground }}>
                          {journal.name}
                        </span>
                        <span className="text-xs" style={{ color: themeConfig.mutedForeground }}>
                          ${(journal.initialBalance ?? 0).toLocaleString()} starting
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditJournalClick(journal)}
                        className="p-1.5"
                        aria-label={`Edit ${journal.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" style={{ color: themeConfig.accent }} />
                      </Button>
                      {journals.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteJournalClick(journal.id)}
                          className="p-1.5 text-red-500 hover:text-red-700"
                          aria-label={`Delete ${journal.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {/* Edit Journal Modal (inline) */}
              {editJournalId && (
                <div className="mt-4 p-4 rounded-xl border" style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
                  <h5 className="text-sm font-medium mb-3" style={{ color: themeConfig.foreground }}>Edit Journal</h5>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium" style={{ color: themeConfig.mutedForeground }}>Name</label>
                      <Input
                        value={editJournalName}
                        onChange={(e) => setEditJournalName(e.target.value)}
                        placeholder="Journal name"
                        className="mt-1 rounded-xl"
                        style={{ backgroundColor: themeConfig.bg, borderColor: themeConfig.border, color: themeConfig.foreground }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium" style={{ color: themeConfig.mutedForeground }}>Starting Balance</label>
                      <Input
                        type="number"
                        value={editJournalBalance}
                        onChange={(e) => setEditJournalBalance(Number(e.target.value) || 0)}
                        placeholder="10000"
                        className="mt-1 rounded-xl"
                        style={{ backgroundColor: themeConfig.bg, borderColor: themeConfig.border, color: themeConfig.foreground }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleEditJournalSave} disabled={!editJournalName.trim()}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditJournalId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Journal Confirmation */}
      <AlertDialog open={deleteJournalDialogOpen} onOpenChange={setDeleteJournalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete journal?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this journal? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteJournalConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
