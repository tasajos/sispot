// frontend/src/components/Competidores.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Row, Col, Badge, ProgressBar, Modal, Button, Spinner } from 'react-bootstrap';
import { User, ShieldAlert, TrendingDown, Target, Brain, Activity } from 'lucide-react';
import './styles/competidores.css';

const Competidores = () => {
  const [candidatos, setCandidatos] = useState([]);
  const [showModalFoda, setShowModalFoda] = useState(false);
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState(null);
  const [fodaData, setFodaData] = useState(null);
  const [loadingFoda, setLoadingFoda] = useState(false);


  useEffect(() => {
    axios
      .get('http://localhost:3310/api/candidatos')
      .then((res) => setCandidatos(res.data))
      .catch((err) => console.error('Error cargando candidatos:', err));
  }, []);

  const abrirFoda = async (cand) => {
    setCandidatoSeleccionado(cand);
    setShowModalFoda(true);
    setLoadingFoda(true);
    setFodaData(null);

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
          <div>
            <Modal.Title className="h6 mb-0">
              Análisis FODA –{' '}
              {candidatoSeleccionado?.nombre || 'Candidato'}
            </Modal.Title>
            <small className="text-muted">
              Basado en IA + búsquedas web (no son encuestas oficiales).
            </small>
          </div>
        </Modal.Header>

        <Modal.Body className="foda-modal-body">
          {loadingFoda && (
            <div className="text-center py-5">
              <Spinner animation="border" size="sm" />{' '}
              <small className="text-muted">
                Generando análisis FODA con IA...
              </small>
            </div>
          )}

          {!loadingFoda && fodaData && (
            <>
              {/* Aceptación */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small text-muted fw-semibold text-uppercase">
                    Grado de aceptación aparente
                  </span>
                  <Badge
                    bg={getColorAceptacion(fodaData.aceptacion?.nivel)}
                    className="rounded-pill"
                  >
                    {fodaData.aceptacion?.nivel?.toUpperCase() ||
                      'DESCONOCIDA'}
                  </Badge>
                </div>
                <ProgressBar
                  now={fodaData.aceptacion?.porcentaje_estimado || 0}
                  variant={getColorAceptacion(fodaData.aceptacion?.nivel)}
                  style={{ height: '7px' }}
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
                      <h6 className="text-success fw-bold mb-2">
                        Fortalezas
                      </h6>
                      <ul className="small mb-0 ps-3">
                        {(fodaData.foda?.fortalezas || []).map(
                          (item, idx) => (
                            <li key={idx}>{item}</li>
                          )
                        )}
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="h-100 border-primary-subtle foda-card">
                    <Card.Body>
                      <h6 className="text-primary fw-bold mb-2">
                        Oportunidades
                      </h6>
                      <ul className="small mb-0 ps-3">
                        {(fodaData.foda?.oportunidades || []).map(
                          (item, idx) => (
                            <li key={idx}>{item}</li>
                          )
                        )}
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="h-100 border-warning-subtle foda-card">
                    <Card.Body>
                      <h6 className="text-warning fw-bold mb-2">
                        Debilidades
                      </h6>
                      <ul className="small mb-0 ps-3">
                        {(fodaData.foda?.debilidades || []).map(
                          (item, idx) => (
                            <li key={idx}>{item}</li>
                          )
                        )}
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="h-100 border-danger-subtle foda-card">
                    <Card.Body>
                      <h6 className="text-danger fw-bold mb-2">
                        Amenazas
                      </h6>
                      <ul className="small mb-0 ps-3">
                        {(fodaData.foda?.amenazas || []).map(
                          (item, idx) => (
                            <li key={idx}>{item}</li>
                          )
                        )}
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
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
