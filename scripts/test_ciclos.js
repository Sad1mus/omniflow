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
 * Prueba de recordatorios de ciclos: inserta un ciclo de vacuna con fecha de hoy,
 * corre la revisión con un enviador falso, verifica que se genera el mensaje y el
 * ciclo queda marcado, y lo borra al final.
 *
 *   npx tsx scripts/test_ciclos.ts
 */
var db_js_1 = require("../src/db.js");
var cycles_js_1 = require("../src/cycles.js");
var clinic = (await (0, db_js_1.getActiveClinics)())[0];
if (!clinic)
    throw new Error('No hay clínicas activas');
// 1. Insertar ciclo de prueba: refuerzo de vacuna con fecha de HOY.
var hoy = new Date();
var pad = function (n) { return String(n).padStart(2, '0'); };
var fechaHoy = "".concat(hoy.getFullYear(), "-").concat(pad(hoy.getMonth() + 1), "-").concat(pad(hoy.getDate()));
var _b = await db_js_1.supabase
    .from('ciclos')
    .insert({
    clinic_id: clinic.id,
    jid: 'test-ciclo@s.whatsapp.net',
    mascota: 'Firulais',
    tipo: 'vacuna',
    descripcion: 'refuerzo anual de rabia',
    fecha_proxima: fechaHoy,
})
    .select()
    .single(), ciclo = _b.data, error = _b.error;
if (error)
    throw error;
console.log('=== ANTES: ciclo insertado ===');
console.log({ id: ciclo.id, tipo: ciclo.tipo, fecha_proxima: ciclo.fecha_proxima, enviado: ciclo.enviado });
// 2. Correr la revisión con enviador falso.
var mensaje = '';
var enviados = await (0, cycles_js_1.revisarCiclos)(clinic, function (_clinic, jid, texto) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        mensaje = texto;
        console.log("\n=== MENSAJE QUE SE ENVIAR\u00CDA a ".concat(jid, ": ===\n"));
        console.log(texto);
        return [2 /*return*/, true];
    });
}); });
// 3. Verificar que el ciclo quedó marcado.
var despues = (await db_js_1.supabase
    .from('ciclos')
    .select('id, enviado')
    .eq('id', ciclo.id)
    .single()).data;
console.log('\n=== DESPUÉS: ciclo marcado ===');
console.log({ id: despues === null || despues === void 0 ? void 0 : despues.id, enviado: despues === null || despues === void 0 ? void 0 : despues.enviado });
// 4. Limpieza (ciclo + mensaje de historial que guarda revisarCiclos).
await db_js_1.supabase.from('ciclos').delete().eq('id', ciclo.id);
await db_js_1.supabase.from('messages').delete().eq('clinic_id', clinic.id).eq('jid', 'test-ciclo@s.whatsapp.net');
var restantes = (await db_js_1.supabase.from('ciclos').select('id').eq('id', ciclo.id)).data;
console.log('\n=== LIMPIEZA ===');
console.log({ ciclos_restantes: (_a = restantes === null || restantes === void 0 ? void 0 : restantes.length) !== null && _a !== void 0 ? _a : 0 });
var ok = enviados >= 1 && mensaje.includes('Firulais') && Boolean(despues === null || despues === void 0 ? void 0 : despues.enviado);
console.log("\nRESULTADO: ".concat(ok ? '✅ PASA' : '❌ FALLA', " (enviados=").concat(enviados, ", marcado=").concat(Boolean(despues === null || despues === void 0 ? void 0 : despues.enviado), ")"));
process.exit(ok ? 0 : 1);
