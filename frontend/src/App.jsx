import { useState, useEffect } from 'react';
import TableroGestion from './components/TableroGestion';
import AnalisisDatos from './components/AnalisisDatos';
import Competidores from './components/Competidores';
import Login from './components/Login';

import './App.css'; // Usaremos esto para darle estilo rápido

function App() {
  const [vistaActual, setVistaActual] = useState('gestion');
  const [usuario, setUsuario] = useState(null); // Estado para el usuario logueado

  // Verificar si ya había iniciado sesión (persistencia básica)
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario_campaña');
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
  }, []);

const handleLogin = (datosUsuario) => {
    setUsuario(datosUsuario);
    localStorage.setItem('usuario_campaña', JSON.stringify(datosUsuario)); // Guardar en navegador
  };

  const handleLogout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario_campaña');
  };

  // SI NO HAY USUARIO, MOSTRAMOS LOGIN
  if (!usuario) {
    return <Login onLogin={handleLogin} />;
  }

  // SI HAY USUARIO, MOSTRAMOS EL SISTEMA
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
      <aside className="sidebar">
        <div className="logo-area">
          <h2>🏛️ Alcaldía Cocha</h2>
          <p className="text-xs text-gray-400 mt-1">Hola, {usuario.nombre}</p>
          <span className="text-xs bg-blue-900 px-2 py-1 rounded mt-2 inline-block">
             {usuario.cargo}
          </span>
        </div>
        <nav>
          <button onClick={() => setVistaActual('gestion')} className={vistaActual === 'gestion' ? 'active' : ''}>📋 Gestión</button>
          
          {/* Ejemplo de restricción por ROL: Solo Admin y Tecnico ven Analisis */}
          {usuario.rol !== 'consulta' && (
             <button onClick={() => setVistaActual('analisis')} className={vistaActual === 'analisis' ? 'active' : ''}>📊 Análisis</button>
          )}
          
          <button onClick={() => setVistaActual('competidores')} className={vistaActual === 'competidores' ? 'active' : ''}>🕵️ Competencia</button>
          
          {/* Botón Salir */}
          <button onClick={handleLogout} style={{marginTop: 'auto', borderTop: '1px solid #34495e', color: '#e74c3c'}}>
            🚪 Cerrar Sesión
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header>
          <h1>Panel de Control</h1>
          <div className="text-sm text-gray-600">
             Rol: <strong>{usuario.rol.toUpperCase()}</strong>
          </div>
        </header>
        <div className="content-body">
          {renderizarVista()}
        </div>
      </main>
    </div>
  );
}

export default App;