"use strict";
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Prueba del pedido de reseñas: inserta una cita simulada de ayer, corre la
 * revisión con un "enviador" falso (imprime en vez de mandar WhatsApp), verifica
 * que la cita queda marcada y la borra al final.
 *
 *   npx tsx scripts/test_resenas.ts
 */
var db_js_1 = require("../src/db.js");
var reviews_js_1 = require("../src/reviews.js");
var clinic = (await (0, db_js_1.getActiveClinics)())[0];
if (!clinic)
    throw new Error('No hay clínicas activas');
// 1. Insertar cita simulada: ayer a esta misma hora (cae en la ventana 2-26h).
//    OJO: fecha y hora se guardan en la TZ de la clínica (config.tz) — igual que
//    lo hace el bot al agendar — así que ambas se construyen en hora LOCAL.
var ayer = new Date(Date.now() - 24 * 3600 * 1000);
var pad = function (n) { return String(n).padStart(2, '0'); };
var fecha = "".concat(ayer.getFullYear(), "-").concat(pad(ayer.getMonth() + 1), "-").concat(pad(ayer.getDate()));
var hora = ayer.toTimeString().slice(0, 8);
var _b = await db_js_1.supabase
    .from('appointments')
    .insert({
    clinic_id: clinic.id,
    jid: 'test-resena@s.whatsapp.net',
    nombre: 'Cliente De Prueba',
    servicio: 'Vacunación',
    mascota: 'Firulais',
    fecha: fecha,
    hora: hora,
    estado: 'confirmada',
})
    .select()
    .single(), insertada = _b.data, error = _b.error;
if (error)
    throw error;
console.log('=== ANTES: cita simulada insertada ===');
console.log({ id: insertada.id, fecha: fecha, hora: hora, resena_pedida: insertada.resena_pedida });
// 2. Correr la revisión con enviador falso (no toca WhatsApp).
var mensajeGenerado = '';
var enviadas = await (0, reviews_js_1.revisarResenas)(clinic, function (_clinic, jid, texto) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        mensajeGenerado = texto;
        console.log("\n=== MENSAJE QUE SE ENVIAR\u00CDA a ".concat(jid, ": ===\n"));
        console.log(texto);
        return [2 /*return*/, true];
    });
}); });
// 3. Verificar que la cita quedó marcada.
var despues = (await db_js_1.supabase
    .from('appointments')
    .select('id, resena_pedida')
    .eq('id', insertada.id)
    .single()).data;
console.log('\n=== DESPUÉS: cita marcada ===');
console.log({ id: despues === null || despues === void 0 ? void 0 : despues.id, resena_pedida: despues === null || despues === void 0 ? void 0 : despues.resena_pedida });
// 4. Limpiar: borrar la cita simulada.
await db_js_1.supabase.from('appointments').delete().eq('id', insertada.id);
var verificarBorrada = (await db_js_1.supabase
    .from('appointments')
    .select('id')
    .eq('id', insertada.id)).data;
console.log('\n=== LIMPIEZA: cita simulada borrada ===');
console.log({ filas_restantes: (_a = verificarBorrada === null || verificarBorrada === void 0 ? void 0 : verificarBorrada.length) !== null && _a !== void 0 ? _a : 0 });
// Resultado final
var ok = enviadas >= 1 && mensajeGenerado.includes(String(clinic.google_review_url)) && (despues === null || despues === void 0 ? void 0 : despues.resena_pedida);
console.log("\nRESULTADO: ".concat(ok ? '✅ PASA' : '❌ FALLA', " (enviadas=").concat(enviadas, ", marcada=").concat(Boolean(despues === null || despues === void 0 ? void 0 : despues.resena_pedida), ")"));
process.exit(ok ? 0 : 1);
