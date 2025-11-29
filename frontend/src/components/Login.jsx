import { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Petición al backend
      const res = await axios.post('http://localhost:3310/api/login', {
        email,
        password
      });

      if (res.data.success) {
        // Pasamos el usuario al componente padre (App.jsx)
        onLogin(res.data.user);
      }
    } catch (err) {
      // Manejo de errores
      if (err.response) {
        setError(err.response.data.message);
      } else {
        setError("Error de conexión con el servidor");
      }
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-800">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-700">🔐 Acceso Campaña</h2>
        
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Correo</label>
            <input 
              type="email" 
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cocha.bo"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Contraseña</label>
            <input 
              type="password" 
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;