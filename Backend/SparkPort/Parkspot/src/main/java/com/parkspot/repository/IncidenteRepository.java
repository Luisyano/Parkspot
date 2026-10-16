package com.parkspot.repository;

import com.parkspot.entity.Incidente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio para la entidad Incidente.
 * Flujo: Operador reporta → Admin resuelve → Operador cierra.
 */
@Repository
public interface IncidenteRepository extends JpaRepository<Incidente, Long> {

    /**
     * Busca incidentes por estado.
     * Ej: "Mostrar todos los incidentes ABIERTOS"
     */
    List<Incidente> findByEstado(Incidente.EstadoIncidente estado);

    /**
     * Busca incidentes por tipo.
     * Ej: "Mostrar todos los incidentes de EXCESO_TIEMPO"
     */
    List<Incidente> findByTipo(Incidente.TipoIncidente tipo);

    /**
     * Busca incidentes de una sede específica.
     * Para el dashboard del operador (solo ve los de su sede).
     */
    List<Incidente> findByEspacioSedeId(Long sedeId);

    /**
     * Busca incidentes reportados por un operador.
     */
    List<Incidente> findByOperadorId(Long operadorId);

    /**
     * Busca incidentes resueltos por un administrador.
     */
    List<Incidente> findByAdminId(Long adminId);

    /**
     * Cuenta incidentes por estado en una sede.
     * Para KPIs del dashboard.
     */
    List<Incidente> findByEspacioSedeIdAndEstado(Long sedeId, Incidente.EstadoIncidente estado);

    /**
     * Busca incidentes de una sede que están ABIERTOS o EN_PROCESO.
     * Para alertas urgentes.
     */
    List<Incidente> findByEspacioSedeIdAndEstadoIn(Long sedeId, List<Incidente.EstadoIncidente> estados);
}