// frontend/src/components/Competidores.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Row, Col, Badge, ProgressBar, Modal, Button, Spinner , Tabs, Tab, Form, Table} from 'react-bootstrap';
import { User, ShieldAlert, TrendingDown, Target, Brain, Activity,Download,GitCompareArrows} from 'lucide-react';


import jsPDF from 'jspdf';
import './styles/competidores.css';

const Competidores = () => {
  const [candidatos, setCandidatos] = useState([]);
  const [showModalFoda, setShowModalFoda] = useState(false);
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState(null);
  const [fodaData, setFodaData] = useState(null);
  const [loadingFoda, setLoadingFoda] = useState(false);
  const [tabKey, setTabKey] = useState("foda");

  const [baseId, setBaseId] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [compareData, setCompareData] = useState(null);



  useEffect(() => {
    axios
      .get('http://localhost:3310/api/candidatos')
      .then((res) => setCandidatos(res.data))
      .catch((err) => console.error('Error cargando candidatos:', err));
  }, []);


  const exportarFodaPdf = () => {
  if (!candidatoSeleccionado || !fodaData) return;

  const doc = new jsPDF();
  let y = 10;

  // Título
  doc.setFontSize(14);
  doc.text(
    `Análisis FODA – ${candidatoSeleccionado.nombre}`,
    10,
    y
  );
  y += 8;

  // Datos básicos
  doc.setFontSize(10);
  doc.text(`Sigla: ${candidatoSeleccionado.sigla || '-'}`, 10, y);
  y += 6;

  const acept = fodaData.aceptacion || {};
  doc.text(
    `Aceptación aparente: ${(acept.nivel || 'Desconocida').toUpperCase()} (${acept.porcentaje_estimado || 0}%)`,
    10,
    y
  );
  y += 6;

  // Tendencias
  if (fodaData.tendencias) {
    const tendenciasLines = doc.splitTextToSize(
      `Tendencias y narrativa actual: ${fodaData.tendencias}`,
      190
    );
    doc.text(tendenciasLines, 10, y);
    y += tendenciasLines.length * 5 + 4;
  }

  const addListaFoda = (titulo, items) => {
    if (!items || !items.length) return;

    // Salto de página si se acaba el espacio
    if (y > 270) {
      doc.addPage();
      y = 10;
    }

    doc.setFont(undefined, 'bold');
    doc.text(titulo, 10, y);
    y += 5;

    doc.setFont(undefined, 'normal');
    const maxWidth = 180;

    items.forEach((it) => {
      const lines = doc.splitTextToSize(`• ${it}`, maxWidth);
      if (y + lines.length * 5 > 280) {
        doc.addPage();
        y = 10;
      }
      doc.text(lines, 10, y);
      y += lines.length * 5;
    });

    y += 3;
  };

  addListaFoda('Fortalezas', fodaData.foda?.fortalezas);
  addListaFoda('Oportunidades', fodaData.foda?.oportunidades);
  addListaFoda('Debilidades', fodaData.foda?.debilidades);
  addListaFoda('Amenazas', fodaData.foda?.amenazas);

  const nombreFile = (candidatoSeleccionado.nombre || 'candidato')
    .replace(/\s+/g, '_')
    .toLowerCase();

  doc.save(`foda_${nombreFile}.pdf`);
};


  const abrirFoda = async (cand) => {
    setCandidatoSeleccionado(cand);
    setShowModalFoda(true);
    setLoadingFoda(true);
    setFodaData(null);
    setBaseId(cand.id);
setCompareIds(candidatos.filter(x => x.id !== cand.id).slice(0, 2).map(x => x.id)); // 2 por defecto
setCompareData(null);
setTabKey("foda");

    try {
      const res = await axios.get(
        `http://localhost:3310/api/candidatos/${cand.id}/foda`
      );
      setFodaData(res.data);
    } catch (err) {
      console.error(err);
      alert('No se pudo generar el análisis FODA');
    } finally {
      setLoadingFoda(false);
    }
  };

const exportarComparacionPdf = () => {
  if (!compareData?.tabla?.base) {
    alert("Primero genera la comparación para exportar.");
    return;
  }

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  let y = 10;

  const base = compareData.tabla.base;
  const comps = compareData.tabla.competidores || [];
  const cols = [base, ...comps];

  // Helpers
  const title = (t) => {
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text(t, 10, y);
    y += 8;
  };

  const subtitle = (t) => {
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    const lines = doc.splitTextToSize(t, 280);
    doc.text(lines, 10, y);
    y += lines.length * 5 + 2;
  };

  const section = (t) => {
    if (y > 185) { doc.addPage(); y = 10; }
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text(t, 10, y);
    y += 6;
    doc.setFont(undefined, "normal");
  };

  const bulletList = (items, maxWidth = 280) => {
    (items || []).forEach((it) => {
      const lines = doc.splitTextToSize(`• ${it}`, maxWidth);
      if (y + lines.length * 5 > 200) { doc.addPage(); y = 10; }
      doc.text(lines, 10, y);
      y += lines.length * 5;
    });
    y += 2;
  };

  // Header
  title(`Comparación FODA – ${base.candidato?.nombre || "Candidato"}`);
  subtitle("Basado en IA + fuentes públicas (no es encuesta oficial).");

  // ===================== Tabla comparativa “manual” =====================
  section("Tabla FODA comparativa");

  // Config tabla
  const startX = 10;
  const startY = y;
  const pageW = 297; // A4 landscape width in mm
  const margin = 10;
  const usableW = pageW - margin * 2;

  const col0W = 35; // columna “Cuadrante”
  const otherW = (usableW - col0W) / cols.length;

  const rowH = 6;

  // Dibujar header row
  const drawCell = (x, y, w, h, text, bold=false) => {
    doc.rect(x, y, w, h);
    doc.setFont(undefined, bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text || "", w - 2);
    doc.text(lines, x + 1.5, y + 4);
  };

  // Header
  drawCell(startX, startY, col0W, rowH, "Cuadrante", true);
  cols.forEach((c, i) => {
    const label = `${c.candidato?.nombre || ""}\n(${c.candidato?.sigla || "N/A"})`;
    drawCell(startX + col0W + i * otherW, startY, otherW, rowH, label, true);
  });

  y = startY + rowH;

  // Filas FODA: en PDF no es fácil hacer alturas dinámicas perfecto sin autotable,
  // así que limitamos a 3 bullets por celda para mantener orden.
  const cuadrantes = [
    ["Fortalezas", "fortalezas"],
    ["Oportunidades", "oportunidades"],
    ["Debilidades", "debilidades"],
    ["Amenazas", "amenazas"],
  ];

  cuadrantes.forEach(([label, key]) => {
    if (y > 185) { doc.addPage(); y = 10; }

    drawCell(startX, y, col0W, rowH * 3, label, true);

    cols.forEach((c, i) => {
      const items = (c[key] || []).slice(0, 3).map((t) => `• ${t}`).join("\n");
      drawCell(startX + col0W + i * otherW, y, otherW, rowH * 3, items);
    });

    y += rowH * 3;
  });

  y += 6;

  // ===================== Brechas =====================
  section("Brechas (resumen)");
  bulletList(compareData.brechas?.ventajas_base?.slice(0, 6), 280);
  bulletList(compareData.brechas?.desventajas_base?.slice(0, 6), 280);
  bulletList(compareData.brechas?.oportunidades_no_aprovechadas?.slice(0, 6), 280);

  // ===================== Mejoras =====================
  section("Cómo mejorar (acciones sugeridas)");
  const prioridades = compareData.mejoras?.prioridades || [];
  const priLines = prioridades.slice(0, 10).map((p) => {
    const pri = (p.prioridad || "").toUpperCase();
    return `[${pri}] ${p.accion}${p.impacto_esperado ? " — " + p.impacto_esperado : ""}`;
  });
  bulletList(priLines, 280);

  section("Mensajes clave");
  bulletList(compareData.mejoras?.mensajes_clave?.slice(0, 10), 280);

  section("Plan 30 / 60 / 90");
  const plan = compareData.mejoras?.plan_30_60_90 || {};
  bulletList(["30 días:", ...(plan.dias_30 || []).slice(0, 6)], 280);
  bulletList(["60 días:", ...(plan.dias_60 || []).slice(0, 6)], 280);
  bulletList(["90 días:", ...(plan.dias_90 || []).slice(0, 6)], 280);

  const nombreFile = (base.candidato?.nombre || "candidato")
    .replace(/\s+/g, "_")
    .toLowerCase();

  doc.save(`comparacion_foda_${nombreFile}.pdf`);
};


  const getColorAceptacion = (nivel) => {
    switch (nivel) {
      case 'alta':
        return 'success';
      case 'media':
        return 'warning';
      case 'baja':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const exportarPdf = () => {
  if (tabKey === "comparacion") exportarComparacionPdf();
  else exportarFodaPdf();
}

  const compararFoda = async () => {
  if (!baseId || compareIds.length === 0) return;

  setLoadingCompare(true);
  setCompareData(null);

  try {
    const res = await axios.post("http://localhost:3310/api/candidatos/foda-comparar", {
      baseId,
      compareIds,
    });
    setCompareData(res.data);
  } catch (e) {
    console.error(e);
    alert("No se pudo generar la comparación FODA");
  } finally {
    setLoadingCompare(false);
  }
};


  return (
    <div className="d-flex flex-column h-100 w-100">
      {/* Header */}
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-0">Radar de Candidatos</h4>
        <span className="text-muted small">
          Análisis FODA con IA, tendencias y nivel de aceptación aparente
        </span>
      </div>

      {/* Grid de Candidatos */}
      <Row className="g-4">
        {candidatos.map((cand) => (
          <Col md={6} xl={4} key={cand.id}>
            <Card className="border-0 shadow-sm h-100 position-relative overflow-hidden">
              <div className="position-absolute top-0 start-0 w-100 pt-1 bg-light"></div>

              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-light p-3 rounded-circle text-secondary">
                      <User size={24} />
                    </div>
                    <div>
                      <h5 className="fw-bold mb-0 text-dark">
                        {cand.nombre}
                      </h5>
                      <small className="text-muted fw-bold">
                        {cand.sigla || 'Sin sigla registrada'}
                      </small>
                    </div>
                  </div>

                  <Badge bg="light" text="dark" className="border px-3 py-2 rounded-pill">
                    Candidato
                  </Badge>
                </div>

                {/* Mini barra de "fortaleza global" usando promedio de habilidades si las tienes */}
                {typeof cand.habilidad_crisis !== 'undefined' && (
                  <div className="mb-3">
                    <label
                      className="text-muted x-small fw-bold text-uppercase mb-1"
                      style={{ fontSize: '0.7rem' }}
                    >
                      Perfil global (promedio habilidades)
                    </label>
                    <ProgressBar
                      now={
                        ((cand.habilidad_crisis +
                          cand.habilidad_dialogo +
                          cand.habilidad_tecnica +
                          cand.habilidad_comunicacion +
                          cand.habilidad_influencia +
                          cand.habilidad_reputacion +
                          cand.habilidad_leyes) /
                          7) *
                        10
                      }
                      variant="info"
                      style={{ height: '6px' }}
                    />
                  </div>
                )}

                <div className="bg-light p-3 rounded-3 mb-3">
                  <div className="d-flex align-items-center gap-2 mb-2 text-primary">
                    <Brain size={16} />
                    <span className="fw-bold small">
                      Análisis FODA con IA:
                    </span>
                  </div>
                  <p className="mb-0 small text-secondary fst-italic">
                    Explora fortalezas, oportunidades, debilidades y amenazas
                    del candidato a partir de su huella pública y contexto
                    local.
                  </p>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-2">
                  <div className="d-flex align-items-center gap-2 text-muted small">
                    <Activity size={14} />
                    <span>Base: nombre + sigla + tendencias web</span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline-primary"
                    className="rounded-pill px-3"
                    onClick={() => abrirFoda(cand)}
                  >
                    Ver FODA IA
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}

        {candidatos.length === 0 && (
          <Col xs={12}>
            <div className="text-center p-5 border border-dashed rounded bg-light">
              <ShieldAlert
                size={40}
                className="text-muted mb-3 opacity-50"
              />
              <p className="text-muted mb-0">
                No se encontraron candidatos registrados.
              </p>
            </div>
          </Col>
        )}
      </Row>

      {/* MODAL FODA */}
<Modal
  show={showModalFoda}
  onHide={() => setShowModalFoda(false)}
  centered
  size="lg"
  dialogClassName="foda-modal"
>
  <Modal.Header closeButton className="foda-modal-header">
  <div className="d-flex justify-content-between align-items-start w-100">
    <div>
      <Modal.Title className="h6 mb-0">
        Análisis FODA – {candidatoSeleccionado?.nombre || 'Candidato'}
      </Modal.Title>
      <small className="text-muted">
        Basado en IA + búsquedas web (no son encuestas oficiales).
      </small>
    </div>

    {/* Botón PDF solo cuando ya hay datos y no está cargando */}
    {!loadingFoda && fodaData && (
     <Button
  variant="outline-secondary"
  size="sm"
  className="ms-3 d-flex align-items-center gap-1 rounded-pill"
  onClick={() => exportarPdf()}
>
  <Download size={16} />
  <span>PDF</span>
</Button>
    )}
  </div>
</Modal.Header>

  <Modal.Body className="foda-modal-body">
  {loadingFoda && (
    <div className="text-center py-5">
      <Spinner animation="border" size="sm" />{" "}
      <small className="text-muted">Generando análisis FODA con IA...</small>
    </div>
  )}

  {!loadingFoda && fodaData && (
    <Tabs activeKey={tabKey} onSelect={(k) => setTabKey(k)} className="mb-3">
      <Tab eventKey="foda" title="FODA">
        {/* 🔽 AQUÍ VA TU CONTENIDO ACTUAL DEL FODA (aceptación, tendencias, cuadrantes, fuentes) */}
        {/* (Pega exactamente tu UI actual dentro de este Tab) */}
      {/* Aceptación general */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="small text-muted fw-semibold text-uppercase">
              Grado de aceptación aparente
            </span>
            <Badge
              bg={getColorAceptacion(fodaData.aceptacion?.nivel)}
              className="rounded-pill"
            >
              {fodaData.aceptacion?.nivel?.toUpperCase() || "DESCONOCIDA"}
            </Badge>
          </div>

          <ProgressBar
            now={fodaData.aceptacion?.porcentaje_estimado || 0}
            variant={getColorAceptacion(fodaData.aceptacion?.nivel)}
            style={{ height: "7px" }}
          />

          <small className="text-muted d-block mt-1">
            {fodaData.aceptacion?.explicacion}
          </small>
        </div>

        {/* Tendencias */}
        <div className="bg-light rounded-3 p-3 mb-4">
          <div className="d-flex align-items-center gap-2 mb-2 text-danger">
            <TrendingDown size={16} />
            <span className="fw-bold small">
              Tendencias y narrativa actual:
            </span>
          </div>
          <p className="mb-0 small text-secondary">
            {fodaData.tendencias}
          </p>
        </div>

        {/* Cuadrantes FODA */}
        <Row className="g-3">
          <Col md={6}>
            <Card className="h-100 border-success-subtle foda-card">
              <Card.Body>
                <h6 className="text-success fw-bold mb-2">Fortalezas</h6>
                <ul className="small mb-0 ps-3">
                  {(fodaData.foda?.fortalezas || []).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="h-100 border-primary-subtle foda-card">
              <Card.Body>
                <h6 className="text-primary fw-bold mb-2">Oportunidades</h6>
                <ul className="small mb-0 ps-3">
                  {(fodaData.foda?.oportunidades || []).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="h-100 border-warning-subtle foda-card">
              <Card.Body>
                <h6 className="text-warning fw-bold mb-2">Debilidades</h6>
                <ul className="small mb-0 ps-3">
                  {(fodaData.foda?.debilidades || []).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="h-100 border-danger-subtle foda-card">
              <Card.Body>
                <h6 className="text-danger fw-bold mb-2">Amenazas</h6>
                <ul className="small mb-0 ps-3">
                  {(fodaData.foda?.amenazas || []).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Fuentes */}
        {Array.isArray(fodaData.fuentesPrincipales) &&
          fodaData.fuentesPrincipales.length > 0 && (
            <div className="bg-white border rounded-3 p-3 mt-4">
              <div className="d-flex align-items-center gap-2 mb-2 text-muted">
                <ShieldAlert size={16} />
                <span className="fw-bold small">
                  Fuentes principales consultadas (Facebook y medios):
                </span>
              </div>
              <div className="fuentes-scroll">
                <ul className="small mb-0 ps-3">
                  {fodaData.fuentesPrincipales.map((f, idx) => (
                    <li key={idx} className="mb-1">
                      <span className="fw-semibold">
                        [{f.tipo === "facebook"
                          ? "Facebook"
                          : f.tipo === "medio"
                          ? "Medio"
                          : "Web"}]
                      </span>{" "}
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-decoration-none"
                      >
                        {f.titulo}
                      </a>{" "}
                      <span className="text-muted">({f.fuente})</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
      </Tab>

      <Tab eventKey="comparacion" title="Comparación">
        <div className="d-flex align-items-center gap-2 mb-3">
          <GitCompareArrows size={18} />
          <span className="fw-bold">Comparar y mejorar análisis FODA</span>
        </div>

        {/* Selectores */}
        <Row className="g-3 mb-3">
          <Col md={6}>
            <Form.Label className="small text-muted fw-semibold">Candidato base</Form.Label>
            <Form.Select
              value={baseId || ""}
              onChange={(e) => {
                const newBase = Number(e.target.value);
                setBaseId(newBase);
                setCompareIds((prev) => prev.filter((id) => id !== newBase));
                setCompareData(null);
              }}
            >
              <option value="" disabled>Seleccione...</option>
              {candidatos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.sigla || "N/A"})
                </option>
              ))}
            </Form.Select>
          </Col>

          <Col md={6}>
            <Form.Label className="small text-muted fw-semibold">Comparar contra</Form.Label>
            <Form.Select
              multiple
              value={compareIds.map(String)}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
                // evita que el base se meta aquí
                setCompareIds(values.filter((v) => v !== baseId));
                setCompareData(null);
              }}
              style={{ height: 120 }}
            >
              {candidatos
                .filter((c) => c.id !== baseId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.sigla || "N/A"})
                  </option>
                ))}
            </Form.Select>
            <small className="text-muted">Ctrl/Shift para seleccionar varios</small>
          </Col>
        </Row>

        <div className="d-flex gap-2 mb-3">
          <Button
            variant="primary"
            className="rounded-pill px-3"
            onClick={compararFoda}
            disabled={loadingCompare || !baseId || compareIds.length === 0}
          >
            {loadingCompare ? "Comparando..." : "Generar comparación"}
          </Button>

          <Button
            variant="outline-secondary"
            className="rounded-pill px-3"
            onClick={() => setCompareData(null)}
          >
            Limpiar
          </Button>
        </div>

        {loadingCompare && (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" />{" "}
            <small className="text-muted">Generando comparación con IA...</small>
          </div>
        )}

        {/* Tabla comparativa */}
        {!loadingCompare && compareData?.tabla && (
          <>
            <div className="border rounded-3 p-3 bg-white mb-3">
              <div className="fw-bold mb-2">Tabla FODA comparativa</div>

              {(() => {
                const base = compareData.tabla.base;
                const comps = compareData.tabla.competidores || [];
                const cols = [base, ...comps];

                const renderList = (arr) => (
                  <ul className="mb-0 ps-3 small">
                    {(arr || []).slice(0, 6).map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                );

                return (
                  <div className="table-responsive">
                    <Table bordered hover className="align-middle small">
                      <thead>
                        <tr>
                          <th style={{ width: 180 }}>Cuadrante</th>
                          {cols.map((c, idx) => (
                            <th key={idx}>
                              {c.candidato?.nombre} <br />
                              <span className="text-muted">({c.candidato?.sigla || "N/A"})</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="fw-bold text-success">Fortalezas</td>
                          {cols.map((c, idx) => <td key={idx}>{renderList(c.fortalezas)}</td>)}
                        </tr>
                        <tr>
                          <td className="fw-bold text-primary">Oportunidades</td>
                          {cols.map((c, idx) => <td key={idx}>{renderList(c.oportunidades)}</td>)}
                        </tr>
                        <tr>
                          <td className="fw-bold text-warning">Debilidades</td>
                          {cols.map((c, idx) => <td key={idx}>{renderList(c.debilidades)}</td>)}
                        </tr>
                        <tr>
                          <td className="fw-bold text-danger">Amenazas</td>
                          {cols.map((c, idx) => <td key={idx}>{renderList(c.amenazas)}</td>)}
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                );
              })()}
            </div>

            {/* Brechas */}
            <Row className="g-3">
              <Col md={6}>
                <div className="border rounded-3 p-3 bg-light">
                  <div className="fw-bold mb-2">Ventajas del base</div>
                  <ul className="mb-0 ps-3 small">
                    {(compareData.brechas?.ventajas_base || []).map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
              </Col>

              <Col md={6}>
                <div className="border rounded-3 p-3 bg-light">
                  <div className="fw-bold mb-2">Brechas / desventajas</div>
                  <ul className="mb-0 ps-3 small">
                    {(compareData.brechas?.desventajas_base || []).map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
              </Col>
            </Row>

            {/* Mejoras */}
            <div className="border rounded-3 p-3 bg-white mt-3">
              <div className="fw-bold mb-2">Cómo podría mejorar</div>

              <div className="mb-3">
                <div className="text-muted small fw-semibold mb-1">Prioridades</div>
                <ul className="mb-0 ps-3 small">
                  {(compareData.mejoras?.prioridades || []).map((p, i) => (
                    <li key={i}>
                      <span className="fw-bold">[{p.prioridad}]</span> {p.accion}
                      {p.razon ? <span className="text-muted"> — {p.razon}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-3">
                <div className="text-muted small fw-semibold mb-1">Mensajes clave</div>
                <ul className="mb-0 ps-3 small">
                  {(compareData.mejoras?.mensajes_clave || []).map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>

              <div>
                <div className="text-muted small fw-semibold mb-2">Plan 30 / 60 / 90</div>
                <Row className="g-2">
                  <Col md={4}>
                    <div className="p-2 border rounded bg-light">
                      <div className="fw-bold small">30 días</div>
                      <ul className="mb-0 ps-3 small">
                        {(compareData.mejoras?.plan_30_60_90?.dias_30 || []).map((x, i) => <li key={i}>{x}</li>)}
                      </ul>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="p-2 border rounded bg-light">
                      <div className="fw-bold small">60 días</div>
                      <ul className="mb-0 ps-3 small">
                        {(compareData.mejoras?.plan_30_60_90?.dias_60 || []).map((x, i) => <li key={i}>{x}</li>)}
                      </ul>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="p-2 border rounded bg-light">
                      <div className="fw-bold small">90 días</div>
                      <ul className="mb-0 ps-3 small">
                        {(compareData.mejoras?.plan_30_60_90?.dias_90 || []).map((x, i) => <li key={i}>{x}</li>)}
                      </ul>
                    </div>
                  </Col>
                </Row>
              </div>
            </div>
          </>
        )}
      </Tab>
    </Tabs>
  )}
</Modal.Body>

  <Modal.Footer className="foda-modal-footer">
    <small className="text-muted me-auto">
      Este análisis es orientativo y se basa en información pública
      disponible. No reemplaza estudios de opinión formales.
    </small>
    <Button variant="light" onClick={() => setShowModalFoda(false)}>
      Cerrar
    </Button>
  </Modal.Footer>
</Modal>

     
    </div>
  );
};

export default Competidores;
