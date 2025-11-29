import { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, MapPin, MoreHorizontal, Plus } from 'lucide-react';
import { Badge, Button } from 'react-bootstrap';

const TableroGestion = () => {
  const [actividades, setActividades] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3310/api/actividades')
      .then(res => setActividades(res.data))
      .catch(err => console.error(err));
  }, []);

  const getTasks = (status) => actividades.filter(a => a.estado === status);

  const TaskCard = ({ task }) => (
    <div className="task-card">
      <div className="d-flex justify-content-between align-items-start mb-2">
        <h6 className="fw-bold text-dark mb-0 pe-2">{task.titulo}</h6>
        <MoreHorizontal size={16} className="text-muted" />
      </div>
      <p className="text-secondary small mb-3 text-truncate">
        {task.descripcion || "..."}
      </p>
      <div className="d-flex justify-content-between align-items-center border-top pt-2">
         <Badge bg="light" text="primary" className="border d-flex align-items-center gap-1 fw-normal">
            <MapPin size={10}/> D-{task.distrito}
         </Badge>
         <small className="text-muted d-flex align-items-center gap-1" style={{fontSize:'0.75rem'}}>
            <Calendar size={12}/> {new Date(task.fecha_evento).toLocaleDateString()}
         </small>
      </div>
    </div>
  );

  return (
    <div className="board-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
           <h4 className="fw-bold mb-0">Gestión Operativa</h4>
           <small className="text-muted">Organiza las actividades de la campaña</small>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-3 shadow-sm">
           <Plus size={18}/> Nueva Tarea
        </Button>
      </div>

      {/* GRID KANBAN: 100% Ancho y Alto */}
      <div className="kanban-grid">
        
        {/* COLUMNA 1 */}
        <div className="kanban-column">
          <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
             <div className="fw-bold text-dark d-flex align-items-center gap-2">
                <span className="bg-danger rounded-circle" style={{width:10, height:10}}></span>
                Por Planificar
             </div>
             <span className="badge bg-white text-dark border">{getTasks('pendiente').length}</span>
          </div>
          <div className="column-body">
             {getTasks('pendiente').map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        </div>

        {/* COLUMNA 2 */}
        <div className="kanban-column">
          <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
             <div className="fw-bold text-dark d-flex align-items-center gap-2">
                <span className="bg-warning rounded-circle" style={{width:10, height:10}}></span>
                En Ejecución
             </div>
             <span className="badge bg-white text-dark border">{getTasks('en_progreso').length}</span>
          </div>
          <div className="column-body">
             {getTasks('en_progreso').map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        </div>

        {/* COLUMNA 3 */}
        <div className="kanban-column">
          <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
             <div className="fw-bold text-dark d-flex align-items-center gap-2">
                <span className="bg-success rounded-circle" style={{width:10, height:10}}></span>
                Realizado
             </div>
             <span className="badge bg-white text-dark border">{getTasks('completado').length}</span>
          </div>
          <div className="column-body">
             {getTasks('completado').map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TableroGestion;