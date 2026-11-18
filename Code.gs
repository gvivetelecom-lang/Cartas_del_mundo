/*
 * Cartas del Mundo · recibe los avisos de Supabase (webhooks) y escribe una fila por evento en la hoja "Datos".
 * Pegar en Extensiones → Apps Script de la hoja de cálculo. Cambiar SECRETO por un código largo que solo conozcas vos.
 */
const SECRETO = "CAMBIAR_POR_UN_CODIGO_LARGO";
const HOJA = "Datos";

function doPost(e) {
  if (!e || !e.parameter || e.parameter.token !== SECRETO) return salida({ ok: false, error: "no autorizado" });
  const aviso = JSON.parse(e.postData.contents);
  const fila = filaDe(aviso);
  if (fila) SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA).appendRow([new Date()].concat(fila));
  return salida({ ok: true, registrado: !!fila });
}

/* Columnas: Origen | Evento | Fecha del evento | Correo | Nombre o titular | Detalle | Texto */
function filaDe(a) {
  const r = a.record || {};
  const viejo = a.old_record || {};
  const fecha = x => (x ? new Date(x) : "");
  const nombre = [r.nombre, r.apellido].filter(Boolean).join(" ");

  if (a.table === "suscriptoras") {
    if (a.type === "INSERT") return [a.table, "nueva_suscripcion", fecha(r.alta), r.correo, nombre, r.celular || "", ""];
    if (a.type === "UPDATE" && r.baja_at && !viejo.baja_at) return [a.table, "baja", fecha(r.baja_at), r.correo, nombre, "", ""];
    return null;
  }
  if (a.table === "mensajes_contacto" && a.type === "INSERT") {
    return [a.table, "mensaje", fecha(r.creado), r.correo, r.nombre || "", r.motivo || "", r.mensaje || ""];
  }
  if (a.table === "envios" && a.type === "INSERT") {
    return [a.table, "propuesta", fecha(r.creado), r.correo, r.nombre || "", r.tipo || "", (r.titulo ? r.titulo + " — " : "") + (r.texto || "")];
  }
  if (a.table === "eventos" && a.type === "INSERT") {
    return [a.table, r.tipo, fecha(r.creado), "", r.titular || "", r.seccion || "", ""];
  }
  return null;
}

function salida(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
