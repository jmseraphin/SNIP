import "../styles/sidebar.css";

export default function Sidebar() {
  return (
    <div className="sidebar">
      <h1 className="logo">SNIP</h1>

      <ul className="menu">
        <li>📊 Tableau de bord</li>
        <li>👤 Personnes</li>
        <li>🔍 Recherche</li>
        <li>📅 Événements</li>
        <li>📄 Documents</li>
        <li>📁 Fichiers</li>
        <li>👥 Utilisateurs & rôles</li>
        <li>📝 Audit logs</li>
        <li>⚙️ Paramètres</li>
      </ul>
    </div>
  );
}