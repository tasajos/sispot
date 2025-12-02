import { useEffect, useState } from 'react';
import axios from 'axios';
import { Tab, Nav, Table, Badge, Button, Row, Col, Card, Modal, Form, Alert } from 'react-bootstrap';
import { Map, MapPin, Layers, Plus, CheckCircle, Pencil, Trash2, AlertTriangle, Activity, Search, Landmark } from 'lucide-react';
import './styles/catalogos.css';

const Catalogos = () => {
  const [key, setKey] = useState('subalcaldias');
  
  // DATOS
  const [subalcaldias, setSubalcaldias] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [otbs, setOtbs] = useState([]);
  const [areas, setAreas] = useState([]);
  const [problemas, setProblemas] = useState([]);
  const [diagnosticos, setDiagnosticos] = useState([]);

  // ESTADOS MODALES
  const [showModalSub, setShowModalSub] = useState(false);
  const [showModalDistrito, setShowModalDistrito] = useState(false);
  const [showModalOtb, setShowModalOtb] = useState(false);
  const [showModalArea, setShowModalArea] = useState(false);
  const [showModalProblema, setShowModalProblema] = useState(false);
  const [showModalDiagnostico, setShowModalDiagnostico] = useState(false);
  const [otbSeleccionada, setOtbSeleccionada] = useState(null);
  const [showModalDetalleDistrito, setShowModalDetalleDistrito] = useState(false);
const [distritoSeleccionado, setDistritoSeleccionado] = useState(null);

  // EDICION Y CARGA
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEdicion, setIdEdicion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [filtroOtb, setFiltroOtb] = useState('');

  // FORMULARIOS
  const initialSub = { nombre: '', responsable: '' };
  const initialDistrito = { nombre: '', zona: 'Norte', poblacion_est: '', subalcaldia_id: '' };
  const initialOtb = { nombre: '', distrito_id: '' };
  const initialArea = { nombre: '' };
  const initialProblema = { nombre: '', area_id: '' };
  const initialDiagnostico = { otb_id: '', problema_id: '', prioridad: 'Alta' };



   // 👉 ORDENAR DISTRITOS POR POBLACIÓN (MAYOR → MENOR)
  const distritosOrdenados = [...distritos].sort(
    (a, b) => Number(b.poblacion_est || 0) - Number(a.poblacion_est || 0)
  );

  // 👉 POBLACIÓN TOTAL
  const poblacionTotal = distritos.reduce(
    (sum, d) => sum + Number(d.poblacion_est || 0),
    0
  );

  const otbsDistrito = distritoSeleccionado
  ? otbs.filter((o) => o.distrito === distritoSeleccionado.nombre)
  : [];

const subalcaldiaDistrito = distritoSeleccionado
  ? subalcaldias.find((s) => s.id === distritoSeleccionado.subalcaldia_id)
  : null;


  const [formSub, setFormSub] = useState(initialSub);
  const [formDistrito, setFormDistrito] = useState(initialDistrito);
  const [formOtb, setFormOtb] = useState(initialOtb);
  const [formArea, setFormArea] = useState(initialArea);
  const [formProblema, setFormProblema] = useState(initialProblema);
  const [formDiagnostico, setFormDiagnostico] = useState(initialDiagnostico);



  const cargarDatos = async () => {
    try {
      const [resSub, resDist, resOtbs, resAreas, resProb, resDiag] = await Promise.all([
        axios.get('http://localhost:3310/api/catalogos/subalcaldias'),
        axios.get('http://localhost:3310/api/catalogos/distritos'),
        axios.get('http://localhost:3310/api/catalogos/otbs'),
        axios.get('http://localhost:3310/api/catalogos/areas'),
        axios.get('http://localhost:3310/api/catalogos/problemas'),
        axios.get('http://localhost:3310/api/catalogos/diagnostico')
      ]);
      setSubalcaldias(resSub.data);
      setDistritos(resDist.data);
      setOtbs(resOtbs.data);
      setAreas(resAreas.data);
      setProblemas(resProb.data);
      setDiagnosticos(resDiag.data);
    } catch (error) { console.error("Error cargando datos", error); }
  };

  useEffect(() => { cargarDatos(); }, []);

  // --- LOGICA MODALES ---
  const abrirModalNuevo = (tipo) => {
      setModoEdicion(false); setIdEdicion(null); setMensajeExito('');
      if(tipo === 'sub') { setFormSub(initialSub); setShowModalSub(true); }
      if(tipo === 'distrito') { setFormDistrito(initialDistrito); setShowModalDistrito(true); }
      if(tipo === 'otb') { setFormOtb(initialOtb); setShowModalOtb(true); }
      if(tipo === 'area') { setFormArea(initialArea); setShowModalArea(true); }
      if(tipo === 'problema') { setFormProblema(initialProblema); setShowModalProblema(true); }
      if(tipo === 'diagnostico') { setFormDiagnostico(initialDiagnostico); setShowModalDiagnostico(true); }
  };

  const abrirModalEditarSub = (item) => {
      setModoEdicion(true); setIdEdicion(item.id); setMensajeExito('');
      setFormSub({ nombre: item.nombre, responsable: item.responsable });
      setShowModalSub(true);
  };

  const abrirModalEditarDistrito = (item) => {
      setModoEdicion(true); setIdEdicion(item.id); setMensajeExito('');
      setFormDistrito({ 
          nombre: item.nombre, 
          zona: item.zona, 
          poblacion_est: item.poblacion_est,
          subalcaldia_id: item.subalcaldia_id || '' 
      });
      setShowModalDistrito(true);
  };

const abrirModalDetalleDistrito = (distrito) => {
  setDistritoSeleccionado(distrito);
  setShowModalDetalleDistrito(true);
};




  const abrirModalEditarOtb = (item) => {
      setModoEdicion(true); setIdEdicion(item.id); setMensajeExito('');
      // Buscar ID de distrito por nombre
      const dist = distritos.find(d => d.nombre === item.distrito);
      setFormOtb({ nombre: item.nombre, distrito_id: dist ? dist.id : '' });
      setShowModalOtb(true);
  };

  const abrirModalEditarDiagnostico = (item) => {
      setModoEdicion(true); setIdEdicion(item.id); setMensajeExito('');
      setFormDiagnostico({ otb_id: item.otb_id, problema_id: item.problema_id, prioridad: item.prioridad });
      setShowModalDiagnostico(true);
  };

  // --- GUARDAR DATOS ---
  const guardarGenerico = async (e, endpoint, formData, setModal, mensaje) => {
      e.preventDefault(); setLoading(true);
      try {
          if (modoEdicion) await axios.put(`http://localhost:3310/api/${endpoint}/${idEdicion}`, formData);
          else await axios.post(`http://localhost:3310/api/${endpoint}`, formData);
          setMensajeExito(mensaje); cargarDatos();
          setTimeout(() => { setModal(false); setMensajeExito(''); setLoading(false); }, 1500);
      } catch (err) { console.error(err); setLoading(false); alert("Error al guardar"); }
  };

  const eliminarRegistro = async (id, endpoint) => {
      if(!window.confirm("¿Eliminar registro?")) return;
      try { await axios.delete(`http://localhost:3310/api/${endpoint}/${id}`); cargarDatos(); }
      catch (err) { alert("No se puede eliminar, tiene datos dependientes."); }
  };

  const otbsFiltradas = otbs.filter(o => o.nombre.toLowerCase().includes(filtroOtb.toLowerCase()));
  const totalOtbsDistritos = distritos.reduce(
  (sum, d) => sum + Number(d.total_otbs || 0),
  0
);

  // Distritos que pertenecen a una subalcaldía
  const obtenerDistritosDeSub = (subId) =>
    distritos.filter(d => d.subalcaldia_id === subId);

  // Color visual para la zona
  const getZonaBadgeVariant = (zona) => {
    switch (zona) {
      case 'Norte':  return 'primary';
      case 'Sur':    return 'danger';
      case 'Este':   return 'success';
      case 'Oeste':  return 'warning';
      case 'Centro': return 'secondary';
      default:       return 'light';
    }
  };

  return (
    <div className="d-flex flex-column h-100 w-100">
      <div className="mb-4">
         <h4 className="fw-bold mb-0 text-dark">Catálogos Municipales</h4>
         <small className="text-muted">Gestión de territorio y diagnóstico</small>
      </div>

      <div className="flex-grow-1 bg-white rounded-4 shadow-sm border p-4 overflow-hidden d-flex flex-column">
        <Tab.Container activeKey={key} onSelect={(k) => setKey(k)}>
          <Row className="h-100 g-0">
            <Col md={3} className="border-end pe-3 d-flex flex-column h-100">
              <Nav variant="pills" className="flex-column gap-2">
                <Nav.Item><Nav.Link eventKey="subalcaldias" className="d-flex gap-2 py-3"><Landmark size={18}/> Subalcaldías</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="distritos" className="d-flex gap-2 py-3"><Map size={18}/> Distritos</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="otbs" className="d-flex gap-2 py-3"><MapPin size={18}/> OTBs / Barrios</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="temas" className="d-flex gap-2 py-3"><Layers size={18}/> Áreas y Problemas</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="diagnostico" className="d-flex gap-2 py-3"><Activity size={18}/> Diagnóstico Barrial</Nav.Link></Nav.Item>
              </Nav>
              <div className="mt-auto p-3 bg-light rounded text-center border">
                 <small className="text-muted d-block mb-2 fw-bold">Acciones</small>
                 {key === 'subalcaldias' && <Button onClick={() => abrirModalNuevo('sub')} variant="dark" className="w-100 d-flex gap-2 justify-content-center"><Plus size={16}/> Nueva Subalcaldía</Button>}
                 {key === 'distritos' && <Button onClick={() => abrirModalNuevo('distrito')} variant="primary" className="w-100 d-flex gap-2 justify-content-center"><Plus size={16}/> Nuevo Distrito</Button>}
                 {key === 'otbs' && <Button onClick={() => abrirModalNuevo('otb')} variant="success" className="w-100 d-flex gap-2 justify-content-center"><Plus size={16}/> Nueva OTB</Button>}
                 {key === 'temas' && <div className="d-flex gap-2"><Button onClick={() => abrirModalNuevo('area')} variant="outline-dark" className="w-50"><Plus size={16}/> Área</Button><Button onClick={() => abrirModalNuevo('problema')} variant="warning" className="w-50 text-white"><Plus size={16}/> Problema</Button></div>}
                 {key === 'diagnostico' && <Button onClick={() => abrirModalNuevo('diagnostico')} variant="secondary" className="w-100 d-flex gap-2 justify-content-center"><Plus size={16}/> Asignar</Button>}
              </div>
            </Col>

            <Col md={9} className="ps-3 h-100 overflow-auto custom-scroll">
              <Tab.Content className="h-100">
                {/* SUBALCALDIAS */}
               <Tab.Pane eventKey="subalcaldias">
  <div className="d-flex justify-content-between align-items-start mb-3 sub-header">
    <div>
      <h5 className="fw-bold mb-1 ps-2 border-start border-4 border-dark">
        Subalcaldías
      </h5>
      <small className="text-muted">
        Relación Subalcaldía → Distritos y responsable político
      </small>
    </div>

    <div className="text-end">
      <span className="badge bg-dark me-2 sub-pill">
        {subalcaldias.length} subalcaldías
      </span>
      <span className="badge bg-light text-dark border sub-pill">
        {distritos.length} distritos
      </span>
    </div>
  </div>

  <Row xs={1} md={2} className="g-3">
    {subalcaldias.map((s) => {
      const distritosSub = obtenerDistritosDeSub(s.id);

  

      return (
        <Col key={s.id}>
          <Card className="sub-card shadow-sm h-100">
            {/* HEADER */}
            <div className="sub-card-header">
              <div className="d-flex align-items-center gap-2">
                <div className="sub-icon-wrapper">
                  <Landmark size={18} />
                </div>
                <div>
                  <div className="fw-semibold">{s.nombre}</div>
                  <small className="text-white-50">ID #{s.id}</small>
                </div>
              </div>

              <div className="text-end">
                <div className="sub-chip-counter">
                  {distritosSub.length} distrito
                  {distritosSub.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* BODY */}
            <Card.Body className="sub-card-body">
              <div className="mb-3">
                <small className="text-muted d-block mb-1">
                  Responsable
                </small>
                {s.responsable ? (
                  <div className="d-flex align-items-center gap-2">
                    <div className="sub-avatar">
                      {s.responsable.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="fw-semibold small">
                        {s.responsable}
                      </div>
                      <small className="text-muted">Subalcalde/a</small>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted small fst-italic">
                    Sin responsable registrado
                  </span>
                )}
              </div>

              <div>
                <small className="text-muted d-block mb-1">
                  Distritos asignados
                </small>

                {distritosSub.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2 sub-distritos-wrapper">
                    {distritosSub.map((d) => (
                      <span
                        key={d.id}
                        className={`badge rounded-pill sub-distrito-badge bg-${getZonaBadgeVariant(
                          d.zona
                        )}`}
                      >
                        {d.nombre}
                      </span>
                    ))}
                  </div>
                ) : (
                  <small className="text-muted fst-italic">
                    Esta subalcaldía aún no tiene distritos vinculados.
                  </small>
                )}
              </div>
            </Card.Body>



<Modal
  show={showModalDetalleDistrito}
  onHide={() => setShowModalDetalleDistrito(false)}
  centered
  size="lg"
>
  <Modal.Header closeButton>
    <Modal.Title className="h6">
      {distritoSeleccionado
        ? `OTBs del ${distritoSeleccionado.nombre}`
        : 'OTBs del distrito'}
    </Modal.Title>
  </Modal.Header>

  <Modal.Body>
    {distritoSeleccionado && (
      <>
        {/* Resumen superior */}
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <small className="text-muted d-block mb-1">Zona</small>
              <div className="fw-semibold">
                {distritoSeleccionado.zona}{' '}
                <Badge
                  bg={getZonaBadgeVariant(distritoSeleccionado.zona)}
                  className="ms-1"
                >
                  Zona
                </Badge>
              </div>
            </div>

            <div>
              <small className="text-muted d-block mb-1">Subalcaldía</small>
              <div className="fw-semibold">
                {subalcaldiaDistrito
                  ? subalcaldiaDistrito.nombre
                  : 'Sin subalcaldía registrada'}
              </div>
            </div>

            <div>
              <small className="text-muted d-block mb-1">
                Población estimada
              </small>
              <div className="fw-semibold">
                {new Intl.NumberFormat('es-BO').format(
                  Number(distritoSeleccionado.poblacion_est || 0)
                )}{' '}
                personas
              </div>
            </div>
          </div>
        </div>

        <hr />

        {/* Listado de OTBs */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0">OTBs registradas</h6>
          <Badge bg="success">
            {otbsDistrito.length} OTB
            {otbsDistrito.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {otbsDistrito.length > 0 ? (
          <div className="list-group list-group-flush otb-modal-list">
            {otbsDistrito.map((o) => (
              <div
                key={o.id}
                className="list-group-item d-flex justify-content-between align-items-center py-2"
              >
                <div className="d-flex align-items-center gap-2">
                  <span className="otb-dot" />
                  <span className="small fw-semibold text-uppercase">
                    {o.nombre}
                  </span>
                </div>
                <small className="text-muted">ID #{o.id}</small>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted small fst-italic">
            Este distrito aún no tiene OTBs registradas.
          </div>
        )}
      </>
    )}
  </Modal.Body>
</Modal>

            {/* FOOTER / ACCIONES */}
            <Card.Footer className="bg-transparent border-0 pt-0 d-flex justify-content-between align-items-center sub-card-footer">
              <small className="text-muted">
                Última actualización • Catálogo territorial
              </small>
              <div>
                <Button
                  variant="link"
                  className="text-secondary p-0 me-2"
                  onClick={() => abrirModalEditarSub(s)}
                  title="Editar subalcaldía"
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="link"
                  className="text-danger p-0"
                  onClick={() =>
                    eliminarRegistro(s.id, 'catalogos/subalcaldias')
                  }
                  title="Eliminar subalcaldía"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      );
    })}
  </Row>
</Tab.Pane>




{/* DISTRITOS */}
<Tab.Pane eventKey="distritos">
  <div className="d-flex justify-content-between align-items-start mb-3 dist-header">
  <div>
    <h5 className="fw-bold mb-1 ps-2 border-start border-4 border-primary">
      Distritos
    </h5>
    <small className="text-muted">
      Vista por zona, subalcaldía, OTBs y población estimada
    </small>
  </div>

    <div className="text-end">
    <span className="badge bg-primary dist-pill me-2">
      {distritos.length} distritos
    </span>
    <span className="badge bg-light text-dark border dist-pill">
      {totalOtbsDistritos} OTBs / barrios
    </span>
  </div>
</div>

{/* NUEVO CARD DE RESUMEN GENERAL */}
<div className="mb-4">
  <Card className="shadow-sm resumen-card">
    <Card.Body className="d-flex justify-content-between align-items-center">
      
      <div className="text-center flex-fill">
        <div className="resumen-number">{distritos.length}</div>
        <div className="resumen-label">Distritos Totales</div>
      </div>

      <div className="divider-v"></div>

      <div className="text-center flex-fill">
        <div className="resumen-number">
          {new Intl.NumberFormat('es-BO').format(poblacionTotal)}
        </div>
        <div className="resumen-label">Población Total</div>
      </div>

    </Card.Body>
  </Card>
</div>

  <Row xs={1} md={2} className="g-3">
     {/* distr     {distritos.map((d) => (*/}

       {distritosOrdenados.map((d) => (
      <Col key={d.id}>
        <Card className="dist-card shadow-sm h-100">
          {/* HEADER */}
          <div className="dist-card-header d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <div className="dist-icon-wrapper">
                <Map size={18} />
              </div>
              <div>
                <div className="fw-semibold">{d.nombre}</div>
                <small className="text-white-50">
                  {d.subalcaldia ? d.subalcaldia : 'Sin subalcaldía'}
                </small>
              </div>
            </div>

            <div className="text-end">
              <span
                className={`badge rounded-pill dist-zona-pill bg-${getZonaBadgeVariant(
                  d.zona
                )}`}
              >
                Zona {d.zona}
              </span>
            </div>
          </div>

          {/* BODY */}
          <Card.Body className="dist-card-body">
            <div className="d-flex justify-content-between mb-2">
              {/* Población */}
              <div>
                <small className="text-muted d-block mb-1">Población estimada</small>
                <div className="dist-kpi">
                  {new Intl.NumberFormat('es-BO').format(
                    Number(d.poblacion_est || 0)
                  )}{' '}
                  <span className="dist-kpi-unit">personas</span>
                </div>
              </div>

              {/* OTBs */}
              <div className="text-end">
                <small className="text-muted d-block mb-1">OTBs / Barrios</small>
                <div className="dist-kpi">
                  {d.total_otbs || 0}{' '}
                  <span className="dist-kpi-unit">registradas</span>
                </div>
              </div>
            </div>

            <div className="dist-meta">
              <small className="text-muted">
                ID #{d.id} • Catálogo territorial municipal
              </small>
            </div>
          </Card.Body>

          {/* FOOTER / ACCIONES */}
                <Card.Footer className="bg-transparent border-0 pt-0 d-flex justify-content-between align-items-center dist-card-footer">
  <div className="d-flex align-items-center gap-2">
    <small className="text-muted">
      Última actualización de datos de distrito
    </small>
    <Button
      variant="outline-primary"
      size="sm"
      className="dist-ver-otbs-btn"
      onClick={() => abrirModalDetalleDistrito(d)}
    >
      Ver OTBs
    </Button>
  </div>

  <div>
    <Button
      variant="link"
      className="text-secondary p-0 me-2"
      onClick={() => abrirModalEditarDistrito(d)}
      title="Editar distrito"
    >
      <Pencil size={16} />
    </Button>
    <Button
      variant="link"
      className="text-danger p-0"
      onClick={() => eliminarRegistro(d.id, 'catalogos/distritos')}
      title="Eliminar distrito"
    >
      <Trash2 size={16} />
    </Button>
  </div>
</Card.Footer>
        </Card>
      </Col>
    ))}
  </Row>
</Tab.Pane>

{/* OTBs */}
<Tab.Pane eventKey="otbs">
  <div className="d-flex justify-content-between align-items-start mb-3 otb-header">
    <div>
      <h5 className="fw-bold mb-1 ps-2 border-start border-4 border-success">
        OTBs / Barrios
      </h5>
      <small className="text-muted">
        Listado de organizaciones territoriales por distrito y subalcaldía
      </small>
    </div>

    <div className="d-flex align-items-center gap-2">
      <input
        type="text"
        placeholder="Buscar OTB..."
        className="form-control form-control-sm otb-search"
        onChange={(e) => setFiltroOtb(e.target.value)}
      />
      <span className="badge bg-success-subtle text-success border otb-pill-count">
        {otbsFiltradas.length} OTBs
      </span>
    </div>
  </div>

  <Row className="g-3">
    {/* LISTA */}
    <Col md={7}>
      <Card className="otb-list-card shadow-sm h-100">
        <Card.Body className="p-0">
          <Table
            hover
            responsive
            size="sm"
            className="align-middle mb-0 otb-table"
          >
            <thead className="bg-light small">
              <tr>
                <th style={{ width: '55%' }}>OTB / Barrio</th>
                <th style={{ width: '25%' }}>Distrito</th>
                <th className="text-end" style={{ width: '20%' }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {otbsFiltradas.map((o) => {
                const distritoObj = distritos.find(
                  (d) => d.nombre === o.distrito
                );
                const subalcaldiaObj = distritoObj
                  ? subalcaldias.find(
                      (s) => s.id === distritoObj.subalcaldia_id
                    )
                  : null;

                const esSeleccionada =
                  otbSeleccionada && otbSeleccionada.id === o.id;

                return (
                  <tr
                    key={o.id}
                    className={esSeleccionada ? 'otb-row-selected' : ''}
                    onClick={() =>
                      setOtbSeleccionada({
                        ...o,
                        distritoObj,
                        subalcaldiaObj,
                      })
                    }
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="fw-semibold text-uppercase small">
                      {o.nombre}
                    </td>
                    <td>
                      <Badge
                        bg="light"
                        text="dark"
                        className="border otb-distrito-badge"
                      >
                        {o.distrito}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirModalEditarOtb(o);
                        }}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          eliminarRegistro(o.id, 'catalogos/otbs');
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Col>

    {/* DETALLE */}
    <Col md={5}>
      <Card className="otb-detail-card shadow-sm h-100">
        <Card.Body>
          {otbSeleccionada ? (
            <>
              {/* Header con “avatar” */}
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="otb-avatar">
                  {otbSeleccionada.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h6 className="mb-0 text-uppercase">
                    {otbSeleccionada.nombre}
                  </h6>
                  <small className="text-muted">
                    ID #{otbSeleccionada.id}
                  </small>
                </div>
              </div>

              {/* Distrito */}
              <div className="mb-3">
                <small className="text-muted d-block mb-1">Distrito</small>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-semibold">
                    {otbSeleccionada.distrito}
                  </span>
                  {otbSeleccionada.distritoObj && (
                    <Badge
                      bg={getZonaBadgeVariant(
                        otbSeleccionada.distritoObj.zona
                      )}
                      className="otb-zona-pill"
                    >
                      Zona {otbSeleccionada.distritoObj.zona}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Subalcaldía */}
              <div className="mb-3">
                <small className="text-muted d-block mb-1">
                  Subalcaldía
                </small>
                <span className="fw-semibold">
                  {otbSeleccionada.subalcaldiaObj
                    ? otbSeleccionada.subalcaldiaObj.nombre
                    : 'Sin subalcaldía registrada'}
                </span>
              </div>

              {/* Población y OTBs del distrito */}
              {otbSeleccionada.distritoObj && (
                <>
                  <div className="mb-3">
                    <small className="text-muted d-block mb-1">
                      Población estimada del distrito
                    </small>
                    <div className="fw-semibold">
                      {new Intl.NumberFormat('es-BO').format(
                        Number(
                          otbSeleccionada.distritoObj.poblacion_est || 0
                        )
                      )}{' '}
                      personas
                    </div>
                  </div>

                  <div className="small text-muted">
                    {otbSeleccionada.distritoObj.total_otbs || 0} OTBs
                    registradas en este distrito.
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center text-muted py-5">
              <MapPin size={32} className="mb-2" />
              <p className="mb-0">
                Selecciona una OTB de la lista para ver el detalle de su
                distrito y subalcaldía.
              </p>
            </div>
          )}
        </Card.Body>

        {otbSeleccionada && (
          <Card.Footer className="bg-light border-top d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Gestión rápida de la OTB seleccionada
            </small>
            <div>
              <Button
                variant="link"
                size="sm"
                onClick={() => abrirModalEditarOtb(otbSeleccionada)}
              >
                <Pencil size={14} />
              </Button>
              <Button
                variant="link"
                size="sm"
                className="text-danger"
                onClick={() =>
                  eliminarRegistro(
                    otbSeleccionada.id,
                    'catalogos/otbs'
                  )
                }
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </Card.Footer>
        )}
      </Card>
    </Col>
  </Row>
</Tab.Pane>
                {/* TEMAS */}
                <Tab.Pane eventKey="temas">
                   <h5 className="fw-bold mb-3 ps-2 border-start border-4 border-warning">Áreas y Problemas</h5>
                   <Row>{areas.map(area => (<Col md={6} key={area.id} className="mb-3"><Card className="h-100 border shadow-sm"><Card.Body><div className="d-flex align-items-center gap-2 mb-3"><Layers size={20} className="text-warning"/><h6 className="fw-bold m-0">{area.nombre}</h6></div><div className="d-flex flex-wrap gap-1">{problemas.filter(p => p.area === area.nombre).map(p => (<Badge key={p.id} bg="light" text="dark" className="border fw-normal">{p.nombre} <span className="text-danger cursor-pointer ms-1" onClick={() => eliminarRegistro(p.id, 'catalogos/problemas')}>&times;</span></Badge>))}</div></Card.Body></Card></Col>))}</Row>
                </Tab.Pane>

                {/* DIAGNOSTICO */}
                <Tab.Pane eventKey="diagnostico">
                    <h5 className="fw-bold mb-3 ps-2 border-start border-4 border-secondary">Diagnóstico</h5>
                    <Row>{diagnosticos.map(d => (<Col md={12} key={d.id} className="mb-2"><Card className="border-0 shadow-sm border-start border-3 border-danger"><Card.Body className="py-2 px-3 d-flex justify-content-between align-items-center"><div><span className="fw-bold">{d.otb}</span> <small className="text-muted">({d.distrito})</small> <div className="text-muted small"><AlertTriangle size={12} className="text-danger"/> {d.problema}</div></div><div><Badge bg="secondary" className="me-2">{d.prioridad}</Badge><Button variant="link" className="p-0 text-danger" onClick={() => eliminarRegistro(d.id, 'catalogos/diagnostico')}><Trash2 size={14}/></Button></div></Card.Body></Card></Col>))}</Row>
                </Tab.Pane>
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </div>

      {/* MODALES */}
      <Modal show={showModalSub} onHide={() => setShowModalSub(false)} centered>
        <Form onSubmit={(e) => guardarGenerico(e, 'catalogos/subalcaldias', formSub, setShowModalSub, 'Subalcaldía guardada')}>
            <Modal.Header closeButton><Modal.Title className="h6">Subalcaldía</Modal.Title></Modal.Header>
            <Modal.Body>{mensajeExito && <Alert variant="success">{mensajeExito}</Alert>}<Form.Group className="mb-3"><Form.Label>Nombre</Form.Label><Form.Control required value={formSub.nombre} onChange={e => setFormSub({...formSub, nombre: e.target.value})}/></Form.Group><Form.Group><Form.Label>Responsable</Form.Label><Form.Control value={formSub.responsable} onChange={e => setFormSub({...formSub, responsable: e.target.value})}/></Form.Group></Modal.Body>
            <Modal.Footer><Button type="submit" disabled={loading}>Guardar</Button></Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showModalDistrito} onHide={() => setShowModalDistrito(false)} centered>
        <Form onSubmit={(e) => guardarGenerico(e, 'catalogos/distritos', formDistrito, setShowModalDistrito, 'Distrito guardado')}>
            <Modal.Header closeButton><Modal.Title className="h6">Distrito</Modal.Title></Modal.Header>
            <Modal.Body>
                {mensajeExito && <Alert variant="success">{mensajeExito}</Alert>}
                <Form.Group className="mb-3"><Form.Label>Nombre</Form.Label><Form.Control required value={formDistrito.nombre} onChange={e => setFormDistrito({...formDistrito, nombre: e.target.value})}/></Form.Group>
                
                <Form.Group className="mb-3">
                    <Form.Label>Subalcaldía</Form.Label>
                    <Form.Select required value={formDistrito.subalcaldia_id} onChange={e => setFormDistrito({...formDistrito, subalcaldia_id: e.target.value})}>
                        <option value="">-- Seleccione --</option>
                        {subalcaldias.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3"><Form.Label>Zona</Form.Label><Form.Select value={formDistrito.zona} onChange={e => setFormDistrito({...formDistrito, zona: e.target.value})}><option value="Norte">Norte</option><option value="Sur">Sur</option><option value="Este">Este</option><option value="Oeste">Oeste</option><option value="Centro">Centro</option></Form.Select></Form.Group>
                <Form.Group><Form.Label>Población</Form.Label><Form.Control type="number" value={formDistrito.poblacion_est} onChange={e => setFormDistrito({...formDistrito, poblacion_est: e.target.value})}/></Form.Group>
            </Modal.Body>
            <Modal.Footer><Button type="submit" disabled={loading}>Guardar</Button></Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showModalOtb} onHide={() => setShowModalOtb(false)} centered>
        <Form onSubmit={(e) => guardarGenerico(e, 'catalogos/otbs', formOtb, setShowModalOtb, 'OTB guardada')}>
            <Modal.Header closeButton><Modal.Title className="h6">OTB</Modal.Title></Modal.Header>
            <Modal.Body>{mensajeExito && <Alert variant="success">{mensajeExito}</Alert>}<Form.Group className="mb-3"><Form.Label>Nombre</Form.Label><Form.Control required value={formOtb.nombre} onChange={e => setFormOtb({...formOtb, nombre: e.target.value})}/></Form.Group><Form.Group><Form.Label>Distrito</Form.Label><Form.Select required value={formOtb.distrito_id} onChange={e => setFormOtb({...formOtb, distrito_id: e.target.value})}><option value="">Select</option>{distritos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}</Form.Select></Form.Group></Modal.Body>
            <Modal.Footer><Button type="submit" disabled={loading}>Guardar</Button></Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showModalArea} onHide={() => setShowModalArea(false)} centered>
        <Form onSubmit={(e) => guardarGenerico(e, 'catalogos/areas', formArea, setShowModalArea, 'Área guardada')}>
            <Modal.Header closeButton><Modal.Title className="h6">Nueva Área</Modal.Title></Modal.Header>
            <Modal.Body>{mensajeExito && <Alert variant="success">{mensajeExito}</Alert>}<Form.Group><Form.Label>Nombre</Form.Label><Form.Control required value={formArea.nombre} onChange={e => setFormArea({...formArea, nombre: e.target.value})}/></Form.Group></Modal.Body>
            <Modal.Footer><Button type="submit" disabled={loading}>Guardar</Button></Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showModalProblema} onHide={() => setShowModalProblema(false)} centered>
        <Form onSubmit={(e) => guardarGenerico(e, 'catalogos/problemas', formProblema, setShowModalProblema, 'Problema guardado')}>
            <Modal.Header closeButton><Modal.Title className="h6">Nuevo Problema</Modal.Title></Modal.Header>
            <Modal.Body>{mensajeExito && <Alert variant="success">{mensajeExito}</Alert>}<Form.Group className="mb-3"><Form.Label>Descripción</Form.Label><Form.Control required value={formProblema.nombre} onChange={e => setFormProblema({...formProblema, nombre: e.target.value})}/></Form.Group><Form.Group><Form.Label>Área</Form.Label><Form.Select required value={formProblema.area_id} onChange={e => setFormProblema({...formProblema, area_id: e.target.value})}><option value="">Select</option>{areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}</Form.Select></Form.Group></Modal.Body>
            <Modal.Footer><Button type="submit" disabled={loading}>Guardar</Button></Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showModalDiagnostico} onHide={() => setShowModalDiagnostico(false)} centered>
        <Form onSubmit={(e) => guardarGenerico(e, 'catalogos/diagnostico', formDiagnostico, setShowModalDiagnostico, 'Asignado')}>
            <Modal.Header closeButton><Modal.Title className="h6">Asignar</Modal.Title></Modal.Header>
            <Modal.Body>{mensajeExito && <Alert variant="success">{mensajeExito}</Alert>}<Form.Group className="mb-3"><Form.Label>OTB</Form.Label><Form.Select required value={formDiagnostico.otb_id} onChange={e => setFormDiagnostico({...formDiagnostico, otb_id: e.target.value})}><option value="">Select</option>{otbs.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}</Form.Select></Form.Group><Form.Group className="mb-3"><Form.Label>Problema</Form.Label><Form.Select required value={formDiagnostico.problema_id} onChange={e => setFormDiagnostico({...formDiagnostico, problema_id: e.target.value})}><option value="">Select</option>{problemas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</Form.Select></Form.Group><Form.Group><Form.Label>Prioridad</Form.Label><Form.Select value={formDiagnostico.prioridad} onChange={e => setFormDiagnostico({...formDiagnostico, prioridad: e.target.value})}><option>Alta</option><option>Media</option><option>Baja</option></Form.Select></Form.Group></Modal.Body>
            <Modal.Footer><Button type="submit" disabled={loading}>Guardar</Button></Modal.Footer>
        </Form>
      </Modal>

    </div>
  );
};

export default Catalogos;