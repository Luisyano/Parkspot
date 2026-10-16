package com.parkspot.repository;

import com.parkspot.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositorio para la entidad Ticket.
 * Los tickets se generan automáticamente al confirmar una reserva.
 */
@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    /**
     * Busca un ticket por su código (ej. PS-2026-07-28-00123).
     * Usado por el operador para validar el ticket manualmente.
     */
    Optional<Ticket> findByCodigo(String codigo);

    /**
     * Busca un ticket por su reserva asociada.
     * Relación 1 a 1.
     */
    Optional<Ticket> findByReservaId(Long reservaId);

    /**
     * Verifica si ya existe un ticket para esa reserva.
     */
    boolean existsByReservaId(Long reservaId);

    /**
     * Verifica si ya existe un ticket con ese código.
     */
    boolean existsByCodigo(String codigo);
}