package com.parkspot.controller;

import com.parkspot.dto.VehiculoDTO;
import com.parkspot.service.VehiculoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para la entidad Vehiculo.
 * Gestiona los vehículos registrados por los usuarios.
 * 
 * BASE URL: /api/vehiculo
 */
@RestController
@RequestMapping("/api/vehiculo")
@CrossOrigin("*")
public class VehiculoController {

    @Autowired
    private VehiculoService service;

    @GetMapping("/listar")
    public ResponseEntity<List<VehiculoDTO>> listar() {
        return ResponseEntity.ok(service.listarTodos());
    }

    @GetMapping("/buscar/{id}")
    public ResponseEntity<VehiculoDTO> buscarPorId(@PathVariable Long id) {
        VehiculoDTO dto = service.buscarPorId(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/buscarPorPlaca/{placa}")
    public ResponseEntity<VehiculoDTO> buscarPorPlaca(@PathVariable String placa) {
        VehiculoDTO dto = service.buscarPorPlaca(placa);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/registrar")
    public ResponseEntity<VehiculoDTO> registrar(@RequestBody VehiculoDTO dto) {
        try {
            VehiculoDTO resultado = service.registrar(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/actualizar/{id}")
    public ResponseEntity<VehiculoDTO> actualizar(@PathVariable Long id, @RequestBody VehiculoDTO dto) {
        try {
            VehiculoDTO resultado = service.actualizar(id, dto);
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
     * GET /api/vehiculo/listarPorUsuario/{usuarioId}
     * Lista todos los vehículos de un usuario.
     */
    @GetMapping("/listarPorUsuario/{usuarioId}")
    public ResponseEntity<List<VehiculoDTO>> listarPorUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(service.listarPorUsuario(usuarioId));
    }
}