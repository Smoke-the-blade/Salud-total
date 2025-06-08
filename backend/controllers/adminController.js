const db = require('../models/db');

exports.listarMedicosPorEspecialidad = (req, res) => {
    const especialidadId = req.params.especialidadId;

    const sql = `
        SELECT u.id, u.nombre, u.apellido, u.email
        FROM usuarios u
        JOIN medico_especialidades me ON u.id = me.medico_id
        WHERE me.especialidad_id = ? AND u.tipo = 'medico'
    `;

    db.query(sql, [especialidadId], (err, resultados) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al listar médicos.' });
        }

        res.status(200).json(resultados);
    });
};

exports.contarPacientesAtendidos = (req, res) => {
    const doctorId = req.params.doctorId;

    const sql = `
        SELECT COUNT(*) AS cantidad
        FROM turnos
        WHERE medico_id = ? AND estado = 'confirmado'
    `;

    db.query(sql, [doctorId], (err, resultados) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al contar pacientes.' });
        }

        res.status(200).json(resultados[0]);
    });
};

exports.registrarMedico = (req, res) => {
    const { nombre, apellido, email, contrasena, especialidades, horarios } = req.body;

    const sqlUsuario = `
        INSERT INTO usuarios (nombre, apellido, email, contrasena, tipo)
        VALUES (?, ?, ?, ?, 'medico')
    `;

    db.query(sqlUsuario, [nombre, apellido, email, contrasena], (err, resultado) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al registrar médico.' });
        }

        const medicoId = resultado.insertId;

        const sqlEspecialidad = `INSERT INTO medico_especialidades (medico_id, especialidad_id) VALUES ?`;
        const valoresEspecialidad = especialidades.map(id => [medicoId, id]);

        db.query(sqlEspecialidad, [valoresEspecialidad], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ mensaje: 'Error al asignar especialidades.' });
            }

            const sqlHorario = `INSERT INTO horarios_doctores (doctor_id, dia_semana, hora_inicio, hora_fin) VALUES ?`;
            const valoresHorarios = horarios.map(h => [medicoId, h.dia_semana, h.hora_inicio, h.hora_fin]);

            db.query(sqlHorario, [valoresHorarios], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ mensaje: 'Error al registrar horarios.' });
                }

                res.status(201).json({ mensaje: 'Médico registrado correctamente.' });
            });
        });
    });
};
