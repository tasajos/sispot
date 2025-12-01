// helpers/ia.js
const OpenAI = require("openai");
const fetch = require("node-fetch"); // si no lo tienes aún en este archivo


// 🔑 Cliente OpenAI (puede ser null si no hay API key)
const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
const openai = hasOpenAIKey ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_SEARCH_CX = process.env.GOOGLE_SEARCH_CX;

console.log(hasOpenAIKey ? "✅ OPENAI_API_KEY detectada." : "⚠️ No hay OPENAI_API_KEY. Se usará solo modelo local.");

const CAMPOS_HABILIDADES = [
  "habilidad_crisis",
  "habilidad_dialogo",
  "habilidad_tecnica",
  "habilidad_comunicacion",
  "habilidad_influencia",
  "habilidad_reputacion",
  "habilidad_leyes"
];

const MAX_PUNTOS = 10;

// 🔹 Arquetipos que usas en el sistema
const ARQUETIPOS = {
  tecnico_gestor: {
    nombre: "Técnico gestor",
    descripcion: "Perfil orientado a la gestión municipal, planificación y servicios.",
    habilidades: {
      habilidad_crisis: 1,
      habilidad_dialogo: 1,
      habilidad_tecnica: 3,
      habilidad_comunicacion: 1,
      habilidad_influencia: 1,
      habilidad_reputacion: 2,
      habilidad_leyes: 1
    }
  },
  comunicador_carisma: {
    nombre: "Comunicador carismático",
    descripcion: "Fuerte en comunicación pública, redes y narrativa política.",
    habilidades: {
      habilidad_crisis: 1,
      habilidad_dialogo: 2,
      habilidad_tecnica: 1,
      habilidad_comunicacion: 3,
      habilidad_influencia: 2,
      habilidad_reputacion: 1,
      habilidad_leyes: 0
    }
  },
  lider_vecinal: {
    nombre: "Líder vecinal territorial",
    descripcion: "Con raíz barrial, contacto directo con OTBs y organizaciones.",
    habilidades: {
      habilidad_crisis: 1,
      habilidad_dialogo: 2,
      habilidad_tecnica: 1,
      habilidad_comunicacion: 1,
      habilidad_influencia: 3,
      habilidad_reputacion: 2,
      habilidad_leyes: 0
    }
  },
  negociador_sindical: {
    nombre: "Negociador sindical",
    descripcion: "Fuerte para pactar con gremios, sindicatos y funcionarios.",
    habilidades: {
      habilidad_crisis: 1,
      habilidad_dialogo: 3,
      habilidad_tecnica: 1,
      habilidad_comunicacion: 1,
      habilidad_influencia: 2,
      habilidad_reputacion: 1,
      habilidad_leyes: 1
    }
  },
  renovador_etico: {
    nombre: "Renovador ético",
    descripcion: "Enfatiza transparencia, lucha contra la corrupción y confianza ciudadana.",
    habilidades: {
      habilidad_crisis: 1,
      habilidad_dialogo: 1,
      habilidad_tecnica: 1,
      habilidad_comunicacion: 1,
      habilidad_influencia: 1,
      habilidad_reputacion: 4,
      habilidad_leyes: 1
    }
  },
  gestor_crisis: {
    nombre: "Gestor de crisis",
    descripcion: "Preparado para conflictos, desastres y momentos de alta presión.",
    habilidades: {
      habilidad_crisis: 3,
      habilidad_dialogo: 2,
      habilidad_tecnica: 1,
      habilidad_comunicacion: 2,
      habilidad_influencia: 1,
      habilidad_reputacion: 1,
      habilidad_leyes: 0
    }
  },
  jurista_normativo: {
    nombre: "Jurista normativo",
    descripcion: "Experto en normativa municipal, autonomías y marcos legales.",
    habilidades: {
      habilidad_crisis: 0,
      habilidad_dialogo: 1,
      habilidad_tecnica: 2,
      habilidad_comunicacion: 1,
      habilidad_influencia: 1,
      habilidad_reputacion: 1,
      habilidad_leyes: 4
    }
  }
};

