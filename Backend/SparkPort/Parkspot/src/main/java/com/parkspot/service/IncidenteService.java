package com.parkspot.service;

import com.parkspot.dto.IncidenteDTO;
import com.parkspot.entity.Espacio;
import com.parkspot.entity.Incidente;
import com.parkspot.entity.Ticket;
import com.parkspot.entity.Usuario;
import com.parkspot.repository.EspacioRepository;
import com.parkspot.repository.IncidenteRepository;
import com.parkspot.repository.TicketRepository;
import com.parkspot.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Servicio para la entidad Incidente.
 * Flujo completo:
 * 1. Operador reporta → estado = ABIERTO
 * 2. Admin revisa y da solución → estado = RESUELTO
 * 3. Operador ejecuta y cierra → estado = CERRADO
 */
@Service
@Transactional
public class IncidenteService {

    @Autowired
    private IncidenteRepository repo;

    @Autowired
    private UsuarioRepository usuarioRepo;

    @Autowired
    private EspacioRepository espacioRepo;

    @Autowired
    private TicketRepository ticketRepo;

    // ==========================================
    // MÉTODOS CRUD PRINCIPALES
    // ==========================================

    public List<IncidenteDTO> listarTodos() {
        return repo.findAll().stream()
                .map(this::convertirADTO)
                .toList();
    }

    public IncidenteDTO buscarPorId(Long id) {
        Incidente entity = repo.findById(id).orElse(null);
        return entity != null ? convertirADTO(entity) : null;
    }

    /**
     * Reporta un nuevo incidente (lo hace el OPERADOR).
     * Estado inicial: ABIERTO.
     */
    public IncidenteDTO reportar(IncidenteDTO dto) {
        Incidente entity = convertirAEntity(dto);

        // Validar que el operador exista
        Usuario operador = usuarioRepo.findById(dto.getOperadorId())
                .orElseThrow(() -> new RuntimeException("Operador no encontrado con ID: " + dto.getOperadorId()));

        // Validar que sea un operador
        if (operador.getRol() != Usuario.Rol.OPERADOR) {
            throw new RuntimeException("Solo los operadores pueden reportar incidentes.");
        }

        entity.setOperador(operador);
        entity.setEstado(Incidente.EstadoIncidente.ABIERTO);
        entity.setFechaCreacion(LocalDateTime.now());

        Incidente guardado = repo.save(entity);
        return convertirADTO(guardado);
    }

    /**
     * Asigna una solución al incidente (lo hace el ADMIN).
     * Cambia estado a RESUELTO.
     */
    public IncidenteDTO resolver(Long incidenteId, Long adminId, String solucion) {
        Incidente entity = repo.findById(incidenteId)
                .orElseThrow(() -> new RuntimeException("Incidente no encontrado con ID: " + incidenteId));

        if (entity.getEstado() == Incidente.EstadoIncidente.CERRADO) {
            throw new RuntimeException("El incidente ya está cerrado.");
        }

        // Validar que el admin exista
        Usuario admin = usuarioRepo.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Administrador no encontrado con ID: " + adminId));

        if (admin.getRol() != Usuario.Rol.ADMIN) {
            throw new RuntimeException("Solo los administradores pueden resolver incidentes.");
        }

        entity.setAdmin(admin);
        entity.setSolucion(solucion);
        entity.setEstado(Incidente.EstadoIncidente.RESUELTO);

        Incidente actualizado = repo.save(entity);
        return convertirADTO(actualizado);
    }

    /**
     * Cierra un incidente (lo hace el OPERADOR después de ejecutar la solución).
     */
    public IncidenteDTO cerrar(Long incidenteId) {
        Incidente entity = repo.findById(incidenteId)
                .orElseThrow(() -> new RuntimeException("Incidente no encontrado con ID: " + incidenteId));

        if (entity.getEstado() != Incidente.EstadoIncidente.RESUELTO) {
            throw new RuntimeException("El incidente debe estar RESUELTO para poder cerrarlo.");
        }

        entity.setEstado(Incidente.EstadoIncidente.CERRADO);
        entity.setFechaCierre(LocalDateTime.now());

        Incidente actualizado = repo.save(entity);
        return convertirADTO(actualizado);
    }

