import { useEffect, useState } from 'react';
import axios from 'axios';
import { Row, Col, Modal, Spinner, Badge, Alert } from 'react-bootstrap';
import { Landmark, Home, Users, User, MapPin, Map } from 'lucide-react';

// Importamos los estilos corregidos
import './styles/Dashboard.css';

const Dashboard = () => {
  const [data, setData] = useState({ 
      resumen: { total_subalcaldias: 0, total_distritos: 0, total_otbs: 0 }, 
      problemas: [] 
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:3310/api/dashboard/data')
      .then(res => {
        // SI EL BACKEND DEVUELVE LISTA VACÍA, USAMOS DATOS FALSOS PARA QUE VEAS EL DISEÑO
        const problemasReales = res.data.problemas.length > 0 ? res.data.problemas : [
            { id: 991, problema: 'Falta de iluminación', area: 'Seguridad Ciudadana', prioridad: 'Alta', otb: 'Ejemplo OTB', distrito: 'D-10', subalcaldia: 'Tunari' },
            { id: 992, problema: 'Bacheo Urgente', area: 'Vías y Obras', prioridad: 'Media', otb: 'Cala Cala', distrito: 'D-2', subalcaldia: 'Adela Zamudio' }
        ];
        
        setData({
            resumen: res.data.resumen,
            problemas: problemasReales
        });
        setLoading(false);
      })
      .catch(err => {
        console.error("Error cargando dashboard:", err);
        // DATOS DE RESPALDO SI FALLA LA CONEXIÓN
        setData({
            resumen: { total_subalcaldias: 7, total_distritos: 10, total_otbs: 435 },
            problemas: [
                { id: 1, problema: 'Falta de iluminación', area: 'Seguridad Ciudadana', prioridad: 'Alta', otb: 'San Pedro', distrito: 'Distrito 10' },
                { id: 2, problema: 'Acumulación de Basura', area: 'Gestión de Residuos', prioridad: 'Media', otb: 'Las Cuadras', distrito: 'Distrito 12' }
            ]
        });
        setLoading(false);
      });
  }, []);

  const handleCardClick = (problema) => {
      setSelectedProblem(problema);
      setShowModal(true);
  };

  if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <div className="dashboard-wrapper">
      
      {/* ------------------------------------------------------------ */}
      {/* 1. SECCIÓN PROBLEMAS (ARRIBA - TARJETAS NARANJAS)            */}
      {/* ------------------------------------------------------------ */}
      <div className="mb-4 d-flex align-items-center">
          <div style={{ width:'5px', height:'25px', backgroundColor:'#F35429', marginRight:'10px', borderRadius:'4px' }}></div>
          <h4 style={{ color:'#6c757d', fontWeight:'700', margin:0 }}>Problemas Identificados</h4>
      </div>

      <Row className="mb-5">
        {data.problemas.map((prob) => (
            <Col md={6} xl={4} key={prob.id}>
                <div className="problem-card" onClick={() => handleCardClick(prob)}>
                    <div className="problem-info">
                        <h5>{prob.problema}</h5>
                        <span>{prob.area}</span>
                    </div>
                    <div className="user-icon-circle">
                        <User size={24} strokeWidth={2.5} />
                    </div>
                </div>
            </Col>
        ))}
      </Row>

      {/* ------------------------------------------------------------ */}
      {/* 2. SECCIÓN KPIs (ABAJO - TARJETAS DE COLORES)                */}
      {/* ------------------------------------------------------------ */}
      <div className="mb-4 d-flex align-items-center">
          <div style={{ width:'5px', height:'25px', backgroundColor:'#00C4B4', marginRight:'10px', borderRadius:'4px' }}></div>
          <h4 style={{ color:'#6c757d', fontWeight:'700', margin:0 }}>Resumen General</h4>
      </div>

      <Row className="g-4">
        {/* SUBALCALDIAS */}
        <Col md={4}>
            <div className="kpi-card bg-turquesa">
                <div className="kpi-content">
                    <div className="kpi-title">Subalcaldías</div>
                    <div className="kpi-number-group">
                        <span className="kpi-label">Nro</span>
                        <span className="kpi-value">{data.resumen.total_subalcaldias}</span>
                    </div>
                </div>
                <div className="kpi-icon-wrapper">
                    <Landmark size={100} color="white" />
                </div>
            </div>
        </Col>

        {/* DISTRITOS */}
        <Col md={4}>
            <div className="kpi-card bg-verde">
                <div className="kpi-content">
                    <div className="kpi-title">Distritos</div>
                    <div className="kpi-number-group">
                        <span className="kpi-label">Nro</span>
                        <span className="kpi-value">{data.resumen.total_distritos}</span>
                    </div>
                </div>
                <div className="kpi-icon-wrapper">
                    <Home size={100} color="white" />
                </div>
            </div>
        </Col>

        {/* OTBs */}
        <Col md={4}>
            <div className="kpi-card bg-azul">
                <div className="kpi-content">
                    <div className="kpi-title">OTB</div>
                    <div className="kpi-number-group">
                        <span className="kpi-label">Nro</span>
                        <span className="kpi-value">{data.resumen.total_otbs}</span>
                    </div>
                </div>
                <div className="kpi-icon-wrapper">
                    <Users size={100} color="white" />
                </div>
            </div>
        </Col>
      </Row>

      {/* ------------------------------------------------------------ */}
      {/* 3. MODAL DE DETALLE (POPUP)                                  */}
      {/* ------------------------------------------------------------ */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-dark text-white border-0">
            <Modal.Title className="h5 fw-bold">Detalle de Ubicación</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 bg-light">
            {selectedProblem && (
                <Row className="g-4">
                    <Col md={12} className="text-center mb-3">
                        <h2 style={{color: '#F35429', fontWeight: '800'}}>{selectedProblem.problema}</h2>
                        <Badge bg="secondary" className="px-3 py-2 mt-2">{selectedProblem.prioridad} Prioridad</Badge>
                    </Col>

                    <Col md={4}>
                        <div className="bg-white p-3 rounded-4 shadow-sm text-center border-top border-5 border-success h-100">
                            <MapPin size={32} className="text-success mb-2"/>
                            <div className="text-muted small fw-bold text-uppercase">Barrio / OTB</div>
                            <h5 className="fw-bold text-dark mt-1">{selectedProblem.otb}</h5>
                        </div>
                    </Col>
                    
                    <Col md={4}>
                        <div className="bg-white p-3 rounded-4 shadow-sm text-center border-top border-5 border-primary h-100">
                            <Map size={32} className="text-primary mb-2"/>
                            <div className="text-muted small fw-bold text-uppercase">Distrito</div>
                            <h5 className="fw-bold text-dark mt-1">{selectedProblem.distrito}</h5>
                        </div>
                    </Col>

                    <Col md={4}>
                        <div className="bg-white p-3 rounded-4 shadow-sm text-center border-top border-5 border-info h-100">
                            <Landmark size={32} className="text-info mb-2"/>
                            <div className="text-muted small fw-bold text-uppercase">Subalcaldía</div>
                            <h5 className="fw-bold text-dark mt-1">{selectedProblem.subalcaldia || "No asignada"}</h5>
                        </div>
                    </Col>
                </Row>
            )}
        </Modal.Body>
      </Modal>

    </div>
  );
};

export default Dashboard;