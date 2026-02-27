import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useChecklists } from '../hooks/useChecklists';
import { useSetupTypes, type SetupType } from '../hooks/useSetupTypes';
import { NeonCard } from '../components/ui/NeonCard';
import { NeonButton } from '../components/ui/NeonButton';
import { NeonInput } from '../components/ui/NeonInput';
import { NeonToggle } from '../components/ui/NeonToggle';
import { NeonModal } from '../components/ui/NeonModal';
import { checklistSchema, type ChecklistFormData } from '@/schemas/checklistSchema';
import { PageContainer } from '@/components/layout/PageContainer';
import { 
  CheckSquare, 
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  BarChart3,
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  order: number;
}

interface Checklist {
  id: string;
  name: string;
  description?: string;
  type: 'pre' | 'during' | 'post' | 'rule';
  items: ChecklistItem[];
  completionRate: number;
}

interface ChecklistCardProps {
  checklist: Checklist;
  onEdit: (checklist: Checklist) => void;
  onDelete: (id: string) => void;
  onToggleItem: (checklistId: string, itemId: string) => void;
}

const ChecklistCard: React.FC<ChecklistCardProps> = ({ 
  checklist, 
  onEdit, 
  onDelete, 
  onToggleItem 
}) => {
  const { themeConfig } = useTheme();
  
  const typeIcons = {
    pre: <Target className="w-5 h-5" />,
    during: <Clock className="w-5 h-5" />,
    post: <CheckCircle className="w-5 h-5" />,
    rule: <AlertCircle className="w-5 h-5" />
  };

  const typeColors = {
    pre: themeConfig.primary,
    during: themeConfig.warning,
    post: themeConfig.success,
    rule: themeConfig.accent || '#8b5cf6'
  };

  return (
    <NeonCard className="p-6">
      <motion.div
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: typeColors[checklist.type] + '20' }}
          >
            {typeIcons[checklist.type]}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{checklist.name}</h3>
            <p className="text-sm text-muted-foreground capitalize">{checklist.type === 'rule' ? 'Trading rule' : `${checklist.type} trading`}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <NeonButton
            variant="ghost"
            size="sm"
            onClick={() => onEdit(checklist)}
          >
            <Edit className="w-4 h-4" />
          </NeonButton>
          <NeonButton
            variant="ghost"
            size="sm"
            onClick={() => onDelete(checklist.id)}
          >
            <Trash2 className="w-4 h-4" />
          </NeonButton>
        </div>
      </motion.div>

      {checklist.description && (
        <p className="text-sm text-muted-foreground mb-4">{checklist.description}</p>
      )}

      <div className="space-y-3">
        {checklist.items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-card transition-colors"
          >
            <NeonToggle
              checked={item.completed}
              onChange={() => onToggleItem(checklist.id, item.id)}
              size="sm"
            />
            <span className={`flex-1 text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {item.text}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Progress</span>
          <span className="text-sm font-medium neon-text">{(checklist.completionRate || 0).toFixed(0)}%</span>
        </div>
        <div className="mt-2 w-full bg-border rounded-full h-2">
          <motion.div
            className="h-2 rounded-full"
            style={{ backgroundColor: typeColors[checklist.type] }}
            initial={{ width: 0 }}
            animate={{ width: `${checklist.completionRate || 0}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </div>
      </div>
    </NeonCard>
  );
};

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  checklist?: Checklist;
  defaultType?: 'rule' | 'pre' | 'during' | 'post';
  onSave: (checklist: Omit<Checklist, 'id' | 'completionRate'>) => void | Promise<void>;
}