// 🔁 Normaliza para que sumen EXACTAMENTE 10 puntos
function normalizarHabilidades(habilidadesRaw) {
  let suma = 0;
  const habilidades = {};

  for (const campo of CAMPOS_HABILIDADES) {
    let v = Number(habilidadesRaw[campo] ?? 0);
    if (!Number.isFinite(v) || v < 0) v = 0;
    habilidades[campo] = v;
    suma += v;
  }

  if (suma === 0) {
    // Fallback neutro pero válido
    return {
      habilidad_crisis: 1,
      habilidad_dialogo: 2,
      habilidad_tecnica: 2,
      habilidad_comunicacion: 2,
      habilidad_influencia: 1,
      habilidad_reputacion: 1,
      habilidad_leyes: 1
    };
  }

  if (suma !== MAX_PUNTOS) {
    const factor = MAX_PUNTOS / suma;
    let nuevaSuma = 0;

    for (const campo of CAMPOS_HABILIDADES) {
      let v = Math.round(habilidades[campo] * factor);
      if (v < 0) v = 0;
      habilidades[campo] = v;
      nuevaSuma += v;
    }

    // Ajuste fino por redondeo
    while (nuevaSuma > MAX_PUNTOS) {
      const campoMax = CAMPOS_HABILIDADES.reduce((acc, c) =>
        habilidades[c] > habilidades[acc] ? c : acc,
      CAMPOS_HABILIDADES[0]);
      if (habilidades[campoMax] > 0) {
        habilidades[campoMax]--;
        nuevaSuma--;
      } else break;
    }

    while (nuevaSuma < MAX_PUNTOS) {
      const campoMin = CAMPOS_HABILIDADES.reduce((acc, c) =>
        habilidades[c] < habilidades[acc] ? c : acc,
      CAMPOS_HABILIDADES[0]);
      habilidades[campoMin]++;
      nuevaSuma++;
    }
  }

  return habilidades;
}

async function buscarInfoEnWeb(nombre) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;

  if (!apiKey || !cx) {
    console.warn("⚠️ Sin GOOGLE_SEARCH_API_KEY o GOOGLE_SEARCH_CX, no se hace búsqueda web.");
    return null;
  }

  const base = `"${nombre}"`;

  const queries = [
    `${base} historia`,
    `${base} biografia`,
    `${base} perfil`,
    `${base} Cochabamba`,
    `${base} bomberos`,
    `${base} elecciones`,
    `${base} site:http://facebook.com`,
    `${base} site:http://youtube.com`,
    `${base} site:http://x.com`,
    `${base} site:http://lostiempos.com`,
    base
  ];

  const resultadosMap = new Map();

  for (const q of queries) {
    const url =
      `https://customsearch.googleapis.com/customsearch/v1` +
      `?key=${encodeURIComponent(apiKey)}` +
      `&cx=${encodeURIComponent(cx)}` +
       `&q=${encodeURIComponent(q)}` ;
      

    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        const texto = await resp.text();
        console.error("❌ Error HTTP en búsqueda web:", resp.status, texto);
        continue;
      }

      const data = await resp.json();

      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        console.log(`ℹ️ Sin resultados para query: "${q}"`);
        continue;
      }

      console.log(`🌐 Resultados encontrados para "${q}"`);

      data.items.slice(0, 10).forEach((item) => {
        if (!resultadosMap.has(item.link)) {
          resultadosMap.set(item.link, {
            titulo: item.title,
            link: item.link,
            snippet: item.snippet,
            fuente: item.displayLink,
          });
        }
      });
    } catch (err) {
      console.error("❌ Error de red en búsqueda web:", err);
    }
  }

  const resultados = Array.from(resultadosMap.values());
  if (resultados.length === 0) return null;

  const resumenTexto = resultados
    .slice(0, 10)
    .map(
      (r, idx) =>
        `[${idx + 1}] ${r.titulo} (${r.fuente})\n${r.snippet}\nURL: ${r.link}`
    )
    .join("\n\n");

  return {
    bruto: resultados,   // 👉 lista para el frontend
    resumen: resumenTexto,
  };
}


// 🧩 Fallback puramente local (sin IA) pero coherente
function generarHabilidadesLocal() {
  // Aquí puedes hacer lógica más elaborada si quieres.
  // Por ahora, un reparto razonable fijo:
  return {
    habilidad_crisis: 2,
    habilidad_dialogo: 2,
    habilidad_tecnica: 2,
    habilidad_comunicacion: 2,
    habilidad_influencia: 1,
    habilidad_reputacion: 1,
    habilidad_leyes: 0
  };
}

/**
 * Llama a OpenAI si hay API key, sino usa fallback local.
 * Devuelve SIEMPRE:
 * {
 *   habilidades: { ...7 campos... },
 *   fuente: 'openai' | 'fallback_local',
 *   motivo?: string
 * }
 */
