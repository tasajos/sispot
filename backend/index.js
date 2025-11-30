const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- CONEXIÓN BD ---
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect((err) => {
    if (err) console.error('❌ Error BD:', err);
    else console.log(`✅ Conectado a BD en puerto ${process.env.DB_PORT}`);
});

// ==========================================
// RUTAS DE LA API (CRUD COMPLETO)
// ==========================================

// --- LOGIN ---
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.query("SELECT * FROM usuarios WHERE email = ?", [email], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.length === 0) return res.status(401).json({ message: "Usuario no encontrado" });
        if (password === result[0].password) {
            const { password, ...user } = result[0];
            res.json({ success: true, user });
        } else {
            res.status(401).json({ message: "Contraseña incorrecta" });
        }
    });
});

// --- ACTIVIDADES (Tablero) ---
app.get('/api/actividades', (req, res) => {
    db.query("SELECT * FROM actividades ORDER BY fecha_evento ASC", (err, r) => err ? res.status(500).send(err) : res.json(r));
});
app.post('/api/actividades', (req, res) => {
    const { titulo, descripcion, tipo, estado, fecha_evento, distrito, responsable } = req.body;
    db.query("INSERT INTO actividades (titulo, descripcion, tipo, estado, fecha_evento, distrito, responsable) VALUES (?,?,?,?,?,?,?)", 
    [titulo, descripcion, tipo, estado, fecha_evento, distrito, responsable], (err, r) => err ? res.status(500).send(err) : res.json({ message: "OK", id: r.insertId }));
});

// --- COMPETIDORES ---
app.get('/api/competidores', (req, res) => {
    db.query("SELECT * FROM competidores", (err, r) => err ? res.status(500).send(err) : res.json(r));
});

// ==========================================
// MÓDULO CATÁLOGOS (Subalcaldías > Distritos > OTBs > Temas)
// ==========================================

// 1. SUBALCALDÍAS
app.get('/api/catalogos/subalcaldias', (req, res) => {
    const sql = `SELECT s.*, COUNT(d.id) as total_distritos FROM subalcaldias s LEFT JOIN distritos d ON s.id = d.subalcaldia_id GROUP BY s.id`;
    db.query(sql, (err, r) => err ? res.status(500).send(err) : res.json(r));
});
app.post('/api/catalogos/subalcaldias', (req, res) => {
    const { nombre, responsable } = req.body;
    db.query("INSERT INTO subalcaldias (nombre, responsable) VALUES (?, ?)", [nombre, responsable], (err, r) => err ? res.status(500).send(err) : res.json({ message: "Creado" }));
});
app.put('/api/catalogos/subalcaldias/:id', (req, res) => {
    const { nombre, responsable } = req.body;
    db.query("UPDATE subalcaldias SET nombre = ?, responsable = ? WHERE id = ?", [nombre, responsable, req.params.id], (err) => err ? res.status(500).send(err) : res.json({ message: "Actualizado" }));
});
app.delete('/api/catalogos/subalcaldias/:id', (req, res) => {
    db.query("DELETE FROM subalcaldias WHERE id = ?", [req.params.id], (err) => err ? res.status(500).send(err) : res.json({ message: "Eliminado" }));
});

// 2. DISTRITOS (Con Subalcaldía)
app.get('/api/catalogos/distritos', (req, res) => {
    const sql = `
        SELECT d.*, s.nombre as subalcaldia, COUNT(o.id) as total_otbs 
        FROM distritos d 
        LEFT JOIN subalcaldias s ON d.subalcaldia_id = s.id 
        LEFT JOIN otbs o ON d.id = o.distrito_id 
        GROUP BY d.id
    `;
    db.query(sql, (err, r) => err ? res.status(500).send(err) : res.json(r));
});
app.post('/api/catalogos/distritos', (req, res) => {
    const { nombre, zona, poblacion_est, subalcaldia_id } = req.body;
    // IMPORTANTE: Convertir string vacío a NULL si no se selecciona subalcaldía
    const subId = subalcaldia_id && subalcaldia_id !== '' ? subalcaldia_id : null;
    const sql = "INSERT INTO distritos (nombre, zona, poblacion_est, subalcaldia_id) VALUES (?, ?, ?, ?)";
    db.query(sql, [nombre, zona, poblacion_est || 0, subId], (err, r) => err ? res.status(500).send(err) : res.json({ message: "Creado" }));
});
app.put('/api/catalogos/distritos/:id', (req, res) => {
    const { nombre, zona, poblacion_est, subalcaldia_id } = req.body;
    const subId = subalcaldia_id && subalcaldia_id !== '' ? subalcaldia_id : null;
    const sql = "UPDATE distritos SET nombre = ?, zona = ?, poblacion_est = ?, subalcaldia_id = ? WHERE id = ?";
    db.query(sql, [nombre, zona, poblacion_est, subId, req.params.id], (err) => err ? res.status(500).send(err) : res.json({ message: "Actualizado" }));
});
app.delete('/api/catalogos/distritos/:id', (req, res) => {
    db.query("DELETE FROM distritos WHERE id = ?", [req.params.id], (err) => err ? res.status(500).send(err) : res.json({ message: "Eliminado" }));
});

