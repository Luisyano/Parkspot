package com.parkspot.service;

import com.parkspot.dto.UsuarioDTO;
import com.parkspot.entity.Sede;
import com.parkspot.entity.Usuario;
import com.parkspot.repository.SedeRepository;
import com.parkspot.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio para la entidad Usuario.
 * Gestiona clientes, operadores y administradores.
 */
@Service
@Transactional
public class UsuarioService {

    @Autowired
    private UsuarioRepository repo;

    @Autowired
    private SedeRepository sedeRepo;

    // ==========================================
    // MÉTODOS CRUD PRINCIPALES
    // ==========================================

    /**
     * Lista todos los usuarios.
     */
    public List<UsuarioDTO> listarTodos() {
        return repo.findAll().stream()
                .map(this::convertirADTO)
                .toList();
    }

    /**
     * Busca un usuario por su ID.
     */
    public UsuarioDTO buscarPorId(Long id) {
        Usuario entity = repo.findById(id).orElse(null);
        return entity != null ? convertirADTO(entity) : null;
    }

    /**
     * Busca un usuario por su email (para login).
     */
    public UsuarioDTO buscarPorEmail(String email) {
        Usuario entity = repo.findByEmail(email).orElse(null);
        return entity != null ? convertirADTO(entity) : null;
    }

    /**
     * Registra un nuevo usuario.
     * Si es OPERADOR, debe tener sede_id.
     */
    public UsuarioDTO registrar(UsuarioDTO dto) {
        // Validar que el email no exista
        if (repo.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("El email ya está registrado: " + dto.getEmail());
        }

        // Si es OPERADOR, validar que tenga sede
        if ("OPERADOR".equals(dto.getRol()) && dto.getSedeId() == null) {
            throw new RuntimeException("Un operador debe tener una sede asignada");
        }

        Usuario entity = convertirAEntity(dto);
        Usuario guardado = repo.save(entity);
        return convertirADTO(guardado);
    }

    /**
     * Actualiza un usuario existente (actualización parcial).
     */
    public UsuarioDTO actualizar(Long id, UsuarioDTO dto) {
        Usuario entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

        if (dto.getNombres() != null) entity.setNombres(dto.getNombres());
        if (dto.getApellidos() != null) entity.setApellidos(dto.getApellidos());
        if (dto.getCelular() != null) entity.setCelular(dto.getCelular());
        if (dto.getRol() != null) entity.setRol(Usuario.Rol.valueOf(dto.getRol()));
        if (dto.getSedeId() != null) {
            Sede sede = sedeRepo.findById(dto.getSedeId())
                    .orElseThrow(() -> new RuntimeException("Sede no encontrada con ID: " + dto.getSedeId()));
            entity.setSede(sede);
        }
        if (dto.getConadisVerificado() != null) entity.setConadisVerificado(dto.getConadisVerificado());
        if (dto.getConadisImagenUrl() != null) entity.setConadisImagenUrl(dto.getConadisImagenUrl());
        if (dto.getConadisFechaExpiracion() != null) entity.setConadisFechaExpiracion(dto.getConadisFechaExpiracion());

        Usuario actualizado = repo.save(entity);
        return convertirADTO(actualizado);
    }

    /**
     * Elimina un usuario por su ID.
     */
    public void eliminar(Long id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Usuario no encontrado con ID: " + id);
        }
        repo.deleteById(id);
    }

    // ==========================================
    // MÉTODOS DE CONSULTA PERSONALIZADOS
    // ==========================================

    /**
     * Lista usuarios por rol.
     */
    public List<UsuarioDTO> listarPorRol(String rol) {
        return repo.findByRol(Usuario.Rol.valueOf(rol)).stream()
                .map(this::convertirADTO)
                .toList();
    }

    /**
     * Lista operadores de una sede.
     */
    public List<UsuarioDTO> listarOperadoresPorSede(Long sedeId) {
        return repo.findByRolAndSedeId(Usuario.Rol.OPERADOR, sedeId).stream()
                .map(this::convertirADTO)
                .toList();
    }

    /**
     * Verifica si un usuario tiene deuda pendiente.
     * (Usado por ReservaService antes de crear una reserva)
     */
    public boolean tieneDeudaPendiente(Long usuarioId) {
        // Este método será usado por ReservaService
        // La implementación real está en DeudaService
        return false;
    }

    // ==========================================
    // MÉTODOS AUXILIARES (Conversión)
    // ==========================================

    /**
     * Convierte una entidad Usuario a UsuarioDTO.
     */
    private UsuarioDTO convertirADTO(Usuario entity) {
        UsuarioDTO dto = new UsuarioDTO();
        dto.setId(entity.getId());
        dto.setNombres(entity.getNombres());
        dto.setApellidos(entity.getApellidos());
        dto.setEmail(entity.getEmail());
        dto.setCelular(entity.getCelular());
        dto.setRol(entity.getRol().name());
        dto.setSedeId(entity.getSede() != null ? entity.getSede().getId() : null);
        dto.setConadisVerificado(entity.getConadisVerificado());
        dto.setConadisImagenUrl(entity.getConadisImagenUrl());
        dto.setConadisFechaExpiracion(entity.getConadisFechaExpiracion());
        dto.setTieneTarjetaGuardada(entity.getTieneTarjetaGuardada());
        dto.setFechaCreacion(entity.getFechaCreacion());
        return dto;
    }

    /**
     * Convierte un UsuarioDTO a entidad Usuario.
     */
    private Usuario convertirAEntity(UsuarioDTO dto) {
        Usuario entity = new Usuario();
        entity.setNombres(dto.getNombres());
        entity.setApellidos(dto.getApellidos());
        entity.setEmail(dto.getEmail());
        entity.setPassword(dto.getPassword()); // ⚠️ Debe estar cifrada antes de llamar a este método
        entity.setCelular(dto.getCelular());
        entity.setRol(Usuario.Rol.valueOf(dto.getRol()));

        if (dto.getSedeId() != null) {
            Sede sede = sedeRepo.findById(dto.getSedeId())
                    .orElseThrow(() -> new RuntimeException("Sede no encontrada con ID: " + dto.getSedeId()));
            entity.setSede(sede);
        }

        entity.setConadisVerificado(dto.getConadisVerificado() != null && dto.getConadisVerificado());
        entity.setConadisImagenUrl(dto.getConadisImagenUrl());
        entity.setConadisFechaExpiracion(dto.getConadisFechaExpiracion());
        entity.setTieneTarjetaGuardada(dto.getTieneTarjetaGuardada() != null && dto.getTieneTarjetaGuardada());

        return entity;
    }
}