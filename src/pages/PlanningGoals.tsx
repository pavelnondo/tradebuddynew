import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  Clock, 
  DollarSign,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Star,
  Award,
  Zap,
  Activity,
  BookOpen,
  Users,
  Settings,
  AlertCircle
} from "lucide-react";
import { NeonCard } from "@/components/ui/NeonCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApiTrades } from '@/hooks/useApiTrades';
import { useGoals, Goal } from '@/hooks/useGoals';
import { useAccountManagement } from '@/hooks/useAccountManagement';
import { useToast } from "@/hooks/use-toast";
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from "@/lib/utils";
import { goalSchema, habitSchema, type GoalFormData, type HabitFormData } from '@/schemas/goalSchema';
import { PageContainer } from '@/components/layout/PageContainer';

interface TradingGoal {
  id: string;
  title: string;
  description: string;
  type: 'profit' | 'trades' | 'winrate' | 'consistency' | 'learning';
  target: number;
  current: number;
  unit: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
  milestones: Milestone[];
}

interface Milestone {
  id: string;
  title: string;
  target: number;
  current: number;
  completed: boolean;
  completedAt?: string;
}

interface Habit {
  id: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  target: number;
  streak: number;
  bestStreak: number;
  lastCompleted?: string;
  status: 'active' | 'paused';
  createdAt: string;
}

interface ProgressEntry {
  id: string;
  goalId: string;
  value: number;
  date: string;
  notes?: string;
}

