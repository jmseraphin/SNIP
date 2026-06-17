import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Persons from "./pages/Persons";
import PersonDetails from "./pages/PersonDetails";
import Search from "./pages/Search";
import Events from "./pages/Events";
import Documents from "./pages/Documents";
import GenericList from "./pages/GenericList";
import Settings from "./pages/Settings";

import Layout from "./components/Layout";
import { getToken } from "./services/api";
import Files from "./pages/Files";
import Relationships from "./pages/Relationships";

function ProtectedRoute() {
  return getToken() ? <Layout /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/persons" element={<Persons />} />
          <Route path="/persons/:id" element={<PersonDetails />} />
          <Route path="/search" element={<Search />} />
          <Route path="/events" element={<Events />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/files" element={<Files />} />
          <Route path="/users" element={<GenericList type="users" />} />
          <Route path="/audit-logs" element={<GenericList type="audit" />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/relationships" element={<Relationships />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}