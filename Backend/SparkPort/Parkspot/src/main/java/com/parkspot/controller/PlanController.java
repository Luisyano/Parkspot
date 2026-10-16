package com.parkspot.controller;

import com.parkspot.dto.PlanDTO;
import com.parkspot.service.PlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para la entidad Plan.
 * Solo lectura: los planes son fijos (POR_HORA, MENSUAL, ANUAL).
 * No se expone creación, actualización ni eliminación.
 * 
 * BASE URL: /api/plan
 */
@RestController
@RequestMapping("/api/plan")
@CrossOrigin("*")
public class PlanController {

    @Autowired
    private PlanService service;

    /**
     * GET /api/plan/listar
     * Lista todos los planes.
     */
    @GetMapping("/listar")
    public ResponseEntity<List<PlanDTO>> listar() {
        return ResponseEntity.ok(service.listarTodos());
    }

    /**
     * GET /api/plan/buscar/{id}
     * Busca un plan por su ID.
     */
    @GetMapping("/buscar/{id}")
    public ResponseEntity<PlanDTO> buscarPorId(@PathVariable Long id) {
        PlanDTO dto = service.buscarPorId(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    /**
     * GET /api/plan/buscarPorNombre/{nombre}
     * Busca un plan por su nombre (POR_HORA, MENSUAL, ANUAL).
     */
    @GetMapping("/buscarPorNombre/{nombre}")
    public ResponseEntity<PlanDTO> buscarPorNombre(@PathVariable String nombre) {
        PlanDTO dto = service.buscarPorNombre(nombre);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }
}