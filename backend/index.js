const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const { llamarModeloIA, ARQUETIPOS } = require('./helpers/ia');
const { generarFodaCandidato } = require('./helpers/iaFoda');
const { analizarTodosLosDistritos } = require("./helpers/iaDistritos");
const { compararFodaConIA } = require("./helpers/iaFodaComparar");
const { analizarRedesConIA } = require("./helpers/iaRedesAnalisis");
const { calcEng, mode } = require("./helpers/redesPosicionamiento");

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



// Actualizar SOLO el estado de una actividad
app.put('/api/actividades/:id/estado', (req, res) => {
  const { estado } = req.body;
  db.query(
    "UPDATE actividades SET estado = ? WHERE id = ?",
    [estado, req.params.id],
    (err) => err ? res.status(500).send(err) : res.json({ message: "Estado actualizado" })
  );
});

// (Opcional) Actualizar toda la actividad
app.put('/api/actividades/:id', (req, res) => {
  const { titulo, descripcion, tipo, estado, fecha_evento, distrito, responsable } = req.body;
  const sql = `
    UPDATE actividades 
    SET titulo=?, descripcion=?, tipo=?, estado=?, fecha_evento=?, distrito=?, responsable=?
    WHERE id=?
  `;
  db.query(sql, [titulo, descripcion, tipo, estado, fecha_evento, distrito, responsable, req.params.id],
    (err) => err ? res.status(500).send(err) : res.json({ message: "Actividad actualizada" })
  );
});


// POST /api/candidatos/foda-comparar
// body: { baseId: number, compareIds: number[] }
app.post("/api/candidatos/foda-comparar", (req, res) => {
  const { baseId, compareIds } = req.body;

  if (!baseId || !Array.isArray(compareIds)) {
    return res.status(400).json({ message: "baseId y compareIds[] son requeridos" });
  }

  const ids = [baseId, ...compareIds].map(Number).filter(Boolean);
  const placeholders = ids.map(() => "?").join(",");

  const sql = `
    SELECT id, nombre, sigla
    FROM candidatos
    WHERE id IN (${placeholders})
  `;

  db.query(sql, ids, async (err, rows) => {
    if (err) return res.status(500).send(err);

    const baseRow = rows.find((r) => Number(r.id) === Number(baseId));
    if (!baseRow) return res.status(404).json({ message: "Candidato base no encontrado" });

    const compRows = rows.filter((r) => Number(r.id) !== Number(baseId));
    if (!compRows.length) return res.status(400).json({ message: "No hay candidatos para comparar" });

    try {
      // Generar FODA para base y competidores (en paralelo)
      const baseFoda = await generarFodaCandidato(baseRow.nombre, baseRow.sigla);

      const compFodas = await Promise.all(
        compRows.map(async (c) => {
          const f = await generarFodaCandidato(c.nombre, c.sigla);
          return { candidato: c, ...f };
        })
      );

      const result = await compararFodaConIA(
        { candidato: baseRow, ...baseFoda },
        compFodas
      );

      res.json(result);
    } catch (e) {
      console.error("❌ Error comparando FODA:", e);
      res.status(500).json({ message: "Error al comparar FODA con IA" });
    }
  });
});

