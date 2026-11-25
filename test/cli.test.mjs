import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(raiz, "src", "cli.mjs");

function ejecutar(args, archivo) {
  return spawnSync(process.execPath, [cli, ...args], {
    encoding: "utf8",
    cwd: raiz,
    env: { ...process.env, USUARIOS_ARCHIVO: archivo },
  });
}

test("la línea de comandos crea, lista y rechaza un correo repetido", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gestor-usuarios-cli-"));
  const archivo = path.join(dir, "usuarios.json");

  try {
    const creado = ejecutar(
      ["crear", "--nombre", "Ana López", "--email", "ana@ejemplo.com", "--rol", "admin"],
      archivo,
    );
    assert.equal(creado.status, 0, creado.stderr);
    assert.match(creado.stdout, /Usuario creado/);
    assert.match(creado.stdout, /ana@ejemplo.com/);

    const listado = ejecutar(["listar", "--texto", "ana"], archivo);
    assert.equal(listado.status, 0, listado.stderr);
    assert.match(listado.stdout, /Ana López/);

    const repetido = ejecutar(
      ["crear", "--nombre", "Ana Dos", "--email", "ANA@ejemplo.com"],
      archivo,
    );
    assert.equal(repetido.status, 1);
    assert.match(repetido.stderr, /Ya hay un usuario/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("un comando desconocido termina con código 2", () => {
  const resultado = ejecutar(["inventado"], path.join(os.tmpdir(), "no-se-usa.json"));
  assert.equal(resultado.status, 2);
  assert.match(resultado.stderr, /Comando desconocido/);
});
