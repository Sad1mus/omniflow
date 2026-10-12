"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Prueba del reporte semanal: genera e imprime el reporte de cada clínica activa
 * con datos REALES (no lo envía por WhatsApp). También demuestra el gating por plan.
 *
 *   npx tsx scripts/test_reporte.ts
 */
var db_js_1 = require("../src/db.js");
var reports_js_1 = require("../src/reports.js");
var plans_js_1 = require("../src/plans.js");
var clinics = await (0, db_js_1.getActiveClinics)();
for (var _i = 0, clinics_1 = clinics; _i < clinics_1.length; _i++) {
    var clinic = clinics_1[_i];
    var incluido = (0, plans_js_1.planIncluye)(clinic, 'reporte_semanal');
    console.log("\n========== ".concat(clinic.nombre, " (plan: ").concat(clinic.plan, ") =========="));
    console.log("\u00BFSu plan incluye reporte semanal?: ".concat(incluido ? 'SÍ ✅' : 'NO ❌ (necesita Growth o Scale)'));
    if (incluido) {
        console.log('--- Texto que recibiría el dueño por WhatsApp: ---\n');
        console.log(await (0, reports_js_1.generarReporteSemanal)(clinic));
    }
}
process.exit(0);
