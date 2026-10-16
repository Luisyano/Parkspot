package com.parkspot.controller;

import com.parkspot.dto.UsuarioDTO;
import com.parkspot.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para la entidad Usuario.
 * Gestiona clientes, operadores y administradores.
 * 
 * BASE URL: /api/usuario
 */
@RestController
@RequestMapping("/api/usuario")
@CrossOrigin("*")
public class UsuarioController {

    @Autowired
    private UsuarioService service;

    // ==========================================
    // ENDPOINTS CRUD PRINCIPALES
    // ==========================================

    /**
     * GET /api/usuario/listar
     * Lista todos los usuarios.
     */
    @GetMapping("/listar")
    public ResponseEntity<List<UsuarioDTO>> listar() {
        return ResponseEntity.ok(service.listarTodos());
    }

    /**
     * GET /api/usuario/buscar/{id}
     * Busca un usuario por su ID.
     */
    @GetMapping("/buscar/{id}")
    public ResponseEntity<UsuarioDTO> buscarPorId(@PathVariable Long id) {
        UsuarioDTO dto = service.buscarPorId(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    /**
     * GET /api/usuario/buscarPorEmail/{email}
     * Busca un usuario por su email (para login).
     */
    @GetMapping("/buscarPorEmail/{email}")
    public ResponseEntity<UsuarioDTO> buscarPorEmail(@PathVariable String email) {
        UsuarioDTO dto = service.buscarPorEmail(email);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    /**
     * POST /api/usuario/registrar
     * Registra un nuevo usuario.
     * ⚠️ La contraseña debe ser cifrada con BCrypt en el frontend o aquí.
     */
    @PostMapping("/registrar")
    public ResponseEntity<UsuarioDTO> registrar(@RequestBody UsuarioDTO dto) {
        try {
            // ⚠️ En producción, la contraseña debe venir cifrada desde el frontend
            // o cifrarse aquí con BCryptPasswordEncoder
            UsuarioDTO resultado = service.registrar(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * PUT /api/usuario/actualizar/{id}
     * Actualiza un usuario existente.
     * ⚠️ No actualiza la contraseña (usar endpoint aparte).
     */
    @PutMapping("/actualizar/{id}")
    public ResponseEntity<UsuarioDTO> actualizar(@PathVariable Long id, @RequestBody UsuarioDTO dto) {
        try {
            UsuarioDTO resultado = service.actualizar(id, dto);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * DELETE /api/usuario/eliminar/{id}
     * Elimina un usuario por su ID.
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
     * GET /api/usuario/listarPorRol/{rol}
     * Lista usuarios por rol (CLIENTE, OPERADOR, ADMIN).
     */
    @GetMapping("/listarPorRol/{rol}")
    public ResponseEntity<List<UsuarioDTO>> listarPorRol(@PathVariable String rol) {
        return ResponseEntity.ok(service.listarPorRol(rol));
    }

    /**
     * GET /api/usuario/listarOperadoresPorSede/{sedeId}
     * Lista operadores de una sede.
     */
    @GetMapping("/listarOperadoresPorSede/{sedeId}")
    public ResponseEntity<List<UsuarioDTO>> listarOperadoresPorSede(@PathVariable Long sedeId) {
        return ResponseEntity.ok(service.listarOperadoresPorSede(sedeId));
    }
}