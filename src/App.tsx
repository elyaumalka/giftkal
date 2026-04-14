import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";

// Auth
import Login from "./pages/auth/Login";
import ResetPassword from "./pages/auth/ResetPassword";
import EventLogin from "./pages/auth/EventLogin";
import VenueLogin from "./pages/auth/VenueLogin";
import Signup from "./pages/auth/Signup";
import AccessPage from "./pages/auth/AccessPage";

// Landing / Marketing
import HomePage from "./pages/landing/HomePage";
import MarketingLayout from "./components/layout/MarketingLayout";
import VenueOwners from "./pages/marketing/VenueOwners";
import EventOwnersPage from "./pages/marketing/EventOwners";
import Benefits from "./pages/marketing/Benefits";
import Pricing from "./pages/marketing/Pricing";
import Testimonials from "./pages/marketing/Testimonials";
import Contact from "./pages/marketing/Contact";

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
import AdminHallsDevices from "./pages/admin/HallsDevices";
import AdminBilling from "./pages/admin/Billing";
import AdminCoupons from "./pages/admin/Coupons";

// Venue
import { VenueLayout } from "./components/layout/VenueLayout";
import VenueDashboard from "./pages/venue/Dashboard";
import VenueInvoices from "./pages/venue/Invoices";
import VenueEvents from "./pages/venue/Events";
import VenueSupport from "./pages/venue/Support";
import VenueSettings from "./pages/venue/Settings";
import VenueHalls from "./pages/venue/Halls";
import VenueLeads from "./pages/venue/Leads";

// Event
import { EventLayout } from "./components/layout/EventLayout";
import EventDashboard from "./pages/event/Dashboard";
import EventInvitations from "./pages/event/Invitations";
import EventGifts from "./pages/event/Gifts";
import EventSettings from "./pages/event/Settings";
import EventRSVP from "./pages/event/RSVP";
import EventBudget from "./pages/event/Budget";
import EventUpgrade from "./pages/event/Upgrade";
import PaymeSetup from "./pages/event/PaymeSetup";

// Public
import EventWelcome from "./pages/gift/EventWelcome";
import GiftScreen from "./pages/gift/GiftScreen";
import SharedInvitePage from "./pages/invite/SharedInvitePage";
import GiftSearch from "./pages/gift/GiftSearch";
import PublicRSVP from "./pages/rsvp/PublicRSVP";
import VenueLanding from "./pages/landing/VenueLanding";

// Kiosk
import KioskPage from "./pages/kiosk/KioskPage";

// API Docs
import YemotApiDocs from "./pages/api/YemotApiDocs";
import SystemApiDocs from "./pages/api/SystemApiDocs";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Marketing pages with shared nav/footer */}
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/venues-page" element={<VenueOwners />} />
            <Route path="/event-owners" element={<EventOwnersPage />} />
            <Route path="/benefits" element={<Benefits />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/testimonials-page" element={<Testimonials />} />
            <Route path="/contact" element={<Contact />} />
          </Route>
          <Route path="/access" element={<AccessPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login/event" element={<EventLogin />} />
          <Route path="/login/venue" element={<VenueLogin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/gift-search" element={<GiftSearch />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/gift/:eventId" element={<EventWelcome />} />
          <Route path="/gift/:eventId/send" element={<GiftScreen />} />
          <Route path="/event/:eventId/payme-setup" element={<PaymeSetup />} />
           <Route path="/landing/:venueId" element={<VenueLanding />} />
           <Route path="/invite/:token" element={<SharedInvitePage />} />
           <Route path="/rsvp/:eventId/:guestId" element={<PublicRSVP />} />
           <Route path="/kiosk/:hallId" element={<KioskPage />} />
          <Route path="/api/yemot" element={<YemotApiDocs />} />
          <Route path="/api/docs" element={<SystemApiDocs />} />

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
            <Route path="halls-devices" element={<AdminHallsDevices />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="seed" element={<SeedData />} />
          </Route>

          {/* Venue owner routes */}
          <Route path="/venue" element={<VenueLayout />}>
            <Route index element={<VenueDashboard />} />
            <Route path="invoices" element={<VenueInvoices />} />
            <Route path="events" element={<VenueEvents />} />
            <Route path="leads" element={<VenueLeads />} />
            <Route path="halls" element={<VenueHalls />} />
            <Route path="support" element={<VenueSupport />} />
            <Route path="settings" element={<VenueSettings />} />
          </Route>

          {/* Event owner routes */}
          <Route path="/event" element={<EventLayout />}>
            <Route index element={<EventDashboard />} />
            <Route path="invitations" element={<EventInvitations />} />
            <Route path="rsvp" element={<EventRSVP />} />
            <Route path="gifts" element={<EventGifts />} />
            <Route path="budget" element={<EventBudget />} />
            <Route path="upgrade" element={<EventUpgrade />} />
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
