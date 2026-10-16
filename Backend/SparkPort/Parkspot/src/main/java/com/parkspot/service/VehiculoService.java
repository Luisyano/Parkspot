package com.parkspot.service;

import com.parkspot.dto.VehiculoDTO;
import com.parkspot.entity.Usuario;
import com.parkspot.entity.Vehiculo;
import com.parkspot.repository.UsuarioRepository;
import com.parkspot.repository.VehiculoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio para la entidad Vehiculo.
 * Gestiona los vehículos registrados por los usuarios.
 * Máximo 5 vehículos por usuario (validado en el backend).
 */
@Service
@Transactional
public class VehiculoService {

    private static final int MAX_VEHICULOS = 5;

    @Autowired
    private VehiculoRepository repo;

    @Autowired
    private UsuarioRepository usuarioRepo;

    // ==========================================
    // MÉTODOS CRUD PRINCIPALES
    // ==========================================

    public List<VehiculoDTO> listarTodos() {
        return repo.findAll().stream()
                .map(this::convertirADTO)
                .toList();
    }

    public VehiculoDTO buscarPorId(Long id) {
        Vehiculo entity = repo.findById(id).orElse(null);
        return entity != null ? convertirADTO(entity) : null;
    }

    public VehiculoDTO buscarPorPlaca(String placa) {
        Vehiculo entity = repo.findByPlaca(placa).orElse(null);
        return entity != null ? convertirADTO(entity) : null;
    }

    public VehiculoDTO registrar(VehiculoDTO dto) {
        // Validar que la placa no exista
        if (repo.existsByPlaca(dto.getPlaca())) {
            throw new RuntimeException("La placa ya está registrada: " + dto.getPlaca());
        }

        // Validar límite de vehículos por usuario
        long count = repo.countByUsuarioId(dto.getUsuarioId());
        if (count >= MAX_VEHICULOS) {
            throw new RuntimeException("El usuario ya tiene " + count + " vehículos (máximo " + MAX_VEHICULOS + ")");
        }

        Vehiculo entity = convertirAEntity(dto);
        Vehiculo guardado = repo.save(entity);
        return convertirADTO(guardado);
    }

    public VehiculoDTO actualizar(Long id, VehiculoDTO dto) {
        Vehiculo entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado con ID: " + id));

        if (dto.getPlaca() != null && !dto.getPlaca().equals(entity.getPlaca())) {
            if (repo.existsByPlaca(dto.getPlaca())) {
                throw new RuntimeException("La placa ya está registrada: " + dto.getPlaca());
            }
            entity.setPlaca(dto.getPlaca());
        }
        if (dto.getTipo() != null) entity.setTipo(Vehiculo.TipoVehiculo.valueOf(dto.getTipo()));
        if (dto.getModelo() != null) entity.setModelo(dto.getModelo());

        Vehiculo actualizado = repo.save(entity);
        return convertirADTO(actualizado);
    }

    public void eliminar(Long id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Vehículo no encontrado con ID: " + id);
        }
        repo.deleteById(id);
    }

    // ==========================================
    // MÉTODOS DE CONSULTA PERSONALIZADOS
    // ==========================================

    public List<VehiculoDTO> listarPorUsuario(Long usuarioId) {
        return repo.findByUsuarioId(usuarioId).stream()
                .map(this::convertirADTO)
                .toList();
    }

    // ==========================================
    // MÉTODOS AUXILIARES (Conversión)
    // ==========================================

    private VehiculoDTO convertirADTO(Vehiculo entity) {
        VehiculoDTO dto = new VehiculoDTO();
        dto.setId(entity.getId());
        dto.setPlaca(entity.getPlaca());
        dto.setTipo(entity.getTipo().name());
        dto.setModelo(entity.getModelo());
        dto.setUsuarioId(entity.getUsuario().getId());
        return dto;
    }

    private Vehiculo convertirAEntity(VehiculoDTO dto) {
        Vehiculo entity = new Vehiculo();
        entity.setPlaca(dto.getPlaca().toUpperCase());
        entity.setTipo(Vehiculo.TipoVehiculo.valueOf(dto.getTipo()));
        entity.setModelo(dto.getModelo());

        Usuario usuario = usuarioRepo.findById(dto.getUsuarioId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + dto.getUsuarioId()));
        entity.setUsuario(usuario);

        return entity;
    }
}