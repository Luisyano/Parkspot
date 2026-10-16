package com.parkspot.service;

import com.parkspot.dto.DeudaDTO;
import com.parkspot.entity.Deuda;
import com.parkspot.entity.Reserva;
import com.parkspot.entity.Usuario;
import com.parkspot.repository.DeudaRepository;
import com.parkspot.repository.ReservaRepository;
import com.parkspot.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Servicio para la entidad Deuda.
 * Sistema "estilo Uber": si un usuario tiene deuda pendiente,
 * no puede crear nuevas reservas.
 */
@Service
@Transactional
public class DeudaService {

    @Autowired
    private DeudaRepository repo;

    @Autowired
    private UsuarioRepository usuarioRepo;

    @Autowired
    private ReservaRepository reservaRepo;

    // ==========================================
    // MÉTODOS CRUD PRINCIPALES
    // ==========================================

    public List<DeudaDTO> listarTodos() {
        return repo.findAll().stream()
                .map(this::convertirADTO)
                .toList();
    }

    public DeudaDTO buscarPorId(Long id) {
        Deuda entity = repo.findById(id).orElse(null);
        return entity != null ? convertirADTO(entity) : null;
    }

    /**
     * Crea una nueva deuda para un usuario.
     * Usado cuando hay exceso de tiempo en una reserva.
     */
    public DeudaDTO crearDeuda(Long usuarioId, Long reservaId, BigDecimal monto, String descripcion) {
        Usuario usuario = usuarioRepo.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + usuarioId));

        Deuda deuda = new Deuda();
        deuda.setUsuario(usuario);
        deuda.setReserva(reservaRepo.findById(reservaId).orElse(null));
        deuda.setMonto(monto);
        deuda.setDescripcion(descripcion);
        deuda.setEstado(Deuda.EstadoDeuda.PENDIENTE);

        Deuda guardado = repo.save(deuda);
        return convertirADTO(guardado);
    }

    /**
     * Paga una deuda.
     */
    public DeudaDTO pagarDeuda(Long deudaId) {
        Deuda deuda = repo.findById(deudaId)
                .orElseThrow(() -> new RuntimeException("Deuda no encontrada con ID: " + deudaId));

        if (deuda.getEstado() == Deuda.EstadoDeuda.PAGADA) {
            throw new RuntimeException("La deuda ya fue pagada.");
        }

        deuda.setEstado(Deuda.EstadoDeuda.PAGADA);
        Deuda actualizado = repo.save(deuda);
        return convertirADTO(actualizado);
    }

    /**
     * Paga todas las deudas pendientes de un usuario.
     * Usado cuando el usuario paga en el dashboard.
     */
    public int pagarTodasDeudas(Long usuarioId) {
        List<Deuda> deudas = repo.findByUsuarioIdAndEstado(usuarioId, Deuda.EstadoDeuda.PENDIENTE);

        if (deudas.isEmpty()) {
            throw new RuntimeException("El usuario no tiene deudas pendientes.");
        }

        for (Deuda deuda : deudas) {
            deuda.setEstado(Deuda.EstadoDeuda.PAGADA);
        }

        repo.saveAll(deudas);
        return deudas.size();
    }

    // ==========================================
    // MÉTODOS DE CONSULTA
    // ==========================================

    public List<DeudaDTO> listarPorUsuario(Long usuarioId) {
        return repo.findByUsuarioId(usuarioId).stream()
                .map(this::convertirADTO)
                .toList();
    }

    public List<DeudaDTO> listarPendientesPorUsuario(Long usuarioId) {
        return repo.findByUsuarioIdAndEstado(usuarioId, Deuda.EstadoDeuda.PENDIENTE).stream()
                .map(this::convertirADTO)
                .toList();
    }

    /**
     * Verifica si un usuario tiene deuda pendiente.
     * ⚡ CONSULTA CRÍTICA: se ejecuta antes de crear una reserva.
     */
    public boolean tieneDeudaPendiente(Long usuarioId) {
        return repo.existsByUsuarioIdAndEstado(usuarioId, Deuda.EstadoDeuda.PENDIENTE);
    }

    /**
     * Obtiene el total de deuda pendiente de un usuario.
     */
    public BigDecimal obtenerTotalDeudaPendiente(Long usuarioId) {
        BigDecimal total = repo.sumDeudaPendienteByUsuarioId(usuarioId);
        return total != null ? total : BigDecimal.ZERO;
    }

    // ==========================================
    // MÉTODOS AUXILIARES (Conversión)
    // ==========================================

    private DeudaDTO convertirADTO(Deuda entity) {
        DeudaDTO dto = new DeudaDTO();
        dto.setId(entity.getId());
        dto.setUsuarioId(entity.getUsuario().getId());
        dto.setReservaId(entity.getReserva() != null ? entity.getReserva().getId() : null);
        dto.setMonto(entity.getMonto());
        dto.setDescripcion(entity.getDescripcion());
        dto.setEstado(entity.getEstado().name());
        dto.setFecha(entity.getFecha());
        return dto;
    }
}