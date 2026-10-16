package com.parkspot.controller;

import com.parkspot.dto.DeudaDTO;
import com.parkspot.service.DeudaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Controlador REST para la entidad Deuda.
 * Sistema "estilo Uber": la deuda bloquea nuevas reservas.
 * 
 * BASE URL: /api/deuda
 */
@RestController
@RequestMapping("/api/deuda")
@CrossOrigin("*")
public class DeudaController {

    @Autowired
    private DeudaService service;

    @GetMapping("/listar")
    public ResponseEntity<List<DeudaDTO>> listar() {
        return ResponseEntity.ok(service.listarTodos());
    }

    @GetMapping("/buscar/{id}")
    public ResponseEntity<DeudaDTO> buscarPorId(@PathVariable Long id) {
        DeudaDTO dto = service.buscarPorId(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/listarPorUsuario/{usuarioId}")
    public ResponseEntity<List<DeudaDTO>> listarPorUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(service.listarPorUsuario(usuarioId));
    }

    @GetMapping("/listarPendientesPorUsuario/{usuarioId}")
    public ResponseEntity<List<DeudaDTO>> listarPendientesPorUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(service.listarPendientesPorUsuario(usuarioId));
    }

    /**
     * GET /api/deuda/tieneDeudaPendiente/{usuarioId}
     * Verifica si un usuario tiene deuda pendiente.
     * ⚡ CONSULTA CRÍTICA: se usa antes de crear una reserva.
     */
    @GetMapping("/tieneDeudaPendiente/{usuarioId}")
    public ResponseEntity<Boolean> tieneDeudaPendiente(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(service.tieneDeudaPendiente(usuarioId));
    }

    /**
     * GET /api/deuda/totalDeudaPendiente/{usuarioId}
     * Obtiene el total de deuda pendiente de un usuario.
     */
    @GetMapping("/totalDeudaPendiente/{usuarioId}")
    public ResponseEntity<BigDecimal> obtenerTotalDeudaPendiente(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(service.obtenerTotalDeudaPendiente(usuarioId));
    }

    /**
     * PATCH /api/deuda/pagar/{deudaId}
     * Paga una deuda específica.
     */
    @PatchMapping("/pagar/{deudaId}")
    public ResponseEntity<DeudaDTO> pagarDeuda(@PathVariable Long deudaId) {
        try {
            DeudaDTO resultado = service.pagarDeuda(deudaId);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * PATCH /api/deuda/pagarTodas/{usuarioId}
     * Paga todas las deudas pendientes de un usuario.
     */
    @PatchMapping("/pagarTodas/{usuarioId}")
    public ResponseEntity<String> pagarTodasDeudas(@PathVariable Long usuarioId) {
        try {
            int cantidad = service.pagarTodasDeudas(usuarioId);
            return ResponseEntity.ok("Se pagaron " + cantidad + " deudas.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}