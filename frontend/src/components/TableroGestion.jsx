import { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, MapPin, MoreHorizontal, Plus, User, Trash2 } from 'lucide-react';
import { Badge, Button, Modal, Form, Spinner } from 'react-bootstrap';
import './styles/tableroGestion.css';

const TableroGestion = () => {
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal nueva tarea
  const [showModalNueva, setShowModalNueva] = useState(false);
  const initialForm = {
    titulo: '',
    descripcion: '',
    tipo: 'Operativa',
    estado: 'pendiente',
    fecha_evento: '',
    distrito: '',
    responsable: '',
  };
  const [form, setForm] = useState(initialForm);

  const cargarActividades = () => {
    setLoading(true);
    axios
      .get('http://localhost:3310/api/actividades')
      .then((res) => setActividades(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarActividades();
  }, []);

  const getTasks = (status) => actividades.filter((a) => a.estado === status);

  // Crear nueva tarea
  const handleGuardarTarea = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3310/api/actividades', form);
      setForm(initialForm);
      setShowModalNueva(false);
      cargarActividades();
    } catch (err) {
      console.error(err);
      alert('Error al guardar la tarea');
    }
  };

  // Cambiar estado
  const handleChangeEstado = async (task, nuevoEstado) => {
    try {
      await axios.put(
        `http://localhost:3310/api/actividades/${task.id}/estado`,
        { estado: nuevoEstado }
      );
      cargarActividades();
    } catch (err) {
      console.error(err);
      alert('No se pudo actualizar el estado');
    }
  };

  // Eliminar tarea
  const handleEliminarTarea = async (taskId) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta tarea?')) return;
    try {
      await axios.delete(`http://localhost:3310/api/actividades/${taskId}`);
      cargarActividades();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar la tarea');
    }
  };

  const getNextAction = (estado) => {
    if (estado === 'pendiente')
      return { label: 'Iniciar', to: 'en_progreso', variant: 'outline-warning' };
    if (estado === 'en_progreso')
      return { label: 'Completar', to: 'completado', variant: 'outline-success' };
    if (estado === 'completado')
      return { label: 'Reabrir', to: 'pendiente', variant: 'outline-secondary' };
    return null;
  };

  const TaskCard = ({ task }) => {
    const next = getNextAction(task.estado);

    return (
      <div className="task-card">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h6 className="fw-bold text-dark mb-0 pe-2">{task.titulo}</h6>
          <MoreHorizontal size={16} className="text-muted" />
        </div>

        <p className="text-secondary small mb-3">
          {task.descripcion || 'Sin descripción'}
        </p>

        <div className="d-flex justify-content-between align-items-center mb-2">
          <Badge
            bg="light"
            text="primary"
            className="border d-flex align-items-center gap-1 fw-normal"
          >
            <MapPin size={10} /> D-{task.distrito || '-'}
          </Badge>

          <small
            className="text-muted d-flex align-items-center gap-1"
            style={{ fontSize: '0.75rem' }}
          >
            <Calendar size={12} />{' '}
            {task.fecha_evento
              ? new Date(task.fecha_evento).toLocaleDateString()
              : 'Sin fecha'}
          </small>
        </div>

        {task.responsable && (
          <div className="d-flex align-items-center gap-1 mb-2 text-muted small">
            <User size={12} /> {task.responsable}
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mt-1">
          <small className="text-muted small">
            #{task.id} • {task.tipo || 'Actividad'}
          </small>

          <div className="d-flex align-items-center gap-1">
            {next && (
              <Button
                size="sm"
                variant={next.variant}
                className="task-action-btn"
                onClick={() => handleChangeEstado(task, next.to)}
              >
                {next.label}
              </Button>
            )}
            <Button
              size="sm"
              variant="link"
              className="p-0 text-danger"
              onClick={() => handleEliminarTarea(task.id)}
              title="Eliminar tarea"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="board-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="fw-bold mb-0">Gestión Operativa</h4>
          <small className="text-muted">
            Organiza las actividades de la campaña
          </small>
        </div>
        <Button
          variant="primary"
          className="d-flex align-items-center gap-2 px-3 shadow-sm"
          onClick={() => setShowModalNueva(true)}
        >
          <Plus size={18} /> Nueva Tarea
        </Button>
      </div>

      {loading && (
        <div className="text-center my-3">
          <Spinner animation="border" size="sm" />{' '}
          <small className="text-muted">Cargando actividades...</small>
        </div>
      )}

      {/* GRID KANBAN */}
      <div className="kanban-grid">
        {/* COLUMNA 1 */}
        <div className="kanban-column">
          <div className="kanban-column-header">
            <div className="fw-bold text-dark d-flex align-items-center gap-2">
              <span className="kanban-dot bg-danger" />
              Por Planificar
            </div>
            <span className="badge bg-white text-dark border">
              {getTasks('pendiente').length}
            </span>
          </div>
          <div className="column-body">
            {getTasks('pendiente').map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        </div>

        {/* COLUMNA 2 */}
        <div className="kanban-column">
          <div className="kanban-column-header">
            <div className="fw-bold text-dark d-flex align-items-center gap-2">
              <span className="kanban-dot bg-warning" />
              En Ejecución
            </div>
            <span className="badge bg-white text-dark border">
              {getTasks('en_progreso').length}
            </span>
          </div>
          <div className="column-body">
            {getTasks('en_progreso').map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        </div>

        {/* COLUMNA 3 */}
        <div className="kanban-column">
          <div className="kanban-column-header">
            <div className="fw-bold text-dark d-flex align-items-center gap-2">
              <span className="kanban-dot bg-success" />
              Realizado
            </div>
            <span className="badge bg-white text-dark border">
              {getTasks('completado').length}
            </span>
          </div>
          <div className="column-body">
            {getTasks('completado').map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        </div>
      </div>

      {/* MODAL NUEVA TAREA (con estilo) */}
      <Modal
        show={showModalNueva}
        onHide={() => setShowModalNueva(false)}
        centered
        dialogClassName="kanban-modal"
      >
        <Form onSubmit={handleGuardarTarea}>
          <Modal.Header closeButton className="kanban-modal-header">
            <div>
              <Modal.Title className="h6 mb-0">Nueva tarea operativa</Modal.Title>
              <small className="text-muted">
                Define una actividad y asígnala a un distrito / responsable.
              </small>
            </div>
          </Modal.Header>
          <Modal.Body className="kanban-modal-body">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Título de la tarea</Form.Label>
              <Form.Control
                required
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ej. Reunión con vecinos del Distrito 3"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={form.descripcion}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
                placeholder="Detalles de la actividad, objetivos, puntos a tratar..."
              />
            </Form.Group>

            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Label className="small fw-semibold">Tipo</Form.Label>
                <Form.Select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                >
                  <option value="Operativa">Operativa</option>
                  <option value="Reunión">Reunión</option>
                  <option value="Comunicación">Comunicación</option>
                  <option value="Territorio">Territorio</option>
                </Form.Select>
              </div>

              <div className="col-md-6 mb-3">
                <Form.Label className="small fw-semibold">Fecha</Form.Label>
                <Form.Control
                  type="date"
                  value={form.fecha_evento}
                  onChange={(e) =>
                    setForm({ ...form, fecha_evento: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <Form.Label className="small fw-semibold">Distrito</Form.Label>
                <Form.Control
                  placeholder="Ej. 1, 2, 3..."
                  value={form.distrito}
                  onChange={(e) =>
                    setForm({ ...form, distrito: e.target.value })
                  }
                />
              </div>

              <div className="col-md-8 mb-3">
                <Form.Label className="small fw-semibold">Responsable</Form.Label>
                <Form.Control
                  placeholder="Nombre del responsable"
                  value={form.responsable}
                  onChange={(e) =>
                    setForm({ ...form, responsable: e.target.value })
                  }
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="kanban-modal-footer">
            <small className="text-muted me-auto">
              Puedes mover la tarea entre columnas según avance el trabajo.
            </small>
            <Button
              variant="light"
              onClick={() => setShowModalNueva(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Guardar tarea
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default TableroGestion;

