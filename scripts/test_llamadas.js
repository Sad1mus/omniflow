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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Prueba del rescate de llamadas perdidas: simula eventos 'call' de Baileys con
 * un enviador falso y verifica:
 *   1. Llamada perdida (timeout) → genera mensaje de rescate + lead
 *   2. Anti-spam: segunda llamada perdida en <6h → NO genera mensaje
 *   3. Llamada contestada (accept) → NO genera mensaje
 *   4. Plan basic → NO genera mensaje (gating)
 *
 *   npx tsx scripts/test_llamadas.ts
 */
var db_js_1 = require("../src/db.js");
var missed_calls_js_1 = require("../src/missed-calls.js");
var clinic = (await (0, db_js_1.getActiveClinics)())[0];
if (!clinic)
    throw new Error('No hay clínicas activas');
var JID_TEST = 'test-llamada@s.whatsapp.net';
var resultados = [];
var mensajes = [];
var enviarFalso = function (jid, texto) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        mensajes.push(texto);
        console.log("  \uD83D\uDCE4 MENSAJE a ".concat(jid, ":\n  ").concat(texto.split('\n').join('\n  '), "\n"));
        return [2 /*return*/];
    });
}); };
// ── 1. Llamada perdida → debe enviar rescate ────────────────────────────
console.log('=== TEST 1: llamada perdida (timeout) con plan', clinic.plan, '===');
(0, missed_calls_js_1.resetAntiSpam)();
mensajes = [];
var r1 = await (0, missed_calls_js_1.handleCallEvents)(clinic, [{ chatId: JID_TEST, status: 'timeout' }], enviarFalso);
console.log("Rescates enviados: ".concat(r1, " (esperado: 1)"));
resultados.push(r1 === 1 && mensajes[0].includes(clinic.nombre));
// ── 2. Anti-spam: segunda llamada en <6h → NO debe enviar ──────────────
console.log('=== TEST 2: segunda llamada perdida inmediata (anti-spam) ===');
mensajes = [];
var r2 = await (0, missed_calls_js_1.handleCallEvents)(clinic, [{ chatId: JID_TEST, status: 'timeout' }], enviarFalso);
console.log("Rescates enviados: ".concat(r2, " (esperado: 0)"));
resultados.push(r2 === 0);
// ── 3. Llamada contestada → NO debe enviar ──────────────────────────────
console.log('=== TEST 3: llamada contestada (accept) ===');
(0, missed_calls_js_1.resetAntiSpam)();
mensajes = [];
var r3 = await (0, missed_calls_js_1.handleCallEvents)(clinic, [{ chatId: 'otro@s.whatsapp.net', status: 'accept' }], enviarFalso);
console.log("Rescates enviados: ".concat(r3, " (esperado: 0)"));
resultados.push(r3 === 0);
// ── 4. Gating: plan basic → NO debe enviar ───────────────────────────────
console.log('=== TEST 4: gating con plan basic ===');
(0, missed_calls_js_1.resetAntiSpam)();
mensajes = [];
var clinicBasic = __assign(__assign({}, clinic), { plan: 'basic' });
var r4 = await (0, missed_calls_js_1.handleCallEvents)(clinicBasic, [{ chatId: JID_TEST, status: 'timeout' }], enviarFalso);
console.log("Rescates enviados: ".concat(r4, " (esperado: 0)"));
resultados.push(r4 === 0);
// ── Limpieza: leads y mensajes de prueba ─────────────────────────────────
await db_js_1.supabase.from('leads').delete().eq('clinic_id', clinic.id).eq('jid', JID_TEST);
await db_js_1.supabase.from('messages').delete().eq('clinic_id', clinic.id).eq('jid', JID_TEST);
console.log('\n=== LIMPIEZA: leads y mensajes de prueba borrados ===');
var ok = resultados.every(Boolean);
console.log("\nRESULTADO: ".concat(ok ? '✅ PASAN 4/4' : "\u274C FALLA (".concat(resultados.map(function (r, i) { return "test".concat(i + 1, "=").concat(r); }).join(', '), ")")));
process.exit(ok ? 0 : 1);
