package com.parkspot.service;

import com.parkspot.dto.ReservaDTO;
import com.parkspot.entity.*;
import com.parkspot.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Servicio para la entidad Reserva.
 * Es el servicio más importante del sistema.
 * Gestiona la creación, validación y seguimiento de reservas.
 */
@Service
@Transactional
public class ReservaService {

    @Autowired
    private ReservaRepository repo;

    @Autowired
    private UsuarioRepository usuarioRepo;

    @Autowired
    private EspacioRepository espacioRepo;

    @Autowired
    private PlanRepository planRepo;

    @Autowired
    private VehiculoRepository vehiculoRepo;

    @Autowired
    private DeudaService deudaService;

    @Autowired
    private TicketService ticketService;

    // ==========================================
    // MÉTODOS CRUD PRINCIPALES
    // ==========================================

    public List<ReservaDTO> listarTodos() {
        return repo.findAll().stream()
                .map(this::convertirADTO)
                .toList();
    }

    public ReservaDTO buscarPorId(Long id) {
        Reserva entity = repo.findById(id).orElse(null);
        return entity != null ? convertirADTO(entity) : null;
    }

    /**
     * Crea una nueva reserva.
     * ⚠️ VALIDACIONES CRÍTICAS:
     * 1. El usuario no debe tener deuda pendiente.
     * 2. El espacio debe estar disponible en el rango de fechas.
     * 3. Si es espacio CONADIS, el usuario debe estar verificado.
     * ✅ CAMBIO: Se cambia el estado del espacio a RESERVADO al crear la reserva.
     */
    public ReservaDTO registrar(ReservaDTO dto) {
        // 1. Validar que el usuario no tenga deuda pendiente
        if (deudaService.tieneDeudaPendiente(dto.getUsuarioId())) {
            throw new RuntimeException("El usuario tiene deuda pendiente. Pague antes de reservar.");
        }

        // 2. Validar disponibilidad del espacio (ahora incluye PENDIENTE)
        List<Reserva> reservasExistentes = repo.findReservasActivasEnRango(
                dto.getEspacioId(),
                dto.getFechaInicio(),
                dto.getFechaFin()
        );
        if (!reservasExistentes.isEmpty()) {
            throw new RuntimeException("El espacio no está disponible en el rango de fechas seleccionado.");
        }

        // 3. Validar CONADIS si el espacio es de ese tipo
        Espacio espacio = espacioRepo.findById(dto.getEspacioId())
                .orElseThrow(() -> new RuntimeException("Espacio no encontrado con ID: " + dto.getEspacioId()));

        if (espacio.getTipo() == Espacio.TipoEspacio.DISCAPACITADO) {
            Usuario usuario = usuarioRepo.findById(dto.getUsuarioId())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + dto.getUsuarioId()));

