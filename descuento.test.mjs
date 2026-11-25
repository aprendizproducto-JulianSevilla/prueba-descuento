import test from "node:test";
import assert from "node:assert";
import { aplicarDescuento } from "./descuento.mjs";

test("aplica 10% de descuento", () => {
  assert.strictEqual(aplicarDescuento(100, 10), 90);
});

test("rechaza porcentaje mayor a 100", () => {
  assert.throws(() => aplicarDescuento(100, 150));
});
