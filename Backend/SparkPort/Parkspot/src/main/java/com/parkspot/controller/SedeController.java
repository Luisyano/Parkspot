package com.parkspot.controller;

import com.parkspot.dto.SedeDTO;
import com.parkspot.service.SedeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para la entidad Sede.
 * Expone endpoints para gestionar sedes de ParkSpot.
 * 
 * BASE URL: /api/sede
 */
@RestController
@RequestMapping("/api/sede")
@CrossOrigin("*") // Permite peticiones desde Angular (frontend)
public class SedeController {

    @Autowired
    private SedeService service;

    // ==========================================
    // ENDPOINTS CRUD PRINCIPALES
    // ==========================================

    /**
     * GET /api/sede/listar
     * Lista todas las sedes.
     */
    @GetMapping("/listar")
    public ResponseEntity<List<SedeDTO>> listar() {
        return ResponseEntity.ok(service.listarTodos());
    }

    /**
     * GET /api/sede/buscar/{id}
     * Busca una sede por su ID.
     */
    @GetMapping("/buscar/{id}")
    public ResponseEntity<SedeDTO> buscarPorId(@PathVariable Long id) {
        SedeDTO dto = service.buscarPorId(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    /**
     * POST /api/sede/registrar
     * Registra una nueva sede.
     */
    @PostMapping("/registrar")
    public ResponseEntity<SedeDTO> registrar(@RequestBody SedeDTO dto) {
        try {
            SedeDTO resultado = service.registrar(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * PUT /api/sede/actualizar/{id}
     * Actualiza una sede existente.
     */
    @PutMapping("/actualizar/{id}")
    public ResponseEntity<SedeDTO> actualizar(@PathVariable Long id, @RequestBody SedeDTO dto) {
        try {
            SedeDTO resultado = service.actualizar(id, dto);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * DELETE /api/sede/eliminar/{id}
     * Elimina una sede por su ID.
     */
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
    // ENDPOINTS DE CONSULTA PERSONALIZADA
    // ==========================================

    /**
     * GET /api/sede/buscarPorDistrito/{distrito}
     * Busca sedes por distrito.
     */
    @GetMapping("/buscarPorDistrito/{distrito}")
    public ResponseEntity<List<SedeDTO>> buscarPorDistrito(@PathVariable String distrito) {
        return ResponseEntity.ok(service.listarPorDistrito(distrito));
    }

    /**
     * GET /api/sede/buscarActivasPorDistrito/{distrito}
     * Busca sedes activas en un distrito.
     */
    @GetMapping("/buscarActivasPorDistrito/{distrito}")
    public ResponseEntity<List<SedeDTO>> buscarActivasPorDistrito(@PathVariable String distrito) {
        return ResponseEntity.ok(service.listarActivasPorDistrito(distrito));
    }
}