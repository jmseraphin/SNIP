import Layout from "../components/Layout";

import Topbar from "../components/Topbar";

import { useParams } from "react-router-dom";

export default function PersonDetails() {

  const { id } = useParams();

  return (

    <Layout>

      <Topbar title="Détail personne" />

      <div className="person-details">

        <div className="person-header">

          <img
            src="https://i.pravatar.cc/120"
            alt="person"
          />

          <div>

            <h2>Rakoto Jean</h2>

            <p>CIN : 101001</p>

            <p>Nationalité : Malagasy</p>

          </div>

        </div>

        {/* TABS */}
        <div className="tabs">

          <button>Informations</button>

          <button>Documents</button>

          <button>Adresses</button>

          <button>Contacts</button>

          <button>Relations</button>

          <button>Événements</button>

          <button>Fichiers</button>

        </div>

        <div className="details-box">

          <p><b>ID :</b> {id}</p>

          <p><b>Nom :</b> Rakoto</p>

          <p><b>Prénom :</b> Jean</p>

          <p><b>Sexe :</b> Homme</p>

          <p><b>Date naissance :</b> 12/05/1995</p>

        </div>

      </div>

    </Layout>

  );

}