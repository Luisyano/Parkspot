package com.parkspot.service;

import com.parkspot.dto.SedeDTO;
import com.parkspot.entity.Sede;
import com.parkspot.repository.SedeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio para la entidad Sede.
 * Gestiona las sedes físicas de ParkSpot.
 */
@Service
@Transactional
public class SedeService {

    @Autowired
    private SedeRepository repo;

    // ==========================================
    // MÉTODOS CRUD PRINCIPALES
    // ==========================================

    /**
     * Lista todas las sedes.
     */
    public List<SedeDTO> listarTodos() {
        return repo.findAll().stream()
                .map(this::convertirADTO)
                .toList();
    }

    /**
     * Busca una sede por su ID.
     */
    public SedeDTO buscarPorId(Long id) {
        Sede entity = repo.findById(id).orElse(null);
        return entity != null ? convertirADTO(entity) : null;
    }

    /**
     * Registra una nueva sede.
     */
    public SedeDTO registrar(SedeDTO dto) {
        Sede entity = convertirAEntity(dto);
        Sede guardado = repo.save(entity);
        return convertirADTO(guardado);
    }

    /**
     * Actualiza una sede existente (actualización parcial).
     * Solo actualiza los campos que vienen en el DTO.
     */
    public SedeDTO actualizar(Long id, SedeDTO dto) {
        Sede entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Sede no encontrada con ID: " + id));

        if (dto.getNombre() != null) entity.setNombre(dto.getNombre());
        if (dto.getDireccion() != null) entity.setDireccion(dto.getDireccion());
        if (dto.getDistrito() != null) entity.setDistrito(dto.getDistrito());
        if (dto.getHoraApertura() != null) entity.setHoraApertura(dto.getHoraApertura());
        if (dto.getHoraCierre() != null) entity.setHoraCierre(dto.getHoraCierre());
        if (dto.getEstado() != null) {
            entity.setEstado(Sede.EstadoSede.valueOf(dto.getEstado()));
        }

        Sede actualizado = repo.save(entity);
        return convertirADTO(actualizado);
    }

    /**
     * Elimina una sede por su ID.
     */
    public void eliminar(Long id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Sede no encontrada con ID: " + id);
        }
        repo.deleteById(id);
    }

    // ==========================================
    // MÉTODOS DE CONSULTA PERSONALIZADOS
    // ==========================================

    /**
     * Busca sedes por distrito.
     */
    public List<SedeDTO> listarPorDistrito(String distrito) {
        return repo.findByDistrito(distrito).stream()
                .map(this::convertirADTO)
                .toList();
    }

    /**
     * Busca sedes activas en un distrito.
     */
    public List<SedeDTO> listarActivasPorDistrito(String distrito) {
        return repo.findByDistritoAndEstado(distrito, Sede.EstadoSede.ACTIVA).stream()
                .map(this::convertirADTO)
                .toList();
    }

    // ==========================================
    // MÉTODOS AUXILIARES (Conversión)
    // ==========================================

    /**
     * Convierte una entidad Sede a SedeDTO.
     */
    private SedeDTO convertirADTO(Sede entity) {
        SedeDTO dto = new SedeDTO();
        dto.setId(entity.getId());
        dto.setNombre(entity.getNombre());
        dto.setDireccion(entity.getDireccion());
        dto.setDistrito(entity.getDistrito());
        dto.setHoraApertura(entity.getHoraApertura());
        dto.setHoraCierre(entity.getHoraCierre());
        dto.setEstado(entity.getEstado().name());
        return dto;
    }

    /**
     * Convierte un SedeDTO a entidad Sede.
     */
    private Sede convertirAEntity(SedeDTO dto) {
        Sede entity = new Sede();
        entity.setNombre(dto.getNombre());
        entity.setDireccion(dto.getDireccion());
        entity.setDistrito(dto.getDistrito());
        entity.setHoraApertura(dto.getHoraApertura());
        entity.setHoraCierre(dto.getHoraCierre());
        if (dto.getEstado() != null) {
            entity.setEstado(Sede.EstadoSede.valueOf(dto.getEstado()));
        }
        return entity;
    }
}