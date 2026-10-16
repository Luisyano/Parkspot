package com.parkspot.repository;

import com.parkspot.entity.Deuda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

/**
 * Repositorio para la entidad Deuda.
 * Sistema "estilo Uber": la deuda bloquea nuevas reservas.
 */
@Repository
public interface DeudaRepository extends JpaRepository<Deuda, Long> {

    /**
     * Busca todas las deudas de un usuario.
     */
    List<Deuda> findByUsuarioId(Long usuarioId);

    /**
     * Busca deudas pendientes de un usuario.
     * ⚡ CONSULTA CRÍTICA: se ejecuta antes de crear una reserva.
     */
    List<Deuda> findByUsuarioIdAndEstado(Long usuarioId, Deuda.EstadoDeuda estado);

    /**
     * Suma el total de deuda pendiente de un usuario.
     * Si es > 0, el usuario no puede reservar.
     */
    @Query("SELECT COALESCE(SUM(d.monto), 0) FROM Deuda d " +
           "WHERE d.usuario.id = :usuarioId AND d.estado = 'PENDIENTE'")
    BigDecimal sumDeudaPendienteByUsuarioId(@Param("usuarioId") Long usuarioId);

    /**
     * Verifica si un usuario tiene deuda pendiente.
     * Retorna true si hay al menos una deuda PENDIENTE.
     */
    boolean existsByUsuarioIdAndEstado(Long usuarioId, Deuda.EstadoDeuda estado);
}