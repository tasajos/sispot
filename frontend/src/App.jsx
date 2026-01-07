import { useState, useEffect } from 'react';
import TableroGestion from './components/TableroGestion';
import AnalisisDatos from './components/AnalisisDatos';
import Competidores from './components/Competidores';
import Catalogos from './components/Catalogos';
import Login from './components/Login';
import { LayoutDashboard, BarChart3, Users, LogOut, Menu, User, Database , LayoutTemplate,Share2} from 'lucide-react';
import Dashboard from './components/Dashboard';
import { Button, Nav, Navbar } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Candidatos from './components/Candidatos';
import AnalisisRedes from "./components/AnalisisRedes";
import RedesCargaPosts from "./components/RedesCargaPosts";
import AnalisisRedesSinIA from "./components/AnalisisRedesSinIA";
import AnalisisRedesContainer from "./components/AnalisisRedesContainer";




import { UserCheck } from 'lucide-react'; // opcional, si lo quieres
import './App.css'; // Importamos nuestro CSS Grid

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
    <div className="app-container">
      
      {/* SIDEBAR */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="p-3 border-bottom border-secondary d-flex align-items-center" style={{height: '60px'}}>
            <span className="fs-5 fw-bold ps-2 text-nowrap">🏛️ Alcaldía Cocha</span>
        </div>
        
        <Nav.Item className="mb-1">
        <Nav.Link 
        active={vistaActual === 'dashboard'} 
        onClick={() => setVistaActual('dashboard')} 
        className={`text-white px-3 py-2 rounded d-flex align-items-center gap-3 ${vistaActual === 'dashboard' ? 'bg-primary shadow-sm' : 'opacity-75 hover-bright'}`}
        >
        <LayoutTemplate size={20}/> <span className="fw-medium">Dashboard</span>
        </Nav.Link>
        </Nav.Item>

        <Nav className="flex-column mb-auto p-2 pt-3">
          <Nav.Item className="mb-1">
            <Nav.Link active={vistaActual === 'gestion'} onClick={() => setVistaActual('gestion')} className="text-white d-flex align-items-center gap-3 py-2 px-3 rounded hover-bright">
              <LayoutDashboard size={20}/> <span className="text-nowrap">Gestión</span>
            </Nav.Link>
          </Nav.Item>
          
          {usuario.rol !== 'consulta' && (
             <Nav.Item className="mb-1">
                <Nav.Link active={vistaActual === 'analisis'} onClick={() => setVistaActual('analisis')} className="text-white d-flex align-items-center gap-3 py-2 px-3 rounded hover-bright">
                  <BarChart3 size={20}/> <span className="text-nowrap">Análisis</span>
                </Nav.Link>
             </Nav.Item>
          )}

          <Nav.Item className="mb-1">
            <Nav.Link active={vistaActual === 'catalogos'} onClick={() => setVistaActual('catalogos')} className="text-white d-flex align-items-center gap-3 py-2 px-3 rounded hover-bright">
              <Database size={20}/> <span className="text-nowrap">Catálogos</span>
            </Nav.Link>
          </Nav.Item>

          <Nav.Item className="mb-1">
        <Nav.Link active={vistaActual === 'candidatos'} onClick={() => setVistaActual('candidatos')} className="text-white d-flex align-items-center gap-3 py-2 px-3 rounded hover-bright">
        <User size={20} /> <span className="text-nowrap">Candidato</span>
        </Nav.Link>
        </Nav.Item>
        


          <Nav.Item className="mb-1">
            <Nav.Link active={vistaActual === 'competidores'} onClick={() => setVistaActual('competidores')} className="text-white d-flex align-items-center gap-3 py-2 px-3 rounded hover-bright">
              <Users size={20}/> <span className="text-nowrap">Competencia</span>
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Nav.Item className="mb-1">
        <Nav.Link
          active={vistaActual === 'analisis_redes'}
          onClick={() => setVistaActual('analisis_redes')}
          className="text-white d-flex align-items-center gap-3 py-2 px-3 rounded hover-bright"
        >
          <Share2 size={20} /> <span className="text-nowrap">Análisis de redes</span>
        </Nav.Link>
      </Nav.Item>


        
        <div className="p-3 border-top border-secondary bg-dark bg-opacity-50">
            <div className="d-flex align-items-center gap-2 mb-3">
                <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white" style={{width:35, height:35}}>
                    <User size={18} />
                </div>
                <div className="text-nowrap overflow-hidden">
                    <strong className="d-block small">{usuario.nombre}</strong>
                </div>
            </div>
            <button onClick={handleLogout} className="btn btn-sm btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2">
                <LogOut size={16} /> Salir
            </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="main-content">
        <Navbar bg="white" className="border-bottom px-4 py-2 justify-content-between" style={{height: '60px', flexShrink: 0}}>
           <div className="d-flex align-items-center gap-3">
               <Button variant="light" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
                  <Menu size={24} />
               </Button>
               <h5 className="m-0 fw-bold text-dark">
                 
                  {vistaActual === 'gestion' && 'Tablero de Estrategia'}
                  {vistaActual === 'analisis' && 'Inteligencia de Datos'}
                  {vistaActual === 'competidores' && 'Radar de Competencia'}
                  {vistaActual === 'catalogos' && 'Catálogos Municipales'}
                  {vistaActual === 'candidatos' && 'Simulación de Candidato'}
                  {vistaActual === 'analisis_redes' && 'Análisis de redes'}

               </h5>
           </div>
        </Navbar>

        {/* ÁREA DE SCROLL */}
        <div className="content-scroll-area">
           {vistaActual === 'dashboard' && <Dashboard />}
            {vistaActual === 'gestion' && <TableroGestion />}
            {vistaActual === 'analisis' && <AnalisisDatos />}
            {vistaActual === 'competidores' && <Competidores />}
            {vistaActual === 'catalogos' && <Catalogos />}
              {vistaActual === 'candidatos' && <Candidatos />}
              {vistaActual === 'analisis_redes' && <AnalisisRedesContainer />}

        </div>
      </div>
    </div>
  );
}

export default App;