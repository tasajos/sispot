import { useEffect, useState } from 'react';
import axios from 'axios';
import { Tab, Nav, Table, Badge, Button, Row, Col, Card } from 'react-bootstrap';
import { Map, MapPin, Layers, AlertTriangle, Plus } from 'lucide-react';

const Catalogos = () => {
  const [key, setKey] = useState('distritos'); // Controla la pestaña activa
  const [distritos, setDistritos] = useState([]);
  const [otbs, setOtbs] = useState([]);
  const [areas, setAreas] = useState([]);

  // Cargar datos al montar
  useEffect(() => {
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
    cargarDatos();
  }, []);

  return (
    <div className="d-flex flex-column h-100 w-100">
      
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
           <h4 className="fw-bold mb-0 text-dark">Catálogos Municipales</h4>
           <small className="text-muted">Configuración territorial y temática de Cochabamba</small>
        </div>
      </div>

      {/* Contenido con Pestañas */}
      <div className="flex-grow-1 bg-white rounded-4 shadow-sm border p-4 overflow-hidden d-flex flex-column">
        
        <Tab.Container activeKey={key} onSelect={(k) => setKey(k)}>
          <Row className="h-100 g-0">
            
            {/* Barra lateral de navegación interna */}
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
              
              <div className="mt-auto p-3 bg-light rounded text-center">
                 <small className="text-muted d-block mb-2">¿Necesitas agregar más datos?</small>
                 <Button variant="outline-primary" size="sm" className="w-100">
                    <Plus size={16}/> Nuevo Registro
                 </Button>
              </div>
            </Col>

            {/* Panel de Contenido */}
            <Col md={9} className="ps-3 h-100 overflow-auto custom-scroll">
              <Tab.Content className="h-100">
                
                {/* Pestaña: DISTRITOS */}
                <Tab.Pane eventKey="distritos">
                  <h5 className="fw-bold text-dark mb-3">Distritos Urbanos y Rurales</h5>
                  <Table hover responsive className="align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th>Nombre</th>
                        <th>Zona</th>
                        <th className="text-center">Población Est.</th>
                        <th className="text-center">Cant. OTBs</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distritos.map(d => (
                        <tr key={d.id}>
                          <td className="fw-bold text-primary">{d.nombre}</td>
                          <td>
                             <Badge bg={d.zona === 'Norte' ? 'success' : d.zona === 'Sur' ? 'warning' : 'info'}>
                                {d.zona}
                             </Badge>
                          </td>
                          <td className="text-center text-muted">{d.poblacion_est.toLocaleString()} hab.</td>
                          <td className="text-center fw-bold">{d.total_otbs}</td>
                          <td className="text-end">
                            <Button variant="link" size="sm" className="text-decoration-none">Editar</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Tab.Pane>

                {/* Pestaña: OTBs */}
                <Tab.Pane eventKey="otbs">
                  <h5 className="fw-bold text-dark mb-3">Organizaciones Territoriales de Base (OTBs)</h5>
                  <div className="d-flex gap-2 mb-3">
                      <input type="text" placeholder="Buscar OTB..." className="form-control form-control-sm w-50" />
                      <select className="form-select form-select-sm w-25">
                          <option>Todos los distritos</option>
                      </select>
                  </div>
                  <Table hover responsive size="sm">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nombre OTB</th>
                        <th>Pertenece a</th>
                        <th className="text-end">Ubicación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {otbs.map((o, idx) => (
                        <tr key={o.id}>
                          <td className="text-muted">{idx + 1}</td>
                          <td className="fw-bold">{o.nombre}</td>
                          <td>{o.distrito}</td>
                          <td className="text-end text-primary cursor-pointer">
                             <MapPin size={14} /> Ver mapa
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Tab.Pane>

                {/* Pestaña: TEMAS */}
                <Tab.Pane eventKey="temas">
                   <h5 className="fw-bold text-dark mb-3">Ejes Temáticos de Campaña</h5>
                   <Row>
                       {areas.map(area => (
                           <Col md={6} key={area.id} className="mb-3">
                               <Card className="h-100 border-0 shadow-sm bg-light">
                                   <Card.Body>
                                       <div className="d-flex align-items-center gap-2 mb-3">
                                           <div className="bg-white p-2 rounded-circle shadow-sm text-primary">
                                               {area.nombre === 'Seguridad Ciudadana' ? <AlertTriangle size={20}/> : <Layers size={20}/>}
                                           </div>
                                           <h6 className="fw-bold m-0">{area.nombre}</h6>
                                       </div>
                                       <div className="ps-2 border-start border-3 border-primary">
                                           <small className="text-muted d-block mb-1">Tipos de problemas asociados:</small>
                                           {/* Aquí podrías mapear los problemas si los trajéramos en la query */}
                                           <Badge bg="white" text="dark" className="border me-1 mb-1">Bacheo</Badge>
                                           <Badge bg="white" text="dark" className="border me-1 mb-1">Falta Obras</Badge>
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
    </div>
  );
};

export default Catalogos;