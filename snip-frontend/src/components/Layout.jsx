import "../styles/Layout.css";

import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import { useState } from "react";

export default function Layout() {

  const [collapsed, setCollapsed] = useState(false);

  return (

    <div className="app">

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div
        className={
          collapsed
            ? "main-content expanded"
            : "main-content"
        }
      >
        <Outlet />
      </div>

    </div>

  );

}