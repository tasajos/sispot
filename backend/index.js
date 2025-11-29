const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
// Cargar variables de entorno al inicio
require('dotenv').config(); 

const app = express();

// Usamos el puerto definido en el .env (3310) o un default por si falla
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// --- 1. CONFIGURACIÓN DE LA BASE DE DATOS (Usando .env) ---
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT // Muy importante: aquí tomará el 3307
});

// Verificar conexión
db.connect((err) => {
    if (err) {
        console.error('❌ Error conectando a la Base de Datos:', err.code);
        console.error('Mensaje:', err.sqlMessage);
        return;
    }
    console.log(`✅ Conectado a la BD '${process.env.DB_NAME}' en el puerto ${process.env.DB_PORT}`);
});

// --- 2. RUTAS DE LA API ---

// 1. LOGIN: Verificar credenciales
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    // Buscar usuario por email
    const sql = "SELECT * FROM usuarios WHERE email = ?";
    db.query(sql, [email], (err, result) => {
        if (err) return res.status(500).send(err);
        
        // Si no existe el usuario
        if (result.length === 0) {
            return res.status(401).json({ message: "Usuario no encontrado" });
        }

        const usuario = result[0];

        // Verificar contraseña (SIMPLE para este ejemplo, en real usar bcrypt)
        if (password === usuario.password) {
            // ¡Login exitoso! Devolvemos los datos del usuario (sin el password)
            const { password, ...datosUsuario } = usuario;
            res.json({ success: true, user: datosUsuario });
        } else {
            res.status(401).json({ message: "Contraseña incorrecta" });
        }
    });
});

// 2. LISTAR USUARIOS (Solo para Admins - lo usaremos luego)
app.get('/api/usuarios', (req, res) => {
    const sql = "SELECT id, nombre, email, rol, cargo, telefono FROM usuarios";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});




// RUTA A: Actividades
app.get('/api/actividades', (req, res) => {
    const sql = "SELECT * FROM actividades ORDER BY fecha_evento ASC";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

// RUTA B: Crear Actividad
app.post('/api/actividades', (req, res) => {
    const { titulo, descripcion, tipo, estado, fecha_evento, distrito, responsable } = req.body;
    const sql = "INSERT INTO actividades (titulo, descripcion, tipo, estado, fecha_evento, distrito, responsable) VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    db.query(sql, [titulo, descripcion, tipo, estado, fecha_evento, distrito, responsable], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "Actividad creada", id: result.insertId });
    });
});

// RUTA C: Análisis Distritos
app.get('/api/analisis/distritos', (req, res) => {
    const sql = "SELECT distrito, AVG(intencion_voto) as promedio, AVG(sentimiento_redes) as sentimiento FROM metricas_intencion GROUP BY distrito";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});




// RUTA D: Competidores
app.get('/api/competidores', (req, res) => {
    const sql = "SELECT * FROM competidores";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});


// --- MÓDULO 2: CATÁLOGOS ---

// A. Obtener Distritos con cantidad de OTBs
app.get('/api/catalogos/distritos', (req, res) => {
    const sql = `
        SELECT d.*, COUNT(o.id) as total_otbs 
        FROM distritos d 
        LEFT JOIN otbs o ON d.id = o.distrito_id 
        GROUP BY d.id
    `;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

// B. Obtener OTBs (Opcional: filtrar por distrito)
app.get('/api/catalogos/otbs', (req, res) => {
    const sql = `
        SELECT o.id, o.nombre, d.nombre as distrito 
        FROM otbs o 
        JOIN distritos d ON o.distrito_id = d.id
        ORDER BY d.nombre, o.nombre
    `;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

// C. Obtener Áreas Temáticas y Problemas
app.get('/api/catalogos/areas', (req, res) => {
    const sql = "SELECT * FROM areas_tematicas";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

// D. CREAR NUEVO DISTRITO
app.post('/api/catalogos/distritos', (req, res) => {
    const { nombre, zona, poblacion_est } = req.body;
    
    // Validación básica
    if (!nombre || !zona) {
        return res.status(400).json({ message: "Nombre y Zona son obligatorios" });
    }

    const sql = "INSERT INTO distritos (nombre, zona, poblacion_est) VALUES (?, ?, ?)";
    db.query(sql, [nombre, zona, poblacion_est || 0], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "Distrito registrado correctamente", id: result.insertId });
    });
});

// E. CREAR NUEVA OTB (Asociada a Distrito)
app.post('/api/catalogos/otbs', (req, res) => {
    const { nombre, distrito_id } = req.body;
    if (!nombre || !distrito_id) {
        return res.status(400).json({ message: "Datos incompletos" });
    }
    const sql = "INSERT INTO otbs (nombre, distrito_id) VALUES (?, ?)";
    db.query(sql, [nombre, distrito_id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "OTB registrada correctamente", id: result.insertId });
    });
});

// F. CREAR TIPO DE PROBLEMA (Asociado a Área)
app.post('/api/catalogos/problemas', (req, res) => {
    const { nombre, area_id } = req.body;
    if (!nombre || !area_id) {
        return res.status(400).json({ message: "Datos incompletos" });
    }
    const sql = "INSERT INTO tipos_problema (nombre, area_id) VALUES (?, ?)";
    db.query(sql, [nombre, area_id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "Tipo de problema registrado", id: result.insertId });
    });
});

// G. EXTRA: OBTENER PROBLEMAS (Para verlos en la lista)
app.get('/api/catalogos/problemas', (req, res) => {
    const sql = `
        SELECT p.id, p.nombre, a.nombre as area 
        FROM tipos_problema p 
        JOIN areas_tematicas a ON p.area_id = a.id
    `;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

// H. ACTUALIZAR DISTRITO (PUT)
app.put('/api/catalogos/distritos/:id', (req, res) => {
    const { nombre, zona, poblacion_est } = req.body;
    const { id } = req.params;
    const sql = "UPDATE distritos SET nombre = ?, zona = ?, poblacion_est = ? WHERE id = ?";
    db.query(sql, [nombre, zona, poblacion_est, id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "Distrito actualizado" });
    });
});

// I. ELIMINAR DISTRITO (DELETE)
app.delete('/api/catalogos/distritos/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM distritos WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "Distrito eliminado" });
    });
});

// J. ELIMINAR OTB
app.delete('/api/catalogos/otbs/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM otbs WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "OTB eliminada" });
    });
});

// K. ELIMINAR PROBLEMA
app.delete('/api/catalogos/problemas/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM tipos_problema WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "Problema eliminado" });
    });
});


// --- 3. INICIAR SERVIDOR ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});