            if (!usuario.getConadisVerificado()) {
                throw new RuntimeException("Este espacio es para personas con discapacidad. " +
                        "Debes tener verificación CONADIS activa.");
            }
        }

        Reserva entity = convertirAEntity(dto);
        entity.setEstado(Reserva.EstadoReserva.PENDIENTE);
        Reserva guardado = repo.save(entity);

        // ✅ CAMBIO: Cambiar estado del espacio a RESERVADO
        espacio.setEstado(Espacio.EstadoEspacio.RESERVADO);
        espacioRepo.save(espacio);

        return convertirADTO(guardado);
    }

    /**
     * Confirma una reserva (después del pago).
     * Cambia el estado de PENDIENTE a CONFIRMADA y genera el ticket.
     */
    public ReservaDTO confirmarReserva(Long reservaId, BigDecimal montoPagado) {
        Reserva reserva = repo.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada con ID: " + reservaId));

        if (reserva.getEstado() != Reserva.EstadoReserva.PENDIENTE) {
            throw new RuntimeException("La reserva no está en estado PENDIENTE.");
        }

        // Cambiar estado a CONFIRMADA
        reserva.setEstado(Reserva.EstadoReserva.CONFIRMADA);
        repo.save(reserva);

        // Generar ticket
        ticketService.generarTicket(reserva, montoPagado);

        return convertirADTO(reserva);
    }

    /**
     * Marca una reserva como ACTIVA (cuando el vehículo ingresa físicamente).
     * Lo hace el operador al validar el ticket.
     */
    public ReservaDTO marcarComoActiva(Long reservaId) {
        Reserva reserva = repo.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada con ID: " + reservaId));

        if (reserva.getEstado() != Reserva.EstadoReserva.CONFIRMADA) {
            throw new RuntimeException("La reserva debe estar CONFIRMADA para activarla.");
        }

        // Cambiar estado del espacio a OCUPADO
        Espacio espacio = reserva.getEspacio();
        espacio.setEstado(Espacio.EstadoEspacio.OCUPADO);
        espacioRepo.save(espacio);

        // Cambiar estado de la reserva
        reserva.setEstado(Reserva.EstadoReserva.ACTIVA);
        repo.save(reserva);

        return convertirADTO(reserva);
    }

    /**
     * Marca una reserva como FINALIZADA (cuando el vehículo sale).
     * Lo hace el operador al validar la salida.
     * Calcula el cobro adicional si hay exceso de tiempo.
     */
    public ReservaDTO marcarComoFinalizada(Long reservaId, LocalDateTime fechaSalidaReal) {
        Reserva reserva = repo.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada con ID: " + reservaId));

        if (reserva.getEstado() != Reserva.EstadoReserva.ACTIVA) {
            throw new RuntimeException("La reserva debe estar ACTIVA para finalizarla.");
        }

        // Calcular exceso de tiempo
        if (fechaSalidaReal.isAfter(reserva.getFechaFin())) {
            // Tiene exceso de tiempo → crear deuda
            BigDecimal cobroAdicional = calcularCobroAdicional(reserva, fechaSalidaReal);
            deudaService.crearDeuda(reserva.getUsuario().getId(), reserva.getId(), cobroAdicional,
                    "Exceso de tiempo en reserva " + reserva.getId());

            reserva.setEstado(Reserva.EstadoReserva.EXCEDIDA);
        } else {
            reserva.setEstado(Reserva.EstadoReserva.FINALIZADA);
        }

        // Cambiar estado del espacio a DISPONIBLE
        Espacio espacio = reserva.getEspacio();
        espacio.setEstado(Espacio.EstadoEspacio.DISPONIBLE);
        espacioRepo.save(espacio);

        // Actualizar ticket con la fecha de salida
        ticketService.registrarSalida(reserva, fechaSalidaReal);

        repo.save(reserva);
        return convertirADTO(reserva);
    }

    /**
     * Cancela una reserva (solo si está PENDIENTE o CONFIRMADA).
     * ✅ CAMBIO: Ahora libera el espacio si la reserva está PENDIENTE o CONFIRMADA.
     */
    public ReservaDTO cancelarReserva(Long reservaId) {
        Reserva reserva = repo.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada con ID: " + reservaId));

        if (reserva.getEstado() == Reserva.EstadoReserva.ACTIVA ||
                reserva.getEstado() == Reserva.EstadoReserva.FINALIZADA) {
            throw new RuntimeException("No se puede cancelar una reserva activa o finalizada.");
        }

        // ✅ CAMBIO: Liberar el espacio si está PENDIENTE o CONFIRMADA
        if (reserva.getEstado() == Reserva.EstadoReserva.PENDIENTE ||
            reserva.getEstado() == Reserva.EstadoReserva.CONFIRMADA) {
            Espacio espacio = reserva.getEspacio();
            espacio.setEstado(Espacio.EstadoEspacio.DISPONIBLE);
            espacioRepo.save(espacio);
        }

        reserva.setEstado(Reserva.EstadoReserva.CANCELADA);
        repo.save(reserva);

        return convertirADTO(reserva);
    }

    // ==========================================
    // MÉTODOS DE CONSULTA PERSONALIZADOS
    // ==========================================

    public List<ReservaDTO> listarPorUsuario(Long usuarioId) {
        return repo.findByUsuarioId(usuarioId).stream()
                .map(this::convertirADTO)
                .toList();
    }

    public List<ReservaDTO> listarActivasPorUsuario(Long usuarioId) {
        return repo.findByUsuarioIdAndEstado(usuarioId, Reserva.EstadoReserva.ACTIVA).stream()
                .map(this::convertirADTO)
                .toList();
    }

    public List<ReservaDTO> listarPorEspacio(Long espacioId) {
        return repo.findByEspacioId(espacioId).stream()
                .map(this::convertirADTO)
                .toList();
    }

    /**
     * Obtiene reservas que están por vencer en las próximas N horas.
     * Para notificaciones automáticas.
     */
    public List<ReservaDTO> listarPorVencer(int horas) {
        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime limite = ahora.plusHours(horas);
        return repo.findReservasPorVencer(ahora, limite).stream()
                .map(this::convertirADTO)
                .toList();
    }

    /**
     * Obtiene reservas que ya excedieron el tiempo.
     * Para alertas del operador.
     */
    public List<ReservaDTO> listarExcedidas() {
        return repo.findReservasExcedidas(LocalDateTime.now()).stream()
                .map(this::convertirADTO)
                .toList();
    }

    // ==========================================
    // MÉTODOS PRIVADOS (Cálculo de cobro)
    // ==========================================

    /**
     * Calcula el cobro adicional por exceso de tiempo.
     * Tarifa por hora fraccionada (se cobra la hora completa).
     */
    private BigDecimal calcularCobroAdicional(Reserva reserva, LocalDateTime fechaSalidaReal) {
        long minutosExcedidos = java.time.Duration.between(reserva.getFechaFin(), fechaSalidaReal).toMinutes();

        if (minutosExcedidos <= 0) {
            return BigDecimal.ZERO;
        }

        // Redondear hacia arriba (cobrar hora completa por cualquier fracción)
        long horasExcedidas = (long) Math.ceil(minutosExcedidos / 60.0);

        // Obtener el precio por hora del plan
        Plan plan = reserva.getPlan();
        BigDecimal precioPorHora = plan.getPrecioBase();

        return precioPorHora.multiply(BigDecimal.valueOf(horasExcedidas));
    }

    // ==========================================
    // MÉTODOS AUXILIARES (Conversión)
    // ==========================================

    private ReservaDTO convertirADTO(Reserva entity) {
        ReservaDTO dto = new ReservaDTO();
        dto.setId(entity.getId());
        dto.setUsuarioId(entity.getUsuario().getId());
        dto.setEspacioId(entity.getEspacio().getId());
        dto.setPlanId(entity.getPlan().getId());
        dto.setVehiculoId(entity.getVehiculo().getId());
        dto.setFechaInicio(entity.getFechaInicio());
        dto.setFechaFin(entity.getFechaFin());
        dto.setEstado(entity.getEstado().name());
        dto.setFechaCreacion(entity.getFechaCreacion());

        // Datos anidados para el frontend
        dto.setNombreUsuario(entity.getUsuario().getNombres() + " " + entity.getUsuario().getApellidos());
        dto.setCodigoEspacio(entity.getEspacio().getCodigo());
        dto.setNombrePlan(entity.getPlan().getNombre().name());
        dto.setPlacaVehiculo(entity.getVehiculo().getPlaca());

        return dto;
    }

    private Reserva convertirAEntity(ReservaDTO dto) {
        Reserva entity = new Reserva();

        Usuario usuario = usuarioRepo.findById(dto.getUsuarioId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + dto.getUsuarioId()));
        entity.setUsuario(usuario);

        Espacio espacio = espacioRepo.findById(dto.getEspacioId())
                .orElseThrow(() -> new RuntimeException("Espacio no encontrado con ID: " + dto.getEspacioId()));
        entity.setEspacio(espacio);

        Plan plan = planRepo.findById(dto.getPlanId())
                .orElseThrow(() -> new RuntimeException("Plan no encontrado con ID: " + dto.getPlanId()));
        entity.setPlan(plan);

        Vehiculo vehiculo = vehiculoRepo.findById(dto.getVehiculoId())
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado con ID: " + dto.getVehiculoId()));
        entity.setVehiculo(vehiculo);

        entity.setFechaInicio(dto.getFechaInicio());
        entity.setFechaFin(dto.getFechaFin());

        return entity;
    }
}