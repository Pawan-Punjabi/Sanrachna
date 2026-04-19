-- 1. Users Table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    email TEXT,
    first_name TEXT,
    plan TEXT DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Floor Plans Table
CREATE TABLE public.floor_plans (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Detections Table
CREATE TABLE public.detections (
    id SERIAL PRIMARY KEY,
    floor_plan_id INTEGER REFERENCES public.floor_plans(id) ON DELETE CASCADE,
    furniture_label TEXT NOT NULL,
    bounding_box JSONB NOT NULL,
    confidence_score REAL NOT NULL
);

-- 4. Product Suggestions Table
CREATE TABLE public.product_suggestions (
    id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES public.detections(id) ON DELETE CASCADE,
    store_name TEXT NOT NULL,
    product_name TEXT NOT NULL,
    price TEXT NOT NULL,
    rating REAL,
    product_url TEXT NOT NULL,
    product_image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
