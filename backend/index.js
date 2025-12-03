const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const { llamarModeloIA, ARQUETIPOS } = require('./helpers/ia');
const { generarFodaCandidato } = require('./helpers/iaFoda');


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
    if (candidatos.length === 0) return res.json({ resultados: [] });

    const resultados = candidatos
      .map(c => {
        const promedio = (
          c.habilidad_crisis +
          c.habilidad_dialogo +
          c.habilidad_tecnica +
          c.habilidad_comunicacion +
          c.habilidad_influencia +
          c.habilidad_reputacion +
          c.habilidad_leyes
        ) / 7;

        return { ...c, score: Number(promedio.toFixed(2)) };
      })
      .sort((a, b) => b.score - a.score);

    res.json({
      titulo: "Ranking integral de candidatos para la Alcaldía de Cochabamba",
      resultados
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
app.get('/api/candidatos/:id/foda', (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT id, nombre, sigla
    FROM candidatos
    WHERE id = ?
  `;

  db.query(sql, [id], async (err, rows) => {
    if (err) return res.status(500).send(err);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Candidato no encontrado" });
    }

    const cand = rows[0];

    try {
      const resultadoFoda = await generarFodaCandidato(cand.nombre, cand.sigla);
      res.json(resultadoFoda);
    } catch (e) {
      console.error("❌ Error generando FODA:", e);
      res.status(500).json({ message: "Error al generar FODA" });
    }
  });
});


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

app.listen(PORT, () => console.log(`🚀 Server en http://localhost:${PORT}`));