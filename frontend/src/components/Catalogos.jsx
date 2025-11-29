import { useEffect, useState } from 'react';
import axios from 'axios';
import { Tab, Nav, Table, Badge, Button, Row, Col, Card, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { Map, MapPin, Layers, AlertTriangle, Plus, Save, X, CheckCircle } from 'lucide-react';

const Catalogos = () => {
  const [key, setKey] = useState('distritos');
  
  // Datos
  const [distritos, setDistritos] = useState([]);
  const [otbs, setOtbs] = useState([]);
  const [areas, setAreas] = useState([]);

  // Estados del Modal y Formulario
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  
  // Datos del Formulario Nuevo Distrito
  const [nuevoDistrito, setNuevoDistrito] = useState({
      nombre: '',
      zona: 'Norte',
      poblacion_est: ''
  });

  // Cargar datos iniciales
  const cargarDatos = async () => {
    try {
      const resDist = await axios.get('http://localhost:3310/api/catalogos/distritos');
      setDistritos(resDist.data);
      const resOtbs = await axios.get('http://localhost:3310/api/catalogos/otbs');
      setOtbs(resOtbs.data);
      const resAreas = await axios.get('http://localhost:3310/api/catalogos/areas');
      setAreas(resAreas.data);
    } catch (error) {
      console.error("Error cargando catálogos", error);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Manejar cambios en los inputs
  const handleChange = (e) => {
      setNuevoDistrito({
          ...nuevoDistrito,
          [e.target.name]: e.target.value
      });
  };

  // Guardar en Base de Datos
  const handleGuardar = async (e) => {
      e.preventDefault();
      setLoading(true);
      setMensajeExito('');

      try {
          await axios.post('http://localhost:3310/api/catalogos/distritos', nuevoDistrito);
          
          // Éxito
          setMensajeExito('¡Distrito registrado correctamente!');
          cargarDatos(); // Recargar la tabla
          
          // Limpiar y cerrar después de 1.5 segundos para que el usuario vea el mensaje
          setTimeout(() => {
              setShowModal(false);
              setMensajeExito('');
              setNuevoDistrito({ nombre: '', zona: 'Norte', poblacion_est: '' });
              setLoading(false);
          }, 1500);

      } catch (error) {
          console.error(error);
          setLoading(false);
          alert("Error al guardar");
      }
  };

  return (
    <div className="d-flex flex-column h-100 w-100">
      
      {/* Header Principal */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
           <h4 className="fw-bold mb-0 text-dark">Catálogos Municipales</h4>
           <small className="text-muted">Configuración territorial y temática</small>
        </div>
      </div>

      {/* Contenedor Principal */}
      <div className="flex-grow-1 bg-white rounded-4 shadow-sm border p-4 overflow-hidden d-flex flex-column">
        <Tab.Container activeKey={key} onSelect={(k) => setKey(k)}>
          <Row className="h-100 g-0">
            
            {/* Menú Lateral */}
            <Col md={3} className="border-end pe-3 d-flex flex-column h-100">
              <Nav variant="pills" className="flex-column gap-2">
                <Nav.Item>
                  <Nav.Link eventKey="distritos" className="d-flex align-items-center gap-2 py-3">
                    <Map size={18} /> Distritos
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="otbs" className="d-flex align-items-center gap-2 py-3">
                    <MapPin size={18} /> OTBs / Barrios
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="temas" className="d-flex align-items-center gap-2 py-3">
                    <Layers size={18} /> Áreas y Problemas
                  </Nav.Link>
                </Nav.Item>
              </Nav>
              
              <div className="mt-auto p-3 bg-light rounded text-center border">
                 <small className="text-muted d-block mb-2 fw-bold">Acciones Rápidas</small>
                 {key === 'distritos' && (
                     <Button variant="primary" size="sm" className="w-100 d-flex align-items-center justify-content-center gap-2 shadow-sm" onClick={() => setShowModal(true)}>
                        <Plus size={16}/> Nuevo Distrito
                     </Button>
                 )}
                 {key !== 'distritos' && (
                     <Button variant="outline-secondary" size="sm" className="w-100" disabled>
                        Solo Distritos (Demo)
                     </Button>
                 )}
              </div>
            </Col>

            {/* Contenido */}
            <Col md={9} className="ps-3 h-100 overflow-auto custom-scroll">
              <Tab.Content className="h-100">
                
                {/* TABLA DISTRITOS */}
                <Tab.Pane eventKey="distritos">
                  <h5 className="fw-bold text-dark mb-3 ps-2 border-start border-4 border-primary">Listado de Distritos</h5>
                  <Table hover responsive className="align-middle">
                    <thead className="bg-light text-secondary small text-uppercase">
                      <tr>
                        <th className="border-0">Nombre</th>
                        <th className="border-0">Zona Geográfica</th>
                        <th className="border-0 text-center">Población</th>
                        <th className="border-0 text-center">OTBs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distritos.map(d => (
                        <tr key={d.id}>
                          <td className="fw-bold text-dark">{d.nombre}</td>
                          <td>
                             <Badge bg={d.zona === 'Norte' ? 'success' : d.zona === 'Sur' ? 'warning' : 'info'} className="fw-normal px-2">
                                {d.zona}
                             </Badge>
                          </td>
                          <td className="text-center text-muted small">{d.poblacion_est.toLocaleString()} hab.</td>
                          <td className="text-center fw-bold">{d.total_otbs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Tab.Pane>

                {/* TABLA OTBS (Sin cambios visuales mayores) */}
                <Tab.Pane eventKey="otbs">
                  <h5 className="fw-bold text-dark mb-3 ps-2 border-start border-4 border-success">OTBs Registradas</h5>
                  <Table hover responsive size="sm">
                    <thead className="bg-light text-secondary small">
                        <tr><th>#</th><th>Nombre</th><th>Distrito</th></tr>
                    </thead>
                    <tbody>
                      {otbs.map((o, idx) => (
                        <tr key={o.id}>
                          <td className="text-muted">{idx + 1}</td>
                          <td className="fw-bold">{o.nombre}</td>
                          <td>{o.distrito}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Tab.Pane>

                {/* TABLA TEMAS */}
                <Tab.Pane eventKey="temas">
                   <h5 className="fw-bold text-dark mb-3 ps-2 border-start border-4 border-warning">Ejes Temáticos</h5>
                   <Row>
                       {areas.map(area => (
                           <Col md={6} key={area.id} className="mb-3">
                               <Card className="h-100 border shadow-sm">
                                   <Card.Body>
                                       <div className="d-flex align-items-center gap-2 mb-2">
                                           <div className="bg-light p-2 rounded-circle text-primary"><Layers size={20}/></div>
                                           <h6 className="fw-bold m-0">{area.nombre}</h6>
                                       </div>
                                   </Card.Body>
                               </Card>
                           </Col>
                       ))}
                   </Row>
                </Tab.Pane>

              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </div>

      {/* --- MODAL ELEGANTE PARA NUEVO DISTRITO --- */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold h5">Nuevo Distrito</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleGuardar}>
            <Modal.Body className="pt-2">
                <p className="text-muted small mb-4">Ingrese la información básica del nuevo territorio.</p>
                
                {mensajeExito && (
                    <Alert variant="success" className="d-flex align-items-center gap-2 py-2">
                        <CheckCircle size={18}/> {mensajeExito}
                    </Alert>
                )}

                <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-secondary">Nombre Oficial</Form.Label>
                    <Form.Control 
                        type="text" 
                        placeholder="Ej: Distrito 15" 
                        name="nombre"
                        value={nuevoDistrito.nombre}
                        onChange={handleChange}
                        required
                        className="form-control-lg fs-6"
                    />
                </Form.Group>

                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-secondary">Zona Geográfica</Form.Label>
                            <Form.Select 
                                name="zona" 
                                value={nuevoDistrito.zona} 
                                onChange={handleChange}
                                className="form-select-lg fs-6"
                            >
                                <option value="Norte">Norte</option>
                                <option value="Sur">Sur</option>
                                <option value="Central">Central</option>
                                <option value="Rural">Rural</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-secondary">Población (aprox)</Form.Label>
                            <Form.Control 
                                type="number" 
                                placeholder="0" 
                                name="poblacion_est"
                                value={nuevoDistrito.poblacion_est}
                                onChange={handleChange}
                                className="form-control-lg fs-6"
                            />
                        </Form.Group>
                    </Col>
                </Row>

            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
                <Button variant="light" onClick={() => setShowModal(false)} disabled={loading}>
                    Cancelar
                </Button>
                <Button variant="primary" type="submit" disabled={loading} className="px-4 shadow-sm">
                    {loading ? (
                        <>
                           <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2"/>
                           Guardando...
                        </>
                    ) : (
                        <>
                           <Save size={18} className="me-2"/> Guardar Registro
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Form>
      </Modal>

    </div>
  );
};

export default Catalogos;