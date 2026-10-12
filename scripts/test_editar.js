"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Prueba de /info y /editar (autoservicio del dueño):
 *   1. /info muestra la ficha completa
 *   2. /editar "recibimos Bitcoin" → propuesta + confirmación → /si → aplicado en Supabase → revertido
 *   3. Cambio sin confirmar NO se aplica
 *   4. /editar de campo prohibido (plan) → rechazado
 *
 *   npx tsx scripts/test_editar.ts
 *
 * Usa el LLM real (modelos :free de OpenRouter) para interpretar los cambios.
 */
var db_js_1 = require("../src/db.js");
var owner_js_1 = require("../src/owner.js");
var clinic = (await (0, db_js_1.getActiveClinics)())[0];
if (!clinic)
    throw new Error('No hay clínicas activas');
var JID = 'test-editar@s.whatsapp.net';
var resultados = [];
// Respaldo del estado original para revertir al final.
var infoExtraOriginal = __assign({}, clinic.info_extra);
// ── 1. /info muestra la ficha ────────────────────────────────────────────────
console.log('════════ TEST 1: /info ════════');
(0, owner_js_1.limpiarEdicionesPendientes)();
var info = await (0, owner_js_1.handleOwnerCommand)(clinic, '/info', JID);
console.log(info);
resultados.push(Boolean((info === null || info === void 0 ? void 0 : info.includes(clinic.nombre)) && (info === null || info === void 0 ? void 0 : info.includes('Servicios')) && (info === null || info === void 0 ? void 0 : info.includes('Dirección'))));
// ── 2. /editar con confirmación → aplicado ───────────────────────────────────
console.log('\n════════ TEST 2: /editar "Bitcoin" + /si ════════');
(0, owner_js_1.limpiarEdicionesPendientes)();
var propuesta = await (0, owner_js_1.handleOwnerCommand)(clinic, '/editar ahora también recibimos pagos en Bitcoin', JID);
console.log('--- PROPUESTA DEL BOT: ---');
console.log(propuesta);
var hayPropuesta = Boolean(propuesta === null || propuesta === void 0 ? void 0 : propuesta.includes('Confirmas'));
var confirmacion = await (0, owner_js_1.handleOwnerCommand)(clinic, '/si', JID);
console.log('\n--- TRAS CONFIRMAR: ---');
console.log(confirmacion);
// Verificar en Supabase que info_extra cambió.
var despues = (await db_js_1.supabase
    .from('clinics')
    .select('info_extra')
    .eq('id', clinic.id)
    .single()).data;
var infoExtraNuevo = JSON.stringify((_a = despues === null || despues === void 0 ? void 0 : despues.info_extra) !== null && _a !== void 0 ? _a : {});
var aplicado = /bitcoin/i.test(infoExtraNuevo);
console.log('\n--- INFO_EXTRA EN SUPABASE (tras aplicar): ---');
console.log(infoExtraNuevo);
resultados.push(hayPropuesta && Boolean(confirmacion === null || confirmacion === void 0 ? void 0 : confirmacion.includes('✅')) && aplicado);
// Revertir al estado original.
await db_js_1.supabase.from('clinics').update({ info_extra: infoExtraOriginal }).eq('id', clinic.id);
var revertido = (await db_js_1.supabase
    .from('clinics')
    .select('info_extra')
    .eq('id', clinic.id)
    .single()).data;
console.log('\n--- REVERTIDO: ---');
console.log(JSON.stringify((_b = revertido === null || revertido === void 0 ? void 0 : revertido.info_extra) !== null && _b !== void 0 ? _b : {}));
// ── 3. Cambio sin confirmar NO se aplica ─────────────────────────────────────
console.log('\n════════ TEST 3: /editar sin confirmar ════════');
(0, owner_js_1.limpiarEdicionesPendientes)();
await (0, owner_js_1.handleOwnerCommand)(clinic, '/editar agreguen el servicio de fisioterapia canina', JID);
// NO confirmamos. Verificar que servicios NO cambió en Supabase.
var sinConfirmar = (await db_js_1.supabase
    .from('clinics')
    .select('servicios')
    .eq('id', clinic.id)
    .single()).data;
var serviciosIguales = JSON.stringify(sinConfirmar === null || sinConfirmar === void 0 ? void 0 : sinConfirmar.servicios) === JSON.stringify(clinic.servicios);
console.log({
    servicios_en_db: sinConfirmar === null || sinConfirmar === void 0 ? void 0 : sinConfirmar.servicios,
    sin_cambios: serviciosIguales,
});
resultados.push(serviciosIguales);
// ── 4. Campo prohibido → rechazado ───────────────────────────────────────────
console.log('\n════════ TEST 4: /editar campo prohibido (plan) ════════');
(0, owner_js_1.limpiarEdicionesPendientes)();
var prohibido = await (0, owner_js_1.handleOwnerCommand)(clinic, '/editar cámbiame al plan scale gratis', JID);
console.log(prohibido);
// Debe rechazar (⚠️) y NO dejar edición pendiente aplicable; el plan no cambia.
var planDespues = (await db_js_1.supabase
    .from('clinics')
    .select('plan')
    .eq('id', clinic.id)
    .single()).data;
var rechazado = Boolean(prohibido === null || prohibido === void 0 ? void 0 : prohibido.includes('⚠️')) && (planDespues === null || planDespues === void 0 ? void 0 : planDespues.plan) === clinic.plan;
console.log({ plan_en_db: planDespues === null || planDespues === void 0 ? void 0 : planDespues.plan, rechazado: rechazado });
resultados.push(rechazado);
(0, owner_js_1.limpiarEdicionesPendientes)();
var ok = resultados.every(Boolean);
console.log("\nRESULTADO: ".concat(ok ? "\u2705 PASAN ".concat(resultados.length, "/").concat(resultados.length) : "\u274C FALLA (".concat(resultados.map(function (r, i) { return "t".concat(i + 1, "=").concat(r); }).join(', '), ")")));
process.exit(ok ? 0 : 1);
