package com.parkspot.repository;

import com.parkspot.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

/**
 * Repositorio para la entidad Pago.
 */
@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {

    /**
     * Busca un pago por su reserva asociada.
     * Relación 1 a 1.
     */
    Pago findByReservaId(Long reservaId);

    /**
     * Suma total de ingresos por sede (para reportes del admin).
     */
    @Query("SELECT SUM(p.monto) FROM Pago p WHERE p.reserva.espacio.sede.id = :sedeId")
    BigDecimal sumMontoBySedeId(@Param("sedeId") Long sedeId);

    /**
     * Suma total de ingresos por método de pago en una sede.
     */
    @Query("SELECT p.metodo, SUM(p.monto) FROM Pago p " +
           "WHERE p.reserva.espacio.sede.id = :sedeId GROUP BY p.metodo")
    List<Object[]> sumMontoPorMetodoEnSede(@Param("sedeId") Long sedeId);
}