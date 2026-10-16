package com.parkspot.service;

import com.parkspot.dto.EspacioDTO;
import com.parkspot.entity.Espacio;
import com.parkspot.entity.Piso;
import com.parkspot.entity.Sede;
import com.parkspot.repository.EspacioRepository;
import com.parkspot.repository.PisoRepository;
import com.parkspot.repository.SedeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Servicio para la entidad Espacio.
 * Gestiona los espacios de estacionamiento.
 * ⚡ Este es el servicio más consultado del sistema.
 */
@Service
@Transactional
public class EspacioService {

    @Autowired
    private EspacioRepository repo;

    @Autowired
    private PisoRepository pisoRepo;

    @Autowired
    private SedeRepository sedeRepo;

    // ==========================================
    // MÉTODOS CRUD PRINCIPALES
    // ==========================================

    public List<EspacioDTO> listarTodos() {
        return repo.findAll().stream()
                .map(this::convertirADTO)
                .toList();
    }

    public EspacioDTO buscarPorId(Long id) {
        Espacio entity = repo.findById(id).orElse(null);
        return entity != null ? convertirADTO(entity) : null;
    }

    /**
     * Registra un nuevo espacio.
     * ⚠️ IMPORTANTE: Sincroniza sede_id con piso.getSede() automáticamente.
     */
    public EspacioDTO registrar(EspacioDTO dto) {
        Espacio entity = convertirAEntity(dto);

        // Sincronización automática: sede_id = piso.getSede().getId()
        Piso piso = pisoRepo.findById(dto.getPisoId())
                .orElseThrow(() -> new RuntimeException("Piso no encontrado con ID: " + dto.getPisoId()));
        entity.setSede(piso.getSede());

        Espacio guardado = repo.save(entity);
        return convertirADTO(guardado);
    }

    public EspacioDTO actualizar(Long id, EspacioDTO dto) {
        Espacio entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Espacio no encontrado con ID: " + id));

        if (dto.getCodigo() != null) entity.setCodigo(dto.getCodigo());
        if (dto.getTipo() != null) entity.setTipo(Espacio.TipoEspacio.valueOf(dto.getTipo()));
        if (dto.getEstado() != null) entity.setEstado(Espacio.EstadoEspacio.valueOf(dto.getEstado()));

        // Si cambia el piso, actualizar también sede_id
        if (dto.getPisoId() != null) {
            Piso piso = pisoRepo.findById(dto.getPisoId())
                    .orElseThrow(() -> new RuntimeException("Piso no encontrado con ID: " + dto.getPisoId()));
            entity.setPiso(piso);
            entity.setSede(piso.getSede()); // Sincronización automática
        }

        Espacio actualizado = repo.save(entity);
        return convertirADTO(actualizado);
    }

    public void eliminar(Long id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Espacio no encontrado con ID: " + id);
        }
        repo.deleteById(id);
    }

    // ==========================================
    // MÉTODOS DE CONSULTA PERSONALIZADOS
    // (LAS MÁS FRECUENTES DEL SISTEMA)
    // ==========================================

    /**
     * Lista espacios de una sede.
     * ⚡ CONSULTA MÁS FRECUENTE.
     */
    public List<EspacioDTO> listarPorSede(Long sedeId) {
        return repo.findBySedeId(sedeId).stream()
                .map(this::convertirADTO)
                .toList();
    }

    /**
     * Lista espacios disponibles de una sede.
     */
    public List<EspacioDTO> listarDisponiblesPorSede(Long sedeId) {
        return repo.findBySedeIdAndEstado(sedeId, Espacio.EstadoEspacio.DISPONIBLE).stream()
                .map(this::convertirADTO)
                .toList();
    }

    /**
     * Lista espacios ocupados de una sede (para el operador).
     */
    public List<EspacioDTO> listarOcupadosPorSede(Long sedeId) {
        return repo.findBySedeIdAndEstado(sedeId, Espacio.EstadoEspacio.OCUPADO).stream()
                .map(this::convertirADTO)
                .toList();
    }

    /**
     * Lista espacios por piso.
     */
    public List<EspacioDTO> listarPorPiso(Long pisoId) {
        return repo.findByPisoId(pisoId).stream()
                .map(this::convertirADTO)
                .toList();
    }

    /**
     * Lista espacios disponibles en una sede para un tipo específico.
     * Usado cuando el cliente filtra por tipo de espacio.
     */
    public List<EspacioDTO> listarDisponiblesPorSedeYTipo(Long sedeId, String tipo) {
        return repo.findBySedeIdAndEstadoAndTipo(
                sedeId,
                Espacio.EstadoEspacio.DISPONIBLE,
                Espacio.TipoEspacio.valueOf(tipo)
        ).stream()
                .map(this::convertirADTO)
                .toList();
    }

    /**
     * Obtiene el resumen de ocupación por estado para una sede.
     * Para los KPIs del dashboard del operador.
     */
    public Map<String, Long> obtenerResumenOcupacion(Long sedeId) {
        List<Object[]> resultados = repo.contarPorEstadoEnSede(sedeId);
        return resultados.stream()
                .collect(Collectors.toMap(
                        r -> ((Espacio.EstadoEspacio) r[0]).name(),
                        r -> (Long) r[1]
                ));
    }

    // ==========================================
    // MÉTODOS AUXILIARES (Conversión)
    // ==========================================

    private EspacioDTO convertirADTO(Espacio entity) {
        EspacioDTO dto = new EspacioDTO();
        dto.setId(entity.getId());
        dto.setPisoId(entity.getPiso().getId());
        dto.setSedeId(entity.getSede().getId());
        dto.setCodigo(entity.getCodigo());
        dto.setTipo(entity.getTipo().name());
        dto.setEstado(entity.getEstado().name());
        return dto;
    }

    private Espacio convertirAEntity(EspacioDTO dto) {
        Espacio entity = new Espacio();
        entity.setCodigo(dto.getCodigo());
        entity.setTipo(Espacio.TipoEspacio.valueOf(dto.getTipo()));
        entity.setEstado(Espacio.EstadoEspacio.valueOf(dto.getEstado()));

        Piso piso = pisoRepo.findById(dto.getPisoId())
                .orElseThrow(() -> new RuntimeException("Piso no encontrado con ID: " + dto.getPisoId()));
        entity.setPiso(piso);
        entity.setSede(piso.getSede()); // ⚡ Sincronización automática

        return entity;
    }
}