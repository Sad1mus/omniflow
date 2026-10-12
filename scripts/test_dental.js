"use strict";
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Prueba del vertical DENTAL: conversación REAL contra el cerebro (handleMessage,
 * LLM free de OpenRouter) con la Clínica Dental Sonríe, sin WhatsApp.
 *
 * Flujo: pedir valoración para implantes el viernes → el bot debe ofrecer
 * horarios reales (tool consultar_disponibilidad) → elegir uno y dar nombre →
 * el bot agenda (fila real en appointments). Limpieza al final.
 *
 *   npx tsx scripts/test_dental.ts
 */
var db_js_1 = require("../src/db.js");
var brain_js_1 = require("../src/brain.js");
var clinic = await (0, db_js_1.getClinicBySessionId)('dental-sonrie');
if (!clinic)
    throw new Error('No existe la clínica dental-sonrie. Corre el seed primero.');
var JID = 'test-dental@s.whatsapp.net';
var resultados = [];
// Limpieza previa por si quedó basura de una corrida anterior.
await db_js_1.supabase.from('messages').delete().eq('clinic_id', clinic.id).eq('jid', JID);
await db_js_1.supabase.from('appointments').delete().eq('clinic_id', clinic.id).eq('jid', JID);
await db_js_1.supabase.from('contacts').delete().eq('clinic_id', clinic.id).eq('jid', JID);
console.log("Cl\u00EDnica: ".concat(clinic.nombre, " (").concat(clinic.vertical, ", plan ").concat(clinic.plan, ")\n"));
// ── Turno 1: pedir valoración para implantes ─────────────────────────────────
var pregunta1 = 'Hola, quiero una valoración para implantes, ¿tienen algo el viernes?';
console.log("\uD83D\uDC64 CLIENTE: ".concat(pregunta1, "\n"));
var respuesta1 = await (0, brain_js_1.handleMessage)(clinic, JID, pregunta1);
console.log("\uD83E\uDD16 BOT: ".concat(respuesta1, "\n"));
// Debe ofrecer horarios reales (formato de hora) y no inventar diagnósticos.
var ofreceHorarios = /\d{1,2}:\d{2}/.test(respuesta1);
console.log(">> \u00BFOfrece horarios concretos (tool de disponibilidad)?: ".concat(ofreceHorarios ? 'SÍ ✅' : 'NO ❌'));
resultados.push(ofreceHorarios);
// ── Turno 2: aceptar el primer horario y dar nombre ──────────────────────────
var horaOfrecida = (_b = (_a = respuesta1.match(/\d{1,2}:\d{2}/)) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : '09:00';
var pregunta2 = "Perfecto, a las ".concat(horaOfrecida, " est\u00E1 bien. Mi nombre es Carlos P\u00E9rez");
console.log("\n\uD83D\uDC64 CLIENTE: ".concat(pregunta2, "\n"));
var respuesta2 = await (0, brain_js_1.handleMessage)(clinic, JID, pregunta2);
console.log("\uD83E\uDD16 BOT: ".concat(respuesta2, "\n"));
// ── Verificar que la cita quedó en la base ───────────────────────────────────
var citas = (await db_js_1.supabase
    .from('appointments')
    .select('nombre, servicio, fecha, hora, estado')
    .eq('clinic_id', clinic.id)
    .eq('jid', JID)).data;
console.log('=== CITAS CREADAS EN SUPABASE ===');
console.log(citas);
var citaCreada = (citas !== null && citas !== void 0 ? citas : []).length >= 1;
resultados.push(citaCreada);
// ── Limpieza ──────────────────────────────────────────────────────────────────
await db_js_1.supabase.from('appointments').delete().eq('clinic_id', clinic.id).eq('jid', JID);
await db_js_1.supabase.from('messages').delete().eq('clinic_id', clinic.id).eq('jid', JID);
await db_js_1.supabase.from('contacts').delete().eq('clinic_id', clinic.id).eq('jid', JID);
await db_js_1.supabase.from('ciclos').delete().eq('clinic_id', clinic.id).eq('jid', JID);
var restantes = (await db_js_1.supabase
    .from('appointments')
    .select('id')
    .eq('clinic_id', clinic.id)
    .eq('jid', JID)).data;
console.log("\n=== LIMPIEZA: citas de prueba restantes: ".concat((_c = restantes === null || restantes === void 0 ? void 0 : restantes.length) !== null && _c !== void 0 ? _c : 0, " ==="));
var ok = resultados.every(Boolean);
console.log("\nRESULTADO: ".concat(ok ? '✅ PASA (horarios reales + cita agendada e2e)' : "\u274C FALLA (horarios=".concat(resultados[0], ", cita=").concat(resultados[1], ")")));
process.exit(ok ? 0 : 1);
