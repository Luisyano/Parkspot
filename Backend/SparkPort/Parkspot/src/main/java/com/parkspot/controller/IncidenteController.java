package com.parkspot.controller;

import com.parkspot.dto.IncidenteDTO;
import com.parkspot.service.IncidenteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para la entidad Incidente.
 * Flujo: Operador reporta → Admin resuelve → Operador cierra.
 * 
 * BASE URL: /api/incidente
 */
@RestController
@RequestMapping("/api/incidente")
@CrossOrigin("*")
public class IncidenteController {

    @Autowired
    private IncidenteService service;

    // ==========================================
    // ENDPOINTS CRUD PRINCIPALES
    // ==========================================

    @GetMapping("/listar")
    public ResponseEntity<List<IncidenteDTO>> listar() {
        return ResponseEntity.ok(service.listarTodos());
    }

    @GetMapping("/buscar/{id}")
    public ResponseEntity<IncidenteDTO> buscarPorId(@PathVariable Long id) {
        IncidenteDTO dto = service.buscarPorId(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    /**
     * POST /api/incidente/reportar
     * Reporta un nuevo incidente (lo hace el OPERADOR).
     * Estado inicial: ABIERTO.
     */
    @PostMapping("/reportar")
    public ResponseEntity<IncidenteDTO> reportar(@RequestBody IncidenteDTO dto) {
        try {
            IncidenteDTO resultado = service.reportar(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ==========================================
    // ENDPOINTS DE FLUJO
    // ==========================================

    /**
     * PATCH /api/incidente/resolver/{incidenteId}
     * Asigna una solución al incidente (lo hace el ADMIN).
     * Cambia estado a RESUELTO.
     */
    @PatchMapping("/resolver/{incidenteId}")
    public ResponseEntity<IncidenteDTO> resolver(
            @PathVariable Long incidenteId,
            @RequestParam Long adminId,
            @RequestParam String solucion) {
        try {
            IncidenteDTO resultado = service.resolver(incidenteId, adminId, solucion);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * PATCH /api/incidente/cerrar/{incidenteId}
     * Cierra un incidente (lo hace el OPERADOR después de ejecutar la solución).
     */
    @PatchMapping("/cerrar/{incidenteId}")
    public ResponseEntity<IncidenteDTO> cerrar(@PathVariable Long incidenteId) {
        try {
            IncidenteDTO resultado = service.cerrar(incidenteId);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * PATCH /api/incidente/reabrir/{incidenteId}
     * Reabre un incidente (si estaba RESUELTO pero no se ejecutó bien).
     */
    @PatchMapping("/reabrir/{incidenteId}")
    public ResponseEntity<IncidenteDTO> reabrir(@PathVariable Long incidenteId) {
        try {
            IncidenteDTO resultado = service.reabrir(incidenteId);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ==========================================
    // ENDPOINTS DE CONSULTA PERSONALIZADA
    // ==========================================

    @GetMapping("/listarPorEstado/{estado}")
    public ResponseEntity<List<IncidenteDTO>> listarPorEstado(@PathVariable String estado) {
        return ResponseEntity.ok(service.listarPorEstado(estado));
    }

    @GetMapping("/listarPorTipo/{tipo}")
    public ResponseEntity<List<IncidenteDTO>> listarPorTipo(@PathVariable String tipo) {
        return ResponseEntity.ok(service.listarPorTipo(tipo));
    }

    @GetMapping("/listarPorSede/{sedeId}")
    public ResponseEntity<List<IncidenteDTO>> listarPorSede(@PathVariable Long sedeId) {
        return ResponseEntity.ok(service.listarPorSede(sedeId));
    }

    @GetMapping("/listarAbiertosPorSede/{sedeId}")
    public ResponseEntity<List<IncidenteDTO>> listarAbiertosPorSede(@PathVariable Long sedeId) {
        return ResponseEntity.ok(service.listarAbiertosPorSede(sedeId));
    }

    /**
     * GET /api/incidente/listarUrgentesPorSede/{sedeId}
     * Lista incidentes ABIERTOS o EN_PROCESO de una sede.
     * Para alertas urgentes.
     */
    @GetMapping("/listarUrgentesPorSede/{sedeId}")
    public ResponseEntity<List<IncidenteDTO>> listarUrgentesPorSede(@PathVariable Long sedeId) {
        return ResponseEntity.ok(service.listarUrgentesPorSede(sedeId));
    }
}