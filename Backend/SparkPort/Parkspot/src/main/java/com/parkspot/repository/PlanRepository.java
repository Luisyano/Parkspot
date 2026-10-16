package com.parkspot.repository;

import com.parkspot.entity.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositorio para la entidad Plan.
 * Solo lectura: los planes son fijos y no se crean nuevos.
 */
@Repository
public interface PlanRepository extends JpaRepository<Plan, Long> {

    /**
     * Busca un plan por su nombre.
     * Usado al crear una reserva: "Quiero plan POR_HORA"
     */
    Optional<Plan> findByNombre(Plan.NombrePlan nombre);
}