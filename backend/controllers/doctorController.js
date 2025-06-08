const db = require('../models/db');

exports.verTurnos = (req, res) => {
    const doctorId = req.params.doctorId;

    const sql = `
        SELECT t.id, t.fecha, t.hora, t.estado, t.detalles,
               u.nombre AS paciente_nombre, u.apellido AS paciente_apellido, u.obra_social
        FROM turnos t
        JOIN usuarios u ON t.paciente_id = u.id
        WHERE t.medico_id = ?
        ORDER BY t.fecha, t.hora
    `;

    db.query(sql, [doctorId], (err, resultados) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener turnos.' });
        }

        res.status(200).json(resultados);
    });
};
exports.actualizarEstadoTurno = (req, res) => {
    const turnoId = req.params.turnoId;
    const { estado } = req.body;

    if (!['en espera', 'confirmado', 'cancelado'].includes(estado)) {
        return res.status(400).json({ mensaje: 'Estado inválido.' });
    }

    const sql = `UPDATE turnos SET estado = ? WHERE id = ?`;

    db.query(sql, [estado, turnoId], (err, resultado) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al actualizar el estado del turno.' });
        }

        res.status(200).json({ mensaje: 'Estado del turno actualizado.' });
    });
};
exports.obtenerHorarios = (req, res) => {
    const doctorId = req.params.doctorId;

    const sql = `
        SELECT * FROM horarios_medicos
        WHERE medico_id = ?
    `;

    db.query(sql, [doctorId], (err, resultados) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener horarios.' });
        }

        res.status(200).json(resultados);
    });
};
exports.horasOcupadas = (req, res) => {
    const { medicoId, fecha } = req.params;
  
    const sql = `
      SELECT TIME_FORMAT(hora, '%H:%i') AS hora
      FROM turnos
      WHERE medico_id = ? AND fecha = ? AND estado != 'cancelado'
    `;
  
    db.query(sql, [medicoId, fecha], (err, resultados) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ mensaje: 'Error al obtener turnos ocupados' });
      }
  
      const horas = resultados.map(r => r.hora); // ya viene como "HH:MM"
      res.json(horas);
    });
};
exports.obtenerFormulariosDePaciente = (req, res) => {
  const pacienteId = req.params.pacienteId;

  const sql = `
    SELECT f.id, f.fecha, f.contenido, u.nombre AS doctor_nombre, u.apellido AS doctor_apellido
    FROM formularios_medicos f
    JOIN usuarios u ON f.doctor_id = u.id
    WHERE f.paciente_id = ?
    ORDER BY f.fecha DESC
  `;

  db.query(sql, [pacienteId], (err, resultados) => {
    if (err) {
      console.error('Error al obtener formularios:', err);
      return res.status(500).json({ mensaje: 'Error al obtener los formularios.' });
    }

    res.status(200).json(resultados);
  });
};
exports.cambiarPassword = (req, res) => {
  const doctorId = req.params.doctorId;
  const { nueva_contrasena } = req.body;

  if (!nueva_contrasena) {
    return res.status(400).json({ mensaje: 'Debes ingresar una nueva contraseña.' });
  }

  const sql = `UPDATE usuarios SET contrasena = ? WHERE id = ? AND tipo = 'medico'`;

  db.query(sql, [nueva_contrasena, doctorId], (err, resultado) => {
    if (err) {
      console.error('Error al cambiar contraseña:', err);
      return res.status(500).json({ mensaje: 'Error al cambiar la contraseña.' });
    }

    res.status(200).json({ mensaje: 'Contraseña actualizada correctamente.' });
  });
};
exports.actualizarDatosDoctor = async (req, res) => {
  const doctorId = req.params.id;
  const { nueva_contrasena } = req.body;

  const updates = [];
  const values = [];

  if (nueva_contrasena) {
    updates.push('contraseña = ?');
    values.push(nueva_contrasena);
  }

  if (updates.length === 0) {
    return res.status(400).json({ mensaje: 'No se proporcionaron datos para actualizar.' });
  }

  try {
    const sql = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ? AND tipo = 'medico'`;
    values.push(doctorId);
    await db.promise().query(sql, values);

    res.status(200).json({ mensaje: 'Datos del doctor actualizados correctamente.' });
  } catch (err) {
    console.error('Error al actualizar datos del doctor:', err);
    res.status(500).json({ mensaje: 'Error al actualizar los datos del doctor.' });
  }
};
exports.obtenerHorariosDoctor = (req, res) => {
  const doctorId = req.params.doctorId;

  const sql = `
    SELECT dia_semana, hora_inicio, hora_fin
    FROM horarios_doctores
    WHERE doctor_id = ?
  `;

  db.query(sql, [doctorId], (err, resultados) => {
    if (err) {
      console.error('Error al obtener horarios:', err);
      return res.status(500).json({ mensaje: 'Error al obtener los horarios.' });
    }
    res.status(200).json(resultados);
  });
};
exports.actualizarHorariosDoctor = (req, res) => {
  const doctorId = req.params.doctorId;
  const nuevosHorarios = req.body.horarios;

  const eliminarSQL = `DELETE FROM horarios_doctores WHERE doctor_id = ?`;

  db.query(eliminarSQL, [doctorId], (err) => {
    if (err) {
      console.error('Error al eliminar horarios anteriores:', err);
      return res.status(500).json({ mensaje: 'Error al actualizar los horarios.' });
    }

    if (!nuevosHorarios || nuevosHorarios.length === 0) {
      return res.status(200).json({ mensaje: 'Horarios eliminados correctamente.' });
    }

    // Insertar los nuevos horarios
    const insertarSQL = `
      INSERT INTO horarios_doctores (doctor_id, dia_semana, hora_inicio, hora_fin)
      VALUES ?
    `;

    const valores = nuevosHorarios.map(h =>
      [doctorId, h.dia_semana, h.hora_inicio, h.hora_fin]
    );

    db.query(insertarSQL, [valores], (err2) => {
      if (err2) {
        console.error('Error al insertar horarios:', err2);
        return res.status(500).json({ mensaje: 'Error al insertar los horarios.' });
      }

      res.status(200).json({ mensaje: 'Horarios actualizados correctamente.' });
    });
  });
};
exports.buscarPacientePorNombreCompleto = (req, res) => {
  const { nombre, apellido } = req.query;

  if (!nombre || !apellido) {
    return res.status(400).json({ mensaje: 'Nombre y apellido requeridos.' });
  }

  const sql = `
    SELECT id, nombre, apellido, email, obra_social
    FROM usuarios
    WHERE tipo = 'paciente' AND nombre = ? AND apellido = ?
  `;

  db.query(sql, [nombre, apellido], (err, resultados) => {
    if (err) {
      console.error('Error al buscar paciente:', err);
      return res.status(500).json({ mensaje: 'Error al buscar paciente.' });
    }

    if (resultados.length === 0) {
      return res.status(404).json({ mensaje: 'Paciente no encontrado.' });
    }

    res.status(200).json(resultados[0]); // Devolvemos solo el primero, asumiendo que no se repiten
  });
};
exports.crearFormularioMedico = (req, res) => {
  const { doctor_id, nombre_completo, contenido } = req.body;

  if (!doctor_id || !nombre_completo || !contenido) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
  }

  const insertarSQL = `
    INSERT INTO formularios_medicos (doctor_id, nombre_completo, contenido)
    VALUES (?, ?, ?)
  `;

  db.query(insertarSQL, [doctor_id, nombre_completo.trim(), contenido], (err) => {
    if (err) {
      console.error('Error al insertar formulario médico:', err);
      return res.status(500).json({ mensaje: 'Error al guardar el formulario.' });
    }

    res.status(201).json({ mensaje: 'Formulario guardado exitosamente.' });
  });
};
exports.obtenerFormulariosPorNombre = (req, res) => {
  const nombreCompleto = req.params.nombreCompleto;

  if (!nombreCompleto || !nombreCompleto.includes(' ')) {
    return res.status(400).json({ mensaje: 'Debe enviar nombre y apellido.' });
  }

  const sql = `
    SELECT id, contenido, fecha AS fecha_creacion
    FROM formularios_medicos
    WHERE nombre_completo = ?
    ORDER BY fecha DESC
  `;

  db.query(sql, [nombreCompleto.trim()], (err, resultados) => {
    if (err) {
      console.error('Error al buscar formularios por nombre completo:', err);
      return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }

    if (resultados.length === 0) {
      return res.status(404).json({ mensaje: 'No se encontraron formularios para este paciente.' });
    }

    res.status(200).json(resultados);
  });
};
exports.editarFormularioMedico = (req, res) => {
  const formularioId = req.params.id;
  const { contenido } = req.body;

  if (!contenido) {
    return res.status(400).json({ mensaje: 'El contenido no puede estar vacío.' });
  }

  const sql = `
    UPDATE formularios_medicos
    SET contenido = ?
    WHERE id = ?
  `;

  db.query(sql, [contenido, formularioId], (err, resultado) => {
    if (err) {
      console.error('Error al editar formulario:', err);
      return res.status(500).json({ mensaje: 'Error al actualizar el formulario.' });
    }

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Formulario no encontrado.' });
    }

    res.status(200).json({ mensaje: 'Formulario actualizado correctamente.' });
  });
};



