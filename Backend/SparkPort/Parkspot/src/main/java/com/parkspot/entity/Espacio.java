package com.parkspot.entity;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "espacio")
public class Espacio {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "piso_id", nullable = false)
	private Piso piso;

	// v2: acceso directo sin pasar por piso (ver nota en la BD).
	// El service debe mantenerlo sincronizado con piso.getSede() al guardar.
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "sede_id", nullable = false)
	private Sede sede;

	@Column(name = "codigo", nullable = false, length = 10)
	private String codigo; // ej. 'A-01'

	@Enumerated(EnumType.STRING)
	@Column(name = "tipo", nullable = false)
	private TipoEspacio tipo = TipoEspacio.REGULAR;

	@Enumerated(EnumType.STRING)
	@Column(name = "estado", nullable = false)
	private EstadoEspacio estado = EstadoEspacio.DISPONIBLE;

	@JsonIgnore
	@OneToMany(mappedBy = "espacio")
	private List<Reserva> reservas;

	@JsonIgnore
	@OneToMany(mappedBy = "espacio")
	private List<Incidente> incidentes;

	public enum TipoEspacio {
		REGULAR, DISCAPACITADO, MOTO
	}

	public enum EstadoEspacio {
		DISPONIBLE, RESERVADO, OCUPADO, MANTENIMIENTO
	}
}