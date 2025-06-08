import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

function AdminDashboard() {
  const { state } = useLocation();
  const admin = state?.usuario;

  const handleLogout = () => {
    window.location.href = '/';
  };

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [especialidades, setEspecialidades] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [especialidadId, setEspecialidadId] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [pacientesAtendidos, setPacientesAtendidos] = useState(null);

  useEffect(() => {
    setEspecialidades([
      { id: 1, nombre: 'Clínica' },
      { id: 2, nombre: 'Pediatría' },
      { id: 3, nombre: 'Cardiología' },
      { id: 4, nombre: 'Ginecología' }
    ]);
  }, []);

  const toggleEspecialidad = (id) => {
    setSeleccionadas(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const agregarHorario = () => {
    setHorarios(prev => [...prev, { dia_semana: '', hora_inicio: '', hora_fin: '' }]);
  };

  const actualizarHorario = (i, campo, valor) => {
    const nuevos = [...horarios];
    nuevos[i][campo] = valor;
    setHorarios(nuevos);
  };

  const registrarMedico = async () => {
    try {
      const res = await axios.post('http://localhost:3001/api/admin/registrar-medico', {
        nombre,
        apellido,
        email,
        contrasena: contraseña,
        especialidades: seleccionadas,
        horarios
      });
      setMensaje(res.data.mensaje);
      setNombre('');
      setApellido('');
      setEmail('');
      setContraseña('');
      setSeleccionadas([]);
      setHorarios([]);
    } catch (err) {
      console.error(err);
      setMensaje('Error al registrar médico.');
    }
  };

  const buscarMedicosPorEspecialidad = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/api/admin/medicos-por-especialidad/${especialidadId}`);
      setMedicos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const obtenerCantidadAtendidos = async (id) => {
    try {
      const res = await axios.get(`http://localhost:3001/api/admin/pacientes-atendidos/${id}`);
      setPacientesAtendidos({ id, cantidad: res.data.cantidad });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>

      <h2>Panel de Administración</h2>
      <h4>Bienvenido/a, {admin?.nombre} {admin?.apellido}</h4>

      <h3>Registrar Médico</h3>
      <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} /><br />
      <input type="text" placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} /><br />
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} /><br />
      <input type="password" placeholder="Contraseña" value={contraseña} onChange={(e) => setContraseña(e.target.value)} /><br />

      <h4>Especialidades:</h4>
      {especialidades.map(e => (
        <label key={e.id}>
          <input
            type="checkbox"
            value={e.id}
            checked={seleccionadas.includes(e.id)}
            onChange={() => toggleEspecialidad(e.id)}
          /> {e.nombre}
        </label>
      ))}

      <h4>Horarios de atención:</h4>
      {horarios.map((h, i) => (
        <div key={i}>
          <select onChange={(e) => actualizarHorario(i, 'dia_semana', e.target.value)}>
            <option value="">Día</option>
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <input type="time" onChange={(e) => actualizarHorario(i, 'hora_inicio', e.target.value)} />
          <input type="time" onChange={(e) => actualizarHorario(i, 'hora_fin', e.target.value)} />
        </div>
      ))}
      <button onClick={agregarHorario}>Agregar Horario</button><br /><br />
      <button onClick={registrarMedico}>Registrar Médico</button>
      {mensaje && <p>{mensaje}</p>}

      <hr />
      <h3>Buscar Médicos por Especialidad</h3>
      <select value={especialidadId} onChange={(e) => setEspecialidadId(e.target.value)}>
        <option value="">Seleccionar</option>
        {especialidades.map(e => (
          <option key={e.id} value={e.id}>{e.nombre}</option>
        ))}
      </select>
      <button onClick={buscarMedicosPorEspecialidad}>Buscar</button>

      {medicos.length > 0 && (
        <ul>
          {medicos.map(m => (
            <li key={m.id}>
              {m.nombre} {m.apellido} ({m.email})
              <button onClick={() => obtenerCantidadAtendidos(m.id)}>Ver pacientes atendidos</button>
              {pacientesAtendidos?.id === m.id && (
                <span> → {pacientesAtendidos.cantidad} pacientes</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminDashboard;
