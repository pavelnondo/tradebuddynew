import React, { useState, useEffect, useMemo } from 'react';
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
  Settings
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApiTrades } from '@/hooks/useApiTrades';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const { toast } = useToast();
  
  const [goals, setGoals] = useState<TradingGoal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showHabitDialog, setShowHabitDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<TradingGoal | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    type: 'profit' as const,
    target: '',
    unit: '',
    deadline: '',
    priority: 'medium' as const,
  });

  const [newHabit, setNewHabit] = useState({
    title: '',
    description: '',
    frequency: 'daily' as const,
    target: '1',
  });

  // Load data from localStorage
  useEffect(() => {
    const savedGoals = localStorage.getItem('tradingGoals');
    const savedHabits = localStorage.getItem('tradingHabits');
    const savedProgress = localStorage.getItem('progressEntries');

    if (savedGoals) setGoals(JSON.parse(savedGoals));
    if (savedHabits) setHabits(JSON.parse(savedHabits));
    if (savedProgress) setProgressEntries(JSON.parse(savedProgress));
  }, []);

  // Save data to localStorage
  const saveGoals = (updatedGoals: TradingGoal[]) => {
    setGoals(updatedGoals);
    localStorage.setItem('tradingGoals', JSON.stringify(updatedGoals));
  };

  const saveHabits = (updatedHabits: Habit[]) => {
    setHabits(updatedHabits);
    localStorage.setItem('tradingHabits', JSON.stringify(updatedHabits));
  };

  const saveProgress = (updatedProgress: ProgressEntry[]) => {
    setProgressEntries(updatedProgress);
    localStorage.setItem('progressEntries', JSON.stringify(updatedProgress));
  };

  // Calculate current progress based on trades
  const calculateCurrentProgress = (goal: TradingGoal): number => {
    if (!Array.isArray(trades)) return 0;

    const now = new Date();
    const goalStart = new Date(goal.createdAt);
    const goalDeadline = new Date(goal.deadline);
    
    // Filter trades within goal timeframe
    const relevantTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.date);
      return tradeDate >= goalStart && tradeDate <= goalDeadline;
    });

    switch (goal.type) {
      case 'profit':
        return relevantTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
      case 'trades':
        return relevantTrades.length;
      case 'winrate':
        if (relevantTrades.length === 0) return 0;
        const winningTrades = relevantTrades.filter(trade => (trade.profitLoss || 0) > 0).length;
        return (winningTrades / relevantTrades.length) * 100;
      case 'consistency':
        // Calculate consecutive profitable days
        const dailyPnL = new Map();
        relevantTrades.forEach(trade => {
          const date = new Date(trade.date).toDateString();
          dailyPnL.set(date, (dailyPnL.get(date) || 0) + (trade.profitLoss || 0));
        });
        
        let maxConsecutive = 0;
        let currentConsecutive = 0;
        const sortedDates = Array.from(dailyPnL.keys()).sort();
        
        sortedDates.forEach(date => {
          if (dailyPnL.get(date) > 0) {
            currentConsecutive++;
            maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
          } else {
            currentConsecutive = 0;
          }
        });
        
        return maxConsecutive;
      case 'learning':
        // Count unique setups or strategies used
        const uniqueSetups = new Set(relevantTrades.map(trade => trade.setup).filter(Boolean));
        return uniqueSetups.size;
      default:
        return 0;
    }
  };

  // Update goal progress
  useEffect(() => {
    const updatedGoals = goals.map(goal => ({
      ...goal,
      current: calculateCurrentProgress(goal),
      status: goal.current >= goal.target ? 'completed' : goal.status,
    }));
    
    if (JSON.stringify(updatedGoals) !== JSON.stringify(goals)) {
      saveGoals(updatedGoals);
    }
  }, [trades, goals]);

  const handleCreateGoal = () => {
    if (!newGoal.title || !newGoal.target || !newGoal.deadline) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title, target, and deadline.",
        variant: "destructive",
      });
      return;
    }

    const goal: TradingGoal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description,
      type: newGoal.type,
      target: parseFloat(newGoal.target),
      current: 0,
      unit: newGoal.unit || getDefaultUnit(newGoal.type),
      deadline: newGoal.deadline,
      priority: newGoal.priority,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      milestones: [],
    };

    saveGoals([...goals, goal]);
    setNewGoal({
      title: '',
      description: '',
      type: 'profit',
      target: '',
      unit: '',
      deadline: '',
      priority: 'medium',
    });
    setShowGoalDialog(false);

    toast({
      title: "Goal created",
      description: `Goal "${goal.title}" has been created.`,
    });
  };

  const handleCreateHabit = () => {
    if (!newHabit.title) {
      toast({
        title: "Missing required fields",
        description: "Please fill in habit title.",
        variant: "destructive",
      });
      return;
    }

    const habit: Habit = {
      id: Date.now().toString(),
      title: newHabit.title,
      description: newHabit.description,
      frequency: newHabit.frequency,
      target: parseInt(newHabit.target),
      streak: 0,
      bestStreak: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    saveHabits([...habits, habit]);
    setNewHabit({
      title: '',
      description: '',
      frequency: 'daily',
      target: '1',
    });
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
      case 'profit': return '$';
      case 'trades': return 'trades';
      case 'winrate': return '%';
      case 'consistency': return 'days';
      case 'learning': return 'strategies';
      default: return '';
    }
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'profit': return <DollarSign className="w-5 h-5" />;
      case 'trades': return <Activity className="w-5 h-5" />;
      case 'winrate': return <Target className="w-5 h-5" />;
      case 'consistency': return <TrendingUp className="w-5 h-5" />;
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

  const activeGoals = goals.filter(goal => goal.status === 'active');
  const completedGoals = goals.filter(goal => goal.status === 'completed');
  const activeHabits = habits.filter(habit => habit.status === 'active');

  const overallProgress = goals.length > 0 
    ? (completedGoals.length / goals.length) * 100 
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planning & Goals</h1>
          <p className="text-muted-foreground">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Goals</p>
                <p className="text-2xl font-bold">{activeGoals.length}</p>
              </div>
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Goals</p>
                <p className="text-2xl font-bold text-green-600">{completedGoals.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Habits</p>
                <p className="text-2xl font-bold">{activeHabits.length}</p>
              </div>
              <Zap className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-bold">{overallProgress.toFixed(0)}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
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
              <h2 className="text-2xl font-bold">Trading Goals</h2>
              <p className="text-muted-foreground">Set and track your trading objectives</p>
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
                  <DialogTitle>Create New Trading Goal</DialogTitle>
                  <DialogDescription>
                    Set a specific, measurable goal for your trading journey
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="goal-title">Goal Title *</Label>
                      <Input
                        id="goal-title"
                        placeholder="e.g., Reach $10K Profit"
                        value={newGoal.title}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="goal-type">Goal Type *</Label>
                      <Select value={newGoal.type} onValueChange={(value: any) => setNewGoal(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="profit">Profit Target</SelectItem>
                          <SelectItem value="trades">Trade Count</SelectItem>
                          <SelectItem value="winrate">Win Rate</SelectItem>
                          <SelectItem value="consistency">Consistency</SelectItem>
                          <SelectItem value="learning">Learning</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goal-description">Description</Label>
                    <Textarea
                      id="goal-description"
                      placeholder="Describe your goal and why it's important"
                      value={newGoal.description}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="goal-target">Target *</Label>
                      <Input
                        id="goal-target"
                        type="number"
                        placeholder="1000"
                        value={newGoal.target}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, target: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="goal-unit">Unit</Label>
                      <Input
                        id="goal-unit"
                        placeholder={getDefaultUnit(newGoal.type)}
                        value={newGoal.unit}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, unit: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="goal-priority">Priority</Label>
                      <Select value={newGoal.priority} onValueChange={(value: any) => setNewGoal(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goal-deadline">Deadline *</Label>
                    <Input
                      id="goal-deadline"
                      type="date"
                      value={newGoal.deadline}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGoal}>
                    Create Goal
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map(goal => {
              const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
              const isOverdue = new Date(goal.deadline) < new Date() && goal.status !== 'completed';
              
              return (
                <Card key={goal.id} className={cn(
                  "card-modern",
                  isOverdue && "border-red-200 bg-red-50 dark:bg-red-950/20"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getGoalIcon(goal.type)}
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                      </div>
                      <div className="flex space-x-1">
                        <Badge className={getPriorityColor(goal.priority)}>
                          {goal.priority}
                        </Badge>
                        <Badge className={getStatusColor(goal.status)}>
                          {goal.status}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{goal.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(progress, 100)} className="h-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{goal.current.toFixed(1)} {goal.unit}</span>
                        <span>{goal.target} {goal.unit}</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3 h-3" />
                        <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {isOverdue && (
                      <div className="text-sm text-red-600 font-medium">
                        ⚠️ Overdue
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {goals.length === 0 && (
            <Card className="card-modern">
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Goals Set</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first trading goal to start tracking your progress
                </p>
                <Button onClick={() => setShowGoalDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
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
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="habit-title">Habit Title *</Label>
                    <Input
                      id="habit-title"
                      placeholder="e.g., Review trades daily"
                      value={newHabit.title}
                      onChange={(e) => setNewHabit(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="habit-description">Description</Label>
                    <Textarea
                      id="habit-description"
                      placeholder="Describe the habit and its benefits"
                      value={newHabit.description}
                      onChange={(e) => setNewHabit(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="habit-frequency">Frequency</Label>
                      <Select value={newHabit.frequency} onValueChange={(value: any) => setNewHabit(prev => ({ ...prev, frequency: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="habit-target">Target (per period)</Label>
                      <Input
                        id="habit-target"
                        type="number"
                        value={newHabit.target}
                        onChange={(e) => setNewHabit(prev => ({ ...prev, target: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowHabitDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateHabit}>
                    Create Habit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Habits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map(habit => (
              <Card key={habit.id} className="card-modern">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-5 h-5" />
                      <CardTitle className="text-lg">{habit.title}</CardTitle>
                    </div>
                    <Badge variant="outline">
                      {habit.frequency}
                    </Badge>
                  </div>
                  <CardDescription>{habit.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>
            ))}
          </div>

          {habits.length === 0 && (
            <Card className="card-modern">
              <CardContent className="p-8 text-center">
                <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Habits Tracked</h3>
                <p className="text-muted-foreground mb-4">
                  Start building consistent trading habits to improve your performance
                </p>
                <Button onClick={() => setShowHabitDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Habit
                </Button>
              </CardContent>
            </Card>
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
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Goal Progress Overview</CardTitle>
                <CardDescription>Current progress on all active goals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeGoals.map(goal => {
                    const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
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
              </CardContent>
            </Card>

            {/* Habit Streaks */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Habit Streaks</CardTitle>
                <CardDescription>Current streaks for all habits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeHabits.map(habit => (
                    <div key={habit.id} className="flex items-center justify-between p-3 border rounded-lg">
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
