package com.parkspot.controller;

import com.parkspot.dto.ReservaDTO;
import com.parkspot.service.ReservaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para la entidad Reserva.
 * ⚡ Es el controller más importante del sistema.
 * 
 * BASE URL: /api/reserva
 */
@RestController
@RequestMapping("/api/reserva")
@CrossOrigin("*")
public class ReservaController {

    @Autowired
    private ReservaService service;

    // ==========================================
    // ENDPOINTS CRUD PRINCIPALES
    // ==========================================

    @GetMapping("/listar")
    public ResponseEntity<List<ReservaDTO>> listar() {
        return ResponseEntity.ok(service.listarTodos());
    }

    @GetMapping("/buscar/{id}")
    public ResponseEntity<ReservaDTO> buscarPorId(@PathVariable Long id) {
        ReservaDTO dto = service.buscarPorId(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    /**
     * POST /api/reserva/registrar
     * Crea una nueva reserva.
     * ⚠️ Valida: deuda pendiente, disponibilidad, CONADIS.
     * ✅ Cambio: Ahora devuelve el mensaje de error en el cuerpo de la respuesta.
     */
    @PostMapping("/registrar")
    public ResponseEntity<?> registrar(@RequestBody ReservaDTO dto) {
        try {
            ReservaDTO resultado = service.registrar(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // ==========================================
    // ENDPOINTS DE NEGOCIO (Flujo de reserva)
    // ==========================================

    /**
     * PATCH /api/reserva/confirmar/{id}
     * Confirma una reserva (después del pago).
     * Genera el ticket automáticamente.
     */
    @PatchMapping("/confirmar/{id}")
    public ResponseEntity<ReservaDTO> confirmarReserva(
            @PathVariable Long id,
            @RequestParam Double montoPagado) {
        try {
            ReservaDTO resultado = service.confirmarReserva(id, java.math.BigDecimal.valueOf(montoPagado));
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * PATCH /api/reserva/marcarActiva/{id}
     * Marca una reserva como ACTIVA (vehículo ingresó físicamente).
     * Lo hace el operador al validar el ticket.
     */
    @PatchMapping("/marcarActiva/{id}")
    public ResponseEntity<ReservaDTO> marcarComoActiva(@PathVariable Long id) {
        try {
            ReservaDTO resultado = service.marcarComoActiva(id);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * PATCH /api/reserva/marcarFinalizada/{id}
     * Marca una reserva como FINALIZADA (vehículo salió).
     * Calcula cobro adicional si hay exceso de tiempo.
     */
    @PatchMapping("/marcarFinalizada/{id}")
    public ResponseEntity<ReservaDTO> marcarComoFinalizada(
            @PathVariable Long id,
            @RequestParam(required = false) String fechaSalidaReal) {
        try {
            LocalDateTime fechaSalida = fechaSalidaReal != null 
                    ? LocalDateTime.parse(fechaSalidaReal) 
                    : LocalDateTime.now();
            ReservaDTO resultado = service.marcarComoFinalizada(id, fechaSalida);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * PATCH /api/reserva/cancelar/{id}
     * Cancela una reserva (solo si está PENDIENTE o CONFIRMADA).
     */
    @PatchMapping("/cancelar/{id}")
    public ResponseEntity<ReservaDTO> cancelarReserva(@PathVariable Long id) {
        try {
            ReservaDTO resultado = service.cancelarReserva(id);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ==========================================
    // ENDPOINTS DE CONSULTA PERSONALIZADA
    // ==========================================

    @GetMapping("/listarPorUsuario/{usuarioId}")
    public ResponseEntity<List<ReservaDTO>> listarPorUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(service.listarPorUsuario(usuarioId));
    }

    @GetMapping("/listarActivasPorUsuario/{usuarioId}")
    public ResponseEntity<List<ReservaDTO>> listarActivasPorUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(service.listarActivasPorUsuario(usuarioId));
    }

    @GetMapping("/listarPorEspacio/{espacioId}")
    public ResponseEntity<List<ReservaDTO>> listarPorEspacio(@PathVariable Long espacioId) {
        return ResponseEntity.ok(service.listarPorEspacio(espacioId));
    }

    /**
     * GET /api/reserva/listarPorVencer/{horas}
     * Lista reservas que vencerán en las próximas N horas.
     * Para notificaciones automáticas.
     */
    @GetMapping("/listarPorVencer/{horas}")
    public ResponseEntity<List<ReservaDTO>> listarPorVencer(@PathVariable int horas) {
        return ResponseEntity.ok(service.listarPorVencer(horas));
    }

    /**
     * GET /api/reserva/listarExcedidas
     * Lista reservas que ya excedieron el tiempo.
     * Para alertas del operador.
     */
    @GetMapping("/listarExcedidas")
    public ResponseEntity<List<ReservaDTO>> listarExcedidas() {
        return ResponseEntity.ok(service.listarExcedidas());
    }
}