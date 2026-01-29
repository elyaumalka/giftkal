import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";

// Auth
import Login from "./pages/auth/Login";
import ResetPassword from "./pages/auth/ResetPassword";

// Admin
import { AdminLayout } from "./components/layout/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import Customers from "./pages/admin/Customers";
import Transactions from "./pages/admin/Transactions";
import EventOwners from "./pages/admin/EventOwners";
import Leads from "./pages/admin/Leads";
import Support from "./pages/admin/Support";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";
import SeedData from "./pages/admin/SeedData";

// Venue
import { VenueLayout } from "./components/layout/VenueLayout";
import VenueDashboard from "./pages/venue/Dashboard";
import VenueInvoices from "./pages/venue/Invoices";
import VenueEvents from "./pages/venue/Events";
import VenueSupport from "./pages/venue/Support";
import VenueSettings from "./pages/venue/Settings";
import VenueLeads from "./pages/venue/Leads";

// Event
import { EventLayout } from "./components/layout/EventLayout";
import EventDashboard from "./pages/event/Dashboard";
import EventInvitations from "./pages/event/Invitations";
import EventGifts from "./pages/event/Gifts";
import EventSettings from "./pages/event/Settings";
import PaymeSetup from "./pages/event/PaymeSetup";

// Public
import GiftScreen from "./pages/gift/GiftScreen";
import VenueLanding from "./pages/landing/VenueLanding";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/gift/:eventId" element={<GiftScreen />} />
          <Route path="/event/:eventId/payme-setup" element={<PaymeSetup />} />
          <Route path="/landing/:venueId" element={<VenueLanding />} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="event-owners" element={<EventOwners />} />
            <Route path="leads" element={<Leads />} />
            <Route path="support" element={<Support />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="seed" element={<SeedData />} />
          </Route>

          {/* Venue owner routes */}
          <Route path="/venue" element={<VenueLayout />}>
            <Route index element={<VenueDashboard />} />
            <Route path="invoices" element={<VenueInvoices />} />
            <Route path="events" element={<VenueEvents />} />
            <Route path="leads" element={<VenueLeads />} />
            <Route path="support" element={<VenueSupport />} />
            <Route path="settings" element={<VenueSettings />} />
          </Route>

          {/* Event owner routes */}
          <Route path="/event" element={<EventLayout />}>
            <Route index element={<EventDashboard />} />
            <Route path="invitations" element={<EventInvitations />} />
            <Route path="gifts" element={<EventGifts />} />
            <Route path="settings" element={<EventSettings />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
}

export default App;
