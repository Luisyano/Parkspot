package com.parkspot.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ticket")
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reserva_id", nullable = false, unique = true)
    private Reserva reserva;

    @Column(name = "codigo", nullable = false, length = 30, unique = true)
    private String codigo; // ej. PS-2026-07-28-00123

    @Column(name = "qr_code", nullable = false, length = 255)
    private String qrCode; // cambia en cada reserva

    @Column(name = "monto_pagado", nullable = false)
    private BigDecimal montoPagado;

    @Column(name = "fecha_ingreso_real")
    private LocalDateTime fechaIngresoReal;

    @Column(name = "fecha_salida_real")
    private LocalDateTime fechaSalidaReal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operador_ingreso_id")
    private Usuario operadorIngreso;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operador_salida_id")
    private Usuario operadorSalida;

    @Column(name = "cobro_adicional", nullable = false)
    private BigDecimal cobroAdicional = BigDecimal.ZERO;

    // Relación con Incidente (opcional, solo si hay incidente asociado)
    @OneToOne(mappedBy = "ticket", fetch = FetchType.LAZY)
    private Incidente incidente;
}