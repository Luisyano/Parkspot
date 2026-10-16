package com.parkspot.repository;

import com.parkspot.entity.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repositorio para la entidad Reserva.
 * Tiene las consultas más complejas del sistema.
 */
@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    /**
     * Busca reservas de un usuario.
     * Para el historial del cliente.
     */
    List<Reserva> findByUsuarioId(Long usuarioId);

    /**
     * Busca reservas de un usuario por estado.
     * Ej: "Mostrar solo mis reservas activas"
     */
    List<Reserva> findByUsuarioIdAndEstado(Long usuarioId, Reserva.EstadoReserva estado);

    /**
     * Busca reservas de un espacio específico.
     * Para ver el historial de ocupación de un espacio.
     */
    List<Reserva> findByEspacioId(Long espacioId);

    /**
     * Busca reservas activas (PENDIENTE, CONFIRMADA o ACTIVA) de un espacio.
     * Para validar si un espacio está disponible en un rango de fechas.
     * ✅ CAMBIO: Se agregó 'PENDIENTE' para bloquear el espacio desde que se crea la reserva.
     */
    @Query("SELECT r FROM Reserva r WHERE r.espacio.id = :espacioId " +
           "AND r.estado IN ('PENDIENTE', 'CONFIRMADA', 'ACTIVA') " +
           "AND r.fechaInicio < :fechaFin " +
           "AND r.fechaFin > :fechaInicio")
    List<Reserva> findReservasActivasEnRango(
        @Param("espacioId") Long espacioId,
        @Param("fechaInicio") LocalDateTime fechaInicio,
        @Param("fechaFin") LocalDateTime fechaFin
    );

    /**
     * Busca reservas confirmadas que están por vencer (para notificaciones).
     * Ej: reservas que vencen en las próximas 2 horas.
     */
    @Query("SELECT r FROM Reserva r WHERE r.estado = 'CONFIRMADA' " +
           "AND r.fechaFin BETWEEN :ahora AND :limite")
    List<Reserva> findReservasPorVencer(
        @Param("ahora") LocalDateTime ahora,
        @Param("limite") LocalDateTime limite
    );

    /**
     * Busca reservas activas que ya deberían haber salido (para alertas de exceso).
     */
    @Query("SELECT r FROM Reserva r WHERE r.estado = 'ACTIVA' AND r.fechaFin < :ahora")
    List<Reserva> findReservasExcedidas(@Param("ahora") LocalDateTime ahora);

    /**
     * Cuenta reservas por estado en una sede (para KPIs del admin).
     */
    @Query("SELECT r.estado, COUNT(r) FROM Reserva r " +
           "WHERE r.espacio.sede.id = :sedeId GROUP BY r.estado")
    List<Object[]> contarPorEstadoEnSede(@Param("sedeId") Long sedeId);

    /**
     * Cuenta reservas por plan en una sede (para reportes de ingresos).
     */
    @Query("SELECT r.plan.nombre, COUNT(r) FROM Reserva r " +
           "WHERE r.espacio.sede.id = :sedeId GROUP BY r.plan.nombre")
    List<Object[]> contarPorPlanEnSede(@Param("sedeId") Long sedeId);
}