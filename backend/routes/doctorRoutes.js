const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

router.get('/turnos/:doctorId', doctorController.verTurnos);
router.put('/turnos/:turnoId', doctorController.actualizarEstadoTurno);
router.get('/ocupados/:medicoId/:fecha', doctorController.horasOcupadas);
router.post('/formulario', doctorController.crearFormularioMedico);
router.get('/formularios/:pacienteId', doctorController.obtenerFormulariosDePaciente);
router.put('/cambiar-contrasena/:doctorId', doctorController.cambiarPassword);
router.get('/horarios/:doctorId', doctorController.obtenerHorariosDoctor);
router.put('/actualizar-horarios/:doctorId', doctorController.actualizarHorariosDoctor);
router.get('/buscar-paciente', doctorController.buscarPacientePorNombreCompleto);
router.get('/formularios-nombre/:nombreCompleto', doctorController.obtenerFormulariosPorNombre);
router.put('/formulario/:id', doctorController.editarFormularioMedico);


module.exports = router;
