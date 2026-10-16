package com.parkspot.controller;

import com.parkspot.dto.EspacioDTO;
import com.parkspot.service.EspacioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controlador REST para la entidad Espacio.
 * ⚡ Este es el controller más consultado del sistema.
 * 
 * BASE URL: /api/espacio
 */
@RestController
@RequestMapping("/api/espacio")
@CrossOrigin("*")
public class EspacioController {

    @Autowired
    private EspacioService service;

    // ==========================================
    // ENDPOINTS CRUD PRINCIPALES
    // ==========================================

    @GetMapping("/listar")
    public ResponseEntity<List<EspacioDTO>> listar() {
        return ResponseEntity.ok(service.listarTodos());
    }

    @GetMapping("/buscar/{id}")
    public ResponseEntity<EspacioDTO> buscarPorId(@PathVariable Long id) {
        EspacioDTO dto = service.buscarPorId(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/registrar")
    public ResponseEntity<EspacioDTO> registrar(@RequestBody EspacioDTO dto) {
        try {
            EspacioDTO resultado = service.registrar(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/actualizar/{id}")
    public ResponseEntity<EspacioDTO> actualizar(@PathVariable Long id, @RequestBody EspacioDTO dto) {
        try {
            EspacioDTO resultado = service.actualizar(id, dto);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/eliminar/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        try {
            service.eliminar(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ==========================================
    // ENDPOINTS DE CONSULTA (LOS MÁS USADOS)
    // ==========================================

    /**
     * GET /api/espacio/listarPorSede/{sedeId}
     * ⚡ CONSULTA MÁS FRECUENTE: lista todos los espacios de una sede.
     */
    @GetMapping("/listarPorSede/{sedeId}")
    public ResponseEntity<List<EspacioDTO>> listarPorSede(@PathVariable Long sedeId) {
        return ResponseEntity.ok(service.listarPorSede(sedeId));
    }

    /**
     * GET /api/espacio/listarDisponiblesPorSede/{sedeId}
     * Lista espacios disponibles de una sede.
     */
    @GetMapping("/listarDisponiblesPorSede/{sedeId}")
    public ResponseEntity<List<EspacioDTO>> listarDisponiblesPorSede(@PathVariable Long sedeId) {
        return ResponseEntity.ok(service.listarDisponiblesPorSede(sedeId));
    }

    /**
     * GET /api/espacio/listarOcupadosPorSede/{sedeId}
     * Lista espacios ocupados de una sede (para el operador).
     */
    @GetMapping("/listarOcupadosPorSede/{sedeId}")
    public ResponseEntity<List<EspacioDTO>> listarOcupadosPorSede(@PathVariable Long sedeId) {
        return ResponseEntity.ok(service.listarOcupadosPorSede(sedeId));
    }

    /**
     * GET /api/espacio/listarPorPiso/{pisoId}
     * Lista espacios por piso.
     */
    @GetMapping("/listarPorPiso/{pisoId}")
    public ResponseEntity<List<EspacioDTO>> listarPorPiso(@PathVariable Long pisoId) {
        return ResponseEntity.ok(service.listarPorPiso(pisoId));
    }

    /**
     * GET /api/espacio/listarDisponiblesPorSedeYTipo
     * Lista espacios disponibles en una sede para un tipo específico.
     * Query Params: sedeId, tipo (REGULAR, DISCAPACITADO, MOTO)
     */
    @GetMapping("/listarDisponiblesPorSedeYTipo")
    public ResponseEntity<List<EspacioDTO>> listarDisponiblesPorSedeYTipo(
            @RequestParam Long sedeId,
            @RequestParam String tipo) {
        return ResponseEntity.ok(service.listarDisponiblesPorSedeYTipo(sedeId, tipo));
    }

    /**
     * GET /api/espacio/resumenOcupacion/{sedeId}
     * Obtiene el resumen de ocupación por estado para una sede.
     * Para los KPIs del dashboard del operador.
     */
    @GetMapping("/resumenOcupacion/{sedeId}")
    public ResponseEntity<Map<String, Long>> obtenerResumenOcupacion(@PathVariable Long sedeId) {
        return ResponseEntity.ok(service.obtenerResumenOcupacion(sedeId));
    }
}