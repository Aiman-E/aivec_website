import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/i18n";
import { ClerkProvider } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { FontLoader } from "@/components/FontLoader";
import NotFound from "@/pages/not-found";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AdminLayout } from "@/components/layout/AdminLayout";

import { Home } from "@/pages/Home";
import { EventDetail } from "@/pages/public/EventDetail";
import { NewsDetail } from "@/pages/public/NewsDetail";
import { BlogDetail } from "@/pages/public/BlogDetail";
import { MyRegistrations } from "@/pages/portal/MyRegistrations";

import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { AdminSiteSettings } from "@/pages/admin/AdminSiteSettings";
import { AdminPages } from "@/pages/admin/AdminPages";
import { AdminPageEdit } from "@/pages/admin/AdminPageEdit";
import { AdminEvents } from "@/pages/admin/AdminEvents";
import { AdminEventFields } from "@/pages/admin/AdminEventFields";
import { AdminEventRegistrations } from "@/pages/admin/AdminEventRegistrations";
import { AdminForms } from "@/pages/admin/AdminForms";
import { AdminFormFields } from "@/pages/admin/AdminFormFields";
import { AdminFormSubmissions } from "@/pages/admin/AdminFormSubmissions";
import { FormPage } from "@/pages/public/FormPage";
import { AdminNews } from "@/pages/admin/AdminNews";
import { AdminBlog } from "@/pages/admin/AdminBlog";
import { AdminContact } from "@/pages/admin/AdminContact";
import { AdminSponsors } from "@/pages/admin/AdminSponsors";
import { AdminHeroImages } from "@/pages/admin/AdminHeroImages";
import { AdminUsers } from "@/pages/admin/AdminUsers";
import { AdminAccounts } from "@/pages/admin/AdminAccounts";

const queryClient = new QueryClient();

// REQUIRED — copy verbatim. Resolves the key from window.location.hostname so the
// same build serves multiple Clerk custom domains. Do not inline the env var.
const PUBLISHABLE_KEY = publishableKeyFromHost(
  typeof window !== "undefined" ? window.location.hostname : "",
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — copy verbatim. Empty in dev (Clerk hits dev FAPI directly), auto-set
// in prod. Do NOT gate on import.meta.env.PROD / NODE_ENV — the empty dev value
// is intentional, and any branching breaks the prod proxy.
const CLERK_PROXY_URL = import.meta.env.VITE_CLERK_PROXY_URL;

function AdminRouter() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/:lang/admin" component={AdminDashboard} />
        <Route path="/:lang/admin/site-settings" component={AdminSiteSettings} />
        <Route path="/:lang/admin/pages" component={AdminPages} />
        <Route path="/:lang/admin/pages/:key" component={AdminPageEdit} />
        <Route path="/:lang/admin/events" component={AdminEvents} />
        <Route path="/:lang/admin/events/:id/fields" component={AdminEventFields} />
        <Route path="/:lang/admin/events/:id/registrations" component={AdminEventRegistrations} />
        <Route path="/:lang/admin/forms" component={AdminForms} />
        <Route path="/:lang/admin/forms/:id/fields" component={AdminFormFields} />
        <Route path="/:lang/admin/forms/:id/submissions" component={AdminFormSubmissions} />
        <Route path="/:lang/admin/news" component={AdminNews} />
        <Route path="/:lang/admin/blog" component={AdminBlog} />
        <Route path="/:lang/admin/contact" component={AdminContact} />
        <Route path="/:lang/admin/sponsors" component={AdminSponsors} />
        <Route path="/:lang/admin/hero-images" component={AdminHeroImages} />
        <Route path="/:lang/admin/users" component={AdminUsers} />
        <Route path="/:lang/admin/accounts" component={AdminAccounts} />
      </Switch>
    </AdminLayout>
  );
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    // Skip when navigating to in-page anchors on the homepage; otherwise reset.
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);
  return null;
}

function LanguageRouter() {
  const [location] = useLocation();
  const isAdmin = location.match(/^\/(en|ar)\/admin/);

  return (
    <div className="flex min-h-screen flex-col">
      {!isAdmin && <Navbar />}
      <main className="flex-1">
        <Switch>
          {/* The Single Page Landing */}
          <Route path="/:lang" component={Home} />
          
          {/* Detail pages and portals */}
          <Route path="/:lang/events/:slug" component={EventDetail} />
          <Route path="/:lang/forms/:slug" component={FormPage} />
          <Route path="/:lang/news/:slug" component={NewsDetail} />
          <Route path="/:lang/blog/:slug" component={BlogDetail} />
          <Route path="/:lang/me/registrations" component={MyRegistrations} />
          
          {/* Admin routes */}
          <Route path="/:lang/admin" component={AdminRouter} />
          <Route path="/:lang/admin/*" component={AdminRouter} />
          
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isAdmin && <Footer />}
    </div>
  );
}

function RootRouter() {
  const [location] = useLocation();
  const saved = typeof localStorage !== "undefined" ? localStorage.getItem("aivec_lang") : null;
  const savedLang = saved === "en" || saved === "ar" ? saved : "ar";

  if (location === "/") {
    return <Redirect to={`/${savedLang}`} />;
  }

  // Accept bare /admin (and /admin/...) without a language prefix
  if (location === "/admin" || location.startsWith("/admin/")) {
    return <Redirect to={`/${savedLang}${location}`} />;
  }

  return <LanguageRouter />;
}

function App() {
  if (!PUBLISHABLE_KEY) {
    return <div>Missing Clerk Publishable Key</div>;
  }

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      proxyUrl={CLERK_PROXY_URL}
      appearance={{
        variables: {
          colorPrimary: "hsl(355 65% 25%)",
        },
        elements: {
          socialButtons: { display: "none" },
          socialButtonsBlockButton: { display: "none" },
          socialButtonsIconButton: { display: "none" },
          dividerRow: { display: "none" },
          dividerText: { display: "none" },
          dividerLine: { display: "none" },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <LanguageProvider>
              <FontLoader />
              <ScrollToTop />
              <RootRouter />
            </LanguageProvider>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;