// Eliminar actividad
app.delete('/api/actividades/:id', (req, res) => {
  db.query("DELETE FROM actividades WHERE id = ?", [req.params.id],
    (err) => err ? res.status(500).send(err) : res.json({ message: "Actividad eliminada" })
  );
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


// Z. DASHBOARD RESUMEN
app.get('/api/dashboard/resumen', (req, res) => {
    // Consulta 1: Conteos Generales
    const sqlConteos = `
        SELECT 
            (SELECT COUNT(*) FROM subalcaldias) as total_subalcaldias,
            (SELECT COUNT(*) FROM distritos) as total_distritos,
            (SELECT COUNT(*) FROM otbs) as total_otbs
    `;

    // Consulta 2: Problemas por Área
    const sqlAreas = `
        SELECT a.nombre, a.icono, COUNT(p.id) as total_problemas 
        FROM areas_tematicas a 
        LEFT JOIN tipos_problema p ON a.id = p.area_id 
        GROUP BY a.id
    `;

    db.query(sqlConteos, (err, resultConteos) => {
        if (err) return res.status(500).send(err);
        
        db.query(sqlAreas, (err2, resultAreas) => {
            if (err2) return res.status(500).send(err2);
            
            res.json({
                resumen: resultConteos[0],
                areas: resultAreas
            });
        });
    });
});







// Z. DASHBOARD COMPLETO
app.get('/api/dashboard/data', (req, res) => {
    
    // 1. Contadores Generales (KPIs)
    const sqlConteos = `
        SELECT 
            (SELECT COUNT(*) FROM subalcaldias) as total_subalcaldias,
            (SELECT COUNT(*) FROM distritos) as total_distritos,
            (SELECT COUNT(*) FROM otbs) as total_otbs
    `;

    // 2. Problemas Identificados (Diagnósticos con toda la jerarquía)
    const sqlProblemas = `
        SELECT 
            diag.id, diag.prioridad, 
            p.nombre as problema, 
            a.nombre as area, 
            o.nombre as otb, 
            d.nombre as distrito, 
            s.nombre as subalcaldia, s.responsable as subalcalde
        FROM diagnostico_otb diag
        JOIN tipos_problema p ON diag.problema_id = p.id
        JOIN areas_tematicas a ON p.area_id = a.id
        JOIN otbs o ON diag.otb_id = o.id
        JOIN distritos d ON o.distrito_id = d.id
        LEFT JOIN subalcaldias s ON d.subalcaldia_id = s.id
        ORDER BY diag.id DESC
    `;

    db.query(sqlConteos, (err, resultConteos) => {
        if (err) return res.status(500).send(err);
        
        db.query(sqlProblemas, (err2, resultProblemas) => {
            if (err2) return res.status(500).send(err2);
            
            res.json({
                resumen: resultConteos[0],
                problemas: resultProblemas
            });
        });
    });
});


// LISTAR CANDIDATOS
app.get('/api/candidatos', (req, res) => {
  const sql = `
    SELECT id, nombre, sigla,
           habilidad_crisis,
           habilidad_dialogo,
           habilidad_tecnica,
           habilidad_comunicacion,
           habilidad_influencia,
           habilidad_reputacion,
           habilidad_leyes,
           habilidades_texto
    FROM candidatos
    ORDER BY nombre ASC
  `;
    db.query(sql, (err, r) => err ? res.status(500).send(err) : res.json(r));
});

// REGISTRAR CANDIDATO
app.post('/api/candidatos', (req, res) => {
    const {
        nombre,
        sigla,
        habilidad_crisis,
        habilidad_dialogo,
        habilidad_tecnica,
        habilidad_comunicacion,
        habilidad_influencia,
        habilidad_reputacion,
        habilidad_leyes,
        habilidades_texto
    } = req.body;

    const sql = `
     INSERT INTO candidatos
  (nombre, sigla,
   habilidad_crisis, habilidad_dialogo, habilidad_tecnica, habilidad_comunicacion,
   habilidad_influencia, habilidad_reputacion, habilidad_leyes,
   habilidades_texto)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

   db.query(sql, [
  nombre,
  sigla,
  habilidad_crisis,
  habilidad_dialogo,
  habilidad_tecnica,
  habilidad_comunicacion,
  habilidad_influencia,
  habilidad_reputacion,
  habilidad_leyes,
  habilidades_texto || null
], (err, r) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "Candidato registrado", id: r.insertId });
    });
});

// (Opcional) ELIMINAR CANDIDATO
app.delete('/api/candidatos/:id', (req, res) => {
    db.query("DELETE FROM candidatos WHERE id = ?", [req.params.id],
        (err) => err ? res.status(500).send(err) : res.json({ message: "Candidato eliminado" })
    );
});


// -------- SIMULACIÓN DE TOMA DE DECISIONES --------

// Mapa de escenarios y ponderaciones de habilidades
const ESCENARIOS = {
  manifestacion: {
    nombre: "Manifestación vecinal",
    pesos: {
      habilidad_crisis: 0.2,
      habilidad_dialogo: 0.2,
      habilidad_tecnica: 0.0,
      habilidad_comunicacion: 0.2,
      habilidad_influencia: 0.25,
      habilidad_reputacion: 0.15,
      habilidad_leyes: 0.0
    }
  },
  huelga: {
    nombre: "Huelga de trabajadores municipales",
    pesos: {
      habilidad_crisis: 0.1,
      habilidad_dialogo: 0.3,
      habilidad_tecnica: 0.1,
      habilidad_comunicacion: 0.1,
      habilidad_influencia: 0.2,
      habilidad_reputacion: 0.1,
      habilidad_leyes: 0.1
    }
  },
  desastre: {
    nombre: "Desastre natural / inundación",
    pesos: {
      habilidad_crisis: 0.3,
      habilidad_dialogo: 0.05,
      habilidad_tecnica: 0.25,
      habilidad_comunicacion: 0.1,
      habilidad_influencia: 0.1,
      habilidad_reputacion: 0.05,
      habilidad_leyes: 0.15
    }
  }
};

// SIMULAR TOMA DE DECISIONES EN UN ESCENARIO
app.post('/api/candidatos/simular-decision', (req, res) => {
  const { escenario } = req.body;

  if (!ESCENARIOS[escenario]) {
    return res.status(400).json({ message: "Escenario no válido" });
  }

  const { pesos, nombre } = ESCENARIOS[escenario];

  const sql = `
    SELECT id, nombre, sigla,
           habilidad_crisis,
           habilidad_dialogo,
           habilidad_tecnica,
           habilidad_comunicacion,
           habilidad_influencia,
           habilidad_reputacion,
           habilidad_leyes
    FROM candidatos
  `;

  db.query(sql, (err, candidatos) => {
    if (err) return res.status(500).send(err);
    if (candidatos.length === 0) {
      return res.json({ escenario: nombre, resultados: [] });
    }

    const resultados = candidatos
      .map(c => {
        const score =
          c.habilidad_crisis       * pesos.habilidad_crisis +
          c.habilidad_dialogo      * pesos.habilidad_dialogo +
          c.habilidad_tecnica      * pesos.habilidad_tecnica +
          c.habilidad_comunicacion * pesos.habilidad_comunicacion +
          c.habilidad_influencia   * pesos.habilidad_influencia +
          c.habilidad_reputacion   * pesos.habilidad_reputacion +
          c.habilidad_leyes        * pesos.habilidad_leyes;

        return { ...c, score: Number(score.toFixed(2)) };
      })
      .sort((a, b) => b.score - a.score);

    res.json({ escenario: nombre, resultados });
  });
});

// -------- SIMULACIÓN DE MEJOR CANDIDATO PARA ALCALDÍA --------

app.get('/api/candidatos/simular-mejor', (req, res) => {
  const sql = `
    SELECT id, nombre, sigla,
           habilidad_crisis,
           habilidad_dialogo,
           habilidad_tecnica,
           habilidad_comunicacion,
           habilidad_influencia,
           habilidad_reputacion,
           habilidad_leyes
    FROM candidatos
  `;

  db.query(sql, (err, candidatos) => {
    if (err) return res.status(500).send(err);
    if (!candidatos || candidatos.length === 0) {
      return res.json({ titulo: "Ranking integral de candidatos para la Alcaldía de Cochabamba", resultados: [] });
    }

    // Pesos (ajustables)
    const PESOS = {
      habilidad_crisis: 1.2,
      habilidad_dialogo: 1.1,
      habilidad_tecnica: 1.4,
      habilidad_comunicacion: 1.3,
      habilidad_influencia: 1.2,
      habilidad_reputacion: 1.1,
      habilidad_leyes: 0.7,
    };

    const sumaPesos = Object.values(PESOS).reduce((a, b) => a + b, 0);

    const resultados = candidatos
      .map(c => {
        const crisis = Number(c.habilidad_crisis) || 0;
        const dialogo = Number(c.habilidad_dialogo) || 0;
        const tecnica = Number(c.habilidad_tecnica) || 0;
        const comunicacion = Number(c.habilidad_comunicacion) || 0;
        const influencia = Number(c.habilidad_influencia) || 0;
        const reputacion = Number(c.habilidad_reputacion) || 0;
        const leyes = Number(c.habilidad_leyes) || 0;

        const scoreRaw =
          crisis * PESOS.habilidad_crisis +
          dialogo * PESOS.habilidad_dialogo +
          tecnica * PESOS.habilidad_tecnica +
          comunicacion * PESOS.habilidad_comunicacion +
          influencia * PESOS.habilidad_influencia +
          reputacion * PESOS.habilidad_reputacion +
          leyes * PESOS.habilidad_leyes;

        // Normalizado (para que sea comparable)
        const score = scoreRaw / sumaPesos;

        return { ...c, score: Number(score.toFixed(2)) };
      })
      .sort((a, b) => b.score - a.score);

    res.json({
      titulo: "Ranking integral de candidatos para la Alcaldía de Cochabamba",
      resultados,
      pesos: PESOS // opcional, útil para debug/transparencia
    });
  });
});

// (Solo UNA vez) ELIMINAR CANDIDATO
app.delete('/api/candidatos/:id', (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM candidatos WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ message: "Candidato eliminado" });
  });
});

// -------- IA: DETECTAR ARQUETIPO + SUGERIR HABILIDADES --------

// Función auxiliar para detectar arquetipo más cercano
function detectarArquetipo(habilidades, arquetipo_id) {
  // Si la IA ya sugirió uno y existe en nuestro mapa, usamos ese
  if (arquetipo_id && ARQUETIPOS[arquetipo_id]) {
    const a = ARQUETIPOS[arquetipo_id];
    const descripcionExtendida =
      `Arquetipo sugerido: ${a.nombre}. ${a.descripcion}. ` +
      `Puntos teóricos del arquetipo: ${JSON.stringify(a.habilidades)}`;

    return {
      id: arquetipo_id,
      nombre: a.nombre,
      descripcion: a.descripcion,
      descripcionExtendida,
    };
  }

  // Si no hay sugerido, calculamos el más cercano
  if (!habilidades || typeof habilidades !== "object") {
    console.warn(
      "⚠️ detectarArquetipo llamado sin habilidades válidas, devolviendo null"
    );
    return null;
  }

  if (!ARQUETIPOS || typeof ARQUETIPOS !== "object") {
    console.warn("⚠️ ARQUETIPOS no definido o inválido");
    return null;
  }

  const nombresArquetipos = Object.keys(ARQUETIPOS);
  if (!nombresArquetipos.length) {
    console.warn("⚠️ ARQUETIPOS está vacío");
    return null;
  }

  let mejorId = null;
  let mejorDistancia = Infinity;

  for (const id of nombresArquetipos) {
    const arq = ARQUETIPOS[id];
    if (!arq || !arq.habilidades) continue;

    const base = arq.habilidades;
    let dist = 0;

    for (const campo of [
      "habilidad_crisis",
      "habilidad_dialogo",
      "habilidad_tecnica",
      "habilidad_comunicacion",
      "habilidad_influencia",
      "habilidad_reputacion",
      "habilidad_leyes",
    ]) {
      const vC = Number((habilidades && habilidades[campo]) || 0);
      const vB = Number((base && base[campo]) || 0);
      dist += Math.abs(vC - vB);
    }

    if (dist < mejorDistancia) {
      mejorDistancia = dist;
      mejorId = id;
    }
  }

  if (!mejorId) return null;

  const arq = ARQUETIPOS[mejorId];
  const descripcionExtendida =
    `Arquetipo sugerido (por proximidad): ${arq.nombre}. ${arq.descripcion}. ` +
    `Puntos teóricos del arquetipo: ${JSON.stringify(arq.habilidades)}`;

  return {
    id: mejorId,
    nombre: arq.nombre,
    descripcion: arq.descripcion,
    descripcionExtendida,
  };
}

// IA: sugerir habilidades + arquetipo
app.post("/api/candidatos/sugerir-habilidades", async (req, res) => {
  const { nombre, sigla } = req.body;

  try {
    const {
      habilidades,
      fuente,
      descripcionIA,
      historia,       // 👈 añadimos historia
      arquetipo_id,
      webResumen,
      webResultados,
      confianza,
      justificacion,
      contextoWeb,
    } = await llamarModeloIA(nombre, sigla);

    const arquetipo = detectarArquetipo(habilidades, arquetipo_id);

    res.json({
      ok: true,
      habilidades,
      arquetipo,
      fuente,        // 'openai' o 'fallback_local'
      descripcionIA, // fortalezas / perfil político
      historia,      // 👈 biografía limpia
      contextoWeb,   // resumen de Google
      webResumen,
      confianza,
      justificacion,
      webResultados,
    });
  } catch (err) {
    console.error("❌ Error en /api/candidatos/sugerir-habilidades:", err);
    res
      .status(500)
      .json({ ok: false, message: "Error al generar sugerencia con IA" });
  }
});


// --- FODA IA por candidato ---



// 🔍 FODA IA POR CANDIDATO
app.get('/api/candidatos/:id/foda', (req, res) => {
  const { id } = req.params;

  db.query(
    'SELECT id, nombre, sigla FROM candidatos WHERE id = ?',
    [id],
    async (err, rows) => {
      if (err) return res.status(500).send(err);
      if (!rows.length) {
        return res.status(404).json({ message: 'Candidato no encontrado' });
      }

      const candidato = rows[0];

      try {
        const analisis = await generarFodaCandidato(
          candidato.nombre,
          candidato.sigla
        );

        res.json({
          candidato,
          ...analisis,
        });
      } catch (e) {
        console.error('❌ Error generando FODA candidato:', e);
        res
          .status(500)
          .json({ message: 'Error al generar análisis FODA con IA' });
      }
    }
  );
});



// 🔍 Análisis de distritos con IA usando SOLO los 15 "Distrito X"
app.get("/api/analisis-distritos", (req, res) => {
  const sql = `
    SELECT 
      MIN(d.id) AS id,                           -- id representativo
      d.nombre       AS nombre_distrito,
      d.subalcaldia_id,
      s.nombre       AS nombre_subalcaldia
    FROM distritos d
    LEFT JOIN subalcaldias s ON d.subalcaldia_id = s.id
    -- Solo filas cuyo nombre sea "Distrito X"
    WHERE d.nombre LIKE 'Distrito %'
    GROUP BY d.nombre, d.subalcaldia_id, s.nombre
    -- Ordenar por el número que está en el nombre: "Distrito 1", "Distrito 2", ...
    ORDER BY CAST(SUBSTRING(d.nombre, 10) AS UNSIGNED)
  `;

  db.query(sql, async (err, rows) => {
    if (err) {
      console.error("❌ Error leyendo distritos:", err);
      return res.status(500).send(err);
    }

    try {
      const data = await analizarTodosLosDistritos(rows); // 👈 le pasamos la lista
      res.json(data);
    } catch (e) {
      console.error("❌ Error en /api/analisis-distritos:", e);
      res
        .status(500)
        .json({ error: "Error generando análisis de distritos" });
    }
  });
});

//analisis redes

app.post("/api/candidatos/redes-analisis", (req, res) => {
  const { baseId, compareIds = [] } = req.body;

  if (!baseId) {
    return res.status(400).json({ message: "baseId es requerido" });
  }

  const ids = [baseId, ...compareIds].map(Number).filter(Boolean);
  const placeholders = ids.map(() => "?").join(",");

  const sql = `
    SELECT id, nombre, sigla
    FROM candidatos
    WHERE id IN (${placeholders})
  `;

  db.query(sql, ids, async (err, rows) => {
    if (err) return res.status(500).send(err);

    const baseRow = rows.find((r) => Number(r.id) === Number(baseId));
    if (!baseRow) {
      return res.status(404).json({ message: "Candidato base no encontrado" });
    }

    const compRows = rows.filter((r) => Number(r.id) !== Number(baseId));

    try {
      const result = await analizarRedesConIA(baseRow, compRows);
      res.json(result);
    } catch (e) {
      console.error("❌ Error analizando redes:", e);
      res.status(500).json({ message: "Error al generar análisis de redes con IA" });
    }
  });
});


// body: { basePageId, comparePageIds: [..], days: 30 }
app.post("/api/redes/posicionamiento", async (req, res) => {
  try {
    const { basePageId, comparePageIds = [], days = 30 } = req.body || {};
    if (!basePageId) return res.status(400).json({ error: "basePageId requerido" });

    const ids = [Number(basePageId), ...comparePageIds.map(Number)].filter(Boolean);
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    const sinceStr = since.toISOString().slice(0, 19).replace("T", " ");

    // 1) páginas
    const [paginas] = await db.promise().query(
      `SELECT * FROM redes_paginas WHERE id IN (${ids.map(() => "?").join(",")})`,
      ids
    );

    // 2) posts del periodo
    const [posts] = await db.promise().query(
      `SELECT * FROM redes_posts
       WHERE pagina_id IN (${ids.map(() => "?").join(",")})
         AND (publicado_en IS NULL OR publicado_en >= ?)
       ORDER BY capturado_en DESC`,
      [...ids, sinceStr]
    );

    // 3) snapshot seguidores (último disponible)
    const [snaps] = await db.promise().query(
      `SELECT s.*
       FROM redes_snapshot_pagina s
       JOIN (
         SELECT pagina_id, MAX(fecha) AS max_fecha
         FROM redes_snapshot_pagina
         WHERE pagina_id IN (${ids.map(() => "?").join(",")})
         GROUP BY pagina_id
       ) t ON t.pagina_id = s.pagina_id AND t.max_fecha = s.fecha`,
      ids
    );

    const snapByPage = Object.fromEntries(snaps.map(s => [s.pagina_id, s]));

    const group = {};
    for (const p of posts) {
      const pid = p.pagina_id;
      if (!group[pid]) group[pid] = [];
      group[pid].push(p);
    }

    const resumen = paginas.map(pg => {
      const arr = group[pg.id] || [];
      const engs = arr.map(a => calcEng(a));
      const engTotal = engs.reduce((a,b) => a+b, 0);
      const engAvg = arr.length ? Math.round(engTotal / arr.length) : 0;
      const tipoDom = arr.length ? mode(arr.map(x => x.tipo || "otro")) : "otro";

      const seguidores = snapByPage[pg.id]?.seguidores ?? null;
      const engRate = (seguidores && seguidores > 0) ? +(engTotal / seguidores).toFixed(4) : null;

      const topPosts = arr
        .map(x => ({ ...x, engagement: calcEng(x) }))
        .sort((a,b) => b.engagement - a.engagement)
        .slice(0, 10);

      return {
        pagina: pg,
        periodo_dias: Number(days),
        posts: arr.length,
        engagement_total: engTotal,
        engagement_promedio: engAvg,
        engagement_rate: engRate,
        tipo_dominante: tipoDom,
        seguidores,
        top_posts: topPosts
      };
    });

    // ranking simple
    const rankingEng = [...resumen].sort((a,b) => b.engagement_total - a.engagement_total)
      .map(x => ({ pagina: x.pagina.nombre, engagement_total: x.engagement_total }));

    const rankingRate = [...resumen]
      .filter(x => x.engagement_rate !== null)
      .sort((a,b) => b.engagement_rate - a.engagement_rate)
      .map(x => ({ pagina: x.pagina.nombre, engagement_rate: x.engagement_rate }));

    return res.json({
      modo: "sin_ia",
      basePageId: Number(basePageId),
      comparePageIds: comparePageIds.map(Number),
      resumen,
      comparacion: { ranking_engagement_total: rankingEng, ranking_engagement_rate: rankingRate }
    });
  } catch (err) {
    console.error("❌ /api/redes/posicionamiento", err);
    res.status(500).json({ error: "Error interno", detalle: String(err?.message || err) });
  }
});

// listar páginas
app.get("/api/redes/paginas", async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT * FROM redes_paginas WHERE activo=1 ORDER BY id DESC"
    );
    res.json(rows);
  } catch (e) {
    console.error("❌ GET /api/redes/paginas", e);
    res.status(500).json({ error: "Error interno" });
  }
});

// crear página
app.post("/api/redes/paginas", async (req, res) => {
  try {
    const p = req.body || {};
    if (!p.nombre || !p.url) return res.status(400).json({ error: "nombre y url son requeridos" });

    const plataforma = p.plataforma || "facebook";
    const categoria = p.categoria || null;
    const es_admin = p.es_admin ? 1 : 0;

    const [r] = await db.promise().query(
      `INSERT INTO redes_paginas (nombre, plataforma, url, categoria, es_admin)
       VALUES (?, ?, ?, ?, ?)`,
      [p.nombre, plataforma, p.url, categoria, es_admin]
    );

    res.json({ ok: true, id: r.insertId });
  } catch (e) {
    console.error("❌ POST /api/redes/paginas", e);
    res.status(500).json({ error: "Error interno" });
  }
});


/* =========================
   POSTS (CAPTURAS MANUALES)
========================= */

// crear post/captura
app.post("/api/redes/posts", async (req, res) => {
  try {
    const p = req.body || {};
    if (!p.pagina_id || !p.post_url) {
      return res.status(400).json({ error: "pagina_id y post_url son requeridos" });
    }

    await db.promise().query(
      `INSERT INTO redes_posts
        (pagina_id, post_url, publicado_en, tipo, texto_corto, reacciones, comentarios, compartidos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(p.pagina_id),
        p.post_url,
        p.publicado_en || null,
        p.tipo || "otro",
        p.texto_corto || null,
        Number(p.reacciones || 0),
        Number(p.comentarios || 0),
        Number(p.compartidos || 0),
      ]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("❌ POST /api/redes/posts", e);
    res.status(500).json({ error: "Error interno" });
  }
});

// listar posts (por pagina)
app.get("/api/redes/posts", async (req, res) => {
  try {
    const paginaId = Number(req.query.paginaId || 0);
    const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);
    if (!paginaId) return res.status(400).json({ error: "paginaId requerido" });

    const [rows] = await db.promise().query(
      `SELECT * FROM redes_posts
       WHERE pagina_id=?
       ORDER BY COALESCE(publicado_en, capturado_en) DESC
       LIMIT ?`,
      [paginaId, limit]
    );
    res.json(rows);
  } catch (e) {
    console.error("❌ GET /api/redes/posts", e);
    res.status(500).json({ error: "Error interno" });
  }
});

