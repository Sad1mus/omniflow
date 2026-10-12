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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Prueba de los controles del dueño (/pausar, /activar, /clientes):
 *   1. /pausar → pausado=true en Supabase
 *   2. Mensaje de cliente con la clínica pausada → NO genera respuesta, pero SÍ queda en messages
 *   3. /activar → pausado=false
 *   4. El mismo mensaje con la clínica activa → SÍ genera respuesta (LLM real)
 *   5. /clientes → imprime la lista de últimos contactos
 *
 *   npx tsx scripts/test_controles.ts
 */
var db_js_1 = require("../src/db.js");
var owner_js_1 = require("../src/owner.js");
var brain_js_1 = require("../src/brain.js");
// Usamos la clínica dental (activo=false → no interfiere con el bot corriendo del usuario).
var clinic = await (0, db_js_1.getClinicBySessionId)('dental-sonrie');
if (!clinic)
    throw new Error('No existe la clínica dental-sonrie');
var JID_DUENO = 'test-dueno@s.whatsapp.net';
var JID_CLIENTE = 'test-cliente-pausa@s.whatsapp.net';
var resultados = [];
// Limpieza previa.
var limpiar = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, db_js_1.supabase.from('messages').delete().eq('clinic_id', clinic.id).in('jid', [JID_CLIENTE])];
            case 1:
                _a.sent();
                return [4 /*yield*/, db_js_1.supabase.from('contacts').delete().eq('clinic_id', clinic.id).in('jid', [JID_CLIENTE])];
            case 2:
                _a.sent();
                return [4 /*yield*/, db_js_1.supabase.from('appointments').delete().eq('clinic_id', clinic.id).in('jid', [JID_CLIENTE])];
            case 3:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
await limpiar();
// ── 1. /pausar ────────────────────────────────────────────────────────────────
console.log('════════ TEST 1: /pausar ════════');
var rPausar = await (0, owner_js_1.handleOwnerCommand)(clinic, '/pausar', JID_DUENO);
console.log(rPausar);
var estado1 = (await db_js_1.supabase.from('clinics').select('pausado').eq('id', clinic.id).single()).data;
console.log("\n>> pausado en Supabase: ".concat(estado1 === null || estado1 === void 0 ? void 0 : estado1.pausado));
resultados.push((estado1 === null || estado1 === void 0 ? void 0 : estado1.pausado) === true);
// ── 2. Mensaje de cliente con clínica pausada ────────────────────────────────
console.log('\n════════ TEST 2: mensaje de cliente estando PAUSADA ════════');
var clinicPausada = __assign(__assign({}, clinic), { pausado: true });
var respuestaPausada = await (0, brain_js_1.handleMessage)(clinicPausada, JID_CLIENTE, 'Hola, quiero una cita');
console.log(">> Respuesta del bot: ".concat(respuestaPausada === null ? 'NINGUNA (null) ✅' : "\"".concat(respuestaPausada, "\" \u274C")));
var msgsPausada = (await db_js_1.supabase
    .from('messages')
    .select('role, content')
    .eq('clinic_id', clinic.id)
    .eq('jid', JID_CLIENTE)).data;
console.log(">> Mensajes guardados en historial: ".concat(msgsPausada === null || msgsPausada === void 0 ? void 0 : msgsPausada.length, " (el mensaje del cliente NO se perdi\u00F3)"));
console.log(msgsPausada);
resultados.push(respuestaPausada === null && ((_a = msgsPausada === null || msgsPausada === void 0 ? void 0 : msgsPausada.length) !== null && _a !== void 0 ? _a : 0) === 1 && ((_b = msgsPausada === null || msgsPausada === void 0 ? void 0 : msgsPausada[0]) === null || _b === void 0 ? void 0 : _b.role) === 'user');
// ── 3. /activar ───────────────────────────────────────────────────────────────
console.log('\n════════ TEST 3: /activar ════════');
var rActivar = await (0, owner_js_1.handleOwnerCommand)(clinic, '/activar', JID_DUENO);
console.log(rActivar);
var estado2 = (await db_js_1.supabase.from('clinics').select('pausado').eq('id', clinic.id).single()).data;
console.log("\n>> pausado en Supabase: ".concat(estado2 === null || estado2 === void 0 ? void 0 : estado2.pausado));
resultados.push((estado2 === null || estado2 === void 0 ? void 0 : estado2.pausado) === false);
// ── 4. El mismo mensaje con la clínica ACTIVA → sí responde ───────────────────
console.log('\n════════ TEST 4: mensaje de cliente estando ACTIVA (LLM real) ════════');
var respuestaActiva = await (0, brain_js_1.handleMessage)(clinic, JID_CLIENTE, '¿Atienden los sábados?');
console.log("\uD83E\uDD16 BOT: ".concat(respuestaActiva));
resultados.push(typeof respuestaActiva === 'string' && respuestaActiva.length > 0);
// ── 5. /clientes ──────────────────────────────────────────────────────────────
console.log('\n════════ TEST 5: /clientes ════════');
var rClientes = await (0, owner_js_1.handleOwnerCommand)(clinic, '/clientes', JID_DUENO);
console.log(rClientes);
resultados.push(Boolean(rClientes === null || rClientes === void 0 ? void 0 : rClientes.includes('Últimos clientes')));
// ── Limpieza final ─────────────────────────────────────────────────────────────
await limpiar();
console.log('\n=== LIMPIEZA: datos de prueba borrados ===');
var ok = resultados.every(Boolean);
console.log("\nRESULTADO: ".concat(ok ? "\u2705 PASAN ".concat(resultados.length, "/").concat(resultados.length) : "\u274C FALLA (".concat(resultados.map(function (r, i) { return "t".concat(i + 1, "=").concat(r); }).join(', '), ")")));
process.exit(ok ? 0 : 1);
