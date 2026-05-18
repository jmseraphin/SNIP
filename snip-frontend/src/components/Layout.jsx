import "../styles/Layout.css";

import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function Layout() {

  return (

    <div className="app">

      <Sidebar />

      <div className="main-content">
        <Outlet />
      </div>

    </div>

  );

}