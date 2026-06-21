import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Persons from "./pages/Persons";
import PersonDetails from "./pages/PersonDetails";
import Search from "./pages/Search";
import Events from "./pages/Events";
import Documents from "./pages/Documents";
import Settings from "./pages/Settings";
import Files from "./pages/Files";
import Relationships from "./pages/Relationships";
import Addresses from "./pages/Addresses";
import Contacts from "./pages/Contacts";
import UsersRoles from "./pages/UsersRoles";
import AuditLogs from "./pages/AuditLogs";

import Layout from "./components/Layout";
import { getToken } from "./services/api";

function applyGlobalPreferences() {
  const theme = localStorage.getItem("snip_theme") || "light";
  const lang = localStorage.getItem("snip_lang") || "fr";

  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("lang", lang);
  document.body.classList.toggle("dark-mode", theme === "dark");
}

function ProtectedRoute() {
  return getToken() ? <Layout /> : <Navigate to="/login" replace />;
}

export default function App() {
  useEffect(() => {
    applyGlobalPreferences();

    const handlePreferencesChange = () => {
      applyGlobalPreferences();
    };

    window.addEventListener("snip-preferences-changed", handlePreferencesChange);
    window.addEventListener("storage", handlePreferencesChange);

    return () => {
      window.removeEventListener("snip-preferences-changed", handlePreferencesChange);
      window.removeEventListener("storage", handlePreferencesChange);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/persons" element={<Persons />} />
          <Route path="/persons/:id" element={<PersonDetails />} />
          <Route path="/search" element={<Search />} />
          <Route path="/relationships" element={<Relationships />} />
          <Route path="/events" element={<Events />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/files" element={<Files />} />
          <Route path="/addresses" element={<Addresses />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/users" element={<UsersRoles />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/settings" element={<Settings />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}