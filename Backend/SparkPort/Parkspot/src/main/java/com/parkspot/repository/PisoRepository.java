package com.parkspot.repository;

import com.parkspot.entity.Piso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio para la entidad Piso.
 */
@Repository
public interface PisoRepository extends JpaRepository<Piso, Long> {

    /**
     * Busca todos los pisos de una sede.
     * Usado para construir el mapa de la sede.
     */
    List<Piso> findBySedeId(Long sedeId);

    /**
     * Busca un piso por sede y número.
     * Útil para validar que no se dupliquen pisos en una sede.
     */
    Piso findBySedeIdAndNumero(Long sedeId, Integer numero);
}