const ChecklistModal: React.FC<ChecklistModalProps> = ({ isOpen, onClose, checklist, defaultType = 'pre', onSave }) => {
  const { themeConfig } = useTheme();
  const [newItemText, setNewItemText] = useState('');

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ChecklistFormData>({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'pre',
      items: [],
    },
  });

  const watchedType = watch('type');
  const watchedItems = watch('items');

  useEffect(() => {
    if (checklist) {
      reset({
        name: checklist.name,
        description: checklist.description || '',
        type: checklist.type,
        items: checklist.items.map(item => ({ text: item.text, completed: item.completed })),
      });
    } else {
      reset({
        name: '',
        description: '',
        type: defaultType,
        items: [],
      });
    }
    setNewItemText('');
  }, [checklist, isOpen, reset, defaultType]);

  const addItem = () => {
    if (newItemText.trim()) {
      const currentItems = watchedItems || [];
      setValue('items', [...currentItems, { text: newItemText.trim(), completed: false }], { shouldValidate: true });
      setNewItemText('');
    }
  };

  const removeItem = (index: number) => {
    const currentItems = watchedItems || [];
    setValue('items', currentItems.filter((_, i) => i !== index), { shouldValidate: true });
  };

  const [saving, setSaving] = useState(false);
  const onSubmit = async (data: ChecklistFormData) => {
    setSaving(true);
    try {
      await onSave({
        name: data.name,
        description: data.description || '',
        type: data.type,
        items: (data.items || []).map((item, index) => ({
          ...item,
          id: `item-${index}`,
          order: index
        }))
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <NeonModal
      isOpen={isOpen}
      onClose={onClose}
      title={checklist ? 'Edit Checklist' : 'Create New Checklist'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <NeonInput
                label="Checklist Name *"
                {...field}
                placeholder="Enter checklist name"
              />
            )}
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <NeonInput
            label="Description"
            {...register('description')}
            placeholder="Enter description (optional)"
          />
          {errors.description && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Type *</label>
          <div className="flex flex-wrap gap-2">
            {(['rule', 'pre', 'during', 'post'] as const).map((t) => (
              <NeonButton
                key={t}
                type="button"
                variant={watchedType === t ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setValue('type', t)}
              >
                {t === 'rule' ? 'Rule' : `${t.charAt(0).toUpperCase() + t.slice(1)} Trading`}
              </NeonButton>
            ))}
          </div>
          {errors.type && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.type.message}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <NeonInput
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addItem();
                }
              }}
              placeholder="Add checklist item"
              className="flex-1"
            />
            <NeonButton type="button" onClick={addItem} size="sm">
              <Plus className="w-4 h-4" />
            </NeonButton>
          </div>

          <div className="space-y-2">
            {(watchedItems || []).map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 rounded-lg border border-border"
              >
                <span className="flex-1 text-sm text-foreground">{item.text}</span>
                <NeonButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                >
                  <X className="w-4 h-4" />
                </NeonButton>
              </motion.div>
            ))}
          </div>
          {errors.items && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.items.message}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <NeonButton type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </NeonButton>
          <NeonButton type="submit" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? 'Saving...' : 'Save'}
          </NeonButton>
        </div>
      </form>
    </NeonModal>
  );
};

interface SetupTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  setupType?: SetupType | null;
  onSave: (data: { name: string; description?: string }) => void | Promise<void>;
}

const SetupTypeModal: React.FC<SetupTypeModalProps> = ({ isOpen, onClose, setupType, onSave }) => {
  const { themeConfig } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (setupType) {
      setName(setupType.name);
      setDescription(setupType.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [setupType, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), description: description.trim() || undefined });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <NeonModal isOpen={isOpen} onClose={onClose} title={setupType ? 'Edit Setup Type' : 'New Setup Type'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Name *</label>
          <NeonInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Breakout, Pullback" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Description (optional)</label>
          <NeonInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" />
        </div>
        <div className="flex justify-end gap-3">
          <NeonButton type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</NeonButton>
          <NeonButton type="submit" disabled={saving || !name.trim()}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? 'Saving...' : 'Save'}
          </NeonButton>
        </div>
      </form>
    </NeonModal>
  );
};

