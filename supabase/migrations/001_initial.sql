-- ============================================================
-- Sanrachna — Supabase Schema Migration 001
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. USERS profile table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FLOOR PLANS
CREATE TABLE IF NOT EXISTS floor_plans (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Plan',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DETECTIONS
CREATE TABLE IF NOT EXISTS detections (
  id BIGSERIAL PRIMARY KEY,
  floor_plan_id BIGINT REFERENCES floor_plans(id) ON DELETE CASCADE,
  furniture_label TEXT NOT NULL,
  bounding_box JSONB NOT NULL,  -- { x, y, w, h } as fractions 0–1
  confidence_score DOUBLE PRECISION NOT NULL
);

-- 4. PRODUCT SUGGESTIONS
CREATE TABLE IF NOT EXISTS product_suggestions (
  id BIGSERIAL PRIMARY KEY,
  detection_id BIGINT REFERENCES detections(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  price TEXT NOT NULL,
  rating DOUBLE PRECISION,
  product_url TEXT NOT NULL,
  product_image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, plan)
  VALUES (NEW.id, NEW.email, 'free')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE floor_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_suggestions ENABLE ROW LEVEL SECURITY;

-- Users: read & update own profile
CREATE POLICY "Users: read own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users: update own plan" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users: insert own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Floor plans: full CRUD own plans
CREATE POLICY "Floor plans: manage own" ON floor_plans
  FOR ALL USING (auth.uid() = user_id);

-- Detections: accessible if you own the floor plan
CREATE POLICY "Detections: manage via floor plan" ON detections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM floor_plans
      WHERE floor_plans.id = detections.floor_plan_id
        AND floor_plans.user_id = auth.uid()
    )
  );

-- Product suggestions: accessible if you own the detection's floor plan
CREATE POLICY "Product suggestions: manage via floor plan" ON product_suggestions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM detections
      JOIN floor_plans ON floor_plans.id = detections.floor_plan_id
      WHERE detections.id = product_suggestions.detection_id
        AND floor_plans.user_id = auth.uid()
    )
  );

-- ============================================================
-- HELPER: upgrade user to pro
-- ============================================================
CREATE OR REPLACE FUNCTION upgrade_to_pro(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users SET plan = 'pro' WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
