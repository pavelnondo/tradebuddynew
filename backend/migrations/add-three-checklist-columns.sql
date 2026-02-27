-- Migration: Add pre/during/post checklist columns to trades table
-- Run this if your database only has one checklist (checklist_id/checklist_items)
-- and you need support for during-trade and post-trade checklists.
-- Safe to run multiple times - uses IF NOT EXISTS.

-- Ensure checklist_items exists (pre-trade snapshot)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'trades' AND column_name = 'checklist_items') THEN
        ALTER TABLE trades ADD COLUMN checklist_items JSONB;
        RAISE NOTICE 'Added checklist_items column to trades';
    END IF;
END $$;

-- Add during_checklist_id (references checklist template)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'trades' AND column_name = 'during_checklist_id') THEN
        BEGIN
            ALTER TABLE trades ADD COLUMN during_checklist_id UUID REFERENCES checklists(id) ON DELETE SET NULL;
        EXCEPTION WHEN others THEN
            ALTER TABLE trades ADD COLUMN during_checklist_id UUID;
        END;
        RAISE NOTICE 'Added during_checklist_id column to trades';
    END IF;
END $$;

-- Add during_checklist_items (snapshot of completed items)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'trades' AND column_name = 'during_checklist_items') THEN
        ALTER TABLE trades ADD COLUMN during_checklist_items JSONB;
        RAISE NOTICE 'Added during_checklist_items column to trades';
    END IF;
END $$;

-- Add post_checklist_id
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'trades' AND column_name = 'post_checklist_id') THEN
        BEGIN
            ALTER TABLE trades ADD COLUMN post_checklist_id UUID REFERENCES checklists(id) ON DELETE SET NULL;
        EXCEPTION WHEN others THEN
            ALTER TABLE trades ADD COLUMN post_checklist_id UUID;
        END;
        RAISE NOTICE 'Added post_checklist_id column to trades';
    END IF;
END $$;

-- Add post_checklist_items
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'trades' AND column_name = 'post_checklist_items') THEN
        ALTER TABLE trades ADD COLUMN post_checklist_items JSONB;
        RAISE NOTICE 'Added post_checklist_items column to trades';
    END IF;
END $$;
