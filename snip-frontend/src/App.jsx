import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Persons from "./pages/Persons";
import PersonDetails from "./pages/PersonDetails";
import Settings from "./pages/Settings";
import Search from "./pages/Search";
import Events from "./pages/Events";

import Layout from "./components/Layout";

function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>

          <Route path="/" element={<Dashboard />} />

          <Route path="/persons" element={<Persons />} />

          <Route
            path="/persons/:id"
            element={<PersonDetails />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />
          <Route path="/search" element={<Search />} />
          <Route path="/events" element={<Events />} />

          {/* TOUJOURS EN DERNIER */}
          <Route
            path="*"
            element={<Navigate to="/" />}
          />

        </Route>

      </Routes>

    </BrowserRouter>

  );

}

export default App;