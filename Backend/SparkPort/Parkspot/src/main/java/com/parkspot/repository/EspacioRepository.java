package com.parkspot.repository;

import com.parkspot.entity.Espacio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio para la entidad Espacio.
 * Tiene las consultas más frecuentes del sistema.
 */
@Repository
public interface EspacioRepository extends JpaRepository<Espacio, Long> {

    /**
     * Busca espacios por sede.
     * ⚡ CONSULTA MÁS FRECUENTE: "espacios disponibles en la sede X"
     * Usa el campo sede_id (optimización v2) → 0 JOINs.
     */
    List<Espacio> findBySedeId(Long sedeId);

    /**
     * Busca espacios por sede y estado.
     * Ej: "Mostrar solo espacios disponibles en Miraflores"
     * También usado para "Mostrar solo espacios ocupados en Miraflores"
     */
    List<Espacio> findBySedeIdAndEstado(Long sedeId, Espacio.EstadoEspacio estado);

    /**
     * Busca espacios por piso.
     * Para mostrar el mapa de un piso específico.
     */
    List<Espacio> findByPisoId(Long pisoId);

    /**
     * Busca espacios por tipo.
     * Ej: "Mostrar solo espacios para discapacitados"
     */
    List<Espacio> findByTipo(Espacio.TipoEspacio tipo);

    /**
     * Busca espacios disponibles en una sede para un tipo específico.
     * Consulta usada cuando el cliente filtra por tipo de espacio.
     */
    List<Espacio> findBySedeIdAndEstadoAndTipo(Long sedeId, Espacio.EstadoEspacio estado, Espacio.TipoEspacio tipo);

    /**
     * Cuenta cuántos espacios hay por estado en una sede.
     * Para los KPIs del dashboard del operador.
     */
    @Query("SELECT e.estado, COUNT(e) FROM Espacio e WHERE e.sede.id = :sedeId GROUP BY e.estado")
    List<Object[]> contarPorEstadoEnSede(@Param("sedeId") Long sedeId);
}