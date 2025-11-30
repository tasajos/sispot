// src/components/Candidatos.jsx
import { useEffect, useState } from 'react';
import { Card, Button, Form, Table, Badge } from 'react-bootstrap';
import { User, Award } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3310';
const MAX_PUNTOS = 10;


function Candidatos() {
  const [subvista, setSubvista] = useState('registrar');
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Form registro
  const [form, setForm] = useState({
  nombre: '',
  sigla: '',
  habilidad_crisis: 0,
  habilidad_dialogo: 0,
  habilidad_tecnica: 0,
  habilidad_comunicacion: 0,
  habilidades_texto: ''
});




const calcularTotal = (f) =>
   Number(f.habilidad_crisis) +
    Number(f.habilidad_dialogo) +
    Number(f.habilidad_tecnica) +
    Number(f.habilidad_comunicacion);

  const totalPuntos = calcularTotal(form);
  const puntosRestantes = MAX_PUNTOS - totalPuntos;

  // Simulación decisiones
  const [escenario, setEscenario] = useState('manifestacion');
  const [resultadosEscenario, setResultadosEscenario] = useState(null);

  // Simulación mejor candidato
  const [rankingMejor, setRankingMejor] = useState(null);

  const cargarCandidatos = async () => {
    try {
      setCargando(true);
      const res = await fetch(`${API_URL}/api/candidatos`);
      const data = await res.json();
      setLista(data);
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'danger', texto: 'Error al cargar candidatos' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (subvista === 'listar') {
      cargarCandidatos();
    }
  }, [subvista]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRegistro = async (e) => {
  e.preventDefault();
  setMensaje(null);

  const total = calcularTotal(form);
  if (total !== MAX_PUNTOS) {
    setMensaje({
      tipo: 'warning',
      texto: `Debes asignar exactamente ${MAX_PUNTOS} puntos. Actualmente llevas ${total}.`
    });
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/candidatos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        habilidad_crisis: Number(form.habilidad_crisis),
        habilidad_dialogo: Number(form.habilidad_dialogo),
        habilidad_tecnica: Number(form.habilidad_tecnica),
        habilidad_comunicacion: Number(form.habilidad_comunicacion)
      })
    });

      if (!res.ok) throw new Error('Error al registrar');
      setMensaje({ tipo: 'success', texto: 'Candidato registrado correctamente' });
      setForm({
  nombre: '',
  sigla: '',
  habilidad_crisis: 0,
  habilidad_dialogo: 0,
  habilidad_tecnica: 0,
  habilidad_comunicacion: 0,
  habilidades_texto: ''
});
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'danger', texto: 'No se pudo registrar el candidato' });
    }
  };

  const simularEscenario = async () => {
    setMensaje(null);
    try {
      const res = await fetch(`${API_URL}/api/candidatos/simular-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escenario })
      });
      const data = await res.json();
      setResultadosEscenario(data);
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'danger', texto: 'No se pudo realizar la simulación' });
    }
  };

  const simularMejor = async () => {
    setMensaje(null);
    try {
      const res = await fetch(`${API_URL}/api/candidatos/simular-mejor`);
      const data = await res.json();
      setRankingMejor(data);
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'danger', texto: 'No se pudo generar el ranking' });
    }
  };

  const eliminarCandidato = async (id) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar este candidato?');
    if (!confirmar) return;

    try {
      const res = await fetch(`${API_URL}/api/candidatos/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Error al eliminar');

      setMensaje({ tipo: 'success', texto: 'Candidato eliminado correctamente' });
      
      // Actualizar la lista en memoria sin recargar todo
      setLista(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'danger', texto: 'No se pudo eliminar el candidato' });
    }
  };

  return (
    <div className="container-fluid">
      {/* Tabs internas */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <Button
          size="sm"
          variant={subvista === 'registrar' ? 'primary' : 'outline-primary'}
          onClick={() => setSubvista('registrar')}
        >
          Registrar Candidatos
        </Button>
        <Button
          size="sm"
          variant={subvista === 'listar' ? 'primary' : 'outline-primary'}
          onClick={() => setSubvista('listar')}
        >
          Listar Candidatos
        </Button>
        <Button
          size="sm"
          variant={subvista === 'simulacion_decisiones' ? 'primary' : 'outline-primary'}
          onClick={() => setSubvista('simulacion_decisiones')}
        >
          Simulación de Toma de Decisiones
        </Button>
        <Button
          size="sm"
          variant={subvista === 'simulacion_mejor' ? 'primary' : 'outline-primary'}
          onClick={() => setSubvista('simulacion_mejor')}
        >
          Mejor Candidato Alcaldía Cochabamba
        </Button>
      </div>

      {mensaje && (
        <div className={`alert alert-${mensaje.tipo} py-2`}>
          {mensaje.texto}
        </div>
      )}

      {/* SUBVISTAS */}
      {subvista === 'registrar' && (
        <Card className="shadow-sm">
          <Card.Header className="d-flex align-items-center gap-2">
            <User size={18} /> Registrar Candidato
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleRegistro}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <Form.Label>Nombre del candidato</Form.Label>
                  <Form.Control
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <Form.Label>Sigla política</Form.Label>
                  <Form.Control
                    name="sigla"
                    value={form.sigla}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Indicador de puntos tipo juego de rol */}
<div className="d-flex justify-content-end mb-2">
  <Badge bg={puntosRestantes === 0 ? 'success' : (puntosRestantes < 0 ? 'danger' : 'info')}>
    Puntos restantes: {puntosRestantes}
  </Badge>
</div>

<div className="row">
  {/* HABILIDADES BLANDAS */}
  <div className="col-md-6">
    <h6 className="text-muted mb-2">Habilidades blandas</h6>

    <div className="mb-3">
      <Form.Label>Manejo de crisis</Form.Label>
      <Form.Control
        type="number"
        min={0}
        max={MAX_PUNTOS}
        name="habilidad_crisis"
        value={form.habilidad_crisis}
        onChange={handleChange}
      />
      <small className="text-muted">
        Reacción ante conflictos, protestas y momentos de presión.
      </small>
    </div>

    <div className="mb-3">
      <Form.Label>Diálogo / negociación</Form.Label>
      <Form.Control
        type="number"
        min={0}
        max={MAX_PUNTOS}
        name="habilidad_dialogo"
        value={form.habilidad_dialogo}
        onChange={handleChange}
      />
      <small className="text-muted">
        Capacidad para negociar con sectores, sindicatos y juntas vecinales.
      </small>
    </div>

    <div className="mb-3">
      <Form.Label>Comunicación pública</Form.Label>
      <Form.Control
        type="number"
        min={0}
        max={MAX_PUNTOS}
        name="habilidad_comunicacion"
        value={form.habilidad_comunicacion}
        onChange={handleChange}
      />
      <small className="text-muted">
        Habilidad para explicar decisiones y conectar con la ciudadanía.
      </small>
    </div>
  </div>

  {/* HABILIDADES TÉCNICAS */}
  <div className="col-md-6">
    <h6 className="text-muted mb-2">Habilidades técnicas</h6>

    <div className="mb-3">
      <Form.Label>Capacidad técnica / gestión municipal</Form.Label>
      <Form.Control
        type="number"
        min={0}
        max={MAX_PUNTOS}
        name="habilidad_tecnica"
        value={form.habilidad_tecnica}
        onChange={handleChange}
      />
      <small className="text-muted">
        Conocimiento de normas, presupuesto, planificación y servicios.
      </small>
    </div>
  </div>
</div>

              <div className="mb-3">
                <Form.Label>Descripción de habilidades / fortalezas</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="habilidades_texto"
                  value={form.habilidades_texto}
                  onChange={handleChange}
                  placeholder="Ej: liderazgo vecinal, experiencia en gestión municipal, etc."
                />
              </div>

              <Button type="submit" variant="primary">
                Guardar candidato
              </Button>
            </Form>
          </Card.Body>
        </Card>
      )}

      {subvista === 'listar' && (
        <Card className="shadow-sm">
          <Card.Header>Listado de Candidatos</Card.Header>
          <Card.Body>
            {cargando ? (
              <p>Cargando...</p>
            ) : lista.length === 0 ? (
              <p>No hay candidatos registrados.</p>
            ) : (
              <Table striped hover responsive size="sm">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Sigla</th>
                    <th>Crisis</th>
                    <th>Diálogo</th>
                    <th>Técnica</th>
                    <th>Comunicación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>


                <tbody>
                {lista.map(c => (
                    <tr key={c.id}>
                    <td>{c.nombre}</td>
                    <td>{c.sigla}</td>
                    <td>{c.habilidad_crisis}</td>
                    <td>{c.habilidad_dialogo}</td>
                    <td>{c.habilidad_tecnica}</td>
                    <td>{c.habilidad_comunicacion}</td>
                    <td>
                        <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => eliminarCandidato(c.id)}
                        >
                        Eliminar
                        </Button>
                    </td>
                    </tr>
                ))}
                </tbody>    
              </Table>
            )}
          </Card.Body>
        </Card>
      )}

      {subvista === 'simulacion_decisiones' && (
        <Card className="shadow-sm">
          <Card.Header>Simulación de toma de decisiones</Card.Header>
          <Card.Body>
            <div className="row mb-3">
              <div className="col-md-4">
                <Form.Label>Escenario</Form.Label>
                <Form.Select
                  value={escenario}
                  onChange={e => setEscenario(e.target.value)}
                >
                  <option value="manifestacion">Manifestación vecinal</option>
                  <option value="huelga">Huelga de trabajadores municipales</option>
                  <option value="desastre">Desastre natural / inundación</option>
                </Form.Select>
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <Button variant="primary" onClick={simularEscenario}>
                  Simular
                </Button>
              </div>
            </div>

            {resultadosEscenario && (
              <>
                <p>
                  Escenario: <strong>{resultadosEscenario.escenario}</strong>
                </p>
                {resultadosEscenario.resultados.length === 0 ? (
                  <p>No hay candidatos para simular.</p>
                ) : (
                  <Table striped hover responsive size="sm">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nombre</th>
                        <th>Sigla</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultadosEscenario.resultados.map((c, idx) => (
                        <tr key={c.id}>
                          <td>
                            {idx === 0 ? (
                              <Badge bg="success">Top</Badge>
                            ) : idx + 1}
                          </td>
                          <td>{c.nombre}</td>
                          <td>{c.sigla}</td>
                          <td>{c.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      )}

      {subvista === 'simulacion_mejor' && (
        <Card className="shadow-sm">
          <Card.Header className="d-flex align-items-center gap-2">
            <Award size={18} /> Mejor Candidato para Alcaldía de Cochabamba
          </Card.Header>
          <Card.Body>
            <Button variant="primary" className="mb-3" onClick={simularMejor}>
              Generar ranking
            </Button>

            {rankingMejor && (
              <>
                <p>{rankingMejor.titulo}</p>
                {rankingMejor.resultados.length === 0 ? (
                  <p>No hay candidatos para evaluar.</p>
                ) : (
                  <Table striped hover responsive size="sm">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nombre</th>
                        <th>Sigla</th>
                        <th>Score promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankingMejor.resultados.map((c, idx) => (
                        <tr key={c.id}>
                          <td>
                            {idx === 0 ? <Badge bg="success">1°</Badge> : idx + 1}
                          </td>
                          <td>{c.nombre}</td>
                          <td>{c.sigla}</td>
                          <td>{c.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

export default Candidatos;
