import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FaSearch } from "react-icons/fa";

import Topbar from "../components/Topbar";
import "../styles/persons.css";

export default function Search() {

  const [searchParams] = useSearchParams();

  const initialQuery = searchParams.get("q") || "";

  const [search, setSearch] = useState(initialQuery);

  return (
    <>
      <Topbar title="Recherche rapide" />

      <div className="table-box">

        <div className="table-header">

          <div>
            <h3>Recherche globale</h3>
            <span>
              Rechercher une personne, un document ou une information
            </span>
          </div>

        </div>

        <div className="filters-bar">

          <div className="search-box">

            <FaSearch className="search-icon" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
            />

          </div>

        </div>

        <div
          style={{
            padding: "30px",
            textAlign: "center"
          }}
        >

          <h3>
            Résultats pour : "{search}"
          </h3>

          <p
            style={{
              marginTop: "10px",
              color: "#64748b"
            }}
          >
            Aucun résultat trouvé.
          </p>

        </div>

      </div>
    </>
  );
}