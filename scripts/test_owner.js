"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Prueba de los comandos del dueño: verifica detección del dueño y las
 * respuestas de cada comando con datos reales (sin enviar nada por WhatsApp).
 *
 *   npx tsx scripts/test_owner.ts
 */
var db_js_1 = require("../src/db.js");
var owner_js_1 = require("../src/owner.js");
var clinic = (await (0, db_js_1.getActiveClinics)())[0];
if (!clinic)
    throw new Error('No hay clínicas activas');
var resultados = [];
// 1. Detección del dueño
console.log('=== TEST 1: detección del dueño ===');
var duenoOk = (0, owner_js_1.esDuenio)(clinic, clinic.telefono_humano.replace(/\D/g, ''));
var extranoOk = !(0, owner_js_1.esDuenio)(clinic, '573009999999');
console.log({ telefono_humano_es_dueno: duenoOk, numero_random_no_es_dueno: extranoOk });
resultados.push(duenoOk && extranoOk);
// 2. Comando /hoy
console.log('\n=== TEST 2: comando /hoy ===');
var hoy = await (0, owner_js_1.handleOwnerCommand)(clinic, '/hoy');
console.log(hoy);
resultados.push(Boolean((hoy === null || hoy === void 0 ? void 0 : hoy.includes('Hoy en')) && (hoy === null || hoy === void 0 ? void 0 : hoy.includes('Panel completo'))));
// 3. Comando /semana (plan scale → debe dar el reporte)
console.log('\n=== TEST 3: comando /semana ===');
var semana = await (0, owner_js_1.handleOwnerCommand)(clinic, '/semana');
console.log(semana);
resultados.push(Boolean(semana === null || semana === void 0 ? void 0 : semana.includes('Reporte semanal')));
// 4. Comando /panel
console.log('\n=== TEST 4: comando /panel ===');
var panel = await (0, owner_js_1.handleOwnerCommand)(clinic, '/panel');
console.log(panel);
resultados.push(Boolean(panel === null || panel === void 0 ? void 0 : panel.includes(String(clinic.dashboard_token))));
// 5. Texto desconocido → null (no responde como dueño)
console.log('\n=== TEST 5: texto que no es comando ===');
var nada = await (0, owner_js_1.handleOwnerCommand)(clinic, 'hola quiero una cita para mi perro');
console.log({ respuesta: nada });
resultados.push(nada === null);
// 6. Variante sin slash y con mayúsculas
console.log('\n=== TEST 6: "Resumen" sin slash ===');
var resumen = await (0, owner_js_1.handleOwnerCommand)(clinic, 'Resumen');
resultados.push(Boolean(resumen === null || resumen === void 0 ? void 0 : resumen.includes('Hoy en')));
console.log({ funciona: Boolean(resumen) });
var ok = resultados.every(Boolean);
console.log("\nRESULTADO: ".concat(ok ? "\u2705 PASAN ".concat(resultados.length, "/").concat(resultados.length) : "\u274C FALLA (".concat(resultados.map(function (r, i) { return "t".concat(i + 1, "=").concat(r); }).join(', '), ")")));
process.exit(ok ? 0 : 1);
