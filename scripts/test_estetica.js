"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Prueba del vertical ESTÉTICA: conversación REAL contra el cerebro con la clínica
 * Estética Belle. El caso crítico: preguntan PRECIO de un tratamiento — el precio
 * NO está en la ficha, así que el bot NO puede inventarlo; debe llevar a una
 * valoración (donde se da el presupuesto exacto).
 *
 *   npx tsx scripts/test_estetica.ts
 */
var db_js_1 = require("../src/db.js");
var brain_js_1 = require("../src/brain.js");
var clinic = await (0, db_js_1.getClinicBySessionId)('estetica-belle');
if (!clinic)
    throw new Error('No existe la clínica estetica-belle. Corre el seed primero.');
var JID = 'test-estetica@s.whatsapp.net';
var resultados = [];
// Limpieza previa.
await db_js_1.supabase.from('messages').delete().eq('clinic_id', clinic.id).eq('jid', JID);
await db_js_1.supabase.from('appointments').delete().eq('clinic_id', clinic.id).eq('jid', JID);
await db_js_1.supabase.from('contacts').delete().eq('clinic_id', clinic.id).eq('jid', JID);
await db_js_1.supabase.from('leads').delete().eq('clinic_id', clinic.id).eq('jid', JID);
console.log("Cl\u00EDnica: ".concat(clinic.nombre, " (").concat(clinic.vertical, ", plan ").concat(clinic.plan, ")\n"));
// ── Turno 1: pregunta de precio (típico DM de Instagram) ─────────────────────
var pregunta1 = 'Hola! Vi sus fotos en Instagram 😍 ¿cuánto cuesta la depilación láser?';
console.log("\uD83D\uDC64 CLIENTA: ".concat(pregunta1, "\n"));
var respuesta1 = await (0, brain_js_1.handleMessage)(clinic, JID, pregunta1);
console.log("\uD83E\uDD16 BOT: ".concat(respuesta1, "\n"));
// CHECK A: NO debe inventar precios (cifras en pesos). Patrones: $XXX.XXX, "300 mil", "300.000 pesos", "desde $X"
var patronPrecio = /\$\s?[\d.,]+|[\d.,]+\s?(mil|pesos|cop)\b|\bdesde\s+[\d.,]+/i;
var inventaPrecio = patronPrecio.test(respuesta1);
console.log(">> \u00BFInvent\u00F3 un precio?: ".concat(inventaPrecio ? 'SÍ ❌ (ALUCINACIÓN)' : 'NO ✅'));
resultados.push(!inventaPrecio);
// CHECK B: debe ofrecer la valoración como siguiente paso.
var ofreceValoracion = /valoraci[oó]n/i.test(respuesta1);
console.log(">> \u00BFOfrece valoraci\u00F3n como siguiente paso?: ".concat(ofreceValoracion ? 'SÍ ✅' : 'NO ❌'));
resultados.push(ofreceValoracion);
// ── Turno 2: acepta la valoración ─────────────────────────────────────────────
var pregunta2 = 'Bueno sí, ¿qué horarios tienen mañana para la valoración?';
console.log("\n\uD83D\uDC64 CLIENTA: ".concat(pregunta2, "\n"));
var respuesta2 = await (0, brain_js_1.handleMessage)(clinic, JID, pregunta2);
console.log("\uD83E\uDD16 BOT: ".concat(respuesta2, "\n"));
// CHECK C: ofrece horarios reales.
var ofreceHorarios = /\d{1,2}:\d{2}/.test(respuesta2);
console.log(">> \u00BFOfrece horarios concretos?: ".concat(ofreceHorarios ? 'SÍ ✅' : 'NO ❌'));
resultados.push(ofreceHorarios);
// ── Limpieza ──────────────────────────────────────────────────────────────────
await db_js_1.supabase.from('appointments').delete().eq('clinic_id', clinic.id).eq('jid', JID);
await db_js_1.supabase.from('messages').delete().eq('clinic_id', clinic.id).eq('jid', JID);
await db_js_1.supabase.from('contacts').delete().eq('clinic_id', clinic.id).eq('jid', JID);
await db_js_1.supabase.from('leads').delete().eq('clinic_id', clinic.id).eq('jid', JID);
console.log('=== LIMPIEZA: datos de prueba borrados ===');
var ok = resultados.every(Boolean);
console.log("\nRESULTADO: ".concat(ok ? '✅ PASA (no inventa precios + ofrece valoración + horarios reales)' : "\u274C FALLA (sin_precio=".concat(resultados[0], ", valoracion=").concat(resultados[1], ", horarios=").concat(resultados[2], ")")));
process.exit(ok ? 0 : 1);
