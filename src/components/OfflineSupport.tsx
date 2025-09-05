import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wifi, 
  WifiOff, 
  Download, 
  Upload, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OfflineData {
  trades: any[];
  goals: any[];
  habits: any[];
  lastSync: string;
}

interface OfflineSupportProps {
  children: React.ReactNode;
}

export function OfflineSupport({ children }: OfflineSupportProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [offlineData, setOfflineData] = useState<OfflineData>({
    trades: [],
    goals: [],
    habits: [],
    lastSync: new Date().toISOString()
  });
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const { toast } = useToast();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection Restored",
        description: "You're back online. Syncing data...",
      });
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're Offline",
        description: "Your data will be synced when connection is restored.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Load offline data from IndexedDB
  useEffect(() => {
    loadOfflineData();
  }, []);

  const loadOfflineData = async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['trades', 'goals', 'habits'], 'readonly');
      
      const trades = await transaction.objectStore('trades').getAll();
      const goals = await transaction.objectStore('goals').getAll();
      const habits = await transaction.objectStore('habits').getAll();
      
      setOfflineData({
        trades: trades || [],
        goals: goals || [],
        habits: habits || [],
        lastSync: localStorage.getItem('lastSync') || new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  };

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TradeBuddyOffline', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('trades')) {
          const tradesStore = db.createObjectStore('trades', { keyPath: 'id' });
          tradesStore.createIndex('date', 'date', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('goals')) {
          const goalsStore = db.createObjectStore('goals', { keyPath: 'id' });
          goalsStore.createIndex('status', 'status', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('habits')) {
          const habitsStore = db.createObjectStore('habits', { keyPath: 'id' });
          habitsStore.createIndex('status', 'status', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('pendingActions')) {
          db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  };

  const saveOfflineData = async (type: string, data: any) => {
    try {
      const db = await openDB();
      const transaction = db.transaction([type], 'readwrite');
      const store = transaction.objectStore(type);
      
      if (Array.isArray(data)) {
        for (const item of data) {
          await store.put(item);
        }
      } else {
        await store.put(data);
      }
      
      await loadOfflineData();
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  };

  const addPendingAction = async (action: any) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['pendingActions'], 'readwrite');
      const store = transaction.objectStore('pendingActions');
      
      await store.add({
        ...action,
        timestamp: new Date().toISOString()
      });
      
      setPendingActions(prev => [...prev, action]);
    } catch (error) {
      console.error('Failed to add pending action:', error);
    }
  };

  const syncOfflineData = async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    
    try {
      // Sync pending actions
      const db = await openDB();
      const transaction = db.transaction(['pendingActions'], 'readwrite');
      const store = transaction.objectStore('pendingActions');
      const pendingActions = await store.getAll();
      
      for (const action of pendingActions) {
        try {
          await fetch(action.url, {
            method: action.method,
            headers: action.headers,
            body: action.body
          });
          
          // Remove successful action
          await store.delete(action.id);
        } catch (error) {
          console.error('Failed to sync action:', error);
        }
      }
      
      // Update last sync time
      localStorage.setItem('lastSync', new Date().toISOString());
      
      toast({
        title: "Sync Complete",
        description: "All offline data has been synchronized.",
      });
      
      await loadOfflineData();
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: "Some data could not be synchronized.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getOfflineStatus = () => {
    if (isOnline) {
      return {
        icon: <Wifi className="w-4 h-4" />,
        text: "Online",
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      };
    } else {
      return {
        icon: <WifiOff className="w-4 h-4" />,
        text: "Offline",
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      };
    }
  };

  const status = getOfflineStatus();

  return (
    <div className="relative">
      {/* Offline Status Indicator */}
      <div className="fixed top-4 right-4 z-50">
        <Badge className={`${status.color} flex items-center space-x-1`}>
          {status.icon}
          <span>{status.text}</span>
        </Badge>
      </div>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border-b border-yellow-200 dark:border-yellow-800 p-3">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                You're offline. Changes will be saved locally and synced when you're back online.
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={syncOfflineData}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Offline Data Summary */}
      {!isOnline && (
        <Card className="m-4 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Offline Data</span>
            </CardTitle>
            <CardDescription>
              Your data is being stored locally while offline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{offlineData.trades.length}</div>
                <div className="text-sm text-muted-foreground">Trades</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{offlineData.goals.length}</div>
                <div className="text-sm text-muted-foreground">Goals</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{offlineData.habits.length}</div>
                <div className="text-sm text-muted-foreground">Habits</div>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Last sync: {new Date(offlineData.lastSync).toLocaleString()}
            </div>
            
            {pendingActions.length > 0 && (
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4" />
                <span>{pendingActions.length} actions pending sync</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {children}
    </div>
  );
}

// Offline-aware API wrapper
export function useOfflineAPI() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const offlineAPI = useCallback(async (url: string, options: RequestInit = {}) => {
    if (isOnline) {
      try {
        const response = await fetch(url, options);
        return response;
      } catch (error) {
        // If request fails, queue it for offline sync
        await queueOfflineAction(url, options);
        throw error;
      }
    } else {
      // Queue action for when online
      await queueOfflineAction(url, options);
      throw new Error('Offline - action queued for sync');
    }
  }, [isOnline]);

  const queueOfflineAction = async (url: string, options: RequestInit) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['pendingActions'], 'readwrite');
      const store = transaction.objectStore('pendingActions');
      
      await store.add({
        url,
        method: options.method || 'GET',
        headers: options.headers,
        body: options.body,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to queue offline action:', error);
    }
  };

  return { offlineAPI, isOnline };
}

// Helper function to open IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TradeBuddyOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('pendingActions')) {
        db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};