export default function Checklists() {
  const { themeConfig } = useTheme();
  const { fetchChecklists, isLoading, error, createChecklist, updateChecklist, deleteChecklist } = useChecklists();
  const { fetchSetupTypes, createSetupType, updateSetupType, deleteSetupType } = useSetupTypes();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [setupTypes, setSetupTypes] = useState<SetupType[]>([]);
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);
  const [editingSetupType, setEditingSetupType] = useState<SetupType | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalDefaultType, setAddModalDefaultType] = useState<'rule' | 'pre' | 'during' | 'post'>('pre');
  const [showAddSetupModal, setShowAddSetupModal] = useState(false);

  useEffect(() => {
    const loadChecklists = async () => {
      const data = await fetchChecklists();
      setChecklists(data);
    };
    loadChecklists();
  }, [fetchChecklists]);

  useEffect(() => {
    const loadSetupTypes = async () => {
      const data = await fetchSetupTypes();
      setSetupTypes(data);
    };
    loadSetupTypes();
  }, [fetchSetupTypes]);
  
  const handleToggleItem = (checklistId: string, itemId: string) => {
    setChecklists(prev => prev.map(checklist => {
      if (checklist.id === checklistId) {
        const updatedItems = checklist.items.map(item => 
          item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        const completedCount = updatedItems.filter(item => item.completed).length;
        const completionRate = (completedCount / updatedItems.length) * 100;
        
        return { ...checklist, items: updatedItems, completionRate };
      }
      return checklist;
    }));
  };

  const handleSaveChecklist = async (checklistData: Omit<Checklist, 'id' | 'completionRate'>) => {
    if (editingChecklist) {
      const result = await updateChecklist(editingChecklist.id, checklistData);
      if (result) {
        setChecklists(prev => prev.map(c => c.id === editingChecklist.id ? { ...c, ...checklistData, completionRate: c.completionRate } : c));
      }
    } else {
      const result = await createChecklist(checklistData);
      if (result) {
        const completionRate = checklistData.items.length > 0
          ? (checklistData.items.filter(i => i.completed).length / checklistData.items.length) * 100
          : 0;
        setChecklists(prev => [...prev, { ...result, type: checklistData.type, completionRate }]);
      }
    }
    setEditingChecklist(null);
  };

  const handleDeleteChecklist = async (id: string) => {
    const result = await deleteChecklist(id);
    if (result) setChecklists(prev => prev.filter(c => c.id !== id));
  };

  const handleSaveSetupType = async (data: { name: string; description?: string }) => {
    if (editingSetupType) {
      const ok = await updateSetupType(editingSetupType.id, data);
      if (ok) setSetupTypes(prev => prev.map(s => s.id === editingSetupType.id ? { ...s, ...data } : s));
      setEditingSetupType(null);
    } else {
      const created = await createSetupType(data);
      if (created) setSetupTypes(prev => [...prev, created]);
      setShowAddSetupModal(false);
    }
  };

  const handleDeleteSetupType = async (id: string) => {
    const result = await deleteSetupType(id);
    if (result) setSetupTypes(prev => prev.filter(s => s.id !== id));
  };

  const rules = checklists.filter(c => c.type === 'rule');
  const preDuringPostChecklists = checklists.filter(c => c.type === 'pre' || c.type === 'during' || c.type === 'post');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="neon-spinner w-8 h-8 mr-3"></div>
        <span className="text-lg">Loading Checklists...</span>
      </div>
    );
  }

  if (error) {
  return (
      <div className="flex items-center justify-center h-64 text-destructive">
        Error loading checklists: {error}
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <PageContainer>
      {/* Header */}
      <motion.div 
        variants={itemVariants} 
        className="pb-8 border-b"
        style={{ borderColor: themeConfig.border }}
      >
        <h1 
          className="text-3xl font-semibold tracking-tight mb-2"
          style={{ color: themeConfig.foreground }}
        >
          Rules, Setups & Checklists
        </h1>
        <p 
          className="text-sm"
          style={{ color: themeConfig.mutedForeground }}
        >
          Define your trading rules, setup types, and pre/during/post-trade checklists
        </p>
      </motion.div>

      {/* Rules Section */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: themeConfig.foreground }}>
            <AlertCircle className="w-5 h-5" style={{ color: themeConfig.accent }} />
            Rules
          </h2>
          <NeonButton 
            size="sm" 
            onClick={() => { setAddModalDefaultType('rule'); setShowAddModal(true); }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Rule
          </NeonButton>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rules.map((checklist) => (
            <ChecklistCard
              key={checklist.id}
              checklist={checklist}
              onEdit={setEditingChecklist}
              onDelete={handleDeleteChecklist}
              onToggleItem={handleToggleItem}
            />
          ))}
        </div>
        {rules.length === 0 && (
          <NeonCard className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Define trading rules to tick off when adding trades.</p>
            <NeonButton onClick={() => { setAddModalDefaultType('rule'); setShowAddModal(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </NeonButton>
          </NeonCard>
        )}
      </motion.div>

      {/* Setups Section */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: themeConfig.foreground }}>
            <BarChart3 className="w-5 h-5" style={{ color: themeConfig.accent }} />
            Setups
          </h2>
          <NeonButton size="sm" onClick={() => setShowAddSetupModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Setup
          </NeonButton>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {setupTypes.map((st) => (
            <NeonCard key={st.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${themeConfig.accent}20` }}>
                    <BarChart3 className="w-5 h-5" style={{ color: themeConfig.accent }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{st.name}</h3>
                    {st.description && <p className="text-sm text-muted-foreground mt-1">{st.description}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <NeonButton variant="ghost" size="sm" onClick={() => setEditingSetupType(st)}>
                    <Edit className="w-4 h-4" />
                  </NeonButton>
                  <NeonButton variant="ghost" size="sm" onClick={() => handleDeleteSetupType(st.id)}>
                    <Trash2 className="w-4 h-4" />
                  </NeonButton>
                </div>
              </div>
            </NeonCard>
          ))}
        </div>
        {setupTypes.length === 0 && (
          <NeonCard className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Define setup types to select when adding trades.</p>
            <NeonButton onClick={() => setShowAddSetupModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Setup
            </NeonButton>
          </NeonCard>
        )}
      </motion.div>

      {/* Checklists Section */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: themeConfig.foreground }}>
            <CheckSquare className="w-5 h-5" style={{ color: themeConfig.accent }} />
            Checklists
          </h2>
          <NeonButton size="sm" onClick={() => { setAddModalDefaultType('pre'); setShowAddModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            New Checklist
          </NeonButton>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {preDuringPostChecklists.map((checklist) => (
              <motion.div key={checklist.id} variants={itemVariants} layout>
                <ChecklistCard
                  checklist={checklist}
                  onEdit={setEditingChecklist}
                  onDelete={handleDeleteChecklist}
                  onToggleItem={handleToggleItem}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {preDuringPostChecklists.length === 0 && (
          <NeonCard className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Create pre-trade, during-trade, and post-trade checklists.</p>
            <NeonButton onClick={() => { setAddModalDefaultType('pre'); setShowAddModal(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Checklist
            </NeonButton>
          </NeonCard>
        )}
      </motion.div>

      {/* Setup Type Modals */}
      <SetupTypeModal
        isOpen={showAddSetupModal}
        onClose={() => setShowAddSetupModal(false)}
        onSave={handleSaveSetupType}
      />
      <SetupTypeModal
        isOpen={!!editingSetupType}
        onClose={() => setEditingSetupType(null)}
        setupType={editingSetupType}
        onSave={handleSaveSetupType}
      />

      {/* Modals */}
      <ChecklistModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        defaultType={addModalDefaultType}
        onSave={handleSaveChecklist}
      />
      
      <ChecklistModal
        isOpen={!!editingChecklist}
        onClose={() => setEditingChecklist(null)}
        checklist={editingChecklist || undefined}
        onSave={handleSaveChecklist}
      />
      </PageContainer>
    </motion.div>
  );
}