import { useEffect, useState } from 'react';
import axios from 'axios';

const TableroGestion = () => {
  const [actividades, setActividades] = useState([]);

  // Cargar datos del backend al iniciar
  useEffect(() => {
    axios.get('http://localhost:3310/api/actividades')
      .then(response => setActividades(response.data))
      .catch(error => console.error("Error cargando actividades:", error));
  }, []);

  const pendientes = actividades.filter(a => a.estado === 'pendiente');
  const enProgreso = actividades.filter(a => a.estado === 'en_progreso');
  const completados = actividades.filter(a => a.estado === 'completado');

  return (
    <div>
      <h2 style={{marginBottom: '20px'}}>Tablero de Campaña (Kanban)</h2>
      <div className="grid-3">
        {/* Columna Pendientes */}
        <div className="card" style={{borderTop: '4px solid #e74c3c'}}>
          <h3>📅 Por Planificar</h3>
          {pendientes.map(task => (
            <div key={task.id} style={{padding:'10px', borderBottom:'1px solid #eee', marginTop:'10px'}}>
              <strong>{task.titulo}</strong>
              <p style={{fontSize:'0.8rem', color:'#666'}}>Distrito {task.distrito}</p>
            </div>
          ))}
          {pendientes.length === 0 && <p>No hay tareas pendientes</p>}
        </div>

        {/* Columna En Progreso */}
        <div className="card" style={{borderTop: '4px solid #f1c40f'}}>
          <h3>🚧 En Ejecución</h3>
          {enProgreso.map(task => (
            <div key={task.id} style={{padding:'10px', borderBottom:'1px solid #eee', marginTop:'10px'}}>
              <strong>{task.titulo}</strong>
              <p style={{fontSize:'0.8rem', color:'#666'}}>{task.responsable}</p>
            </div>
          ))}
        </div>

        {/* Columna Completado */}
        <div className="card" style={{borderTop: '4px solid #2ecc71'}}>
          <h3>✅ Realizado</h3>
          {completados.map(task => (
            <div key={task.id} style={{padding:'10px', borderBottom:'1px solid #eee', marginTop:'10px'}}>
              <strong>{task.titulo}</strong>
              <p style={{fontSize:'0.8rem', color:'#666'}}>Finalizado</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TableroGestion;