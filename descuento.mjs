export function calcularDescuento(subtotal, clienteFrecuente) {
  if (subtotal < 0) {
    return 0;
  }
  if (!clienteFrecuente) {
    return 0;
  }
  return subtotal * 0.1;
}
