import { useState } from 'react';
import axios from 'axios';
// Importamos íconos de Lucide (ya lo instalamos antes)
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import './styles/Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Estado para el ojito
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // NOTA: Asegúrate de que el puerto sea el correcto (3310 según tu configuración anterior)
      const res = await axios.post('http://localhost:3310/api/login', {
        email,
        password
      });

      if (res.data.success) {
        onLogin(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error de conexión con el servidor");
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-box">
        {/* Ícono superior grande */}
        <div className="login-header-icon">
          <User size={64} strokeWidth={1.5} />
        </div>
        
        {/* Mensaje de Error */}
        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Input Grupo: Usuario */}
          <div className="input-group">
            <User className="input-icon-left" size={20} />
            <input 
              type="email" 
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Input Grupo: Contraseña */}
          <div className="input-group">
            <Lock className="input-icon-left" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {/* Botón del ojito para ver password */}
            <button 
              type="button"
              className="input-icon-right-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Opciones (Recordarme / Olvidé contraseña) */}
          <div className="login-options">
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" className="mr-2 accent-blue-500" />
              <span className="text-sm text-gray-600">Recordarme</span>
            </label>
            <a href="#" className="text-sm text-blue-500 hover:underline">¿Olvidaste la contraseña?</a>
          </div>

          {/* Botón Submit */}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Verificando...' : 'INGRESAR'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;