// 3. OTBS
app.get('/api/catalogos/otbs', (req, res) => {
    const sql = "SELECT o.id, o.nombre, d.nombre as distrito FROM otbs o JOIN distritos d ON o.distrito_id = d.id ORDER BY d.nombre, o.nombre";
    db.query(sql, (err, r) => err ? res.status(500).send(err) : res.json(r));
});
app.post('/api/catalogos/otbs', (req, res) => {
    const { nombre, distrito_id } = req.body;
    db.query("INSERT INTO otbs (nombre, distrito_id) VALUES (?, ?)", [nombre, distrito_id], (err, r) => err ? res.status(500).send(err) : res.json({ message: "Creado" }));
});
app.put('/api/catalogos/otbs/:id', (req, res) => {
    const { nombre, distrito_id } = req.body;
    db.query("UPDATE otbs SET nombre = ?, distrito_id = ? WHERE id = ?", [nombre, distrito_id, req.params.id], (err) => err ? res.status(500).send(err) : res.json({ message: "Actualizado" }));
});
app.delete('/api/catalogos/otbs/:id', (req, res) => {
    db.query("DELETE FROM otbs WHERE id = ?", [req.params.id], (err) => err ? res.status(500).send(err) : res.json({ message: "Eliminado" }));
});

// 4. AREAS Y PROBLEMAS
app.get('/api/catalogos/areas', (req, res) => {
    db.query("SELECT * FROM areas_tematicas", (err, r) => err ? res.status(500).send(err) : res.json(r));
});
app.post('/api/catalogos/areas', (req, res) => {
    db.query("INSERT INTO areas_tematicas (nombre, icono) VALUES (?, 'Layers')", [req.body.nombre], (err, r) => err ? res.status(500).send(err) : res.json({ message: "Creado" }));
});
app.get('/api/catalogos/problemas', (req, res) => {
    const sql = "SELECT p.id, p.nombre, a.nombre as area FROM tipos_problema p JOIN areas_tematicas a ON p.area_id = a.id";
    db.query(sql, (err, r) => err ? res.status(500).send(err) : res.json(r));
});
app.post('/api/catalogos/problemas', (req, res) => {
    db.query("INSERT INTO tipos_problema (nombre, area_id) VALUES (?, ?)", [req.body.nombre, req.body.area_id], (err, r) => err ? res.status(500).send(err) : res.json({ message: "Creado" }));
});
app.delete('/api/catalogos/problemas/:id', (req, res) => {
    db.query("DELETE FROM tipos_problema WHERE id = ?", [req.params.id], (err) => err ? res.status(500).send(err) : res.json({ message: "Eliminado" }));
});

// 5. DIAGNÓSTICO
app.get('/api/catalogos/diagnostico', (req, res) => {
    const sql = `
        SELECT diag.id, diag.otb_id, diag.problema_id, diag.prioridad,
               o.nombre as otb, d.nombre as distrito, 
               p.nombre as problema, a.nombre as area 
        FROM diagnostico_otb diag
        JOIN otbs o ON diag.otb_id = o.id
        JOIN distritos d ON o.distrito_id = d.id
        JOIN tipos_problema p ON diag.problema_id = p.id
        JOIN areas_tematicas a ON p.area_id = a.id
        ORDER BY d.id, o.nombre
    `;
    db.query(sql, (err, r) => err ? res.status(500).send(err) : res.json(r));
});
app.post('/api/catalogos/diagnostico', (req, res) => {
    const { otb_id, problema_id, prioridad } = req.body;
    db.query("SELECT * FROM diagnostico_otb WHERE otb_id = ? AND problema_id = ?", [otb_id, problema_id], (err, r) => {
        if (err) return res.status(500).send(err);
        if (r.length > 0) return res.status(400).json({ message: "Ya asignado" });
        db.query("INSERT INTO diagnostico_otb (otb_id, problema_id, prioridad) VALUES (?, ?, ?)", [otb_id, problema_id, prioridad], (err2) => err2 ? res.status(500).send(err2) : res.json({ message: "Asignado" }));
    });
});
app.put('/api/catalogos/diagnostico/:id', (req, res) => {
    const { otb_id, problema_id, prioridad } = req.body;
    db.query("UPDATE diagnostico_otb SET otb_id = ?, problema_id = ?, prioridad = ? WHERE id = ?", [otb_id, problema_id, prioridad, req.params.id], (err) => err ? res.status(500).send(err) : res.json({ message: "Actualizado" }));
});
app.delete('/api/catalogos/diagnostico/:id', (req, res) => {
    db.query("DELETE FROM diagnostico_otb WHERE id = ?", [req.params.id], (err) => err ? res.status(500).send(err) : res.json({ message: "Eliminado" }));
});

app.listen(PORT, () => console.log(`🚀 Server en http://localhost:${PORT}`));