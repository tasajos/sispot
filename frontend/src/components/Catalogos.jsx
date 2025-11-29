import { useEffect, useState } from 'react';
import axios from 'axios';
import { Tab, Nav, Table, Badge, Button, Row, Col, Card, Modal, Form, Alert } from 'react-bootstrap';
import { Map, MapPin, Layers, Plus, CheckCircle, Pencil, Trash2, AlertTriangle, Activity, Search, Save } from 'lucide-react';

const Catalogos = () => {
  const [key, setKey] = useState('distritos');
  
  // --- DATOS ---
  const [distritos, setDistritos] = useState([]);
  const [otbs, setOtbs] = useState([]);
  const [areas, setAreas] = useState([]);
  const [problemas, setProblemas] = useState([]);
  const [diagnosticos, setDiagnosticos] = useState([]);

  // --- MODALES (VISIBILIDAD) ---
  const [showModalDistrito, setShowModalDistrito] = useState(false);
  const [showModalOtb, setShowModalOtb] = useState(false);
  const [showModalProblema, setShowModalProblema] = useState(false);
  const [showModalDiagnostico, setShowModalDiagnostico] = useState(false);

  // --- EDICIÓN ---
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEdicion, setIdEdicion] = useState(null);

  // --- UI STATE ---
  const [loading, setLoading] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [filtroOtb, setFiltroOtb] = useState('');

  // --- FORMULARIOS (ESTADO INICIAL) ---
  const initialDistrito = { nombre: '', zona: 'Centro', poblacion_est: '' };
  const initialOtb = { nombre: '', distrito_id: '' };
  const initialProblema = { nombre: '', area_id: '' };
  const initialDiagnostico = { otb_id: '', problema_id: '', prioridad: 'Alta' };

  const [formDistrito, setFormDistrito] = useState(initialDistrito);
  const [formOtb, setFormOtb] = useState(initialOtb);
  const [formProblema, setFormProblema] = useState(initialProblema);
  const [formDiagnostico, setFormDiagnostico] = useState(initialDiagnostico);

  // 1. CARGAR DATOS
  const cargarDatos = async () => {
    try {
      const [resDist, resOtbs, resAreas, resProb, resDiag] = await Promise.all([
        axios.get('http://localhost:3310/api/catalogos/distritos'),
        axios.get('http://localhost:3310/api/catalogos/otbs'),
        axios.get('http://localhost:3310/api/catalogos/areas'),
        axios.get('http://localhost:3310/api/catalogos/problemas'),
        axios.get('http://localhost:3310/api/catalogos/diagnostico')
      ]);
      setDistritos(resDist.data);
      setOtbs(resOtbs.data);
      setAreas(resAreas.data);
      setProblemas(resProb.data);
      setDiagnosticos(resDiag.data);
    } catch (error) { console.error("Error cargando datos", error); }
  };

  useEffect(() => { cargarDatos(); }, []);

  // --- APERTURA DE MODALES ---
  const abrirModalNuevo = (tipo) => {
      setModoEdicion(false); setIdEdicion(null); setMensajeExito('');
      
      if(tipo === 'distrito') { setFormDistrito(initialDistrito); setShowModalDistrito(true); }
      if(tipo === 'otb') { setFormOtb(initialOtb); setShowModalOtb(true); }
      if(tipo === 'problema') { setFormProblema(initialProblema); setShowModalProblema(true); }
      if(tipo === 'diagnostico') { setFormDiagnostico(initialDiagnostico); setShowModalDiagnostico(true); }
  };

  const abrirModalEditarOtb = (item) => {
      setModoEdicion(true); setIdEdicion(item.id); setMensajeExito('');
      // Buscamos el ID del distrito basado en el nombre que viene de la tabla (join)
      const dist = distritos.find(d => d.nombre === item.distrito); 
      setFormOtb({ nombre: item.nombre, distrito_id: dist ? dist.id : '' }); 
      setShowModalOtb(true);
  };

  const abrirModalEditarDistrito = (item) => {
      setModoEdicion(true); setIdEdicion(item.id); setMensajeExito('');
      setFormDistrito({ nombre: item.nombre, zona: item.zona, poblacion_est: item.poblacion_est });
      setShowModalDistrito(true);
  };

  // --- FUNCIONES CRUD ---

  // A. Guardar Distrito
  const guardarDistrito = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
        if (modoEdicion) await axios.put(`http://localhost:3310/api/catalogos/distritos/${idEdicion}`, formDistrito);
        else await axios.post('http://localhost:3310/api/catalogos/distritos', formDistrito);
        finalizarGuardado('Distrito guardado correctamente', setShowModalDistrito);
    } catch (err) { handleError(err); }
  };

  // B. Guardar OTB
  const guardarOtb = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
        if (modoEdicion) await axios.put(`http://localhost:3310/api/catalogos/otbs/${idEdicion}`, formOtb);
        else await axios.post('http://localhost:3310/api/catalogos/otbs', formOtb);
        finalizarGuardado('OTB guardada correctamente', setShowModalOtb);
    } catch (err) { handleError(err); }
  };

  // C. Guardar Problema (ESTA ES LA QUE FALTABA O DABA ERROR)
  const guardarProblema = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
        await axios.post('http://localhost:3310/api/catalogos/problemas', formProblema);
        finalizarGuardado('Tipo de problema agregado', setShowModalProblema);
    } catch (err) { handleError(err); }
  };

  // D. Guardar Diagnóstico
  const guardarDiagnostico = async (e) => {
      e.preventDefault(); setLoading(true);
      try {
          await axios.post('http://localhost:3310/api/catalogos/diagnostico', formDiagnostico);
          finalizarGuardado('Problema asignado a la OTB', setShowModalDiagnostico);
      } catch (err) { 
          setLoading(false);
          alert(err.response?.data?.message || "Error al asignar");
      }
  };

  // E. Eliminar Genérico
  const eliminarRegistro = async (id, endpoint) => {
      if(!window.confirm(`¿Estás seguro de eliminar este registro?`)) return;
      try {
          await axios.delete(`http://localhost:3310/api/${endpoint}/${id}`);
          cargarDatos();
      } catch (err) { alert("No se puede eliminar (posiblemente tenga datos relacionados)."); }
  };

  // Helpers
  const finalizarGuardado = (mensaje, setModal) => {
      setMensajeExito(mensaje); cargarDatos();
      setTimeout(() => { setModal(false); setMensajeExito(''); setLoading(false); }, 1500);
  };
  const handleError = (err) => { console.error(err); setLoading(false); alert("Error de conexión"); };

  // Helper visual para zonas
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

  const otbsFiltradas = otbs.filter(o => o.nombre.toLowerCase().includes(filtroOtb.toLowerCase()));

  return (
    <div className="d-flex flex-column h-100 w-100">
      <div className="mb-4">
         <h4 className="fw-bold mb-0 text-dark">Catálogos Municipales</h4>
         <small className="text-muted">Gestión de territorio y diagnóstico</small>
      </div>

      <div className="flex-grow-1 bg-white rounded-4 shadow-sm border p-4 overflow-hidden d-flex flex-column">
        <Tab.Container activeKey={key} onSelect={(k) => setKey(k)}>
          <Row className="h-100 g-0">
            
            {/* MENU LATERAL */}
            <Col md={3} className="border-end pe-3 d-flex flex-column h-100">
              <Nav variant="pills" className="flex-column gap-2">
                <Nav.Item><Nav.Link eventKey="distritos" className="d-flex align-items-center gap-2 py-3"><Map size={18} /> Distritos</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="otbs" className="d-flex align-items-center gap-2 py-3"><MapPin size={18} /> OTBs / Barrios</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="temas" className="d-flex align-items-center gap-2 py-3"><Layers size={18} /> Áreas y Problemas</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="diagnostico" className="d-flex align-items-center gap-2 py-3"><Activity size={18} /> Diagnóstico Barrial</Nav.Link></Nav.Item>
              </Nav>
              
              <div className="mt-auto p-3 bg-light rounded text-center border">
                 <small className="text-muted d-block mb-2 fw-bold">Acciones</small>
                 {key === 'distritos' && <Button onClick={() => abrirModalNuevo('distrito')} variant="primary" className="w-100 d-flex gap-2 justify-content-center shadow-sm"><Plus size={16}/> Nuevo Distrito</Button>}
                 {key === 'otbs' && <Button onClick={() => abrirModalNuevo('otb')} variant="success" className="w-100 d-flex gap-2 justify-content-center shadow-sm"><Plus size={16}/> Nueva OTB</Button>}
                 {key === 'temas' && <Button onClick={() => abrirModalNuevo('problema')} variant="warning" className="w-100 d-flex gap-2 justify-content-center shadow-sm text-white"><Plus size={16}/> Nuevo Problema</Button>}
                 {key === 'diagnostico' && <Button onClick={() => abrirModalNuevo('diagnostico')} variant="dark" className="w-100 d-flex gap-2 justify-content-center shadow-sm"><Plus size={16}/> Asignar Problema</Button>}
              </div>
            </Col>

            {/* CONTENIDO PRINCIPAL */}
            <Col md={9} className="ps-3 h-100 overflow-auto custom-scroll">
              <Tab.Content className="h-100">
                
                {/* 1. DISTRITOS */}
                <Tab.Pane eventKey="distritos">
                  <h5 className="fw-bold text-dark mb-3 ps-2 border-start border-4 border-primary">Listado de Distritos</h5>
                  <Table hover responsive className="align-middle">
                    <thead className="bg-light small"><tr><th>Nombre</th><th>Zona</th><th className="text-center">Población</th><th className="text-center">OTBs</th><th className="text-end">Acciones</th></tr></thead>
                    <tbody>
                      {distritos.map(d => (
                        <tr key={d.id}>
                          <td className="fw-bold">{d.nombre}</td>
                          <td><Badge bg={getZonaVariant(d.zona)}>{d.zona}</Badge></td>
                          <td className="text-center small">{d.poblacion_est.toLocaleString()}</td>
                          <td className="text-center fw-bold">{d.total_otbs}</td>
                          <td className="text-end">
                              <Button variant="link" className="p-0 me-2 text-secondary" onClick={() => abrirModalEditarDistrito(d)}><Pencil size={16} /></Button>
                              <Button variant="link" className="p-0 text-danger" onClick={() => eliminarRegistro(d.id, 'catalogos/distritos')}><Trash2 size={16} /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Tab.Pane>

                {/* 2. OTBs */}
                <Tab.Pane eventKey="otbs">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold text-dark m-0 ps-2 border-start border-4 border-success">OTBs Registradas</h5>
                      <div className="d-flex align-items-center gap-2 border rounded px-2 bg-light">
                          <Search size={14} className="text-muted"/>
                          <input type="text" placeholder="Buscar OTB..." className="border-0 bg-transparent p-1 small" style={{outline:'none'}} onChange={e => setFiltroOtb(e.target.value)}/>
                      </div>
                  </div>
                  <Table hover responsive size="sm" className="align-middle">
                    <thead className="bg-light small"><tr><th>#</th><th>Nombre OTB</th><th>Distrito</th><th className="text-end">Acciones</th></tr></thead>
                    <tbody>
                      {otbsFiltradas.map((o, idx) => (
                        <tr key={o.id}>
                          <td className="text-muted">{idx + 1}</td>
                          <td className="fw-bold">{o.nombre}</td>
                          <td><Badge bg="light" text="dark" className="border">{o.distrito}</Badge></td>
                          <td className="text-end">
                              <Button variant="link" className="p-0 me-2 text-secondary" onClick={() => abrirModalEditarOtb(o)}><Pencil size={14} /></Button>
                              <Button variant="link" className="p-0 text-danger" onClick={() => eliminarRegistro(o.id, 'catalogos/otbs')}><Trash2 size={14} /></Button>
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
                                           <div className="d-flex flex-wrap gap-1 align-items-center">
                                               {problemas.filter(p => p.area === area.nombre).map(p => (
                                                   <Badge key={p.id} bg="white" text="secondary" className="border fw-normal d-flex align-items-center gap-1">
                                                       {p.nombre}
                                                       <span className="text-danger cursor-pointer ms-1" onClick={() => eliminarRegistro(p.id, 'catalogos/problemas')}>&times;</span>
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

                {/* 4. DIAGNÓSTICO */}
                <Tab.Pane eventKey="diagnostico">
                    <h5 className="fw-bold text-dark mb-3 ps-2 border-start border-4 border-dark">Diagnóstico por OTB</h5>
                    
                    <Row>
                        {diagnosticos.length === 0 && <Col><div className="text-center p-5 border border-dashed rounded text-muted">Aún no hay diagnósticos asignados.</div></Col>}
                        
                        {diagnosticos.map((diag) => (
                             <Col md={12} key={diag.id} className="mb-2">
                                 <Card className="border-0 shadow-sm border-start border-3 border-danger">
                                     <Card.Body className="py-2 px-3 d-flex justify-content-between align-items-center">
                                         <div>
                                             <div className="fw-bold text-dark d-flex align-items-center gap-2">
                                                 {diag.otb}
                                                 <Badge bg="light" text="dark" className="border text-muted fw-normal" style={{fontSize:'0.65rem'}}>{diag.distrito}</Badge>
                                             </div>
                                             <div className="text-muted small d-flex align-items-center gap-1">
                                                 <AlertTriangle size={12} className="text-danger"/>
                                                 {diag.problema} <span className="text-muted fst-italic">({diag.area})</span>
                                             </div>
                                         </div>
                                         <div className="d-flex align-items-center gap-3">
                                             <Badge bg={diag.prioridad === 'Alta' ? 'danger' : 'warning'}>{diag.prioridad}</Badge>
                                             <Button variant="link" className="p-0 text-muted" onClick={() => eliminarRegistro(diag.id, 'catalogos/diagnostico')}><Trash2 size={14}/></Button>
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

      {/* 1. MODAL DISTRITO */}
      <Modal show={showModalDistrito} onHide={() => setShowModalDistrito(false)} centered>
        <Modal.Header closeButton><Modal.Title className="h6 fw-bold">{modoEdicion ? 'Editar Distrito' : 'Nuevo Distrito'}</Modal.Title></Modal.Header>
        <Form onSubmit={guardarDistrito}>
            <Modal.Body>
                {mensajeExito && <Alert variant="success"><CheckCircle size={16}/> {mensajeExito}</Alert>}
                <Form.Group className="mb-3"><Form.Label>Nombre</Form.Label><Form.Control required type="text" value={formDistrito.nombre} onChange={e => setFormDistrito({...formDistrito, nombre: e.target.value})} /></Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Zona Geográfica</Form.Label>
                    <Form.Select value={formDistrito.zona} onChange={e => setFormDistrito({...formDistrito, zona: e.target.value})}>
                        <option value="Norte">Norte</option><option value="Sur">Sur</option><option value="Este">Este</option><option value="Oeste">Oeste</option><option value="Centro">Centro</option>
                    </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3"><Form.Label>Población Aprox.</Form.Label><Form.Control type="number" value={formDistrito.poblacion_est} onChange={e => setFormDistrito({...formDistrito, poblacion_est: e.target.value})} /></Form.Group>
            </Modal.Body>
            <Modal.Footer><Button type="submit" disabled={loading}>{loading ? 'Guardando...' : (modoEdicion ? 'Actualizar' : 'Guardar')}</Button></Modal.Footer>
        </Form>
      </Modal>

      {/* 2. MODAL OTB */}
      <Modal show={showModalOtb} onHide={() => setShowModalOtb(false)} centered>
        <Modal.Header closeButton className="bg-success text-white"><Modal.Title className="h6 fw-bold">{modoEdicion ? 'Editar OTB' : 'Nueva OTB'}</Modal.Title></Modal.Header>
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
            <Modal.Footer><Button variant="success" type="submit" disabled={loading}>{loading ? 'Guardando...' : (modoEdicion ? 'Actualizar' : 'Registrar')}</Button></Modal.Footer>
        </Form>
      </Modal>

      {/* 3. MODAL PROBLEMA (Ahora sí con la función correcta) */}
      <Modal show={showModalProblema} onHide={() => setShowModalProblema(false)} centered>
        <Modal.Header closeButton className="bg-warning"><Modal.Title className="h6 fw-bold text-dark">Nuevo Tipo de Problema</Modal.Title></Modal.Header>
        <Form onSubmit={guardarProblema}>
            <Modal.Body>
                {mensajeExito && <Alert variant="success"><CheckCircle size={16}/> {mensajeExito}</Alert>}
                <Form.Group className="mb-3"><Form.Label>Descripción</Form.Label><Form.Control required type="text" placeholder="Ej: Falta de alumbrado" value={formProblema.nombre} onChange={e => setFormProblema({...formProblema, nombre: e.target.value})} /></Form.Group>
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

      {/* 4. MODAL DIAGNÓSTICO */}
      <Modal show={showModalDiagnostico} onHide={() => setShowModalDiagnostico(false)} centered>
        <Modal.Header closeButton className="bg-dark text-white"><Modal.Title className="h6 fw-bold">Asignar Problema a OTB</Modal.Title></Modal.Header>
        <Form onSubmit={guardarDiagnostico}>
            <Modal.Body>
                {mensajeExito && <Alert variant="success"><CheckCircle size={16}/> {mensajeExito}</Alert>}
                <Form.Group className="mb-3"><Form.Label>Seleccione la OTB:</Form.Label>
                    <Form.Select required value={formDiagnostico.otb_id} onChange={e => setFormDiagnostico({...formDiagnostico, otb_id: e.target.value})}>
                        <option value="">-- Buscar OTB --</option>
                        {otbs.map(o => (<option key={o.id} value={o.id}>{o.nombre} ({o.distrito})</option>))}
                    </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3"><Form.Label>Problema Principal:</Form.Label>
                    <Form.Select required value={formDiagnostico.problema_id} onChange={e => setFormDiagnostico({...formDiagnostico, problema_id: e.target.value})}>
                        <option value="">-- Seleccione Problema --</option>
                        {problemas.map(p => (<option key={p.id} value={p.id}>{p.nombre} ({p.area})</option>))}
                    </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3"><Form.Label>Prioridad:</Form.Label>
                    <Form.Select value={formDiagnostico.prioridad} onChange={e => setFormDiagnostico({...formDiagnostico, prioridad: e.target.value})}>
                        <option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option>
                    </Form.Select>
                </Form.Group>
            </Modal.Body>
            <Modal.Footer><Button variant="dark" type="submit" disabled={loading}>Asignar Problema</Button></Modal.Footer>
        </Form>
      </Modal>

    </div>
  );
};

export default Catalogos;