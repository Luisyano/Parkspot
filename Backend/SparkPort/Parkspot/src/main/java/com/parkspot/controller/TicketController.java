package com.parkspot.controller;

import com.parkspot.dto.TicketDTO;
import com.parkspot.service.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador REST para la entidad Ticket.
 * Los tickets se generan automáticamente al confirmar una reserva.
 * 
 * BASE URL: /api/ticket
 */
@RestController
@RequestMapping("/api/ticket")
@CrossOrigin("*")
public class TicketController {

    @Autowired
    private TicketService service;

    @GetMapping("/buscar/{id}")
    public ResponseEntity<TicketDTO> buscarPorId(@PathVariable Long id) {
        TicketDTO dto = service.buscarPorId(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    /**
     * GET /api/ticket/buscarPorCodigo/{codigo}
     * Busca un ticket por su código (ej. PS-2026-07-28-00123).
     * Usado por el operador para validar el ticket.
     */
    @GetMapping("/buscarPorCodigo/{codigo}")
    public ResponseEntity<TicketDTO> buscarPorCodigo(@PathVariable String codigo) {
        TicketDTO dto = service.buscarPorCodigo(codigo);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    /**
     * GET /api/ticket/buscarPorReserva/{reservaId}
     * Busca un ticket por su reserva asociada.
     */
    @GetMapping("/buscarPorReserva/{reservaId}")
    public ResponseEntity<TicketDTO> buscarPorReserva(@PathVariable Long reservaId) {
        TicketDTO dto = service.buscarPorReserva(reservaId);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }
    
    /**
     * PATCH /api/ticket/registrarIngreso/{ticketId}?operadorId=X
     * Registra el ingreso del vehículo (lo hace el OPERADOR).
     * Cambia el estado de la reserva a ACTIVA y el espacio a OCUPADO.
     */
    @PatchMapping("/registrarIngreso/{ticketId}")
    public ResponseEntity<?> registrarIngreso(
            @PathVariable Long ticketId,
            @RequestParam Long operadorId) {
        try {
            TicketDTO resultado = service.registrarIngreso(ticketId, operadorId);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * PATCH /api/ticket/registrarSalida/{ticketId}
     * Registra la salida del vehículo (lo hace el OPERADOR).
     */
    @PatchMapping("/registrarSalida/{ticketId}")
    public ResponseEntity<?> registrarSalida(@PathVariable Long ticketId) {
        try {
            TicketDTO resultado = service.registrarSalidaPorTicketId(ticketId);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}