import path from "node:path";
import {
  ConflictoError,
  ErrorGestorUsuarios,
  NoEncontradoError,
  ValidacionError,
  crearRepositorioArchivo,
  crearServicioUsuarios,
} from "./index.mjs";

const AYUDA = `Gestor de usuarios

Uso:
  node src/cli.mjs <comando> [opciones]

Comandos:
  crear --nombre <nombre> --email <correo> [--rol admin|editor|lector]
  listar [--rol <rol>] [--activo true|false] [--texto <busqueda>]
  obtener <id>
  actualizar <id> [--nombre <nombre>] [--email <correo>] [--rol <rol>] [--activo true|false]
  activar <id>
  desactivar <id>
  eliminar <id>
  ayuda

Los datos se guardan en data/usuarios.json
o en la ruta de la variable de entorno USUARIOS_ARCHIVO.
`;

function leerArgumentos(argv) {
  const [comando, ...resto] = argv;
  const posicionales = [];
  const opciones = {};

  for (let i = 0; i < resto.length; i += 1) {
    const token = resto[i];
    if (!token.startsWith("--")) {
      posicionales.push(token);
      continue;
    }

    const clave = token.slice(2);
    const valor = resto[i + 1];
    if (valor === undefined || valor.startsWith("--")) {
      opciones[clave] = true;
      continue;
    }

    opciones[clave] = valor;
    i += 1;
  }

  return { comando, posicionales, opciones };
}

function rutaArchivo() {
  if (process.env.USUARIOS_ARCHIVO) return path.resolve(process.env.USUARIOS_ARCHIVO);
  return path.resolve("data", "usuarios.json");
}

function leerBooleano(valor, campo) {
  if (valor === "true") return true;
  if (valor === "false") return false;
  throw new ValidacionError(`${campo} tiene que ser true o false.`, { [campo]: "usa true o false" });
}

function idDe(posicionales) {
  const id = posicionales[0];
  if (!id) {
    throw new ValidacionError("Indica el id del usuario.", { id: "es obligatorio" });
  }
  return id;
}

function imprimirUsuario(usuario) {
  console.log(`${usuario.nombre} <${usuario.email}>`);
  console.log(`  id: ${usuario.id}`);
  console.log(`  rol: ${usuario.rol}`);
  console.log(`  estado: ${usuario.activo ? "activo" : "inactivo"}`);
  console.log(`  creado: ${usuario.creadoEn}`);
  console.log(`  actualizado: ${usuario.actualizadoEn}`);
}

const comandos = {
  crear(servicio, { opciones }) {
    const campos = {};
    if (!opciones.nombre) campos.nombre = "es obligatorio";
    if (!opciones.email) campos.email = "es obligatorio";
    if (Object.keys(campos).length > 0) {
      throw new ValidacionError("Para crear un usuario hacen falta --nombre y --email.", campos);
    }

    const usuario = servicio.crear({
      nombre: opciones.nombre,
      email: opciones.email,
      rol: opciones.rol,
    });

    console.log("Usuario creado.");
    imprimirUsuario(usuario);
  },

  listar(servicio, { opciones }) {
    const filtro = {};
    if (opciones.rol) filtro.rol = opciones.rol;
    if (opciones.activo !== undefined) filtro.activo = leerBooleano(opciones.activo, "activo");
    if (opciones.texto) filtro.texto = opciones.texto;

    const usuarios = servicio.listar(filtro);
    if (usuarios.length === 0) {
      console.log("No hay usuarios.");
      return;
    }

    console.log(`${usuarios.length} usuario${usuarios.length === 1 ? "" : "s"}.`);
    for (const usuario of usuarios) {
      console.log("");
      imprimirUsuario(usuario);
    }
  },

  obtener(servicio, { posicionales }) {
    imprimirUsuario(servicio.obtener(idDe(posicionales)));
  },

  actualizar(servicio, { posicionales, opciones }) {
    const cambios = {};
    if (opciones.nombre !== undefined) cambios.nombre = opciones.nombre;
    if (opciones.email !== undefined) cambios.email = opciones.email;
    if (opciones.rol !== undefined) cambios.rol = opciones.rol;
    if (opciones.activo !== undefined) cambios.activo = leerBooleano(opciones.activo, "activo");

    const usuario = servicio.actualizar(idDe(posicionales), cambios);
    console.log("Usuario actualizado.");
    imprimirUsuario(usuario);
  },

  activar(servicio, { posicionales }) {
    const usuario = servicio.activar(idDe(posicionales));
    console.log("Usuario activado.");
    imprimirUsuario(usuario);
  },

  desactivar(servicio, { posicionales }) {
    const usuario = servicio.desactivar(idDe(posicionales));
    console.log("Usuario desactivado.");
    imprimirUsuario(usuario);
  },

  eliminar(servicio, { posicionales }) {
    servicio.eliminar(idDe(posicionales));
    console.log("Usuario eliminado.");
  },
};

function mostrarError(error) {
  if (error instanceof ValidacionError) {
    console.error(error.message);
    for (const [campo, detalle] of Object.entries(error.campos)) {
      console.error(`- ${campo}: ${detalle}`);
    }
    process.exitCode = 1;
    return;
  }

  if (error instanceof ConflictoError || error instanceof NoEncontradoError || error instanceof ErrorGestorUsuarios) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function main(argv) {
  const entrada = leerArgumentos(argv);
  if (!entrada.comando || entrada.comando === "ayuda" || entrada.comando === "help") {
    console.log(AYUDA);
    return;
  }

  const accion = comandos[entrada.comando];
  if (!accion) {
    console.error(`Comando desconocido: ${entrada.comando}`);
    console.error("Usa: node src/cli.mjs ayuda");
    process.exitCode = 2;
    return;
  }

  try {
    const servicio = crearServicioUsuarios({
      repositorio: crearRepositorioArchivo(rutaArchivo()),
    });
    accion(servicio, entrada);
  } catch (error) {
    mostrarError(error);
  }
}

main(process.argv.slice(2));
