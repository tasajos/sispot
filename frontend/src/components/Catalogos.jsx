import { useEffect, useState } from 'react';
import axios from 'axios';
import { Tab, Nav, Table, Badge, Button, Row, Col, Card, Modal, Form, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Map, MapPin, Layers, Plus, Save, CheckCircle, Pencil, Trash2, AlertTriangle } from 'lucide-react';

const Catalogos = () => {
  const [key, setKey] = useState('distritos');
  
  // --- DATOS ---
  const [distritos, setDistritos] = useState([]);
  const [otbs, setOtbs] = useState([]);
  const [areas, setAreas] = useState([]);
  const [problemas, setProblemas] = useState([]);

  // --- MODALES ---
  const [showModalDistrito, setShowModalDistrito] = useState(false);
  const [showModalOtb, setShowModalOtb] = useState(false);
  const [showModalProblema, setShowModalProblema] = useState(false);

  // --- ESTADOS DE EDICIÓN ---
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEdicion, setIdEdicion] = useState(null);

  // --- ESTADOS DE CARGA Y FEEDBACK ---
  const [loading, setLoading] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  // --- FORMULARIOS ---
  const initialDistrito = { nombre: '', zona: 'Centro', poblacion_est: '' };
  const [formDistrito, setFormDistrito] = useState(initialDistrito);
  
  const initialOtb = { nombre: '', distrito_id: '' };
  const [formOtb, setFormOtb] = useState(initialOtb);
  
  const initialProblema = { nombre: '', area_id: '' };
  const [formProblema, setFormProblema] = useState(initialProblema);

  // 1. CARGAR DATOS
  const cargarDatos = async () => {
    try {
      const [resDist, resOtbs, resAreas, resProb] = await Promise.all([
        axios.get('http://localhost:3310/api/catalogos/distritos'),
        axios.get('http://localhost:3310/api/catalogos/otbs'),
        axios.get('http://localhost:3310/api/catalogos/areas'),
        axios.get('http://localhost:3310/api/catalogos/problemas')
      ]);
      setDistritos(resDist.data);
      setOtbs(resOtbs.data);
      setAreas(resAreas.data);
      setProblemas(resProb.data);
    } catch (error) {
      console.error("Error cargando datos", error);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  // --- LOGICA DE APERTURA DE MODALES (CREAR vs EDITAR) ---
  const abrirModalNuevo = (tipo) => {
      setModoEdicion(false);
      setIdEdicion(null);
      setMensajeExito('');
      
      if(tipo === 'distrito') { setFormDistrito(initialDistrito); setShowModalDistrito(true); }
      if(tipo === 'otb') { setFormOtb(initialOtb); setShowModalOtb(true); }
      if(tipo === 'problema') { setFormProblema(initialProblema); setShowModalProblema(true); }
  };

  const abrirModalEditarDistrito = (item) => {
      setModoEdicion(true);
      setIdEdicion(item.id);
      setMensajeExito('');
      setFormDistrito({ nombre: item.nombre, zona: item.zona, poblacion_est: item.poblacion_est });
      setShowModalDistrito(true);
  };

  // --- FUNCIONES CRUD (CREAR / EDITAR / ELIMINAR) ---

  // A. Guardar/Editar Distrito
  const guardarDistrito = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        if (modoEdicion) {
            await axios.put(`http://localhost:3310/api/catalogos/distritos/${idEdicion}`, formDistrito);
            finalizarGuardado('Distrito actualizado correctamente', setShowModalDistrito);
        } else {
            await axios.post('http://localhost:3310/api/catalogos/distritos', formDistrito);
            finalizarGuardado('Distrito creado con éxito', setShowModalDistrito);
        }
    } catch (err) { handleError(err); }
  };

  // B. Eliminar Genérico
  const eliminarRegistro = async (id, tipo, endpoint) => {
      if(!window.confirm(`¿Estás seguro de eliminar este ${tipo}?`)) return;
      try {
          await axios.delete(`http://localhost:3310/api/${endpoint}/${id}`);
          cargarDatos();
      } catch (err) {
          alert("No se puede eliminar. Puede que tenga datos relacionados.");
      }
  };

  // C. Guardar OTB
  const guardarOtb = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        await axios.post('http://localhost:3310/api/catalogos/otbs', formOtb);
        finalizarGuardado('OTB registrada correctamente', setShowModalOtb);
    } catch (err) { handleError(err); }
  };

  // D. Guardar Problema
  const guardarProblema = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        await axios.post('http://localhost:3310/api/catalogos/problemas', formProblema);
        finalizarGuardado('Tipo de problema agregado', setShowModalProblema);
    } catch (err) { handleError(err); }
  };

  // Helpers
  const finalizarGuardado = (mensaje, setModal) => {
      setMensajeExito(mensaje);
      cargarDatos();
      setTimeout(() => {
          setModal(false);
          setMensajeExito('');
          setLoading(false);
      }, 1500);
  };

  const handleError = (err) => {
      console.error(err);
      setLoading(false);
      alert("Error al procesar la solicitud");
  };

  const getZonaVariant = (zona) => {
      switch(zona) {
          case 'Norte': return 'success';
          case 'Sur': return 'warning';
          case 'Este': return 'info';
          case 'Oeste': return 'primary';
          case 'Centro': return 'secondary';
          default: return 'light';
      }
  };

  return (
    <div className="d-flex flex-column h-100 w-100">
      <div className="mb-4">
         <h4 className="fw-bold mb-0 text-dark">Catálogos Municipales</h4>
         <small className="text-muted">Configuración territorial y temática</small>
      </div>

      <div className="flex-grow-1 bg-white rounded-4 shadow-sm border p-4 overflow-hidden d-flex flex-column">
        <Tab.Container activeKey={key} onSelect={(k) => setKey(k)}>
          <Row className="h-100 g-0">
            
            {/* SIDEBAR INTERNO */}
            <Col md={3} className="border-end pe-3 d-flex flex-column h-100">
              <Nav variant="pills" className="flex-column gap-2">
                <Nav.Item><Nav.Link eventKey="distritos" className="d-flex align-items-center gap-2 py-3"><Map size={18} /> Distritos</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="otbs" className="d-flex align-items-center gap-2 py-3"><MapPin size={18} /> OTBs / Barrios</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="temas" className="d-flex align-items-center gap-2 py-3"><Layers size={18} /> Áreas y Problemas</Nav.Link></Nav.Item>
              </Nav>
              
              {/* BOTONES DE ACCIÓN */}
              <div className="mt-auto p-3 bg-light rounded text-center border">
                 <small className="text-muted d-block mb-2 fw-bold">Acciones</small>
                 {key === 'distritos' && (
                     <Button onClick={() => abrirModalNuevo('distrito')} variant="primary" className="w-100 d-flex gap-2 justify-content-center shadow-sm"><Plus size={16}/> Nuevo Distrito</Button>
                 )}
                 {key === 'otbs' && (
                     <Button onClick={() => abrirModalNuevo('otb')} variant="success" className="w-100 d-flex gap-2 justify-content-center shadow-sm"><Plus size={16}/> Nueva OTB</Button>
                 )}
                 {key === 'temas' && (
                     <Button onClick={() => abrirModalNuevo('problema')} variant="warning" className="w-100 d-flex gap-2 justify-content-center shadow-sm text-white"><Plus size={16}/> Nuevo Problema</Button>
                 )}
              </div>
            </Col>

            {/* CONTENIDO TABLAS */}
            <Col md={9} className="ps-3 h-100 overflow-auto custom-scroll">
              <Tab.Content className="h-100">
                
                {/* 1. DISTRITOS */}
                <Tab.Pane eventKey="distritos">
                  <h5 className="fw-bold text-dark mb-3 ps-2 border-start border-4 border-primary">Listado de Distritos</h5>
                  <Table hover responsive className="align-middle">
                    <thead className="bg-light small text-uppercase"><tr><th>Nombre</th><th>Zona</th><th className="text-center">Población</th><th className="text-center">OTBs</th><th className="text-end">Acciones</th></tr></thead>
                    <tbody>
                      {distritos.map(d => (
                        <tr key={d.id}>
                          <td className="fw-bold">{d.nombre}</td>
                          <td><Badge bg={getZonaVariant(d.zona)}>{d.zona}</Badge></td>
                          <td className="text-center small">{d.poblacion_est.toLocaleString()}</td>
                          <td className="text-center fw-bold">{d.total_otbs}</td>
                          <td className="text-end">
                              <Button variant="link" className="p-0 me-2 text-secondary" onClick={() => abrirModalEditarDistrito(d)}>
                                  <Pencil size={16} />
                              </Button>
                              <Button variant="link" className="p-0 text-danger" onClick={() => eliminarRegistro(d.id, 'distrito', 'catalogos/distritos')}>
                                  <Trash2 size={16} />
                              </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Tab.Pane>

                {/* 2. OTBs */}
                <Tab.Pane eventKey="otbs">
                  <h5 className="fw-bold text-dark mb-3 ps-2 border-start border-4 border-success">OTBs Registradas</h5>
                  <Table hover responsive size="sm">
                    <thead className="bg-light small"><tr><th>#</th><th>Nombre OTB</th><th>Distrito</th><th className="text-end">Acciones</th></tr></thead>
                    <tbody>
                      {otbs.map((o, idx) => (
                        <tr key={o.id}>
                          <td className="text-muted">{idx + 1}</td>
                          <td className="fw-bold">{o.nombre}</td>
                          <td><Badge bg="light" text="dark" className="border">{o.distrito}</Badge></td>
                          <td className="text-end">
                              <Button variant="link" className="p-0 text-danger" onClick={() => eliminarRegistro(o.id, 'OTB', 'catalogos/otbs')}>
                                  <Trash2 size={14} />
                              </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Tab.Pane>

                {/* 3. TEMAS */}
                <Tab.Pane eventKey="temas">
                   <h5 className="fw-bold text-dark mb-3 ps-2 border-start border-4 border-warning">Áreas y Tipos de Problema</h5>
                   <Row>
                       {areas.map(area => (
                           <Col md={6} key={area.id} className="mb-3">
                               <Card className="h-100 border shadow-sm">
                                   <Card.Body>
                                       <div className="d-flex align-items-center gap-2 mb-3">
                                           <div className="bg-light p-2 rounded-circle text-warning"><Layers size={20}/></div>
                                           <h6 className="fw-bold m-0">{area.nombre}</h6>
                                       </div>
                                       <div className="ps-2 border-start border-3 border-light">
                                           <small className="text-muted d-block mb-2">Problemas registrados:</small>
                                           <div className="d-flex flex-wrap gap-1 align-items-center">
                                               {problemas.filter(p => p.area === area.nombre).map(p => (
                                                   <Badge key={p.id} bg="white" text="secondary" className="border fw-normal d-flex align-items-center gap-1">
                                                       {p.nombre}
                                                       <span className="text-danger cursor-pointer ms-1" onClick={() => eliminarRegistro(p.id, 'problema', 'catalogos/problemas')}>&times;</span>
                                                   </Badge>
                                               ))}
                                               {problemas.filter(p => p.area === area.nombre).length === 0 && <span className="text-muted small fst-italic">Sin registros</span>}
                                           </div>
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

      {/* ================= MODALES ================= */}

      {/* 1. MODAL DISTRITO (CREAR / EDITAR) */}
      <Modal show={showModalDistrito} onHide={() => setShowModalDistrito(false)} centered>
        <Modal.Header closeButton><Modal.Title className="h6 fw-bold">{modoEdicion ? 'Editar Distrito' : 'Nuevo Distrito'}</Modal.Title></Modal.Header>
        <Form onSubmit={guardarDistrito}>
            <Modal.Body>
                {mensajeExito && <Alert variant="success"><CheckCircle size={16}/> {mensajeExito}</Alert>}
                <Form.Group className="mb-3"><Form.Label>Nombre</Form.Label><Form.Control required type="text" value={formDistrito.nombre} onChange={e => setFormDistrito({...formDistrito, nombre: e.target.value})} /></Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Zona Geográfica</Form.Label>
                    <Form.Select value={formDistrito.zona} onChange={e => setFormDistrito({...formDistrito, zona: e.target.value})}>
                        <option value="Norte">Norte</option>
                        <option value="Sur">Sur</option>
                        <option value="Este">Este</option>
                        <option value="Oeste">Oeste</option>
                        <option value="Centro">Centro</option>
                    </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3"><Form.Label>Población Aprox.</Form.Label><Form.Control type="number" value={formDistrito.poblacion_est} onChange={e => setFormDistrito({...formDistrito, poblacion_est: e.target.value})} /></Form.Group>
            </Modal.Body>
            <Modal.Footer><Button type="submit" disabled={loading}>{loading ? 'Guardando...' : (modoEdicion ? 'Actualizar' : 'Guardar')}</Button></Modal.Footer>
        </Form>
      </Modal>

      {/* 2. MODAL OTB */}
      <Modal show={showModalOtb} onHide={() => setShowModalOtb(false)} centered>
        <Modal.Header closeButton className="bg-success text-white"><Modal.Title className="h6 fw-bold">Nueva OTB / Barrio</Modal.Title></Modal.Header>
        <Form onSubmit={guardarOtb}>
            <Modal.Body>
                {mensajeExito && <Alert variant="success"><CheckCircle size={16}/> {mensajeExito}</Alert>}
                <Form.Group className="mb-3"><Form.Label>Nombre OTB</Form.Label><Form.Control required type="text" value={formOtb.nombre} onChange={e => setFormOtb({...formOtb, nombre: e.target.value})} /></Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Distrito:</Form.Label>
                    <Form.Select required value={formOtb.distrito_id} onChange={e => setFormOtb({...formOtb, distrito_id: e.target.value})}>
                        <option value="">-- Seleccione --</option>
                        {distritos.map(d => (<option key={d.id} value={d.id}>{d.nombre} ({d.zona})</option>))}
                    </Form.Select>
                </Form.Group>
            </Modal.Body>
            <Modal.Footer><Button variant="success" type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Registrar'}</Button></Modal.Footer>
        </Form>
      </Modal>

      {/* 3. MODAL PROBLEMA */}
      <Modal show={showModalProblema} onHide={() => setShowModalProblema(false)} centered>
        <Modal.Header closeButton className="bg-warning"><Modal.Title className="h6 fw-bold text-dark">Nuevo Tipo de Problema</Modal.Title></Modal.Header>
        <Form onSubmit={guardarProblema}>
            <Modal.Body>
                {mensajeExito && <Alert variant="success"><CheckCircle size={16}/> {mensajeExito}</Alert>}
                <Form.Group className="mb-3"><Form.Label>Descripción</Form.Label><Form.Control required type="text" value={formProblema.nombre} onChange={e => setFormProblema({...formProblema, nombre: e.target.value})} /></Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Área Temática:</Form.Label>
                    <Form.Select required value={formProblema.area_id} onChange={e => setFormProblema({...formProblema, area_id: e.target.value})}>
                        <option value="">-- Seleccione --</option>
                        {areas.map(a => (<option key={a.id} value={a.id}>{a.nombre}</option>))}
                    </Form.Select>
                </Form.Group>
            </Modal.Body>
            <Modal.Footer><Button variant="warning" type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button></Modal.Footer>
        </Form>
      </Modal>

    </div>
  );
};

export default Catalogos;