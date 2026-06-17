# SNIP Frontend connecté au backend fourni

Backend analysé sans modification. Frontend ajusté pour consommer les routes réelles :

- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/profile
- GET /api/persons/search
- GET /api/persons/:id?includeDetails=true
- POST /api/persons
- PUT /api/persons/:id
- DELETE /api/persons/:id
- GET /api/users
- GET /api/users/roles
- GET /api/audit/logs
- GET /api/audit/stats
- POST /api/files/upload
- GET /api/files/person/:personId
- GET /api/events/person/:personId

Configuration :

1. Copier `.env.example` vers `.env`
2. Vérifier : `VITE_API_BASE_URL=http://localhost:5000/api`
3. Lancer : `npm install`
4. Lancer : `npm run dev`

Remarque : le backend actuel ne fournit pas d'endpoint global pour dashboard documents/events ni liste globale fichiers/documents. Le frontend affiche donc 0 tant que ces données ne sont pas disponibles globalement, et affiche les fichiers/événements dans le détail d'une personne via `includeDetails=true`.
