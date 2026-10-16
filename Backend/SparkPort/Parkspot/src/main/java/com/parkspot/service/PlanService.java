package com.parkspot.service;

import com.parkspot.dto.PlanDTO;
import com.parkspot.entity.Plan;
import com.parkspot.repository.PlanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Servicio para la entidad Plan.
 * Solo lectura: los planes son fijos (POR_HORA, MENSUAL, ANUAL).
 * No se expone creación ni eliminación.
 */
@Service
@Transactional(readOnly = true)
public class PlanService {

    @Autowired
    private PlanRepository repo;

    // ==========================================
    // MÉTODOS DE LECTURA
    // ==========================================

    public List<PlanDTO> listarTodos() {
        return repo.findAll().stream()
                .map(this::convertirADTO)
                .toList();
    }

    public PlanDTO buscarPorId(Long id) {
        Plan entity = repo.findById(id).orElse(null);
        return entity != null ? convertirADTO(entity) : null;
    }

    public PlanDTO buscarPorNombre(String nombre) {
        Plan entity = repo.findByNombre(Plan.NombrePlan.valueOf(nombre)).orElse(null);
        return entity != null ? convertirADTO(entity) : null;
    }

    // ==========================================
    // MÉTODOS AUXILIARES (Conversión)
    // ==========================================

    private PlanDTO convertirADTO(Plan entity) {
        PlanDTO dto = new PlanDTO();
        dto.setId(entity.getId());
        dto.setNombre(entity.getNombre().name());
        dto.setPrecioBase(entity.getPrecioBase());

        // Calcular precio final con descuento
        BigDecimal descuento = entity.getPrecioBase()
                .multiply(entity.getDescuentoPorcentaje())
                .divide(BigDecimal.valueOf(100));
        BigDecimal precioFinal = entity.getPrecioBase().subtract(descuento);

        dto.setDescuentoPorcentaje(entity.getDescuentoPorcentaje());
        dto.setPrecioFinal(precioFinal);

        return dto;
    }
}