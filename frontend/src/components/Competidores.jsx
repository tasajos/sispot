import { useEffect, useState } from 'react';
import axios from 'axios';

const Competidores = () => {
  // 1. Inicializar con [] (array vacío), NUNCA null o undefined
  const [competidores, setCompetidores] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 2. CORRECCIÓN: Puerto 3310
    axios.get('http://localhost:3310/api/competidores')
      .then(response => {
        setActividades(response.data); // Ojo: asegúrate que tu endpoint devuelve un array
      })
      .catch(err => {
        console.error("Error:", err);
        setError("No se pudieron cargar los datos.");
      });
  }, []);

  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Perfil de Competencia</h2>
      
      {/* 3. Validación de seguridad: Si está vacío, mostrar mensaje */}
      {competidores.length === 0 ? (
        <p className="p-4 text-gray-500">Cargando datos o no hay competidores registrados...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competidores.map(comp => (
            <div key={comp.id} className="border rounded-xl p-4 shadow bg-white">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold">{comp.nombre}</h3>
                <span className={`px-2 py-1 rounded text-xs text-white ${comp.nivel_amenaza === 'alto' ? 'bg-red-500' : 'bg-blue-500'}`}>
                  {comp.nivel_amenaza}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-2">{comp.partido}</p>
              <div className="mt-2 bg-gray-50 p-2 rounded">
                <h4 className="font-bold text-xs text-gray-400">Debilidades:</h4>
                <p className="text-sm italic">{comp.debilidades}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Competidores;