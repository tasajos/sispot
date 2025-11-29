import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Row, Col, Badge, ProgressBar } from 'react-bootstrap';
import { User, ShieldAlert, TrendingDown, Target } from 'lucide-react';

const Competidores = () => {
  // 1. Aquí definimos la variable correcta: competidores
  const [competidores, setCompetidores] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3310/api/competidores')
      .then(response => {
        // 2. CORRECCIÓN: Usamos setCompetidores (antes decía setActividades por error)
        setCompetidores(response.data);
      })
      .catch(error => console.error("Error cargando competidores:", error));
  }, []);

  // Función para determinar color según amenaza
  const getVariant = (nivel) => {
    if (nivel === 'alto') return 'danger';
    if (nivel === 'medio') return 'warning';
    return 'success';
  };

  return (
    <div className="d-flex flex-column h-100 w-100">
      
      {/* Header */}
      <div className="mb-4">
         <h4 className="fw-bold text-dark mb-0">Radar de Competencia</h4>
         <span className="text-muted small">Análisis FODA y monitoreo de rivales</span>
      </div>

      {/* Grid de Competidores */}
      <Row className="g-4">
        {competidores.map(comp => (
          <Col md={6} xl={4} key={comp.id}>
            <Card className="border-0 shadow-sm h-100 position-relative overflow-hidden">
              {/* Borde superior de color según amenaza */}
              <div className={`position-absolute top-0 start-0 w-100 pt-1 bg-${getVariant(comp.nivel_amenaza)}`}></div>
              
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                   <div className="d-flex align-items-center gap-3">
                      <div className="bg-light p-3 rounded-circle text-secondary">
                          <User size={24} />
                      </div>
                      <div>
                          <h5 className="fw-bold mb-0 text-dark">{comp.nombre}</h5>
                          <small className="text-muted fw-bold">{comp.partido}</small>
                      </div>
                   </div>
                   <Badge bg={`${getVariant(comp.nivel_amenaza)}-subtle`} text={getVariant(comp.nivel_amenaza)} className="border px-3 py-2 rounded-pill">
                      Amenaza {comp.nivel_amenaza.toUpperCase()}
                   </Badge>
                </div>

                <div className="mb-4">
                   <label className="text-muted x-small fw-bold text-uppercase mb-1" style={{fontSize:'0.7rem'}}>Nivel de Presencia</label>
                   <ProgressBar 
                      now={comp.nivel_amenaza === 'alto' ? 85 : comp.nivel_amenaza === 'medio' ? 50 : 25} 
                      variant={getVariant(comp.nivel_amenaza)} 
                      style={{height: '6px'}} 
                   />
                </div>

                <div className="bg-light p-3 rounded-3 mb-3">
                    <div className="d-flex align-items-center gap-2 mb-2 text-danger">
                        <TrendingDown size={16} />
                        <span className="fw-bold small">Debilidades Detectadas:</span>
                    </div>
                    <p className="mb-0 small text-secondary fst-italic">
                        "{comp.debilidades}"
                    </p>
                </div>

                <div className="d-flex align-items-center gap-2 text-muted small border-top pt-3">
                    <Target size={14} />
                    <span>Última actividad: <strong>Campaña en redes</strong></span>
                </div>

              </Card.Body>
            </Card>
          </Col>
        ))}

        {competidores.length === 0 && (
            <Col xs={12}>
                <div className="text-center p-5 border border-dashed rounded bg-light">
                    <ShieldAlert size={40} className="text-muted mb-3 opacity-50"/>
                    <p className="text-muted mb-0">No se encontraron datos de competidores.</p>
                </div>
            </Col>
        )}
      </Row>
    </div>
  );
};

export default Competidores;