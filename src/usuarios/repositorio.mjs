import fs from "node:fs";
import path from "node:path";

function copiar(usuario) {
  return usuario ? { ...usuario } : null;
}

export function crearRepositorioMemoria(iniciales = []) {
  const porId = new Map();

  for (const usuario of iniciales) {
    porId.set(usuario.id, { ...usuario });
  }

  return {
    guardar(usuario) {
      porId.set(usuario.id, { ...usuario });
    },

    buscarPorId(id) {
      return copiar(porId.get(id));
    },

    buscarPorEmail(email) {
      for (const usuario of porId.values()) {
        if (usuario.email === email) return copiar(usuario);
      }
      return null;
    },

    listar() {
      return [...porId.values()].map((usuario) => ({ ...usuario }));
    },

    eliminar(id) {
      return porId.delete(id);
    },
  };
}

function leerArchivo(ruta) {
  if (!fs.existsSync(ruta)) return [];

  let texto;
  try {
    texto = fs.readFileSync(ruta, "utf8").trim();
  } catch (error) {
    throw new Error(`No se pudo leer el archivo de usuarios (${ruta}): ${error.message}`);
  }

  if (texto === "") return [];

  let datos;
  try {
    datos = JSON.parse(texto);
  } catch (error) {
    throw new Error(`No se pudo leer el archivo de usuarios (${ruta}): ${error.message}`);
  }

  if (!Array.isArray(datos)) {
    throw new Error(`No se pudo leer el archivo de usuarios (${ruta}): el contenido tiene que ser una lista.`);
  }

  return datos.map((usuario) => ({ ...usuario }));
}

function escribirArchivo(ruta, usuarios) {
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, `${JSON.stringify(usuarios, null, 2)}\n`, "utf8");
}

export function crearRepositorioArchivo(ruta) {
  return {
    guardar(usuario) {
      const usuarios = leerArchivo(ruta);
      const indice = usuarios.findIndex((item) => item.id === usuario.id);
      if (indice === -1) usuarios.push({ ...usuario });
      else usuarios[indice] = { ...usuario };
      escribirArchivo(ruta, usuarios);
    },

    buscarPorId(id) {
      return copiar(leerArchivo(ruta).find((usuario) => usuario.id === id));
    },

    buscarPorEmail(email) {
      return copiar(leerArchivo(ruta).find((usuario) => usuario.email === email));
    },

    listar() {
      return leerArchivo(ruta);
    },

    eliminar(id) {
      const usuarios = leerArchivo(ruta);
      const siguientes = usuarios.filter((usuario) => usuario.id !== id);
      if (siguientes.length === usuarios.length) return false;
      escribirArchivo(ruta, siguientes);
      return true;
    },
  };
}
