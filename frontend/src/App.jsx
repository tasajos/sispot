import { useState } from 'react';
import TableroGestion from './components/TableroGestion';
import AnalisisDatos from './components/AnalisisDatos';
import Competidores from './components/Competidores';
import './App.css'; // Usaremos esto para darle estilo rápido

function App() {
  const [vistaActual, setVistaActual] = useState('gestion');

  const renderizarVista = () => {
    switch (vistaActual) {
      case 'gestion': return <TableroGestion />;
      case 'analisis': return <AnalisisDatos />;
      case 'competidores': return <Competidores />;
      default: return <TableroGestion />;
    }
  };

  return (
    <div className="app-container">
      {/* BARRA LATERAL (SIDEBAR) */}
      <aside className="sidebar">
        <div className="logo-area">
          <h2>🏛️ Alcaldía Cocha</h2>
          <p>Sistema de Campaña</p>
        </div>
        <nav>
          <button 
            className={vistaActual === 'gestion' ? 'active' : ''} 
            onClick={() => setVistaActual('gestion')}
          >
            📋 Gestión de Campaña
          </button>
          <button 
            className={vistaActual === 'analisis' ? 'active' : ''} 
            onClick={() => setVistaActual('analisis')}
          >
            📊 Análisis de Datos
          </button>
          <button 
            className={vistaActual === 'competidores' ? 'active' : ''} 
            onClick={() => setVistaActual('competidores')}
          >
            🕵️ Perfil Competencia
          </button>
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="main-content">
        <header>
          <h1>Panel de Control - Candidato</h1>
          <div className="user-info">Usuario: Jefe de Campaña</div>
        </header>
        <div className="content-body">
          {renderizarVista()}
        </div>
      </main>
    </div>
  );
}

export default App;