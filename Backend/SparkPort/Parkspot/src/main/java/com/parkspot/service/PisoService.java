package com.parkspot.service;

import com.parkspot.dto.PisoDTO;
import com.parkspot.entity.Piso;
import com.parkspot.entity.Sede;
import com.parkspot.repository.PisoRepository;
import com.parkspot.repository.SedeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio para la entidad Piso.
 * Gestiona los pisos de cada sede.
 */
@Service
@Transactional
public class PisoService {

    @Autowired
    private PisoRepository repo;

    @Autowired
    private SedeRepository sedeRepo;

    // ==========================================
    // MÉTODOS CRUD PRINCIPALES
    // ==========================================

    public List<PisoDTO> listarTodos() {
        return repo.findAll().stream()
                .map(this::convertirADTO)
                .toList();
    }

    public PisoDTO buscarPorId(Long id) {
        Piso entity = repo.findById(id).orElse(null);
        return entity != null ? convertirADTO(entity) : null;
    }

    public PisoDTO registrar(PisoDTO dto) {
        Piso entity = convertirAEntity(dto);
        Piso guardado = repo.save(entity);
        return convertirADTO(guardado);
    }

    public PisoDTO actualizar(Long id, PisoDTO dto) {
        Piso entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Piso no encontrado con ID: " + id));

        if (dto.getNumero() != null) entity.setNumero(dto.getNumero());
        if (dto.getLetra() != null) entity.setLetra(dto.getLetra());
        if (dto.getSedeId() != null) {
            Sede sede = sedeRepo.findById(dto.getSedeId())
                    .orElseThrow(() -> new RuntimeException("Sede no encontrada con ID: " + dto.getSedeId()));
            entity.setSede(sede);
        }

        Piso actualizado = repo.save(entity);
        return convertirADTO(actualizado);
    }

    public void eliminar(Long id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Piso no encontrado con ID: " + id);
        }
        repo.deleteById(id);
    }

    // ==========================================
    // MÉTODOS DE CONSULTA PERSONALIZADOS
    // ==========================================

    public List<PisoDTO> listarPorSede(Long sedeId) {
        return repo.findBySedeId(sedeId).stream()
                .map(this::convertirADTO)
                .toList();
    }

    // ==========================================
    // MÉTODOS AUXILIARES (Conversión)
    // ==========================================

    private PisoDTO convertirADTO(Piso entity) {
        PisoDTO dto = new PisoDTO();
        dto.setId(entity.getId());
        dto.setSedeId(entity.getSede().getId());
        dto.setNumero(entity.getNumero());
        dto.setLetra(entity.getLetra());
        return dto;
    }

    private Piso convertirAEntity(PisoDTO dto) {
        Piso entity = new Piso();
        entity.setNumero(dto.getNumero());
        entity.setLetra(dto.getLetra());

        Sede sede = sedeRepo.findById(dto.getSedeId())
                .orElseThrow(() -> new RuntimeException("Sede no encontrada con ID: " + dto.getSedeId()));
        entity.setSede(sede);

        return entity;
    }
}