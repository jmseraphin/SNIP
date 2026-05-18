import Layout from "../components/Layout";

import Topbar from "../components/Topbar";

import { Link } from "react-router-dom";

export default function Persons() {

  const persons = [

    {
      id: 1,
      national_id: "101001",
      first_name: "Jean",
      last_name: "Rakoto",
      gender: "Homme",
      nationality: "Malagasy"
    },

    {
      id: 2,
      national_id: "101002",
      first_name: "Sarah",
      last_name: "Rabe",
      gender: "Femme",
      nationality: "Malagasy"
    }

  ];

  return (

    <Layout>

      <Topbar title="Gestion des personnes" />

      <div className="table-box">

        <div className="table-header">

          <h3>Liste des personnes</h3>

          <button>
            Ajouter
          </button>

        </div>

        <table>

          <thead>

            <tr>

              <th>CIN</th>

              <th>Nom</th>

              <th>Sexe</th>

              <th>Nationalité</th>

              <th>Actions</th>

            </tr>

          </thead>

          <tbody>

            {
              persons.map((person) => (

                <tr key={person.id}>

                  <td>{person.national_id}</td>

                  <td>
                    {person.first_name} {person.last_name}
                  </td>

                  <td>{person.gender}</td>

                  <td>{person.nationality}</td>

                  <td>

                    <Link
                      to={`/persons/${person.id}`}
                    >
                      Voir
                    </Link>

                  </td>

                </tr>

              ))
            }

          </tbody>

        </table>

      </div>

    </Layout>

  );

}