    /**
     * Reabre un incidente (si estaba RESUELTO pero no se ejecutó bien).
     * Vuelve a estado EN_PROCESO.
     */
    public IncidenteDTO reabrir(Long incidenteId) {
        Incidente entity = repo.findById(incidenteId)
                .orElseThrow(() -> new RuntimeException("Incidente no encontrado con ID: " + incidenteId));

        if (entity.getEstado() == Incidente.EstadoIncidente.CERRADO) {
            throw new RuntimeException("No se puede reabrir un incidente cerrado.");
        }

        entity.setEstado(Incidente.EstadoIncidente.EN_PROCESO);
        Incidente actualizado = repo.save(entity);
        return convertirADTO(actualizado);
    }

    // ==========================================
    // MÉTODOS DE CONSULTA PERSONALIZADOS
    // ==========================================

    public List<IncidenteDTO> listarPorEstado(String estado) {
        return repo.findByEstado(Incidente.EstadoIncidente.valueOf(estado)).stream()
                .map(this::convertirADTO)
                .toList();
    }

    public List<IncidenteDTO> listarPorTipo(String tipo) {
        return repo.findByTipo(Incidente.TipoIncidente.valueOf(tipo)).stream()
                .map(this::convertirADTO)
                .toList();
    }

    public List<IncidenteDTO> listarPorSede(Long sedeId) {
        return repo.findByEspacioSedeId(sedeId).stream()
                .map(this::convertirADTO)
                .toList();
    }

    public List<IncidenteDTO> listarAbiertosPorSede(Long sedeId) {
        return repo.findByEspacioSedeIdAndEstado(sedeId, Incidente.EstadoIncidente.ABIERTO).stream()
                .map(this::convertirADTO)
                .toList();
    }

    public List<IncidenteDTO> listarUrgentesPorSede(Long sedeId) {
        List<Incidente.EstadoIncidente> estadosUrgentes = List.of(
                Incidente.EstadoIncidente.ABIERTO,
                Incidente.EstadoIncidente.EN_PROCESO
        );
        return repo.findByEspacioSedeIdAndEstadoIn(sedeId, estadosUrgentes).stream()
                .map(this::convertirADTO)
                .toList();
    }

    // ==========================================
    // MÉTODOS AUXILIARES (Conversión)
    // ==========================================

    private IncidenteDTO convertirADTO(Incidente entity) {
        IncidenteDTO dto = new IncidenteDTO();
        dto.setId(entity.getId());
        dto.setEspacioId(entity.getEspacio() != null ? entity.getEspacio().getId() : null);
        dto.setTicketId(entity.getTicket() != null ? entity.getTicket().getId() : null);
        dto.setOperadorId(entity.getOperador().getId());
        dto.setAdminId(entity.getAdmin() != null ? entity.getAdmin().getId() : null);
        dto.setTipo(entity.getTipo().name());
        dto.setDescripcion(entity.getDescripcion());
        dto.setSolucion(entity.getSolucion());
        dto.setEstado(entity.getEstado().name());
        dto.setFechaCreacion(entity.getFechaCreacion());
        dto.setFechaCierre(entity.getFechaCierre());

        // Datos anidados
        dto.setNombreOperador(entity.getOperador().getNombres() + " " + entity.getOperador().getApellidos());
        if (entity.getAdmin() != null) {
            dto.setNombreAdmin(entity.getAdmin().getNombres() + " " + entity.getAdmin().getApellidos());
        }
        if (entity.getEspacio() != null) {
            dto.setCodigoEspacio(entity.getEspacio().getCodigo());
        }

        return dto;
    }

    private Incidente convertirAEntity(IncidenteDTO dto) {
        Incidente entity = new Incidente();

        if (dto.getEspacioId() != null) {
            Espacio espacio = espacioRepo.findById(dto.getEspacioId())
                    .orElseThrow(() -> new RuntimeException("Espacio no encontrado con ID: " + dto.getEspacioId()));
            entity.setEspacio(espacio);
        }

        if (dto.getTicketId() != null) {
            Ticket ticket = ticketRepo.findById(dto.getTicketId())
                    .orElseThrow(() -> new RuntimeException("Ticket no encontrado con ID: " + dto.getTicketId()));
            entity.setTicket(ticket);
        }

        entity.setTipo(Incidente.TipoIncidente.valueOf(dto.getTipo()));
        entity.setDescripcion(dto.getDescripcion());

        return entity;
    }
}