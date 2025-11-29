import { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, MapPin, MoreHorizontal, Plus } from 'lucide-react';
import { Badge, Button, Dropdown } from 'react-bootstrap';

const TableroGestion = () => {
  const [actividades, setActividades] = useState([]);

  useEffect(() => {
    // Ajusta tu puerto aquí (3310)
    axios.get('http://localhost:3310/api/actividades')
      .then(res => setActividades(res.data))
      .catch(err => console.error(err));
  }, []);

  const getTasks = (status) => actividades.filter(a => a.estado === status);

  // Tarjeta Limpia y Moderna
  const TaskCard = ({ task }) => (
    <div className="bg-white p-3 rounded-3 shadow-sm mb-3 border border-light position-relative task-hover">
      <div className="d-flex justify-content-between align-items-start mb-2">
        <h6 className="fw-bold text-dark mb-0 pe-3">{task.titulo}</h6>
        <MoreHorizontal size={16} className="text-muted cursor-pointer" />
      </div>
      <p className="text-secondary small mb-3 text-truncate" style={{fontSize:'0.85rem'}}>
        {task.descripcion || "Sin descripción"}
      </p>
      <div className="d-flex justify-content-between align-items-center pt-2 border-top border-light">
         <Badge bg="light" text="primary" className="border d-flex align-items-center gap-1 fw-normal">
            <MapPin size={10}/> D-{task.distrito}
         </Badge>
         <div className="text-muted small d-flex align-items-center gap-1" style={{fontSize:'0.75rem'}}>
            <Calendar size={12}/> {new Date(task.fecha_evento).toLocaleDateString()}
         </div>
      </div>
    </div>
  );

  return (
    <div className="d-flex flex-column h-100 w-100">
      {/* Header del Tablero */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
           <h4 className="fw-bold mb-0">Gestión Operativa</h4>
           <small className="text-muted">Flujo de trabajo de la campaña 2025</small>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 py-2 shadow-sm rounded-pill">
           <Plus size={18}/> <span className="fw-bold">Nueva Tarea</span>
        </Button>
      </div>

      {/* GRID LAYOUT: Aquí aseguramos que cubra todo el ancho */}
      <div className="flex-grow-1 w-100 pb-2" style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', // Responsive automático
          gap: '1.5rem',
          alignItems: 'start'
      }}>
        
        {/* COLUMNA 1 */}
        <div className="d-flex flex-column h-100 bg-white rounded-4 shadow-sm border overflow-hidden">
          <div className="p-3 border-bottom bg-light bg-opacity-50 d-flex justify-content-between align-items-center">
             <div className="d-flex align-items-center gap-2 fw-bold text-secondary">
                <span className="d-inline-block rounded-circle bg-danger" style={{width:8, height:8}}></span>
                Por Planificar
             </div>
             <span className="badge bg-secondary bg-opacity-10 text-secondary">{getTasks('pendiente').length}</span>
          </div>
          <div className="p-3 flex-grow-1 overflow-auto bg-light bg-opacity-25">
             {getTasks('pendiente').map(t => <TaskCard key={t.id} task={t} />)}
             {getTasks('pendiente').length === 0 && (
                <div className="text-center py-5 text-muted fst-italic border border-dashed rounded bg-white">
                   <small>Lista vacía</small>
                </div>
             )}
          </div>
        </div>

        {/* COLUMNA 2 */}
        <div className="d-flex flex-column h-100 bg-white rounded-4 shadow-sm border overflow-hidden">
          <div className="p-3 border-bottom bg-light bg-opacity-50 d-flex justify-content-between align-items-center">
             <div className="d-flex align-items-center gap-2 fw-bold text-secondary">
                <span className="d-inline-block rounded-circle bg-warning" style={{width:8, height:8}}></span>
                En Ejecución
             </div>
             <span className="badge bg-secondary bg-opacity-10 text-secondary">{getTasks('en_progreso').length}</span>
          </div>
          <div className="p-3 flex-grow-1 overflow-auto bg-light bg-opacity-25">
             {getTasks('en_progreso').map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        </div>

        {/* COLUMNA 3 */}
        <div className="d-flex flex-column h-100 bg-white rounded-4 shadow-sm border overflow-hidden">
          <div className="p-3 border-bottom bg-light bg-opacity-50 d-flex justify-content-between align-items-center">
             <div className="d-flex align-items-center gap-2 fw-bold text-secondary">
                <span className="d-inline-block rounded-circle bg-success" style={{width:8, height:8}}></span>
                Realizado
             </div>
             <span className="badge bg-secondary bg-opacity-10 text-secondary">{getTasks('completado').length}</span>
          </div>
          <div className="p-3 flex-grow-1 overflow-auto bg-light bg-opacity-25">
             {getTasks('completado').map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TableroGestion;