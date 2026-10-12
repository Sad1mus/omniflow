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
var _a, _b, _c, _d, _e, _f, _g, _h, _j;
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Onboarding express: crea una clínica nueva completa en Supabase en 1 comando.
 *
 *   npx tsx scripts/nueva_clinica.ts --json '{"nombre":"...","vertical":"veterinaria",...}'
 *   npx tsx scripts/nueva_clinica.ts --json ruta/al/archivo.json
 *
 * Campos requeridos: nombre, vertical, telefono_humano.
 * Todo lo demás tiene defaults sensatos según el vertical.
 * Imprime al final: link del panel, session_id e instrucciones del QR.
 */
var node_fs_1 = require("node:fs");
var node_crypto_1 = require("node:crypto");
var db_js_1 = require("../src/db.js");
var config_js_1 = require("../src/config.js");
// ── Defaults por vertical ──────────────────────────────────────────────────────
var DEFAULTS = {
    veterinaria: {
        servicios: ['Consulta general', 'Vacunación', 'Baño y peluquería', 'Desparasitación'],
        valor: 80000,
        tono: 'Cálido, cercano y resolutivo. Trata a las mascotas por su nombre.',
    },
    dental: {
        servicios: ['Valoración', 'Limpieza dental', 'Ortodoncia', 'Blanqueamiento'],
        valor: 150000,
        tono: 'Profesional y cercano. Transmite confianza: ir al odontólogo no tiene que dar miedo.',
    },
    estetica: {
        servicios: ['Valoración', 'Limpieza facial', 'Depilación láser', 'Masajes'],
        valor: 200000,
        tono: 'Elegante, cálido y discreto. Hace sentir a cada clienta especial.',
    },
};
var HORARIO_DEFAULT = {
    dias: [1, 2, 3, 4, 5, 6],
    inicio: '08:00',
    fin: '18:00',
    duracion_min: 30,
    almuerzo: ['12:30', '14:00'],
};
// ── Parsear argumentos ─────────────────────────────────────────────────────────
var jsonIdx = process.argv.indexOf('--json');
if (jsonIdx === -1 || !process.argv[jsonIdx + 1]) {
    console.error('Uso: npx tsx scripts/nueva_clinica.ts --json \'{"nombre":...}\' (o ruta a archivo .json)');
    process.exit(1);
}
var jsonArg = process.argv[jsonIdx + 1];
var raw = (0, node_fs_1.existsSync)(jsonArg) ? (0, node_fs_1.readFileSync)(jsonArg, 'utf8') : jsonArg;
var datos;
try {
    datos = JSON.parse(raw);
}
catch (_k) {
    console.error('❌ El JSON no es válido. Revisa las comillas y la sintaxis.');
    process.exit(1);
}
// ── Validar requeridos ─────────────────────────────────────────────────────────
var faltantes = ['nombre', 'vertical', 'telefono_humano'].filter(function (c) { return !datos[c]; });
if (faltantes.length > 0) {
    console.error("\u274C Faltan campos requeridos: ".concat(faltantes.join(', ')));
    process.exit(1);
}
if (!['veterinaria', 'dental', 'estetica'].includes(datos.vertical)) {
    console.error("\u274C Vertical inv\u00E1lido: \"".concat(datos.vertical, "\". Usa: veterinaria | dental | estetica"));
    process.exit(1);
}
// ── Construir la clínica con defaults ──────────────────────────────────────────
var def = DEFAULTS[datos.vertical];
var sessionId = datos.nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
var infoExtra = __assign({}, ((_a = datos.info_extra) !== null && _a !== void 0 ? _a : {}));
if (datos.medios_pago)
    infoExtra.medios_pago = datos.medios_pago;
var fila = {
    nombre: datos.nombre,
    vertical: datos.vertical,
    ciudad: (_b = datos.ciudad) !== null && _b !== void 0 ? _b : null,
    direccion: (_c = datos.direccion) !== null && _c !== void 0 ? _c : null,
    servicios: (_d = datos.servicios) !== null && _d !== void 0 ? _d : def.servicios,
    horario: (_e = datos.horario) !== null && _e !== void 0 ? _e : HORARIO_DEFAULT,
    tono: (_f = datos.tono) !== null && _f !== void 0 ? _f : def.tono,
    info_extra: infoExtra,
    session_id: sessionId,
    telefono_humano: datos.telefono_humano.replace(/\D/g, ''),
    plan: (_g = datos.plan) !== null && _g !== void 0 ? _g : 'basic',
    valor_cita_promedio: (_h = datos.valor_cita_promedio) !== null && _h !== void 0 ? _h : def.valor,
    google_review_url: (_j = datos.google_review_url) !== null && _j !== void 0 ? _j : null,
    dashboard_token: (0, node_crypto_1.randomBytes)(16).toString('hex'),
    activo: true,
};
// ── Insertar ───────────────────────────────────────────────────────────────────
var _l = await db_js_1.supabase.from('clinics').insert(fila).select().single(), data = _l.data, error = _l.error;
if (error) {
    if (error.code === '23505') {
        console.error("\u274C Ya existe una cl\u00EDnica con session_id \"".concat(sessionId, "\". \u00BFEs un duplicado?"));
    }
    else {
        console.error('❌ Error creando la clínica:', error.message);
    }
    process.exit(1);
}
// ── Resultado ──────────────────────────────────────────────────────────────────
console.log('');
console.log('═'.repeat(60));
console.log("\u2705 CL\u00CDNICA CREADA: ".concat(data.nombre));
console.log('═'.repeat(60));
console.log('');
console.log("   Vertical:    ".concat(data.vertical));
console.log("   Plan:        ".concat(data.plan));
console.log("   Session ID:  ".concat(data.session_id));
console.log("   Servicios:   ".concat(data.servicios.join(', ')));
console.log('');
console.log('📊 PANEL DE CLIENTAS (envíaselo al dueño):');
console.log("   ".concat(config_js_1.config.dashboardUrl, "/d/").concat(data.dashboard_token));
console.log('');
console.log('📲 PASOS PARA CONECTAR EL WHATSAPP:');
console.log('   1. Reinicia el agente (npm run dev o pm2 restart)');
console.log("   2. Aparecer\u00E1 el QR de \"".concat(data.nombre, "\" en la consola"));
console.log('   3. Desde el WhatsApp DE LA CLÍNICA: Dispositivos vinculados → Vincular dispositivo → escanear');
console.log('   4. Prueba escribiéndole desde otro número: "Hola, quiero una cita"');
console.log('');
console.log('💬 COMANDOS DEL DUEÑO (explícaselos):');
console.log('   /hoy · /semana · /panel · /info · /editar · /ayuda');
console.log('');
process.exit(0);
