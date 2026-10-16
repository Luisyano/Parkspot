package com.parkspot.entity;

import java.math.BigDecimal;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "plan")
public class Plan {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	// Solo lectura desde la API: las 3 filas ya vienen sembradas en la BD
	// (ver seeds del script SQL). No se expone un POST de creación.
	@Enumerated(EnumType.STRING)
	@Column(name = "nombre", nullable = false, unique = true)
	private NombrePlan nombre;

	@Column(name = "precio_base", nullable = false)
	private BigDecimal precioBase;

	@Column(name = "descuento_porcentaje", nullable = false)
	private BigDecimal descuentoPorcentaje;

	@JsonIgnore
	@OneToMany(mappedBy = "plan")
	private List<Reserva> reservas;

	public enum NombrePlan {
		POR_HORA, MENSUAL, ANUAL
	}
}