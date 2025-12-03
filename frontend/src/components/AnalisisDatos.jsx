import { useEffect, useState,useRef  } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, Row, Col, Badge, Spinner } from "react-bootstrap";
import { MapPin, Users, AlertTriangle, Link as LinkIcon } from "lucide-react";
import "./styles/analisisDatos.css";

const colorNivel = (nivel) => {
  switch (nivel) {
    case "alto":
      return "danger";
    case "medio":
      return "warning";
    case "bajo":
      return "success";
    default:
      return "secondary";
  }
};

// 🔹 Card de detalle (la usamos visible y oculta)
const DetalleDistrito = ({ data }) => {
  if (!data) return null;

  return (
    <Card className="border-0 shadow-sm analisis-detalle-card">
      <Card.Body className="d-flex flex-column h-100">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <MapPin size={18} className="text-primary" />
              <h6 className="fw-bold mb-0">Distrito {data.distrito}</h6>
            </div>
            <small className="text-muted">
              Subalcaldía: {data.subalcaldia || "N/D"}
            </small>
          </div>
          <div className="text-end">
            <div className="small text-muted mb-1">Oportunidad</div>
            <h5 className="mb-0 text-primary">
              {data.score_oportunidad || 0}%
            </h5>
          </div>
        </div>

        <Row className="g-3 mb-3">
          <Col xs={6}>
            <div className="p-2 bg-light rounded-3 text-center">
              <div className="small text-muted">Conflictividad</div>
              <Badge
                bg={colorNivel(data.nivel_conflictividad)}
                className="mt-1"
              >
                {(data.nivel_conflictividad || "N/D").toUpperCase()}
              </Badge>
            </div>
          </Col>
          <Col xs={6}>
            <div className="p-2 bg-light rounded-3 text-center">
              <div className="small text-muted">Oportunidad política</div>
              <Badge
                bg={colorNivel(data.grado_oportunidad_politica)}
                className="mt-1"
              >
                {(data.grado_oportunidad_politica || "N/D").toUpperCase()}
              </Badge>
            </div>
          </Col>
        </Row>

        <div className="mb-3 small text-secondary">
          {data.resumen_situacion}
        </div>

        {/* Problemas principales */}
        <div className="mb-3">
          <div className="d-flex align-items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-warning flex-shrink-0" />
            <span className="fw-bold small">Problemas principales</span>
          </div>
          <ul className="small mb-0 ps-3">
            {(data.problemas_principales || []).map((p, i) => (
              <li key={i}>{p}</li>
            ))}
            {(!data.problemas_principales ||
              !data.problemas_principales.length) && (
              <li className="text-muted">
                Sin problemas identificados en las fuentes consultadas.
              </li>
            )}
          </ul>
        </div>

        {/* OTB en conflicto */}
        <div className="mb-3">
          <div className="d-flex align-items-center gap-2 mb-1">
            <Users size={16} className="text-primary flex-shrink-0" />
            <span className="fw-bold small">
              OTB con conflictos o demandas visibles
            </span>
          </div>
          <ul className="small mb-0 ps-3">
            {(data.otbs_conflicto || []).map((o, i) => (
              <li key={i}>{o}</li>
            ))}
            {(!data.otbs_conflicto || !data.otbs_conflicto.length) && (
              <li className="text-muted">
                No se identificaron OTB específicas en conflicto en las
                fuentes.
              </li>
            )}
          </ul>
        </div>

        {/* Actores clave */}
        <div className="mb-3">
          <div className="d-flex align-items-center gap-2 mb-1">
            <Users size={16} className="text-success flex-shrink-0" />
            <span className="fw-bold small">
              Actores clave para acompañar al candidato
            </span>
          </div>
          <ul className="small mb-0 ps-3">
            {(data.actores_clave || []).map((a, i) => (
              <li key={i}>
                <strong>{a.nombre}</strong>{" "}
                <span className="text-muted">({a.rol || a.tipo})</span>
                <br />
                <span className="text-muted">{a.descripcion}</span>
              </li>
            ))}
            {(!data.actores_clave || !data.actores_clave.length) && (
              <li className="text-muted">
                No se identificaron actores concretos en las fuentes. Requiere
                trabajo de campo.
              </li>
            )}
          </ul>
        </div>

        {/* Fuentes principales */}
        {Array.isArray(data.fuentesPrincipales) &&
          data.fuentesPrincipales.length > 0 && (
            <div className="mt-auto fuentes-container small">
              <div className="d-flex align-items-center gap-2 mb-1">
                <LinkIcon size={16} className="text-muted flex-shrink-0" />
                <span className="fw-bold small">
                  Fuentes principales consultadas
                </span>
              </div>
              <div className="fuentes-scroll">
                <ul className="mb-0 ps-3">
                  {data.fuentesPrincipales.map((f, idx) => (
                    <li key={idx} className="mb-1">
                      <span className="fw-semibold">
                        [
                        {f.tipo === "facebook"
                          ? "Facebook"
                          : f.tipo === "medio"
                          ? "Medio"
                          : "Web"}
                        ]
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
      </Card.Body>
    </Card>
  );
};

const AnalisisDatos = () => {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(false); // carga de datos
  const [exportando, setExportando] = useState(false); // export PDF
  const [error, setError] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);

 const chartRef = useRef(null);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(
          "http://localhost:3310/api/analisis-distritos"
        );
        setDatos(res.data || []);
        if (res.data && res.data.length > 0) {
          setSeleccionado(res.data[0]);
        }
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar el análisis de distritos.");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const handleBarClick = (data) => {
    if (!data || !data.activeLabel) return;
    const distritoNum = Number(data.activeLabel);
    const found = datos.find((d) => d.distrito === distritoNum);
    if (found) setSeleccionado(found);
  };

  const chartData = datos.map((d) => ({
    distrito: String(d.distrito),
    promedio: d.score_oportunidad || 0,
  }));

  const handleDownloadPDF = async () => {
    if (!datos.length) return;

    try {
      setExportando(true);
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Portada
      pdf.setFontSize(16);
      pdf.text("Análisis Territorial con IA", 14, 20);
      pdf.setFontSize(11);
      pdf.text("Municipio de Cochabamba - 15 distritos", 14, 28);
      pdf.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 36);

      // Gráfico general
      if (chartRef.current) {
        const canvas = await html2canvas(chartRef.current, {
          scale: 2,
          useCORS: true,
          scrollX: 0,
          scrollY: 0,
        });
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 10, 45, imgWidth, imgHeight);
      }

      // Una página por distrito (usamos las cards ocultas)
      for (const d of datos) {
        const el = document.getElementById(`pdf-card-distrito-${d.distrito}`);
        if (!el) continue;

        pdf.addPage();

        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          scrollX: 0,
          scrollY: 0,
        });
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      }

      pdf.save("analisis_distritos_cochabamba.pdf");
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("Ocurrió un error al generar el PDF.");
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="analisis-wrapper d-flex flex-column h-100 w-100">
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="fw-bold text-dark mb-0">
            Análisis Territorial con IA
          </h4>
          <span className="text-muted small">
            15 distritos de Cochabamba · Problemas · OTB en conflicto · Actores
            clave
          </span>
        </div>
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={handleDownloadPDF}
          disabled={loading || exportando || !datos.length}
        >
          {exportando ? "Generando PDF..." : "Descargar PDF"}
        </button>
      </div>

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" size="sm" />{" "}
          <small className="text-muted">
            Consultando web, Facebook y noticias para cada distrito...
          </small>
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-danger">{error}</div>
      )}

      {!loading && !error && datos.length > 0 && (
        <>
          <Row className="g-4">
            <Col lg={7}>
              <Card className="border-0 shadow-sm h-100" ref={chartRef}>
                <Card.Body>
                  <h6 className="fw-bold mb-1">
                    Oportunidad política por distrito
                  </h6>
                  <small className="text-muted d-block mb-3">
                    Puntaje 0–100 estimado a partir de problemas,
                    conflictividad y actores.
                  </small>

                  <div style={{ width: "100%", height: 320 }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                        onClick={handleBarClick}
                      >
                        <XAxis
                          dataKey="distrito"
                          label={{
                            value: "Distrito",
                            position: "insideBottom",
                            offset: -5,
                          }}
                        />
                        <YAxis
                          label={{
                            value: "Oportunidad (%)",
                            angle: -90,
                            position: "insideLeft",
                          }}
                          domain={[0, 100]}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="promedio"
                          name="Oportunidad (%)"
                          fill="#4f46e5"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-3 p-3 bg-light rounded-3 small">
                    <strong>Tip:</strong> Haz clic en una barra para ver el
                    detalle del distrito (problemas, OTB y actores).
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={5}>
              {seleccionado && <DetalleDistrito data={seleccionado} />}
            </Col>
          </Row>

          {/* 🔹 Contenedor oculto con una card por distrito para el PDF */}
          <div
            style={{
              position: "fixed",
              left: "-9999px",
              top: 0,
              zIndex: -1,
            }}
          >
            {datos.map((d) => (
              <div
                key={d.distrito}
                id={`pdf-card-distrito-${d.distrito}`}
                style={{ width: "800px", padding: "16px" }} // ancho fijo ayuda a que el render sea consistente
              >
                <DetalleDistrito data={d} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AnalisisDatos;
