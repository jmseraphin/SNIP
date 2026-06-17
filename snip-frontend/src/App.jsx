import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Persons from "./pages/Persons";
import PersonDetails from "./pages/PersonDetails";
import Search from "./pages/Search";
import Events from "./pages/Events";
import GenericList from "./pages/GenericList";
import Settings from "./pages/Settings";
import Layout from "./components/Layout";
import { getToken } from "./services/api";

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
          <Route path="/documents" element={<GenericList type="documents" />} />
          <Route path="/files" element={<GenericList type="files" />} />
          <Route path="/users" element={<GenericList type="users" />} />
          <Route path="/audit-logs" element={<GenericList type="audit" />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