async function llamarModeloIA(nombre, sigla) {
  if (!openai) {
    console.warn("⚠️ Sin cliente OpenAI. Usando modelo local.");
    return {
      habilidades: generarHabilidadesLocal(),
      fuente: "fallback_local",
      motivo: "no_openai_key",
      descripcionIA: "Perfil generado localmente sin IA externa.",
      historia: "",
      arquetipo_id: "tecnico_gestor",
      contextoWeb: null,
      webResumen: null,
      webResultados: [],
    };
  }

  const infoWeb = await buscarInfoEnWeb(nombre);
  const contextoWeb = infoWeb?.resumen || null;
  const webResultados = infoWeb?.bruto || [];

  const descripcionArquetipos = `
Arquetipos disponibles (elige SOLO UNO usando el id):

- tecnico_gestor: perfil orientado a la gestión municipal, planificación y servicios.
- comunicador_carisma: fuerte en comunicación pública, redes y narrativa política.
- lider_vecinal: raíz barrial, contacto directo con OTBs y organizaciones.
- negociador_sindical: fuerte para pactar con gremios, sindicatos y funcionarios.
- renovador_etico: enfatiza transparencia, lucha contra la corrupción y confianza ciudadana.
- gestor_crisis: preparado para conflictos, desastres y alta presión.
- jurista_normativo: experto en normativa municipal, autonomías y marcos legales.
`;

  const prompt = `
Eres un analista político de elecciones municipales en Cochabamba (Bolivia).

Datos:
- Candidato: ${nombre || "Desconocido"} (${sigla || "N/A"})
- Información obtenida desde la web (si existe):

${contextoWeb || "(Sin información relevante encontrada en la web.)"}

Tareas:

1) Asigna EXACTAMENTE 10 puntos enteros en estas habilidades (0-10, suma total = 10):
   - habilidad_crisis
   - habilidad_dialogo
   - habilidad_tecnica
   - habilidad_comunicacion
   - habilidad_influencia
   - habilidad_reputacion
   - habilidad_leyes

2) Escribe una **descripción_perfil**: un párrafo corto con las fortalezas del candidato para gobernar (perfil político).

3) Escribe un campo "biografia":
   - SOLO si en la información de la web hay datos concretos (cargos reales, grupos, etc.).
   - Si NO hay datos fiables, escribe exactamente:
     "No se encontró información biográfica suficiente del candidato en las fuentes consultadas."
   - No inventes fechas, títulos universitarios, ni detalles personales que no aparezcan en las fuentes.

4) Elige el arquetipo que mejor encaje, usando SOLO uno de estos ids:
   tecnico_gestor, comunicador_carisma, lider_vecinal, negociador_sindical,
   renovador_etico, gestor_crisis, jurista_normativo.

${descripcionArquetipos}

Responde SOLO con un JSON válido, sin texto adicional. Formato:

{
  "habilidad_crisis": 2,
  "habilidad_dialogo": 1,
  "habilidad_tecnica": 2,
  "habilidad_comunicacion": 2,
  "habilidad_influencia": 1,
  "habilidad_reputacion": 1,
  "habilidad_leyes": 1,
  "descripcion_perfil": "Texto del perfil político y fortalezas...",
  "biografia": "Solo biografía o el mensaje estándar si no hay información...",
  "arquetipo_sugerido": "tecnico_gestor"
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "Eres un analista político en Bolivia. Debes responder ÚNICAMENTE con un JSON válido y NO inventar biografías.",
        },
        { role: "user", content: prompt },
      ],
    });

    let text = completion.choices?.[0]?.message?.content?.trim() || "";
    console.log("🔎 Respuesta OpenAI (texto bruto):", text);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error("❌ No se pudo parsear JSON de OpenAI, usando fallback local.");
      return {
        habilidades: generarHabilidadesLocal(),
        fuente: "fallback_local",
        motivo: "json_parse_error",
        descripcionIA: "Perfil generado localmente sin IA externa.",
        historia: "",
        arquetipo_id: "tecnico_gestor",
        contextoWeb,
        webResumen: contextoWeb,
        webResultados,
      };
    }

    const habilidades = normalizarHabilidades(parsed);

    return {
      habilidades,
      fuente: "openai",
      descripcionIA: parsed.descripcion_perfil || "",
      historia: parsed.biografia || "",
      arquetipo_id: parsed.arquetipo_sugerido || null,
      contextoWeb,
      webResumen: infoWeb?.resumen || "",
      webResultados: infoWeb?.bruto || [],
    };
  } catch (err) {
    console.error("❌ Error llamando a OpenAI:", err);
    return {
      habilidades: generarHabilidadesLocal(),
      fuente: "fallback_local",
      motivo: err.code || err.message || "openai_error",
      descripcionIA: "Perfil generado localmente sin IA externa.",
      historia: "",
      arquetipo_id: "tecnico_gestor",
      contextoWeb,
      webResumen: contextoWeb,
      webResultados,
    };
  }
}

module.exports = {
  llamarModeloIA,
  ARQUETIPOS,
};