package com.parkspot.service;

import com.parkspot.dto.PagoDTO;
import com.parkspot.entity.Pago;
import com.parkspot.entity.Reserva;
import com.parkspot.repository.PagoRepository;
import com.parkspot.repository.ReservaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Servicio para la entidad Pago.
 * Gestiona los pagos de las reservas.
 */
@Service
@Transactional
public class PagoService {

    @Autowired
    private PagoRepository repo;

    @Autowired
    private ReservaRepository reservaRepo;

    @Autowired
    private ReservaService reservaService;

    // ==========================================
    // MÉTODOS CRUD PRINCIPALES
    // ==========================================

    public List<PagoDTO> listarTodos() {
        return repo.findAll().stream()
                .map(this::convertirADTO)
                .toList();
    }

    public PagoDTO buscarPorId(Long id) {
        Pago entity = repo.findById(id).orElse(null);
        return entity != null ? convertirADTO(entity) : null;
    }

    public PagoDTO buscarPorReserva(Long reservaId) {
        Pago entity = repo.findByReservaId(reservaId);
        return entity != null ? convertirADTO(entity) : null;
    }

    /**
     * Registra un pago para una reserva.
     * Confirma la reserva automáticamente después del pago.
     */
    public PagoDTO registrar(PagoDTO dto) {
        // Validar que la reserva exista
        Reserva reserva = reservaRepo.findById(dto.getReservaId())
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada con ID: " + dto.getReservaId()));

        // Validar que la reserva esté PENDIENTE
        if (reserva.getEstado() != Reserva.EstadoReserva.PENDIENTE) {
            throw new RuntimeException("La reserva no está en estado PENDIENTE.");
        }

        // Crear pago
        Pago entity = new Pago();
        entity.setReserva(reserva);
        entity.setMetodo(Pago.MetodoPago.valueOf(dto.getMetodo()));
        entity.setMonto(dto.getMonto());

        Pago guardado = repo.save(entity);

        // Confirmar reserva y generar ticket
        reservaService.confirmarReserva(reserva.getId(), dto.getMonto());

        return convertirADTO(guardado);
    }

    // ==========================================
    // MÉTODOS DE CONSULTA (Reportes)
    // ==========================================

    /**
     * Obtiene el total de ingresos por sede.
     */
    public BigDecimal obtenerTotalIngresosPorSede(Long sedeId) {
        BigDecimal total = repo.sumMontoBySedeId(sedeId);
        return total != null ? total : BigDecimal.ZERO;
    }

    /**
     * Obtiene el desglose de ingresos por método de pago en una sede.
     */
    public Map<String, BigDecimal> obtenerIngresosPorMetodoEnSede(Long sedeId) {
        List<Object[]> resultados = repo.sumMontoPorMetodoEnSede(sedeId);
        return resultados.stream()
                .collect(Collectors.toMap(
                        r -> ((Pago.MetodoPago) r[0]).name(),
                        r -> (BigDecimal) r[1]
                ));
    }

    // ==========================================
    // MÉTODOS AUXILIARES (Conversión)
    // ==========================================

    private PagoDTO convertirADTO(Pago entity) {
        PagoDTO dto = new PagoDTO();
        dto.setId(entity.getId());
        dto.setReservaId(entity.getReserva().getId());
        dto.setMetodo(entity.getMetodo().name());
        dto.setMonto(entity.getMonto());
        dto.setFecha(entity.getFecha());
        return dto;
    }
}