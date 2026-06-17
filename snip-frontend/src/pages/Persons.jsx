import "../styles/persons.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";
import { personsApi } from "../services/api";
import { fmtDate, fullName, nationalId, phone, number } from "../utils/format";
import { FaSearch, FaPlus, FaEdit, FaTrash, FaEye, FaUsers } from "react-icons/fa";

const emptyForm = { last_name: "", first_name: "", cin: "", phone: "", gender: "", nationality: "Malagasy", birth_date: "", birth_place: "", status: "active" };

export default function Persons() {
  const navigate = useNavigate();
  const [persons, setPersons] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await personsApi.list({ q: query, gender });
      setPersons(res.data || []);
      setTotal(res.total || 0);
    } catch {
      setPersons([]);
      setTotal(0);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [query, gender]);

  const openCreate = () => { setForm(emptyForm); setModal("create"); setError(""); };
  const openEdit = (p) => { setForm({ ...emptyForm, ...p, cin: p.cin || "" }); setModal(p.id); setError(""); };
  const save = async () => {
    try {
      setError("");
      if (modal === "create") await personsApi.create(form); else await personsApi.update(modal, form);
      setModal(null); await load();
    } catch (e) { setError(e.message); }
  };
  const remove = async (p) => {
    if (!window.confirm(`Supprimer ${fullName(p)} ?`)) return;
    try { await personsApi.remove(p.id); await load(); } catch (e) { alert(e.message); }
  };

  return (
    <>
      <Topbar title="Gestion des personnes" />
      <div className="persons-stats"><div className="stats-card"><div className="stats-icon"><FaUsers /></div><div><h3>Total personnes</h3><p>{loading ? "…" : number(total)}</p></div></div></div>
      <div className="table-box">
        <div className="table-header"><div><h3>Liste des personnes</h3><span>Gestion complète des personnes enregistrées</span></div><button className="add-btn" onClick={openCreate}><FaPlus /> Ajouter une personne</button></div>
        <div className="filters-bar"><div className="search-box"><FaSearch className="search-icon" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher nom, CIN, téléphone..." /></div><select value={gender} onChange={(e) => setGender(e.target.value)}><option value="">Tous les sexes</option><option value="M">Masculin</option><option value="F">Féminin</option><option value="Homme">Homme</option><option value="Femme">Femme</option></select></div>
        <table><thead><tr><th>ID</th><th>Nom complet</th><th>CIN</th><th>Téléphone</th><th>Sexe</th><th>Date naissance</th><th>Statut</th><th>Actions</th></tr></thead><tbody>
          {!loading && persons.length === 0 && <tr><td colSpan="8" style={{ textAlign: "center", padding: 28 }}>Aucune personne trouvée</td></tr>}
          {persons.map((p) => <tr key={p.id}><td>{p.id}</td><td><div className="person-info"><div className="person-avatar">{fullName(p).charAt(0)}</div><div><h4>{fullName(p)}</h4><span>{p.birth_place || p.birthPlace || "—"}</span></div></div></td><td>{nationalId(p)}</td><td>{phone(p)}</td><td>{p.gender || p.sexe || "—"}</td><td>{fmtDate(p.birth_date || p.birthDate)}</td><td><span className={(p.status || "active") === "active" ? "status active" : "status inactive"}>{p.status || "active"}</span></td><td><div className="action-buttons"><button className="view-btn" onClick={() => navigate(`/persons/${p.id}`)}><FaEye /></button><button className="edit-btn" onClick={() => openEdit(p)}><FaEdit /></button><button className="delete-btn" onClick={() => remove(p)}><FaTrash /></button></div></td></tr>)}
        </tbody></table>
        <div className="pagination"><span>Affichage de {persons.length} sur {number(total)} personnes</span></div>
      </div>
      {modal && <div className="modal-overlay"><div className="modal-box wide"><h3>{modal === "create" ? "Ajouter une personne" : "Modifier une personne"}</h3>{error && <div className="login-error">{error}</div>}<div className="form-grid"><input placeholder="Nom de famille" value={form.last_name || ""} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /><input placeholder="Prénom" value={form.first_name || ""} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /><input placeholder="CIN / Identifiant national" value={form.cin || ""} onChange={(e) => setForm({ ...form, cin: e.target.value })} /><input placeholder="Téléphone" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><input type="date" value={form.birth_date || ""} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} /><select value={form.gender || ""} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="">Sexe</option><option value="M">Masculin</option><option value="F">Féminin</option></select><input placeholder="Lieu naissance" value={form.birth_place || ""} onChange={(e) => setForm({ ...form, birth_place: e.target.value })} /><input placeholder="Nationalité" value={form.nationality || ""} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></div><div className="modal-actions"><button className="cancel-btn" onClick={() => setModal(null)}>Annuler</button><button className="save-btn" onClick={save}>Enregistrer</button></div></div></div>}
    </>
  );
}
