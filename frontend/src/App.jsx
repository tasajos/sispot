import { useState, useEffect } from 'react';
import TableroGestion from './components/TableroGestion';
import Login from './components/Login';
import { LayoutDashboard, BarChart3, Users, LogOut, Menu, User } from 'lucide-react';
import { Button, Navbar, Nav } from 'react-bootstrap';
// Asegúrate de importar Bootstrap CSS en main.jsx si no lo has hecho
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [vistaActual, setVistaActual] = useState('gestion');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const u = localStorage.getItem('usuario_campaña');
    if (u) setUsuario(JSON.parse(u));
  }, []);

  const handleLogin = (datos) => {
    setUsuario(datos);
    localStorage.setItem('usuario_campaña', JSON.stringify(datos));
  };

  const handleLogout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario_campaña');
  };

  if (!usuario) return <Login onLogin={handleLogin} />;

  return (
    <div className="d-flex w-100 h-100">
      
      {/* --- SIDEBAR PROFESIONAL --- */}
      <div 
        className="d-flex flex-column flex-shrink-0 text-white bg-dark shadow-lg transition-width"
        style={{ 
          width: sidebarOpen ? '260px' : '0px', 
          transition: 'width 0.3s ease',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          zIndex: 1000
        }}
      >
        {/* Marca / Logo */}
        <div className="d-flex align-items-center p-3 border-bottom border-secondary bg-black bg-opacity-25" style={{height: '60px'}}>
            <span className="fs-5 fw-bold text-white ps-2">🏛️ Alcaldía Cocha</span>
        </div>
        
        {/* Navegación */}
        <Nav className="flex-column mb-auto p-2 pt-3">
          <Nav.Item className="mb-1">
            <Nav.Link 
              active={vistaActual === 'gestion'} 
              onClick={() => setVistaActual('gestion')} 
              className={`text-white px-3 py-2 rounded d-flex align-items-center gap-3 ${vistaActual === 'gestion' ? 'bg-primary shadow-sm' : 'opacity-75 hover-bright'}`}
            >
              <LayoutDashboard size={20}/> <span className="fw-medium">Gestión</span>
            </Nav.Link>
          </Nav.Item>
          
          {usuario.rol !== 'consulta' && (
             <Nav.Item className="mb-1">
                <Nav.Link 
                  active={vistaActual === 'analisis'} 
                  onClick={() => setVistaActual('analisis')} 
                  className={`text-white px-3 py-2 rounded d-flex align-items-center gap-3 ${vistaActual === 'analisis' ? 'bg-primary shadow-sm' : 'opacity-75 hover-bright'}`}
                >
                  <BarChart3 size={20}/> <span className="fw-medium">Análisis</span>
                </Nav.Link>
             </Nav.Item>
          )}

          <Nav.Item className="mb-1">
            <Nav.Link 
              active={vistaActual === 'competidores'} 
              onClick={() => setVistaActual('competidores')} 
              className={`text-white px-3 py-2 rounded d-flex align-items-center gap-3 ${vistaActual === 'competidores' ? 'bg-primary shadow-sm' : 'opacity-75 hover-bright'}`}
            >
              <Users size={20}/> <span className="fw-medium">Competencia</span>
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Perfil de Usuario (Footer) */}
        <div className="p-3 border-top border-secondary bg-black bg-opacity-10">
            <div className="d-flex align-items-center gap-3 mb-3 px-2">
                <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm" style={{width:38, height:38, minWidth:38}}>
                    <User size={20} />
                </div>
                <div className="overflow-hidden">
                    <strong className="d-block small text-white text-truncate">{usuario.nombre}</strong>
                    <span className="text-white text-opacity-50 small d-block text-truncate" style={{fontSize: '0.75rem'}}>{usuario.cargo}</span>
                </div>
            </div>
            
            {/* BOTÓN SALIR MEJORADO */}
            <button 
                onClick={handleLogout}
                className="btn btn-link text-decoration-none text-danger w-100 d-flex align-items-center justify-content-start px-2 py-1 hover-bg-danger rounded transition-colors"
                style={{opacity: 0.9}}
            >
                <LogOut size={18} className="me-2" />
                <span className="fw-bold small">Cerrar Sesión</span>
            </button>
        </div>
      </div>

      {/* --- ÁREA PRINCIPAL (Full Width Real) --- */}
      <div className="d-flex flex-column flex-grow-1" style={{minWidth: 0, backgroundColor: '#f3f4f6'}}>
        
        {/* Navbar Superior */}
        <Navbar bg="white" className="border-bottom px-4 py-2 sticky-top justify-content-between" style={{height: '60px'}}>
           <div className="d-flex align-items-center gap-3">
               <Button variant="light" size="sm" className="border-0 bg-transparent p-1" onClick={() => setSidebarOpen(!sidebarOpen)}>
                  <Menu size={24} color="#333"/>
               </Button>
               <h5 className="m-0 fw-bold text-dark">
                  {vistaActual === 'gestion' && 'Tablero de Estrategia'}
                  {vistaActual === 'analisis' && 'Inteligencia de Datos'}
                  {vistaActual === 'competidores' && 'Radar de Competencia'}
               </h5>
           </div>
        </Navbar>

        {/* CONTENIDO FLUIDO (Sin Container wrapper) */}
        <div className="flex-grow-1 overflow-hidden p-0 position-relative">
            <div className="h-100 w-100 overflow-auto p-4">
                {vistaActual === 'gestion' && <TableroGestion />}
                {/* Agrega los otros componentes aquí */}
            </div>
        </div>
      </div>
    </div>
  );
}

export default App;