// eliminar post
app.delete("/api/redes/posts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.promise().query("DELETE FROM redes_posts WHERE id=?", [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error("❌ DELETE /api/redes/posts/:id", e);
    res.status(500).json({ error: "Error interno" });
  }
});


/* =========================
   SNAPSHOT (SEGUIDORES)
========================= */

app.post("/api/redes/snapshot", async (req, res) => {
  try {
    const s = req.body || {};
    if (!s.pagina_id || !s.fecha) return res.status(400).json({ error: "pagina_id y fecha requeridos" });

    await db.promise().query(
      `INSERT INTO redes_snapshot_pagina (pagina_id, fecha, seguidores, me_gusta, notas)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE seguidores=VALUES(seguidores), me_gusta=VALUES(me_gusta), notas=VALUES(notas)`,
      [
        Number(s.pagina_id),
        s.fecha,
        s.seguidores ?? null,
        s.me_gusta ?? null,
        s.notas ?? null,
      ]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("❌ POST /api/redes/snapshot", e);
    res.status(500).json({ error: "Error interno" });
  }
});


/* =========================
   POSICIONAMIENTO (SIN IA)
========================= */
// body: { basePageId, comparePageIds:[], days:30 }
app.post("/api/redes/posicionamiento", async (req, res) => {
  try {
    const { basePageId, comparePageIds = [], days = 30 } = req.body || {};
    if (!basePageId) return res.status(400).json({ error: "basePageId requerido" });

    const ids = [Number(basePageId), ...comparePageIds.map(Number)].filter(Boolean);
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    const sinceStr = since.toISOString().slice(0, 19).replace("T", " ");

    // páginas
    const [paginas] = await db.promise().query(
      `SELECT * FROM redes_paginas WHERE id IN (${ids.map(() => "?").join(",")})`,
      ids
    );

    // posts del periodo
    const [posts] = await db.promise().query(
      `SELECT * FROM redes_posts
       WHERE pagina_id IN (${ids.map(() => "?").join(",")})
       AND (publicado_en IS NULL OR publicado_en >= ?)
       ORDER BY COALESCE(publicado_en, capturado_en) DESC`,
      [...ids, sinceStr]
    );

    // último snapshot por página
    const [snaps] = await db.promise().query(
      `SELECT s.*
       FROM redes_snapshot_pagina s
       JOIN (
         SELECT pagina_id, MAX(fecha) AS max_fecha
         FROM redes_snapshot_pagina
         WHERE pagina_id IN (${ids.map(() => "?").join(",")})
         GROUP BY pagina_id
       ) t ON t.pagina_id=s.pagina_id AND t.max_fecha=s.fecha`,
      ids
    );
    const snapByPage = Object.fromEntries(snaps.map(s => [s.pagina_id, s]));

    // agrupar posts
    const group = {};
    for (const p of posts) {
      if (!group[p.pagina_id]) group[p.pagina_id] = [];
      group[p.pagina_id].push(p);
    }

    const resumen = paginas.map(pg => {
      const arr = group[pg.id] || [];
      const engTotal = arr.reduce((acc, x) => acc + calcEng(x), 0);
      const engAvg = arr.length ? Math.round(engTotal / arr.length) : 0;
      const tipoDom = arr.length ? mode(arr.map(x => x.tipo || "otro")) : "otro";

      const seguidores = snapByPage[pg.id]?.seguidores ?? null;
      const engRate = (seguidores && seguidores > 0) ? +(engTotal / seguidores).toFixed(4) : null;

      const topPosts = arr
        .map(x => ({ ...x, engagement: calcEng(x) }))
        .sort((a,b) => b.engagement - a.engagement)
        .slice(0, 10);

      return {
        pagina: pg,
        periodo_dias: Number(days),
        posts: arr.length,
        engagement_total: engTotal,
        engagement_promedio: engAvg,
        engagement_rate: engRate,
        tipo_dominante: tipoDom,
        seguidores,
        top_posts: topPosts
      };
    });

    const rankingEng = [...resumen]
      .sort((a,b) => b.engagement_total - a.engagement_total)
      .map(x => ({ pagina: x.pagina.nombre, engagement_total: x.engagement_total }));

    const rankingRate = [...resumen]
      .filter(x => x.engagement_rate !== null)
      .sort((a,b) => b.engagement_rate - a.engagement_rate)
      .map(x => ({ pagina: x.pagina.nombre, engagement_rate: x.engagement_rate }));

    res.json({
      modo: "sin_ia",
      basePageId: Number(basePageId),
      comparePageIds: comparePageIds.map(Number),
      resumen,
      comparacion: {
        ranking_engagement_total: rankingEng,
        ranking_engagement_rate: rankingRate
      }
    });
  } catch (e) {
    console.error("❌ POST /api/redes/posicionamiento", e);
    res.status(500).json({ error: "Error interno", detalle: String(e?.message || e) });
  }
});


app.listen(PORT, () => console.log(`🚀 Server en http://localhost:${PORT}`));