export default function PlanningGoals() {
  const { trades } = useApiTrades();
  const { goals: apiGoals, loading: goalsLoading, createGoal, updateGoal, deleteGoal } = useGoals();
  const { activeJournal } = useAccountManagement();
  const { toast } = useToast();
  const { themeConfig } = useTheme();
  
  const [habits, setHabits] = useState<Habit[]>([]);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showHabitDialog, setShowHabitDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deleteGoalDialogOpen, setDeleteGoalDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  const handleDeleteGoalConfirm = async () => {
    if (!goalToDelete) return;
    const id = goalToDelete.id;
    setGoalToDelete(null);
    setDeleteGoalDialogOpen(false);
    try {
      await deleteGoal(id);
      toast({
        title: "Goal deleted",
        description: "The goal has been successfully deleted.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete goal.",
        variant: "destructive",
      });
    }
  };

  // Form validation for goals
  const {
    register: registerGoal,
    handleSubmit: handleSubmitGoal,
    formState: { errors: goalErrors },
    reset: resetGoal,
    setValue: setGoalValue,
    watch: watchGoal,
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: '',
      description: '',
      goalType: 'profit',
      targetValue: 0,
      unit: 'USD',
      period: 'monthly',
      startDate: '',
      endDate: '',
    },
  });

  // Form validation for habits
  const {
    register: registerHabit,
    handleSubmit: handleSubmitHabit,
    formState: { errors: habitErrors },
    reset: resetHabit,
    setValue: setHabitValue,
    watch: watchHabit,
  } = useForm<HabitFormData>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      title: '',
      description: '',
      frequency: 'daily',
      target: 1,
    },
  });

  const watchedGoal = watchGoal();
  const watchedHabit = watchHabit();

  // Load habits from localStorage (keeping this for now)
  useEffect(() => {
    const savedHabits = localStorage.getItem('tradingHabits');
    const savedProgress = localStorage.getItem('progressEntries');

    if (savedHabits) setHabits(JSON.parse(savedHabits));
    if (savedProgress) setProgressEntries(JSON.parse(savedProgress));
  }, []);

  // Save habits to localStorage (keeping this for now)
  const saveHabits = (updatedHabits: Habit[]) => {
    setHabits(updatedHabits);
    localStorage.setItem('tradingHabits', JSON.stringify(updatedHabits));
  };

  const saveProgress = (updatedProgress: ProgressEntry[]) => {
    setProgressEntries(updatedProgress);
    localStorage.setItem('progressEntries', JSON.stringify(updatedProgress));
  };

  // Note: Goal progress is now calculated and stored in the database
  // The API goals already contain current values that are updated based on actual trade data

  const handleCreateGoal = async (data: GoalFormData) => {
    try {
      const goalData = {
        title: data.title,
        description: data.description || '',
        goalType: data.goalType,
        targetValue: data.targetValue,
        unit: data.unit || getDefaultUnit(data.goalType),
        period: data.period,
        journalId: activeJournal?.id,
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        endDate: data.endDate,
      };

      if (editingGoal) {
        await updateGoal(editingGoal.id, goalData);
        toast({
          title: "Goal updated",
          description: `Goal "${goalData.title}" has been updated.`,
        });
      } else {
        await createGoal(goalData);
        toast({
          title: "Goal created",
          description: `Goal "${goalData.title}" has been created.`,
        });
      }
      
      resetGoal();
      setEditingGoal(null);
      setShowGoalDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || (editingGoal ? "Failed to update goal. Please try again." : "Failed to create goal. Please try again."),
        variant: "destructive",
      });
    }
  };

  const handleCreateHabit = (data: HabitFormData) => {
    const habit: Habit = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description || '',
      frequency: data.frequency,
      target: data.target,
      streak: 0,
      bestStreak: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      completedDates: [],
    };

    saveHabits([...habits, habit]);
    resetHabit();
    setShowHabitDialog(false);

    toast({
      title: "Habit created",
      description: `Habit "${habit.title}" has been created.`,
    });
  };

  const handleCompleteHabit = (habitId: string) => {
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const newStreak = habit.streak + 1;
        return {
          ...habit,
          streak: newStreak,
          bestStreak: Math.max(habit.bestStreak, newStreak),
          lastCompleted: new Date().toISOString(),
        };
      }
      return habit;
    });

    saveHabits(updatedHabits);

    toast({
      title: "Habit completed",
      description: "Great job! Keep up the momentum.",
    });
  };

  const getDefaultUnit = (type: string): string => {
    switch (type) {
      case 'profit': return 'USD';
      case 'win_rate': return '%';
      case 'trades_count': return 'count';
      case 'risk_management': return 'USD';
      case 'learning': return 'count';
      default: return '';
    }
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'profit': return <DollarSign className="w-5 h-5" />;
      case 'trades_count': return <Activity className="w-5 h-5" />;
      case 'win_rate': return <Target className="w-5 h-5" />;
      case 'risk_management': return <TrendingUp className="w-5 h-5" />;
      case 'learning': return <BookOpen className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'paused': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Filter goals by active journal
  const filteredGoals = activeJournal 
    ? apiGoals.filter(goal => goal.journalId === activeJournal.id)
    : apiGoals;

  const activeGoals = filteredGoals.filter(goal => goal.status === 'active');
  const completedGoals = filteredGoals.filter(goal => goal.status === 'completed');
  const activeHabits = habits.filter(habit => habit.status === 'active');

  const overallProgress = filteredGoals.length > 0 
    ? (completedGoals.length / filteredGoals.length) * 100 
    : 0;

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-center justify-between pb-8 border-b" style={{ borderColor: themeConfig.border }}>
        <div>
          <h1 
            className="text-3xl font-semibold tracking-tight mb-2"
            style={{ color: themeConfig.foreground }}
          >
            Planning & <span style={{ color: themeConfig.accent }}>Goals</span>
          </h1>
          <p 
            className="text-sm"
            style={{ color: themeConfig.mutedForeground }}
          >
            Set trading goals, track progress, and build successful habits
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Award className="w-4 h-4" />
            <span>Goal Tracking</span>
          </Badge>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <NeonCard className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p 
                className="text-sm font-medium mb-1"
                style={{ color: themeConfig.mutedForeground }}
              >
                Active Goals
              </p>
              <p 
                className="text-3xl font-semibold tracking-tight"
                style={{ color: themeConfig.foreground }}
              >
                {activeGoals.length}
              </p>
            </div>
            <div 
              className="p-2.5 rounded-xl"
              style={{ 
                backgroundColor: `${themeConfig.accent}12`,
                border: `1px solid ${themeConfig.accent}25`
              }}
            >
              <Target className="w-5 h-5" style={{ color: themeConfig.accent }} />
            </div>
          </div>
        </NeonCard>

        <NeonCard className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p 
                className="text-sm font-medium mb-1"
                style={{ color: themeConfig.mutedForeground }}
              >
                Completed Goals
              </p>
              <p 
                className="text-3xl font-semibold tracking-tight"
                style={{ color: themeConfig.success }}
              >
                {completedGoals.length}
              </p>
            </div>
            <div 
              className="p-2.5 rounded-xl"
              style={{ 
                backgroundColor: `${themeConfig.success}12`,
                border: `1px solid ${themeConfig.success}25`
              }}
            >
              <CheckCircle className="w-5 h-5" style={{ color: themeConfig.success }} />
            </div>
          </div>
        </NeonCard>

        <NeonCard className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p 
                className="text-sm font-medium mb-1"
                style={{ color: themeConfig.mutedForeground }}
              >
                Active Habits
              </p>
              <p 
                className="text-3xl font-semibold tracking-tight"
                style={{ color: themeConfig.foreground }}
              >
                {activeHabits.length}
              </p>
            </div>
            <div 
              className="p-2.5 rounded-xl"
              style={{ 
                backgroundColor: `${themeConfig.accent}12`,
                border: `1px solid ${themeConfig.accent}25`
              }}
            >
              <Zap className="w-5 h-5" style={{ color: themeConfig.accent }} />
            </div>
          </div>
        </NeonCard>

        <NeonCard className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p 
                className="text-sm font-medium mb-1"
                style={{ color: themeConfig.mutedForeground }}
              >
                Overall Progress
              </p>
              <p 
                className="text-3xl font-semibold tracking-tight"
                style={{ color: themeConfig.foreground }}
              >
                {overallProgress.toFixed(0)}%
              </p>
            </div>
            <div 
              className="p-2.5 rounded-xl"
              style={{ 
                backgroundColor: `${themeConfig.accent}12`,
                border: `1px solid ${themeConfig.accent}25`
              }}
            >
              <BarChart3 className="w-5 h-5" style={{ color: themeConfig.accent }} />
            </div>
          </div>
        </NeonCard>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="goals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="goals">Trading Goals</TabsTrigger>
          <TabsTrigger value="habits">Habit Tracking</TabsTrigger>
          <TabsTrigger value="progress">Progress Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-6">
          {/* Goals Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: themeConfig.foreground }}>Trading Goals</h2>
              <p style={{ color: themeConfig.mutedForeground }}>Set and track your trading objectives</p>
            </div>
            <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-1">
                  <Plus className="w-4 h-4" />
                  <span>New Goal</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingGoal ? 'Edit Trading Goal' : 'Create New Trading Goal'}</DialogTitle>
                  <DialogDescription>
                    {editingGoal ? 'Update your trading goal' : 'Set a specific, measurable goal for your trading journey'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitGoal(handleCreateGoal)} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="goal-title" className="text-sm font-medium" style={{ color: themeConfig.foreground }}>Goal Title *</Label>
                      <Input
                        id="goal-title"
                        placeholder="e.g., Reach $10K Profit"
                        {...registerGoal('title')}
                        className="mt-1.5 rounded-xl"
                        style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border, color: themeConfig.foreground }}
                      />
                      {goalErrors.title && (
                        <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {goalErrors.title.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="goal-type" className="text-sm font-medium" style={{ color: themeConfig.foreground }}>Goal Type *</Label>
                      <select
                        id="goal-type"
                        value={watchedGoal.goalType}
                        onChange={(e) => {
                          const v = e.target.value as GoalFormData['goalType'];
                          setGoalValue('goalType', v);
                          if (!watchedGoal.unit || watchedGoal.unit === 'USD') {
                            setGoalValue('unit', getDefaultUnit(v));
                          }
                        }}
                        className="mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm"
                        style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border, color: themeConfig.foreground }}
                      >
                        <option value="profit">Profit Target</option>
                        <option value="trades_count">Trade Count</option>
                        <option value="win_rate">Win Rate</option>
                        <option value="risk_management">Risk Management</option>
                        <option value="learning">Learning</option>
                      </select>
                      {goalErrors.goalType && (
                        <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {goalErrors.goalType.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="goal-description" className="text-sm font-medium" style={{ color: themeConfig.foreground }}>Description</Label>
                      <Textarea
                        id="goal-description"
                        placeholder="Describe your goal and why it's important"
                        {...registerGoal('description')}
                        className="mt-1.5 rounded-xl"
                        style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border, color: themeConfig.foreground }}
                      />
                      {goalErrors.description && (
                        <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {goalErrors.description.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="goal-target" className="text-sm font-medium" style={{ color: themeConfig.foreground }}>Target *</Label>
                        <Input
                          id="goal-target"
                          type="number"
                          step="0.01"
                          placeholder="1000"
                          {...registerGoal('targetValue', { valueAsNumber: true })}
                          className="mt-1.5 rounded-xl"
                          style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border, color: themeConfig.foreground }}
                        />
                        {goalErrors.targetValue && (
                          <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {goalErrors.targetValue.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="goal-unit" className="text-sm font-medium" style={{ color: themeConfig.foreground }}>Unit</Label>
                        <Input
                          id="goal-unit"
                          placeholder={getDefaultUnit(watchedGoal.goalType)}
                          {...registerGoal('unit')}
                          className="mt-1.5 rounded-xl"
                          style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border, color: themeConfig.foreground }}
                        />
                        {goalErrors.unit && (
                          <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {goalErrors.unit.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="goal-period" className="text-sm font-medium" style={{ color: themeConfig.foreground }}>Period</Label>
                        <select
                          id="goal-period"
                          value={watchedGoal.period}
                          onChange={(e) => setGoalValue('period', e.target.value as GoalFormData['period'])}
                          className="mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm"
                          style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border, color: themeConfig.foreground }}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                        {goalErrors.period && (
                          <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {goalErrors.period.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="goal-start" className="text-sm font-medium" style={{ color: themeConfig.foreground }}>Start Date</Label>
                        <Input
                          id="goal-start"
                          type="date"
                          {...registerGoal('startDate')}
                          className="mt-1.5 rounded-xl"
                          style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border, color: themeConfig.foreground }}
                        />
                        {goalErrors.startDate && (
                          <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {goalErrors.startDate.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="goal-end" className="text-sm font-medium" style={{ color: themeConfig.foreground }}>End Date *</Label>
                        <Input
                          id="goal-end"
                          type="date"
                          {...registerGoal('endDate')}
                          className="mt-1.5 rounded-xl"
                          style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border, color: themeConfig.foreground }}
                        />
                        {goalErrors.endDate && (
                          <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {goalErrors.endDate.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setShowGoalDialog(false);
                      setEditingGoal(null);
                      resetGoal();
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingGoal ? 'Update Goal' : 'Create Goal'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals.map(goal => {
              const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
              const isOverdue = goal.endDate && new Date(goal.endDate) < new Date() && goal.status !== 'completed';
              
              return (
                <NeonCard 
                  key={goal.id} 
                  className={cn(
                    "p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300",
                    isOverdue && "border-red-200 bg-red-50 dark:bg-red-950/20"
                  )}
                  style={!isOverdue ? { 
                    backgroundColor: themeConfig.card, 
                    borderWidth: '1px', 
                    borderStyle: 'solid', 
                    borderColor: themeConfig.border 
                  } : undefined}
                >
                  <div className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getGoalIcon(goal.goalType)}
                        <h3 className="text-lg font-semibold">{goal.title}</h3>
                      </div>
                      <div className="flex space-x-1">
                        <Badge className={getStatusColor(goal.status)}>
                          {goal.status}
                        </Badge>
                        <Badge variant="outline">
                          {goal.period}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(progress, 100)} className="h-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{goal.currentValue.toFixed(1)} {goal.unit}</span>
                        <span>{goal.targetValue} {goal.unit}</span>
                      </div>
                    </div>
                    
                    {goal.endDate && (
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3 h-3" />
                          <span>Due: {new Date(goal.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}

                    {isOverdue && (
                      <div className="text-sm text-red-600 font-medium">
                        ⚠️ Overdue
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingGoal(goal);
                          resetGoal({
                            title: goal.title,
                            description: goal.description || '',
                            goalType: goal.goalType as any,
                            targetValue: goal.targetValue,
                            unit: goal.unit,
                            period: goal.period as any,
                            startDate: goal.startDate || '',
                            endDate: goal.endDate || '',
                          });
                          setShowGoalDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setGoalToDelete(goal);
                          setDeleteGoalDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                      {goal.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await updateGoal(goal.id, { status: 'completed' });
                              toast({
                                title: "Goal completed",
                                description: "Congratulations on completing your goal!",
                              });
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to update goal.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </NeonCard>
              );
            })}
          </div>

          {apiGoals.length === 0 && !goalsLoading && (
            <NeonCard className="p-8 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Goals Set</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first trading goal to start tracking your progress
                </p>
                <Button onClick={() => setShowGoalDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Goal
                </Button>
            </NeonCard>
          )}
        </TabsContent>

        <TabsContent value="habits" className="space-y-6">
          {/* Habits Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Habit Tracking</h2>
              <p className="text-muted-foreground">Build consistent trading habits</p>
            </div>
            <Dialog open={showHabitDialog} onOpenChange={setShowHabitDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-1">
                  <Plus className="w-4 h-4" />
                  <span>New Habit</span>
                </Button>
              </DialogTrigger>
                <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Habit</DialogTitle>
                  <DialogDescription>
                    Track daily, weekly, or monthly trading habits
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitHabit(handleCreateHabit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="habit-title">Habit Title *</Label>
                    <Input
                      id="habit-title"
                      placeholder="e.g., Review trades daily"
                      {...registerHabit('title')}
                    />
                    {habitErrors.title && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {habitErrors.title.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="habit-description">Description</Label>
                    <Textarea
                      id="habit-description"
                      placeholder="Describe the habit and its benefits"
                      {...registerHabit('description')}
                    />
                    {habitErrors.description && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {habitErrors.description.message}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="habit-frequency">Frequency</Label>
                      <Select 
                        value={watchedHabit.frequency} 
                        onValueChange={(value: any) => setHabitValue('frequency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      {habitErrors.frequency && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {habitErrors.frequency.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="habit-target">Target (per period)</Label>
                      <Input
                        id="habit-target"
                        type="number"
                        {...registerHabit('target', { valueAsNumber: true })}
                      />
                      {habitErrors.target && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {habitErrors.target.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setShowHabitDialog(false);
                      resetHabit();
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Create Habit
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Habits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map(habit => (
              <NeonCard key={habit.id} className="p-6">
                <div className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-5 h-5" />
                      <h3 className="text-lg font-semibold">{habit.title}</h3>
                    </div>
                    <Badge variant="outline">
                      {habit.frequency}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{habit.description}</p>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{habit.streak}</div>
                      <div className="text-sm text-muted-foreground">Current Streak</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{habit.bestStreak}</div>
                      <div className="text-sm text-muted-foreground">Best Streak</div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={() => handleCompleteHabit(habit.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                  
                  {habit.lastCompleted && (
                    <div className="text-sm text-muted-foreground text-center">
                      Last completed: {new Date(habit.lastCompleted).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </NeonCard>
            ))}
          </div>

          {habits.length === 0 && (
            <NeonCard className="p-8 text-center">
                <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Habits Tracked</h3>
                <p className="text-muted-foreground mb-4">
                  Start building consistent trading habits to improve your performance
                </p>
                <Button onClick={() => setShowHabitDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Habit
                </Button>
            </NeonCard>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Progress Analytics</h2>
            <p className="text-muted-foreground">
              Track your progress over time and identify patterns
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Goal Progress Chart */}
            <NeonCard className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Goal Progress Overview</h3>
                <p className="text-sm text-muted-foreground">Current progress on all active goals</p>
              </div>
              <div>
                <div className="space-y-4">
                  {activeGoals.map(goal => {
                    const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
                    return (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{goal.title}</span>
                          <span>{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={Math.min(progress, 100)} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </NeonCard>

            {/* Habit Streaks */}
            <NeonCard className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Habit Streaks</h3>
                <p className="text-sm text-muted-foreground">Current streaks for all habits</p>
              </div>
              <div>
                <div className="space-y-4">
                  {activeHabits.map(habit => (
                    <div key={habit.id} className="flex items-center justify-between p-3 rounded-lg" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: themeConfig.border }}>
                      <div>
                        <div className="font-medium">{habit.title}</div>
                        <div className="text-sm text-muted-foreground">{habit.frequency}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">{habit.streak}</div>
                        <div className="text-sm text-muted-foreground">streak</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </NeonCard>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Goal Confirmation */}
      <AlertDialog open={deleteGoalDialogOpen} onOpenChange={setDeleteGoalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete goal?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this goal? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteGoalConfirm}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
