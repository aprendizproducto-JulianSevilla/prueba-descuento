export class ErrorGestorUsuarios extends Error {
  constructor(mensaje, codigo) {
    super(mensaje);
    this.name = new.target.name;
    this.codigo = codigo;
  }
}

export class ValidacionError extends ErrorGestorUsuarios {
  constructor(mensaje, campos = {}) {
    super(mensaje, "validacion");
    this.campos = campos;
  }
}

export class NoEncontradoError extends ErrorGestorUsuarios {
  constructor(mensaje) {
    super(mensaje, "no_encontrado");
  }
}

export class ConflictoError extends ErrorGestorUsuarios {
  constructor(mensaje) {
    super(mensaje, "conflicto");
  }
}
