
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ContestsPage from "./pages/ContestsPage";
import ConcertsPage from "./pages/ConcertsPage";
import JuryPage from "./pages/JuryPage";
import GalleryPage from "./pages/GalleryPage";
import SponsorsPage from "./pages/SponsorsPage";
import ResultsPage from "./pages/ResultsPage";
import ContactsPage from "./pages/ContactsPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contests" element={<ContestsPage />} />
          <Route path="/concerts" element={<ConcertsPage />} />
          <Route path="/jury" element={<JuryPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/sponsors" element={<SponsorsPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;