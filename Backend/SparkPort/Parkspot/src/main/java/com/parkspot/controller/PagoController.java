package com.parkspot.controller;

import com.parkspot.dto.PagoDTO;
import com.parkspot.service.PagoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para la entidad Pago.
 * Gestiona los pagos de las reservas.
 * 
 * BASE URL: /api/pago
 */
@RestController
@RequestMapping("/api/pago")
@CrossOrigin("*")
public class PagoController {

    @Autowired
    private PagoService service;

    @GetMapping("/listar")
    public ResponseEntity<List<PagoDTO>> listar() {
        return ResponseEntity.ok(service.listarTodos());
    }

    @GetMapping("/buscar/{id}")
    public ResponseEntity<PagoDTO> buscarPorId(@PathVariable Long id) {
        PagoDTO dto = service.buscarPorId(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/buscarPorReserva/{reservaId}")
    public ResponseEntity<PagoDTO> buscarPorReserva(@PathVariable Long reservaId) {
        PagoDTO dto = service.buscarPorReserva(reservaId);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    /**
     * POST /api/pago/registrar
     * Registra un pago y confirma la reserva automáticamente.
     */
    @PostMapping("/registrar")
    public ResponseEntity<PagoDTO> registrar(@RequestBody PagoDTO dto) {
        try {
            PagoDTO resultado = service.registrar(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ==========================================
    // ENDPOINTS DE REPORTES
    // ==========================================

    /**
     * GET /api/pago/totalIngresosPorSede/{sedeId}
     * Obtiene el total de ingresos por sede.
     */
    @GetMapping("/totalIngresosPorSede/{sedeId}")
    public ResponseEntity<BigDecimal> obtenerTotalIngresosPorSede(@PathVariable Long sedeId) {
        return ResponseEntity.ok(service.obtenerTotalIngresosPorSede(sedeId));
    }

    /**
     * GET /api/pago/ingresosPorMetodoEnSede/{sedeId}
     * Obtiene el desglose de ingresos por método de pago en una sede.
     */
    @GetMapping("/ingresosPorMetodoEnSede/{sedeId}")
    public ResponseEntity<Map<String, BigDecimal>> obtenerIngresosPorMetodoEnSede(@PathVariable Long sedeId) {
        return ResponseEntity.ok(service.obtenerIngresosPorMetodoEnSede(sedeId));
    }
}