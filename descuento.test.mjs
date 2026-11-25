import assert from "node:assert/strict";
import { calcularDescuento } from "./descuento.mjs";

assert.equal(calcularDescuento(200, true), 20);
console.log("ok");
