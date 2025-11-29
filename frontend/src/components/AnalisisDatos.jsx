// src/components/AnalisisDatos.jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const AnalisisDatos = ({ datos }) => {
  // datos vendría del backend: [{distrito: 1, promedio: 45}, {distrito: 2, promedio: 30}...]
  
  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">Intención de Voto por Distrito</h2>
      <p className="text-gray-600 mb-4">Análisis de penetración en zonas clave (Norte, Sur, Central).</p>
      
      <BarChart width={600} height={300} data={datos}>
        <XAxis dataKey="distrito" label={{ value: 'Distrito', position: 'insideBottom' }} />
        <YAxis label={{ value: '% Voto', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="promedio" fill="#8884d8" name="Intención de Voto (%)" />
      </BarChart>
      
      <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-500">
        <strong>Alerta de Anomalía:</strong> El Distrito 9 (Zona Sur) muestra una caída del 5% en la última semana. Se sugiere reforzar con visitas vecinales.
      </div>
    </div>
  );
};
export default AnalisisDatos;