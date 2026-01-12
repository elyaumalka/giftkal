-- User roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'venue_owner', 'event_owner');

-- User roles table (for security - never store roles on profiles)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Venues table (אולמות)
CREATE TABLE public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    banner_url TEXT,
    monthly_subscription DECIMAL(10,2) DEFAULT 0,
    landing_page_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Devices table (מכשירי סליקה)
CREATE TABLE public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
    serial_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Events table (אירועים)
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_date DATE NOT NULL,
    event_type TEXT NOT NULL DEFAULT 'חתונה',
    groom_name TEXT,
    bride_name TEXT,
    groom_parents TEXT,
    bride_parents TEXT,
    groom_grandparents TEXT,
    bride_grandparents TEXT,
    invitation_text TEXT,
    invitation_design_url TEXT,
    device_rental_cost DECIMAL(10,2) DEFAULT 0,
    device_returned BOOLEAN DEFAULT false,
    payment_completed BOOLEAN DEFAULT false,
    documents_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Guests table (מוזמנים)
CREATE TABLE public.guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    relationship TEXT,
    invitation_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transactions/Gifts table (מתנות/עסקאות)
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
    payer_name TEXT NOT NULL,
    payer_email TEXT,
    payer_phone TEXT,
    amount DECIMAL(10,2) NOT NULL,
    installments INTEGER DEFAULT 1,
    relationship TEXT,
    blessing_text TEXT,
    receipt_url TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Leads table (לידים)
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_type TEXT NOT NULL CHECK (lead_type IN ('venue_owner', 'event_owner')),
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    venue_name TEXT,
    venue_address TEXT,
    venue_count INTEGER DEFAULT 1,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tasks table (משימות)
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    due_date DATE,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notes table (הערות)
CREATE TABLE public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Support tickets table (פניות ותקלות)
CREATE TABLE public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
    ticket_type TEXT NOT NULL CHECK (ticket_type IN ('inquiry', 'issue')),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
    response TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Documents table (מסמכים)
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Required documents config table
CREATE TABLE public.required_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type TEXT NOT NULL,
    for_type TEXT NOT NULL CHECK (for_type IN ('venue_owner', 'event_owner')),
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Invoices table (חשבוניות)
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    for_month DATE NOT NULL,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- API Keys table
CREATE TABLE public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System settings table
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_email TEXT,
    logo_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.required_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can view all, update own
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User roles: Only admins can manage
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Venues: Admins see all, owners see own
CREATE POLICY "Admins can view all venues" ON public.venues FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR owner_id = auth.uid());
CREATE POLICY "Users can insert venues" ON public.venues FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own venues" ON public.venues FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR owner_id = auth.uid());
CREATE POLICY "Admins can delete venues" ON public.venues FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Devices: Based on venue ownership
CREATE POLICY "View devices" ON public.devices FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR 
    EXISTS (SELECT 1 FROM public.venues WHERE venues.id = devices.venue_id AND venues.owner_id = auth.uid())
);
CREATE POLICY "Manage devices" ON public.devices FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR 
    EXISTS (SELECT 1 FROM public.venues WHERE venues.id = devices.venue_id AND venues.owner_id = auth.uid())
);

-- Events: Admins, venue owners, and event owners
CREATE POLICY "View events" ON public.events FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR 
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.venues WHERE venues.id = events.venue_id AND venues.owner_id = auth.uid())
);
CREATE POLICY "Create events" ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Update events" ON public.events FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR owner_id = auth.uid()
);

-- Guests: Event owner or admin
CREATE POLICY "View guests" ON public.guests FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR 
    EXISTS (SELECT 1 FROM public.events WHERE events.id = guests.event_id AND events.owner_id = auth.uid())
);
CREATE POLICY "Manage guests" ON public.guests FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR 
    EXISTS (SELECT 1 FROM public.events WHERE events.id = guests.event_id AND events.owner_id = auth.uid())
);

-- Transactions: Based on event ownership
CREATE POLICY "View transactions" ON public.transactions FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR 
    EXISTS (SELECT 1 FROM public.events WHERE events.id = transactions.event_id AND events.owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.venues WHERE venues.id = transactions.venue_id AND venues.owner_id = auth.uid())
);
CREATE POLICY "Create transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (true);

-- Leads: Admin only
CREATE POLICY "Admins manage leads" ON public.leads FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Tasks: Admin or assigned user
CREATE POLICY "View tasks" ON public.tasks FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR user_id = auth.uid()
);
CREATE POLICY "Manage tasks" ON public.tasks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Notes: Admin only
CREATE POLICY "Admins manage notes" ON public.notes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Support tickets: User's own or admin
CREATE POLICY "View own tickets" ON public.support_tickets FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR user_id = auth.uid()
);
CREATE POLICY "Create tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- Documents
CREATE POLICY "View documents" ON public.documents FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR user_id = auth.uid()
);
CREATE POLICY "Manage own documents" ON public.documents FOR ALL TO authenticated USING (user_id = auth.uid());

-- Required documents: viewable by all, admin manages
CREATE POLICY "View required docs" ON public.required_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage required docs" ON public.required_documents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Invoices: Venue owner or admin
CREATE POLICY "View invoices" ON public.invoices FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR 
    EXISTS (SELECT 1 FROM public.venues WHERE venues.id = invoices.venue_id AND venues.owner_id = auth.uid())
);
CREATE POLICY "Admin manage invoices" ON public.invoices FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- API keys: Admin only
CREATE POLICY "Admin manage api keys" ON public.api_keys FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- System settings: Admin only
CREATE POLICY "Admin manage settings" ON public.system_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'משתמש חדש'), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();