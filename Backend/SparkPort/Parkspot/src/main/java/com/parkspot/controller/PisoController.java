package com.parkspot.controller;

import com.parkspot.dto.PisoDTO;
import com.parkspot.service.PisoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para la entidad Piso.
 * 
 * BASE URL: /api/piso
 */
@RestController
@RequestMapping("/api/piso")
@CrossOrigin("*")
public class PisoController {

    @Autowired
    private PisoService service;

    @GetMapping("/listar")
    public ResponseEntity<List<PisoDTO>> listar() {
        return ResponseEntity.ok(service.listarTodos());
    }

    @GetMapping("/buscar/{id}")
    public ResponseEntity<PisoDTO> buscarPorId(@PathVariable Long id) {
        PisoDTO dto = service.buscarPorId(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/registrar")
    public ResponseEntity<PisoDTO> registrar(@RequestBody PisoDTO dto) {
        try {
            PisoDTO resultado = service.registrar(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/actualizar/{id}")
    public ResponseEntity<PisoDTO> actualizar(@PathVariable Long id, @RequestBody PisoDTO dto) {
        try {
            PisoDTO resultado = service.actualizar(id, dto);
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

    /**
     * GET /api/piso/listarPorSede/{sedeId}
     * Lista todos los pisos de una sede.
     */
    @GetMapping("/listarPorSede/{sedeId}")
    public ResponseEntity<List<PisoDTO>> listarPorSede(@PathVariable Long sedeId) {
        return ResponseEntity.ok(service.listarPorSede(sedeId));
    }
}