
/* ---------- Datos de ejemplo ---------- */
/* Suscripción gratuita: se pide por correo (Gmail) y Anita la confirma. Sin pagos. */
const desdeTxt = () => L("gratis", "grátis", "free");
const gs = n => n.toLocaleString("es-PY") + " Gs";
const SECCIONES = [
  { id: "paraguay", t: "🇵🇾 Paraguay" },
  { id: "internacional", t: "🌏 Relaciones internacionales y defensa" },
  { id: "economia", t: "📈 Economía y recursos" },
  { id: "ciencia", t: "🔬 Ciencia, tecnología e IA" },
  { id: "historia", t: "🏺 Historia y ciencias de la Tierra" },
  { id: "america", t: "🌎 América Latina, mundo y cultura" }
];
let ARCHIVO = [];
let CARTA = [];

/* ---------- Estado (datos reales desde Supabase) ---------- */
let st = { hoy: ahoraSP().fecha, sesion: null, admin: false, fila: null, subs: {}, mensajes: [], cartaCompleta: false, listo: false, confirmar: null };
let vs = { q: "", sec: "todas", motivo: "Suscripción", tipo: "Noticia o artículo", consent: false, flash: null, verCarta: null, gtab: "resumen", adulto: false, menor: false, tutorOk: false, acepta: false, delOk: false, refocus: null, cookies: null, pop: false, fechaCarta: null, loginIniciado: false };
let draftVals = {};
vs.lang = (() => { try { return localStorage.getItem("cdm-idioma") || "es"; } catch (e) { return "es"; } })();
document.documentElement.lang = vs.lang;
vs.cookies = (() => { try { return localStorage.getItem("cdm-cookies"); } catch (e) { return null; } })();
function save() {}

/* ---------- Utilidades ---------- */
function addDays(iso, n) { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
function fmt(iso) { return iso ? new Date(iso + "T12:00:00").toLocaleDateString(LOC[vs.lang] || "es-PY", { day: "numeric", month: "long", year: "numeric" }) : "—"; }
function fmtLargo(iso) { return new Date(iso + "T12:00:00").toLocaleDateString(LOC[vs.lang] || "es-PY", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
function fmtCorto(iso) { return new Date(iso + "T12:00:00").toLocaleDateString(LOC[vs.lang] || "es-PY", { weekday: "long", day: "numeric", month: "long" }); }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function log() {}
function diasDesde(iso) { return Math.round((new Date(st.hoy + "T12:00:00") - new Date(iso + "T12:00:00")) / 86400000); }
function esLibre(iso) { return diasDesde(iso) < 7; }
function hasAccess(e) {
  const s = e && st.subs[e];
  if (!s) return false;
  if (s.cortesia) return true;
  return s.estado === "activa";
}
const ACCESO = () => hasAccess(st.sesion);
const ACCESO_COMPLETO = ACCESO;
function badge(s) {
  const map = { activa: ["e-activo", L("Activa", "Ativa", "Active")], pendiente: ["e-gracia", L("Pendiente de confirmar", "Pendente de confirmação", "Pending confirmation")], cancelada: ["e-cancelada", L("Cancelada", "Cancelada", "Cancelled")] };
  if (s.cortesia) return `<span class="estado-pill e-cortesia">${L("Cortesía del grupo", "Cortesia do grupo", "Group courtesy")}</span>`;
  const [c, t] = map[s.estado] || ["e-vencido", L("Sin suscripción", "Sem assinatura", "No subscription")];
  return `<span class="estado-pill ${c}">${t}</span>`;
}


/* ---------- Bloques reutilizables ---------- */
const T = {
  es: { archivo:"Archivo", quienes:"Quiénes somos", cartaAlMundo:"Cartas al Mundo", contacto:"Contacto", ingresar:"Ingresar", miCuenta:"Mi cuenta", suscribirme:"Suscribirme", desde:"desde", compartir:"Compartir", gestion:"Gestión (privada)",
    completa:"Carta completa", vistaPrevia:"Vista previa", libre:"libre", porQue:"Por qué importa", fuentes:"Fuentes", muroTit:"Seguí leyendo con la suscripción", muroTxt:"Suscribite gratis para leer la carta completa.",
    envioTit:"Enviá tu texto", envioMuroTit:"Enviar textos es para suscriptoras", envioMuroTxt:"Con una suscripción podés enviar tu manifiesto o ensayo.", nombre:"Tu nombre o seudónimo", correo:"Tu correo", texto:"Tu texto", pegaAqui:"Pegá aquí tu manifiesto, ensayo o artículo", enviarAnita:"Enviar", avisoEnvio:"Tu envío llega para leerlo. No se publica automáticamente.",
    temaEt:"Tema del manifiesto o ensayo de hoy · lo genera la carta diaria", temaTit:"[Tema del día, enviado por la skill de Cartas del Mundo]", temaTxt:"Escribí un texto breve (manifiesto, ensayo o artículo) sobre este tema. Se lee y, si encaja, se publica en la próxima carta con tu nombre o seudónimo.",
    cierreTxt:"Esta carta se publica todos los días. Si querés revisar las anteriores, el archivo está disponible para vos.", archivoCartas:"Archivo de cartas", compartirCarta:"Compartir la carta", enviarPropuesta:"Enviar una propuesta",
    noticiaDia:"Noticia del día · Paraguay", muroNoticiaTit:"Leer la noticia completa es para suscriptoras", muroNoticiaTxt:"Con la suscripción leés el análisis completo y las fuentes.", masCarta:"Más de la carta de hoy", verCarta:"Ver carta completa", archivoAnteriores:"Archivo de cartas anteriores" },
  pt: { archivo:"Arquivo", quienes:"Quem somos", cartaAlMundo:"Cartas ao Mundo", contacto:"Contato", ingresar:"Entrar", miCuenta:"Minha conta", suscribirme:"Assinar", desde:"a partir de", compartir:"Compartilhar", gestion:"Gestão (privada)",
    completa:"Carta completa", vistaPrevia:"Prévia", libre:"livre", porQue:"Por que importa", fuentes:"Fontes", muroTit:"Continue lendo com a assinatura", muroTxt:"Assine grátis para ler a carta completa.",
    envioTit:"Envie seu texto", envioMuroTit:"Enviar textos é para assinantes", envioMuroTxt:"Com uma assinatura você pode enviar seu manifesto ou ensaio.", nombre:"Seu nome ou pseudônimo", correo:"Seu e-mail", texto:"Seu texto", pegaAqui:"Cole aqui seu manifesto, ensaio ou artigo", enviarAnita:"Enviar", avisoEnvio:"Seu envio chega para leitura. Não é publicado automaticamente.",
    temaEt:"Tema do manifesto ou ensaio de hoje · gerado pela carta diária", temaTit:"[Tema do dia, enviado pela skill Cartas do Mundo]", temaTxt:"Escreva um texto breve (manifesto, ensaio ou artigo) sobre este tema. Ele é lido e, se encaixar, é publicado na próxima carta com seu nome ou pseudônimo.",
    cierreTxt:"Esta carta é publicada todos os dias. Se quiser ver as anteriores, o arquivo está disponível para você.", archivoCartas:"Arquivo de cartas", compartirCarta:"Compartilhar a carta", enviarPropuesta:"Enviar uma proposta",
    noticiaDia:"Notícia do dia · Paraguai", muroNoticiaTit:"Ler a notícia completa é para assinantes", muroNoticiaTxt:"Com a assinatura você lê a análise completa e as fontes.", masCarta:"Mais da carta de hoje", verCarta:"Ver carta completa", archivoAnteriores:"Arquivo de cartas anteriores" },
  en: { archivo:"Archive", quienes:"About us", cartaAlMundo:"Letters to the World", contacto:"Contact", ingresar:"Log in", miCuenta:"My account", suscribirme:"Subscribe", desde:"from", compartir:"Share", gestion:"Management (private)",
    completa:"Full letter", vistaPrevia:"Preview", libre:"free", porQue:"Why it matters", fuentes:"Sources", muroTit:"Keep reading with a subscription", muroTxt:"Subscribe for free to read the full letter.",
    envioTit:"Send your text", envioMuroTit:"Sending texts is for subscribers", envioMuroTxt:"With a subscription you can send your manifesto or essay.", nombre:"Your name or pen name", correo:"Your email", texto:"Your text", pegaAqui:"Paste your manifesto, essay or article here", enviarAnita:"Send", avisoEnvio:"Your submission is sent to be read. It is not published automatically.",
    temaEt:"Today's manifesto or essay topic · generated by the daily letter", temaTit:"[Topic of the day, sent by the Cartas del Mundo skill]", temaTxt:"Write a short text (manifesto, essay or article) on this topic. It is read and, if it fits, published in the next letter under your name or pen name.",
    cierreTxt:"This letter is published every day. To see past ones, the archive is available to you.", archivoCartas:"Letters archive", compartirCarta:"Share the letter", enviarPropuesta:"Send a proposal",
    noticiaDia:"Story of the day · Paraguay", muroNoticiaTit:"Reading the full story is for subscribers", muroNoticiaTxt:"With a subscription you read the full analysis and the sources.", masCarta:"More from today's letter", verCarta:"See full letter", archivoAnteriores:"Archive of past letters" }
};
const LOC = { es: "es-PY", pt: "pt-BR", en: "en-US" };
const SEC_T = {
  "🇵🇾 Paraguay": { pt: "🇵🇾 Paraguai", en: "🇵🇾 Paraguay" },
  "🌏 Relaciones internacionales y defensa": { pt: "🌏 Relações internacionais e defesa", en: "🌏 International relations and defense" },
  "📈 Economía y recursos": { pt: "📈 Economia e recursos", en: "📈 Economy and resources" },
  "🔬 Ciencia, tecnología e IA": { pt: "🔬 Ciência, tecnologia e IA", en: "🔬 Science, technology and AI" },
  "🏺 Historia y ciencias de la Tierra": { pt: "🏺 História e ciências da Terra", en: "🏺 History and earth sciences" },
  "🌎 América Latina, mundo y cultura": { pt: "🌎 América Latina, mundo e cultura", en: "🌎 Latin America, world and culture" }
};
function L(es, pt, en) { return vs.lang === "pt" ? pt : vs.lang === "en" ? en : es; }
function tr(k) { return (T[vs.lang] && T[vs.lang][k]) || T.es[k] || k; }
function nw(n, f) { const l = vs.lang; return (l !== "es" && n[l] && n[l][f]) || n[f] || ""; }
function secT(sec) { const l = vs.lang; return (l !== "es" && SEC_T[sec] && SEC_T[sec][l]) || sec; }
function setIdioma(l) {
  vs.lang = l;
  if (vs.cookies === "todas") try { localStorage.setItem("cdm-idioma", l); } catch (e) {}
  document.documentElement.lang = l;
  render();
}
function selectorIdioma() {
  return `<span class="idioma">${["es", "pt", "en"].map(l => `<button type="button" class="lang-btn ${vs.lang === l ? "activo" : ""}" data-a="idioma" data-m="${l}" aria-pressed="${vs.lang === l}">${l.toUpperCase()}</button>`).join("")}</span>`;
}
function navHTML(name) {
  const it = (id, lbl) => `<a href="#${id}" class="${name === id ? "activo" : ""}">${lbl}</a>`;
  const cuenta = st.sesion ? `<a href="#cuenta">${tr("miCuenta")}</a>` : `<a href="#suscribirse">${tr("ingresar")}</a>`;
  return `<button type="button" class="skip" data-a="skip">${L("Saltar al contenido", "Pular para o conteúdo", "Skip to content")}</button><nav class="nav" aria-label="Principal">
    <div class="links"><a href="#inicio" aria-label="Inicio"><img class="logo" src="logo_nanduti.svg" alt=""></a>${it("archivo", tr("archivo"))}${it("quienes", tr("quienes"))}${it("cartas-al-mundo", tr("cartaAlMundo"))}${it("contacto", tr("contacto"))}</div>
    <div class="links">${selectorIdioma()}${cuenta}<a href="#suscribirse" class="cta" data-a="pop">${tr("suscribirme")} · ${desdeTxt()}</a></div>
  </nav>`;
}
function footerHTML() {
  return `<footer>
    <span>© Cartas del Mundo</span>
    <span><a href="#cuenta">${L("Darme de baja", "Cancelar assinatura", "Unsubscribe")}</a> · <a href="#archivo">${tr("archivo")}</a> · <a href="#compartir">${tr("compartir")}</a> · <a href="#gestion">${tr("gestion")}</a></span>
  </footer>`;
}
/* Pop-up de suscripción: entrar con el correo (como un login) y después pedir la suscripción gratuita. */
function popHTML() {
  if (!vs.pop) return "";
  const x = `<button type="button" class="pop-x" data-a="pop-cerrar" aria-label="${L("Cerrar", "Fechar", "Close")}">×</button>`;
  const intro = L("Entrá con tu correo y pedí la suscripción gratis. No hace falta contraseña.", "Entre com seu e-mail e peça a assinatura grátis. Não precisa de senha.", "Log in with your email and request the free subscription. No password needed.");
  let cuerpo;
  if (st.sesion) {
    const s = st.subs[st.sesion];
    if (s && s.estado === "pendiente") cuerpo = `<p>${L("Tu pedido ya está pendiente. La confirmación llega por correo.", "Seu pedido já está pendente. A confirmação chega por e-mail.", "Your request is already pending. Confirmation arrives by email.")}</p>`;
    else if (s && s.estado === "activa") cuerpo = `<p>${L("Ya tenés la suscripción activa. Entrá a tu cuenta para leer la carta completa.", "Você já tem a assinatura ativa. Entre na sua conta para ler a carta completa.", "Your subscription is already active. Go to your account to read the full letter.")}</p><a class="btn" href="#cuenta" data-a="pop-cerrar">${L("Entrar a mi cuenta", "Entrar na minha conta", "Go to my account")}</a>`;
    else cuerpo = `<p class="nota">${L("Entraste como", "Entrou como", "Signed in as")} <b>${esc(st.sesion)}</b>.</p>${formSuscribir()}`;
  } else if (st.pendiente) {
    cuerpo = `<p>${L("Mandamos un enlace de acceso a", "Enviamos um link de acesso para", "We sent an access link to")} <b>${esc(st.pendiente)}</b>.</p><p class="nota">${L("Escribí aquí el código de 6 números que llegó al correo, o abrí el enlace desde este mismo navegador.", "Escreva aqui o código de 6 números que chegou ao e-mail, ou abra o link neste mesmo navegador.", "Type the 6-digit code from the email here, or open the link from this same browser.")}</p>${formCodigo()}`;
  } else {
    cuerpo = `<p>${intro}</p>
      <form id="f-login-pop">
        <label for="pop-mail">${L("Tu correo", "Seu e-mail", "Your email")}</label>
        <input type="email" id="pop-mail" placeholder="tu@correo.com" required>
        ${camposAlta()}
        <button class="btn" type="submit">${L("Log in", "Log in", "Log in")}</button>
      </form>`;
  }
  return `<div class="pop-fondo" data-a="pop-cerrar"></div>
    <div class="pop-caja" role="dialog" aria-modal="true" aria-labelledby="pop-tit">${x}
      <div class="etiqueta">${tr("suscribirme")} · ${desdeTxt()}</div>
      <h2 id="pop-tit">${L("Seguí leyendo: suscribite gratis", "Continue lendo: assine grátis", "Keep reading: subscribe for free")}</h2>
      ${cuerpo}
    </div>`;
}
function bloqueCuenta() {
  const e = st.sesion, s = st.subs[e];
  if (!s || s.estado === "sin_suscripcion") return formSuscribir();
  if (s.cortesia) return `<p>${L("Tu cuenta es de cortesía del grupo. Acceso completo.", "Sua conta é cortesia do grupo. Acesso completo.", "Your account is a courtesy from the group. Full access.")}</p>`;
  if (s.estado === "pendiente") return `<p>${L("Recibimos tu pedido de suscripción. La confirmación llega por correo.", "Recebemos seu pedido de assinatura. A confirmação chega por e-mail.", "We received your subscription request. Confirmation arrives by email.")}</p>
      <button class="btn sec" data-a="cancelar">${L("Cancelar mi pedido", "Cancelar meu pedido", "Cancel my request")}</button>`;
  if (s.estado === "activa") return `<p>${L("Tu suscripción está activa desde", "Sua assinatura está ativa desde", "Your subscription is active since")} ${fmtCuando(s.altaHora)}. ${L("Es gratuita.", "É gratuita.", "It is free.")}</p>
      <button class="btn sec" data-a="cancelar">${L("Darme de baja de la suscripción", "Cancelar minha assinatura", "Unsubscribe")}</button>`;
  return `<p>${L("Diste de baja tu suscripción. Podés volver a pedirla cuando quieras.", "Você cancelou a assinatura. Pode pedir de novo quando quiser.", "You unsubscribed. You can request it again anytime.")}</p>${formSuscribir()}`;
}
/* Fecha y hora legibles (hora de Paraguay). */
function fmtCuando(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-PY", { timeZone: "America/Asuncion", dateStyle: "medium", timeStyle: "short" });
}
/* Alta junto con el acceso: nombre, apellido y celular se piden al entrar. Si la persona es nueva, queda suscripta al volver del correo. */
const CLAVE_ALTA = "cdm_alta_pendiente";
function camposAlta() {
  const toggle = `<button type="button" class="link" data-a="toggle-cuenta">${vs.yaCuenta ? L("Soy nueva: crear cuenta", "Sou nova: criar conta", "I'm new: create an account") : L("Ya tengo una cuenta", "Já tenho uma conta", "I already have an account")}</button>`;
  if (vs.yaCuenta) return `<p>${toggle}</p>`;
  const celMsg = L("El celular tiene que empezar con + y el código de país, por ejemplo +595 981 123456.", "O celular precisa começar com + e o código do país, por exemplo +595 981 123456.", "The mobile number must start with + and the country code, for example +595 981 123456.");
  return `<label>${L("Nombre", "Nome", "First name")}<input type="text" name="nombre" autocomplete="given-name" required></label>
    <label>${L("Apellido", "Sobrenome", "Last name")}<input type="text" name="apellido" autocomplete="family-name" required></label>
    <label>${L("Celular (con +)", "Celular (com +)", "Mobile (with +)")}<input type="tel" name="celular" placeholder="+595 981 123456" autocomplete="tel" required pattern="\\+[0-9\\s\\-.()]{8,22}" title="${esc(celMsg)}"></label>
    <p>${toggle}</p>
    <p class="nota">${L("Nombre, apellido y celular son obligatorios para tu suscripción gratuita.", "Nome, sobrenome e celular são obrigatórios para sua assinatura gratuita.", "First name, last name and mobile number are required for your free subscription.")}</p>`;
}
function guardarAltaPendiente(f) {
  try {
    const nombre = (f.nombre || "").trim(), apellido = (f.apellido || "").trim(), celular = (f.celular || "").trim();
    if (nombre && apellido && /^\+[0-9\s\-.()]{8,22}$/.test(celular)) localStorage.setItem(CLAVE_ALTA, JSON.stringify({ nombre, apellido, celular }));
    else localStorage.removeItem(CLAVE_ALTA);
  } catch (err) { /* sin almacenamiento: entra igual y los datos se piden después */ }
}
async function altaPendiente() {
  let datos = null;
  try { datos = JSON.parse(localStorage.getItem(CLAVE_ALTA) || "null"); localStorage.removeItem(CLAVE_ALTA); } catch (err) { datos = null; }
  if (!datos || !sb) return;
  const { error } = await sb.rpc("solicitar_suscripcion", { p_nombre: datos.nombre, p_apellido: datos.apellido, p_celular: datos.celular });
  if (!error) {
    await cargarFila();
    flash("cuenta", L("Listo: tu suscripción ya está activa y podés leer la carta completa.", "Pronto: sua assinatura já está ativa e você pode ler a carta completa.", "Done: your subscription is active and you can read the full letter now."));
  }
}

/* Código de 6 números que llega por correo: se escribe en la misma página, sin salir a otra pestaña. */
function formCodigo() {
  const err = vs.codigoErr ? `<p class="nota" role="alert">${esc(vs.codigoErr)}</p>` : "";
  return `<form id="f-codigo" class="suscribir-form">
    <label for="in-codigo">${L("Código de 6 números", "Código de 6 números", "6-digit code")}</label>
    <input type="text" id="in-codigo" inputmode="numeric" autocomplete="one-time-code" required>
    ${err}
    <button class="btn" type="submit">${L("Entrar con el código", "Entrar com o código", "Log in with the code")}</button>
  </form>`;
}
function formSuscribir() {
  return `<div class="plan"><b>${L("Suscribite gratis", "Assine grátis", "Subscribe for free")}</b>
    ${notaPrecio()}
    <form id="f-suscribir" class="suscribir-form">
      <label for="s-nombre">${L("Nombre", "Nome", "First name")}</label>
      <input type="text" id="s-nombre" autocomplete="given-name" required>
      <label for="s-apellido">${L("Apellido", "Sobrenome", "Last name")}</label>
      <input type="text" id="s-apellido" autocomplete="family-name" required>
      <label for="s-celular">${L("Celular (con +)", "Celular (com +)", "Mobile (with +)")}</label>
      <input type="tel" id="s-celular" placeholder="+595 981 123456" autocomplete="tel" required>
      <label for="s-correo">${L("Tu correo", "Seu e-mail", "Your email")}</label>
      <input type="email" id="s-correo" value="${esc(st.sesion || "")}" readonly>
      <button class="btn" type="submit">${L("Suscribirme", "Assinar", "Subscribe")}</button>
    </form></div>`;
}
function sesionBarra() {
  if (!st.sesion) return `<div class="sesion-barra"><span>${L("No iniciaste sesión", "Você não entrou", "You are not logged in")}</span><a class="btn chico" href="#suscribirse">${tr("ingresar")}</a></div>`;
  const s = st.subs[st.sesion];
  const estados = { activa: L("Suscripción activa", "Assinatura ativa", "Active subscription"), pendiente: L("Pedido pendiente", "Pedido pendente", "Request pending"), cancelada: L("Cancelada", "Cancelada", "Cancelled") };
  const estado = s ? (s.cortesia ? L("Cortesía del grupo", "Cortesia do grupo", "Group courtesy") : estados[s.estado] || L("Sin suscripción", "Sem assinatura", "No subscription")) : L("Sin suscripción", "Sem assinatura", "No subscription");
  return `<div class="sesion-barra"><span>${L("Sesión iniciada", "Sessão iniciada", "Signed in")} · ${esc(st.sesion)}</span><span class="estado">${estado}</span></div>`;
}
function flashHTML(name) {
  if (vs.flash && vs.flash.v === name) return `<div class="flash" role="status">${esc(vs.flash.t)}</div>`;
  return "";
}


/* ---------- Pago, consentimientos y avisos ---------- */
function notaPrecio() {
  return `<p class="nota">${L("La suscripción es gratuita: no hay pagos ni cobros. Podés darte de baja cuando quieras.", "A assinatura é gratuita: não há pagamentos nem cobranças. Pode cancelar quando quiser.", "The subscription is free: there are no payments or charges. You can unsubscribe anytime.")}</p>`;
}
function checksPago() {
  const chk = (a, on, texto) => `<button type="button" class="check" data-a="${a}" aria-pressed="${on}"><span class="caja ${on ? "on" : ""}"></span><span>${texto}</span></button>`;
  return `<div class="pago-datos">
    <p class="nota">${L("Antes de pedir la suscripción, confirmá lo siguiente:", "Antes de pedir a assinatura, confirme o seguinte:", "Before requesting the subscription, please confirm:")}</p>
    ${chk("edad-adulto", vs.adulto, L("Tengo 18 años o más.", "Tenho 18 anos ou mais.", "I am 18 or older."))}
    ${chk("edad-menor", vs.menor, L("Soy menor de 18 años (necesito el consentimiento de mi madre, padre o tutor).", "Sou menor de 18 anos (preciso do consentimento da minha mãe, pai ou responsável).", "I am under 18 (I need consent from my parent or guardian)."))}
    ${vs.menor ? `<div class="tutor">
      <label for="p-tutor">${L("Correo de tu madre, padre o tutor", "E-mail da sua mãe, pai ou responsável", "Email of your parent or guardian")}</label>
      <input type="email" id="p-tutor" placeholder="correo@ejemplo.com">
      ${chk("tutor-ok", vs.tutorOk, L("Mi madre, padre o tutor acepta que yo contrate esta suscripción y que este correo reciba los avisos de mi suscripción.", "Minha mãe, pai ou responsável aceita que eu contrate esta assinatura e que este e-mail receba os avisos da assinatura.", "My parent or guardian agrees that I subscribe and that this email receives notices about the subscription."))}
    </div>` : ""}
    ${chk("acepta", vs.acepta, L("Acepto los términos y condiciones y la política de privacidad.", "Aceito os termos e condições e a política de privacidade.", "I accept the terms and conditions and the privacy policy."))}
  </div>`;
}
function solicitudEliminar() {
  return `<div class="card" id="eliminar-datos">
    <div class="etiqueta">${L("Tus datos", "Seus dados", "Your data")}</div>
    <h2>${L("Pedir la eliminación de mis datos personales", "Pedir a exclusão dos meus dados pessoais", "Request deletion of my personal data")}</h2>
    <p class="nota">${L("Borramos los datos de tu cuenta y los textos que enviaste, salvo los que estemos obligados a conservar por ley. Plazo de respuesta: [a confirmar].", "Apagamos os dados da sua conta e os textos que você enviou, exceto os que somos obrigados a guardar por lei. Prazo de resposta: [a confirmar].", "We delete your account data and the texts you sent, except what we are required to keep by law. Response time: [to be confirmed].")}</p>
    <form id="f-eliminar">
      <label for="d-correo">${L("Correo de la cuenta", "E-mail da conta", "Account email")}</label>
      <input type="email" id="d-correo" value="${esc(st.sesion || "")}" required>
      <label for="d-motivo">${L("Motivo (opcional)", "Motivo (opcional)", "Reason (optional)")}</label>
      <textarea id="d-motivo"></textarea>
      <button type="button" class="check" data-a="del-ok" aria-pressed="${vs.delOk}"><span class="caja ${vs.delOk ? "on" : ""}"></span><span>${L("Entiendo que esta solicitud no se puede deshacer y que se eliminarán los datos de mi cuenta.", "Entendo que esta solicitação não pode ser desfeita e que os dados da minha conta serão excluídos.", "I understand this request cannot be undone and that my account data will be deleted.")}</span></button>
      <button class="btn sec" type="submit">${L("Enviar solicitud de eliminación", "Enviar solicitação de exclusão", "Send deletion request")}</button>
    </form>
  </div>`;
}
function cookiesBanner() {
  if (vs.cookies) return "";
  return `<div class="cookies" role="dialog" aria-labelledby="ck-tit">
    <p id="ck-tit"><b>${L("Cookies y almacenamiento", "Cookies e armazenamento", "Cookies and storage")}.</b> ${L("Usamos el almacenamiento de tu navegador para que el sitio funcione (tu acceso y tu elección de cookies) y, si lo aceptás, para recordar el idioma. No usamos cookies de publicidad ni de terceros.", "Usamos o armazenamento do seu navegador para o site funcionar (seu acesso e sua escolha de cookies) e, se aceitar, para lembrar o idioma. Não usamos cookies de publicidade nem de terceiros.", "We use your browser's storage so the site works (your sign-in and your cookie choice) and, if you accept, to remember the language. We do not use advertising or third-party cookies.")}</p>
    <div class="acc"><button type="button" class="btn" data-a="ck-solo">${L("Solo necesarias", "Somente necessários", "Necessary only")}</button><button type="button" class="btn" data-a="ck-todas">${L("Aceptar todas", "Aceitar todos", "Accept all")}</button></div>
  </div>`;
}

/* ---------- Páginas legales (borrador en español) ---------- */
const PH = t => `<mark class="ph">[${t}]</mark>`;
function paginaLegal(etq, titulo, cuerpo) {
  return `<div class="titulo-pagina"><div class="etiqueta">${etq}</div><h1>${titulo}</h1></div>
  <div class="card legal">
    <p class="nota">${L("Borrador para revisión. Los datos entre [corchetes] se completan antes de publicar. Este texto legal está en español.", "Rascunho para revisão. Os dados entre [colchetes] são completados antes de publicar. Este texto legal está disponível apenas em espanhol por enquanto.", "Draft for review. Items in [brackets] are completed before publishing. This legal text is available in Spanish only for now.")}</p>
    ${cuerpo}
  </div>`;
}
function vPrivacidad() {
  return paginaLegal(L("Legal", "Legal", "Legal"), L("Política de privacidad", "Política de privacidade", "Privacy policy"), `
  <h2>1. Quién es responsable</h2>
  <p>Contacto: <a href="mailto:ancorvalan.a@gmail.com">ancorvalan.a@gmail.com</a>.</p>
  <h2>2. Qué datos recogemos</h2>
  <ul>
    <li><b>Correo electrónico</b>: para entrar a tu cuenta, registrar tu pedido de suscripción y responderte.</li>
    <li><b>Nombre o seudónimo</b>: solo si lo escribís. Es opcional.</li>
    <li><b>Textos que enviás</b> y el nombre o seudónimo con que los firmás.</li>
    <li><b>Datos de tu suscripción</b>: estado (pedida, confirmada o dada de baja) y fechas del pedido y de la confirmación.</li>
    <li><b>Confirmación de edad</b>. Si sos menor de 18 años, también el correo de tu madre, padre o tutor.</li>
    <li><b>Aceptaciones</b>: fecha en que aceptaste los términos y, si corresponde, el consentimiento de tu tutor.</li>
    <li><b>Preferencias de idioma y de cookies</b>, guardadas en tu navegador.</li>
  </ul>
  <p>No pedimos documento de identidad. No pedimos datos de tarjeta ni de ningún medio de pago: la suscripción es gratuita y no hay cobros.</p>
  <h2>3. Para qué los usamos</h2>
  <ul>
    <li>Crear y administrar tu cuenta, y registrar y confirmar tu suscripción gratuita.</li>
    <li>Responder tus consultas y avisarte sobre tu cuenta.</li>
    <li>Publicar un texto tuyo solo si lo enviaste para eso y aceptaste la publicación.</li>
    <li>Cumplir obligaciones legales, por ejemplo las fiscales.</li>
  </ul>
  <h2>4. Lo que no hacemos</h2>
  <ul>
    <li>No vendemos datos personales.</li>
    <li>No usamos publicidad ni cookies de terceros.</li>
    <li>No pedimos datos que no necesitamos para lo anterior.</li>
  </ul>
  <p>Este sitio no carga herramientas de terceros. ${PH("Confirmar al publicar: proveedor de alojamiento y qué registros técnicos guardan")}</p>
  <h2>5. Menores de 18 años</h2>
  <p>Para suscribirte siendo menor de 18 años necesitás el consentimiento de tu madre, padre o tutor. Usamos su correo solo para los avisos de tu suscripción. Si detectamos una suscripción de un menor sin ese consentimiento, la damos de baja y eliminamos sus datos. ${PH("política y base legal a confirmar: Código de la Niñez y la Adolescencia, Ley 1680/2001")}</p>
  <h2>6. Cuánto los guardamos</h2>
  <p>Mientras tu cuenta esté activa. Después, ${PH("PLAZO")} o hasta que pidas la eliminación, salvo los datos que debamos conservar por ley.</p>
  <h2>7. Tus derechos</h2>
  <p>Podés pedir acceso, corrección, eliminación u oposición, y retirar tu consentimiento. Para pedir la eliminación entrá a <a href="#cuenta">Mi cuenta</a> y usá “Pedir la eliminación de mis datos personales”. Si no tenés cuenta, escribí a <a href="mailto:ancorvalan.a@gmail.com">ancorvalan.a@gmail.com</a>.</p>
  <h2>8. Seguridad</h2>
  <p>${PH("Describir las medidas reales al publicar: acceso por enlace de un solo uso, conexión cifrada (HTTPS), control de acceso al área privada")}</p>
  <h2>9. Cambios en esta política</h2>
  <p>Si cambiamos esta política, lo avisamos en el sitio ${PH("medio a confirmar")}.</p>
  <h2>10. Ley aplicable</h2>
  <p>Paraguay, incluida la Ley N.º 1682/2001 de información de carácter privado y sus modificaciones. ${PH("revisar con abogado")}</p>`);
}
function vTerminos() {
  return paginaLegal(L("Legal", "Legal", "Legal"), L("Términos y condiciones", "Termos e condições", "Terms and conditions"), `
  <h2>1. Quiénes somos</h2>
  <p>Contacto: <a href="mailto:ancorvalan.a@gmail.com">ancorvalan.a@gmail.com</a>.</p>
  <h2>2. El servicio</h2>
  <p>Cartas del Mundo publica cada día una carta de noticias internacionales con las fuentes citadas. La suscripción es gratuita.</p>
  <h2>3. Cómo se suscribe</h2>
  <p>La suscripción se pide por correo a <a href="mailto:ancorvalan.a@gmail.com">ancorvalan.a@gmail.com</a>, desde <a href="#suscribirse">Suscribirse</a>. El pedido se confirma y tu cuenta pasa a estado “Activa”. Mientras tu pedido esté pendiente, no tenés acceso a la carta completa. ${PH("definir plazo de confirmación")}</p>
  <h2>4. Sin cobros</h2>
  <p>No hay planes, precios ni pagos. Nadie te cobra por la suscripción.</p>
  <h2>5. Baja</h2>
  <p>Podés darte de baja cuando quieras desde <a href="#cuenta">Mi cuenta</a>, con el botón “Darme de baja de la suscripción”. Dejás de tener acceso a la carta completa desde ese momento.</p>
  <h2>6. Textos que enviás</h2>
  <p>Al enviar un texto confirmás que es tuyo o que tenés permiso para compartirlo. Se lee antes de decidir si se publica. ${PH("definir: derechos sobre el texto, alcance de la autorización de publicación (nombre o seudónimo, plazo) y si podés retirarla")}</p>
  <h2>7. Contenido de la carta</h2>
  <p>Las noticias citan sus fuentes. Hacemos lo posible por que sean exactas, pero no garantizamos que estén completas. ${PH("definir procedimiento de corrección de errores")}</p>
  <h2>8. Uso aceptable</h2>
  <p>No se pueden enviar textos ilegales, que inciten al odio o a la violencia, ni que usen datos de terceros sin permiso. Podemos retirar textos que incumplan esto.</p>
  <h2>9. Edad</h2>
  <p>Para suscribirte tenés que tener 18 años o más, o contar con el consentimiento de tu madre, padre o tutor, como explica la Política de privacidad.</p>
  <h2>10. Responsabilidad</h2>
  <p>${PH("cláusula de limitación de responsabilidad a redactar con abogado")}</p>
  <h2>11. Ley aplicable y tribunales</h2>
  <p>Paraguay. ${PH("tribunales competentes a definir")}</p>
  <h2>12. Cambios</h2>
  <p>${PH("procedimiento de aviso de cambios a definir")}</p>`);
}
function vReembolso() {
  return paginaLegal(L("Legal", "Legal", "Legal"), L("Política de reembolsos", "Política de reembolso", "Refund policy"), `
  <h2>1. No hay cobros</h2>
  <p>La suscripción es gratuita. No se cobra ningún monto, así que no hay nada que reembolsar.</p>
  <h2>2. Si esto cambia</h2>
  <p>Si en el futuro la suscripción tuviera costo, esta política se actualizará antes de cualquier cobro, y ${PH("definir derechos de reembolso y de desistimiento para ese caso (Ley 1334/1998 de Defensa del Consumidor)")}.</p>
  <h2>3. Cómo consultar</h2>
  <p>Si tenés dudas, escribí a <a href="mailto:ancorvalan.a@gmail.com">ancorvalan.a@gmail.com</a> con el correo de tu cuenta.</p>`);
}
function vCookies() {
  return paginaLegal(L("Legal", "Legal", "Legal"), L("Política de cookies", "Política de cookies", "Cookie policy"), `
  <h2>1. Qué es</h2>
  <p>Son datos que un sitio guarda en tu navegador. En este sitio usamos el almacenamiento local del navegador (localStorage), que cumple la misma función técnica que una cookie.</p>
  <h2>2. Qué guardamos</h2>
  <div class="tabla-wrap"><table>
    <thead><tr><th>${L("Qué", "O quê", "What")}</th><th>${L("Tipo", "Tipo", "Type")}</th><th>${L("Para qué", "Para quê", "Purpose")}</th><th>${L("Cuánto dura", "Quanto tempo", "How long")}</th></tr></thead>
    <tbody>
      <tr><td>${L("Sesión de acceso", "Sessão de acesso", "Sign-in session")}</td><td>${L("Necesaria", "Necessário", "Necessary")}</td><td>${L("Mantener tu sesión iniciada", "Manter sua sessão iniciada", "Keep you signed in")}</td><td>${L("Hasta que cierres sesión", "Até você sair", "Until you log out")}</td></tr>
      <tr><td>${L("Elección de cookies", "Escolha de cookies", "Cookie choice")}</td><td>${L("Necesaria", "Necessário", "Necessary")}</td><td>${L("Recordar tu elección del aviso", "Lembrar sua escolha do aviso", "Remember your banner choice")}</td><td>${L("Hasta que la borres", "Até você apagar", "Until you delete it")}</td></tr>
      <tr><td>${L("Idioma", "Idioma", "Language")}</td><td>${L("Preferencia", "Preferência", "Preference")}</td><td>${L("Recordar el idioma elegido", "Lembrar o idioma escolhido", "Remember the chosen language")}</td><td>${L("Hasta que la borres. Solo si aceptaste todas", "Até você apagar. Só se aceitou todas", "Until you delete it. Only if you accepted all")}</td></tr>
    </tbody></table></div>
  <h2>3. Lo que no usamos</h2>
  <p>No usamos cookies de publicidad, de seguimiento ni de terceros. ${PH("confirmar al publicar: ningún script de terceros en el sitio")}</p>
  <h2>4. Cómo funciona el aviso</h2>
  <p>“Solo necesarias” guarda solo lo necesario. “Aceptar todas” también guarda la preferencia de idioma. Las dos opciones dan el mismo acceso al contenido.</p>
  <h2>5. Cómo borrarlas</h2>
  <p>Desde la configuración de tu navegador, borrando los datos de este sitio. Si borrás la sesión, tenés que volver a iniciarla.</p>
  <h2>6. Cambios</h2>
  <p>${PH("procedimiento de aviso de cambios a definir")}</p>`);
}

/* ---------- Vistas ---------- */
function vInicio() {
  return `
  <header class="banner">
    <img class="logo-banner" src="logo_crema.svg" alt="Logo Cartas del Mundo">
    <div class="titulo">Cartas del Mundo</div>
    <div class="bajada">${L("Noticias internacionales · Recupera tu criterio propio", "Notícias internacionais · Recupere o seu senso crítico", "International news · Recover your own judgment")}</div>
    <div class="linea"></div>
  </header>
  <div class="fila1">
    <section class="noticia-dia">
      <div class="etiqueta">${tr("noticiaDia")}</div>
      <h1>${esc(nw(C0(), "t"))}</h1>
      <p>${esc(nw(C0(), "porque"))}</p>
      <div class="fecha">${fmtLargo(fechaCarta())}</div>
      <a class="btn" href="#noticia">${L("Acceder a la noticia del día", "Acessar a notícia do dia", "Read the story of the day")}</a>
    </section>
    ${temaDia() ? `<section class="tema-home">
      <div class="etiqueta-t">${L("Tema del manifiesto o ensayo de hoy", "Tema do manifesto ou ensaio de hoje", "Today's manifesto or essay topic")}</div>
      <h2>${esc(temaDia().t)}</h2>
      <p>${L("Escribí un texto breve sobre este tema y enviálo desde la sección de abajo.", "Escreva um texto breve sobre este tema e envie pela seção abaixo.", "Write a short text on this topic and send it from the section below.")}</p>
      <a class="btn-claro" href="#compartir">${L("Enviar mi texto", "Enviar meu texto", "Send my text")}</a>
    </section>` : ""}
  </div>
  <section class="secciones-home">
    <div class="titulo-s">${L("Secciones de la carta", "Seções da carta", "Sections of the letter")}</div>
    <div class="grid-secc">
      ${SECCIONES.map(s => `<a class="sec-card" href="#archivo">${secT(s.t)}</a>`).join("")}
    </div>
  </section>
  <section class="quienes">
    <div class="foto"><img src="foto_anita_2.jpg" alt="Anita"></div>
    <div class="textos">
      <div class="bloque marron">
        <h2>${L("Quiénes somos", "Quem somos", "About us")}</h2>
        <p>${L("¡Holaaa! Soy Anita, paraguaya, y estudio Mediación Cultural con énfasis en Historia Social en la UNILA, en Foz de Iguazú, Brasil. Empecé la carrera en 2022. Historia Social es una rama que no se queda solo con los hechos históricos: estudia los contextos en los que esos hechos ocurren, como la vida cotidiana de las personas, las relaciones entre regiones y las condiciones económicas y culturales que los atraviesan. Participo en LALA (Latin American Leadership Academy) y me interesa estar al tanto de lo que pasa en el mundo, en Paraguay y, en especial, en Ciudad del Este.",
          "Oi! Sou a Anita, paraguaia, e estudo Mediação Cultural com ênfase em História Social na UNILA, em Foz do Iguaçu, Brasil. Comecei a faculdade em 2022. História Social é um campo que não se limita aos fatos históricos: estuda os contextos em que esses fatos acontecem, como a vida cotidiana das pessoas, as relações entre regiões e as condições econômicas e culturais que os atravessam. Participo da LALA (Latin American Leadership Academy) e me interessa estar por dentro do que acontece no mundo, no Paraguai e, em especial, em Ciudad del Este.",
          "Hi! I'm Anita, from Paraguay, and I study Cultural Mediation with an emphasis on Social History at UNILA, in Foz do Iguaçu, Brazil. I started the degree in 2022. Social History goes beyond historical facts: it studies the contexts in which those facts happen, such as everyday life, relations between regions and the economic and cultural conditions around them. I take part in LALA (Latin American Leadership Academy), and I care about keeping up with what happens in the world, in Paraguay and, especially, in Ciudad del Este.")}</p>
        <p class="ig">Instagram: @an_corvalan</p>
      </div>
      <div class="bloque terra">
        <h2>${L("¿Dónde nace Cartas del Mundo?", "De onde nasce o Cartas do Mundo?", "Where does Cartas del Mundo come from?")}</h2>
        <p>${L("Con tantas cosas que pasan en el mundo todos los días, es difícil mantenerse actualizada sobre lo que sucede en otros países, y también sobre el nuestro. Es fácil quedarse en una burbuja: leer siempre las mismas fuentes y ver solo lo que confirma lo que ya pensamos. Por eso nacen las Cartas del Mundo: para acercarnos, aunque sea un poco, a estar informad@s, mirar el mundo con una visión más amplia y formarnos una opinión propia, o por lo menos intentarlo.",
          "Com tanta coisa acontecendo no mundo todos os dias, é difícil acompanhar o que acontece em outros países e também no nosso. É fácil ficar numa bolha: ler sempre as mesmas fontes e ver só o que confirma o que já pensamos. Por isso nascem as Cartas do Mundo: para nos aproximar, mesmo que um pouco, de estar informad@s, olhar o mundo com uma visão mais ampla e formar uma opinião própria, ou pelo menos tentar.",
          "With so much happening in the world every day, it is hard to keep up with what goes on in other countries, and in our own. It is easy to stay in a bubble: always reading the same sources and seeing only what confirms what we already think. That is why Cartas del Mundo exists: to bring us a little closer to being informed, to look at the world with a wider view and to form our own opinion, or at least to try.")}</p>
      </div>
    </div>
  </section>
  <div class="gorila">🦍❤️</div>
  <section class="comparte">
    <div class="etiqueta">${L("Participá", "Participe", "Get involved")}</div>
    <h2>${L("¿Quieres compartir algo?", "Quer compartilhar algo?", "Want to share something?")}</h2>
    <p>${L("Si tenés una noticia, un artículo, un ensayo o un manifiesto que te gustaría publicar, mandanoslo. Lo revisamos y, si encaja, lo sumamos a la próxima publicación con tu nombre.", "Se você tem uma notícia, um artigo, um ensaio ou um manifesto que gostaria de publicar, mande para nós. Revisamos e, se encaixar, incluímos na próxima publicação com o seu nome.", "If you have a news story, an article, an essay or a manifesto you would like to publish, send it to us. We review it and, if it fits, we add it to the next publication under your name.")}</p>
    <div class="tipos">
      <div class="tipo"><b>${L("Noticia o artículo", "Notícia ou artigo", "News or article")}</b><span>${L("Una noticia internacional o un análisis breve con fuentes.", "Uma notícia internacional ou uma análise breve com fontes.", "An international news story or a short analysis with sources.")}</span></div>
      <div class="tipo"><b>${L("Ensayo", "Ensaio", "Essay")}</b><span>${L("Una reflexión más extensa sobre un tema del mundo.", "Uma reflexão mais longa sobre um tema do mundo.", "A longer reflection on a topic from the world.")}</span></div>
      <div class="tipo"><b>${L("Manifiesto", "Manifesto", "Manifesto")}</b><span>${L("Un texto corto que defienda una idea o una postura propia.", "Um texto curto que defenda uma ideia ou uma posição própria.", "A short text that defends an idea or a personal stance.")}</span></div>
    </div>
    <a class="btn" href="#compartir" style="margin-top:24px">${L("Publica tu manifiesto, ensayo o artículo", "Publique seu manifesto, ensaio ou artigo", "Publish your manifesto, essay or article")}</a>
  </section>
  <div class="pie-banner">
    <span>${L("Leé todas las noticias del día, el archivo y el análisis de cada carta.", "Leia todas as notícias do dia, o arquivo e a análise de cada carta.", "Read all of the day's stories, the archive and the analysis of every letter.")}</span>
    <a class="btn-sec" href="#archivo">${L("Ver archivo", "Ver arquivo", "View archive")}</a>
  </div>`;
}

function listaArchivo() {
  const q = vs.q.trim().toLowerCase();
  const items = cartasVisibles().filter(c => (vs.sec === "todas" || c.s.includes(vs.sec)) && (!q || archT(c).toLowerCase().includes(q)));
  if (!items.length) return `<p class="vacio">${L("No hay cartas que coincidan con la búsqueda.", "Nenhuma carta corresponde à busca.", "No letters match your search.")}</p>`;
  let h = "", anio = "";
  for (const c of items) {
    const mes = new Date(c.f + "T12:00:00").toLocaleDateString(LOC[vs.lang] || "es-PY", { month: "long", year: "numeric" });
    if (mes !== anio) { anio = mes; h += `<div class="anio">${esc(mes)}</div>`; }
    const libre = esLibre(c.f);
    const temas = c.s.map(id => secT(SECCIONES.find(x => x.id === id).t)).join(" · ");
    h += `<a class="carta-fila ${libre ? "libre" : ""}" href="#carta" data-a="verCarta" data-m="${c.f}" data-libre="${libre ? 1 : 0}">
      <div class="fechaf">${esc(fmtCorto(c.f))}</div>
      <div class="info"><h3>${esc(archT(c))}</h3><div class="temas">${temas}</div></div>
      <span class="etq ${libre ? "libre" : ""}">${libre ? L("Libre", "Livre", "Free") : L("Suscriptores", "Assinantes", "Subscribers")}</span></a>`;
  }
  return h;
}
function archT(c) {
  if (vs.lang === "es") return c.t;
  return (c.tl && c.tl[vs.lang]) || c.t;
}

function vArchivo() {
  return `
  <div class="titulo-pagina">
    <h1>${L("Archivo", "Arquivo", "Archive")}</h1>
    <p>${L("Todas las cartas publicadas, ordenadas por fecha. Las de los últimos 7 días son libres; el resto es para suscriptores.", "Todas as cartas publicadas, em ordem de data. As dos últimos 7 dias são livres; as demais são para assinantes.", "All published letters, sorted by date. Those from the last 7 days are free; the rest are for subscribers.")}</p>
  </div>
  <div class="buscador"><input type="text" id="q-archivo" placeholder="${L("Buscar por palabra clave, país o título", "Buscar por palavra-chave, país ou título", "Search by keyword, country or title")}" value="${esc(vs.q)}"></div>
  <div class="chips">
    <button class="chip ${vs.sec === "todas" ? "sel" : ""}" data-a="sec" data-m="todas">${L("Todas las secciones", "Todas as seções", "All sections")}</button>
    ${SECCIONES.map(s => `<button class="chip ${vs.sec === s.id ? "sel" : ""}" data-a="sec" data-m="${s.id}">${secT(s.t)}</button>`).join("")}
  </div>
  <div id="lista-archivo">${listaArchivo()}</div>
  <div class="banner-verde">
    <p>${L("Con la suscripción tenés acceso a todo el archivo, desde la primera carta publicada.", "Com a assinatura você tem acesso a todo o arquivo, desde a primeira carta publicada.", "With the subscription you have access to the whole archive, from the first letter published.")}</p>
    <a class="btn" href="#suscribirse" data-a="pop">${tr("suscribirme")} · ${desdeTxt()}</a>
  </div>`;
}

function vQuienes() {
  return `
  <div class="titulo-pagina">
    <div class="etiqueta">${L("Sobre el proyecto", "Sobre o projeto", "About the project")}</div>
    <h1>${L("Quiénes somos", "Quem somos", "About us")}</h1>
  </div>
  <section class="pag-quienes">
    <div style="width:400px;max-width:100%;flex-shrink:0;border-radius:16px;overflow:hidden;position:relative;min-height:380px;background:var(--marron);"><img src="foto_anita_2.jpg" alt="Anita" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:72% 40%;"></div>
    <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:18px;">
      <div class="bloque marron">
        <h2>${L("Hola, soy Anita", "Oi, eu sou a Anita", "Hi, I'm Anita")}</h2>
        <p>${L("¡Holaaa! Soy Anita, paraguaya, y estudio Mediación Cultural con énfasis en Historia Social en la UNILA, en Foz de Iguazú, Brasil. Empecé la carrera en 2022. Historia Social es una rama que no se queda solo con los hechos históricos: estudia los contextos en los que esos hechos ocurren, como la vida cotidiana de las personas, las relaciones entre regiones y las condiciones económicas y culturales que los atraviesan. Participo en LALA (Latin American Leadership Academy) y me interesa estar al tanto de lo que pasa en el mundo, en Paraguay y, en especial, en Ciudad del Este.",
          "Oi! Sou a Anita, paraguaia, e estudo Mediação Cultural com ênfase em História Social na UNILA, em Foz do Iguaçu, Brasil. Comecei a faculdade em 2022. História Social é um campo que não se limita aos fatos históricos: estuda os contextos em que esses fatos acontecem, como a vida cotidiana das pessoas, as relações entre regiões e as condições econômicas e culturais que os atravessam. Participo da LALA (Latin American Leadership Academy) e me interessa estar por dentro do que acontece no mundo, no Paraguai e, em especial, em Ciudad del Este.",
          "Hi! I'm Anita, from Paraguay, and I study Cultural Mediation with an emphasis on Social History at UNILA, in Foz do Iguaçu, Brazil. I started the degree in 2022. Social History goes beyond historical facts: it studies the contexts in which those facts happen, such as everyday life, relations between regions and the economic and cultural conditions around them. I take part in LALA (Latin American Leadership Academy), and I care about keeping up with what happens in the world, in Paraguay and, especially, in Ciudad del Este.")}</p>
        <p class="ig">Instagram: @an_corvalan</p>
      </div>
      <div class="bloque terra">
        <h2>${L("¿Dónde nace Cartas del Mundo?", "De onde nasce o Cartas do Mundo?", "Where does Cartas del Mundo come from?")}</h2>
        <p>${L("Con tantas cosas que pasan en el mundo todos los días, es difícil mantenerse actualizada sobre lo que sucede en otros países, y también sobre el nuestro. Es fácil quedarse en una burbuja: leer siempre las mismas fuentes y ver solo lo que confirma lo que ya pensamos. Por eso nacen las Cartas del Mundo: para acercarnos, aunque sea un poco, a estar informad@s, mirar el mundo con una visión más amplia y formarnos una opinión propia, o por lo menos intentarlo.",
          "Com tanta coisa acontecendo no mundo todos os dias, é difícil acompanhar o que acontece em outros países e também no nosso. É fácil ficar numa bolha: ler sempre as mesmas fontes e ver só o que confirma o que já pensamos. Por isso nascem as Cartas do Mundo: para nos aproximar, mesmo que um pouco, de estar informad@s, olhar o mundo com uma visão mais ampla e formar uma opinião própria, ou pelo menos tentar.",
          "With so much happening in the world every day, it is hard to keep up with what goes on in other countries, and in our own. It is easy to stay in a bubble: always reading the same sources and seeing only what confirms what we already think. That is why Cartas del Mundo exists: to bring us a little closer to being informed, to look at the world with a wider view and to form our own opinion, or at least to try.")}</p>
      </div>
    </div>
  </section>
  <section class="mision">
    <div class="etiqueta">${L("Misión y valor", "Missão e valor", "Mission and value")}</div>
    <h2>${L("Por qué importa esta plataforma", "Por que esta plataforma importa", "Why this platform matters")}</h2>
    <div class="valores">
      <div class="valor"><h3>${L("Misión", "Missão", "Mission")}</h3><p>${L("Que las personas jóvenes no solo se enteren de lo que pasa en el mundo, sino que entiendan por qué importa.", "Que as pessoas jovens não apenas fiquem sabendo do que acontece no mundo, mas entendam por que isso importa.", "That young people not only learn what is happening in the world, but understand why it matters.")}</p></div>
      <div class="valor"><h3>${L("Valor", "Valor", "Value")}</h3><p>${L("Una carta diaria con noticias internacionales de fuentes distintas, con una explicación breve de cada una y criterio propio.", "Uma carta diária com notícias internacionais de fontes diferentes, com uma explicação breve de cada uma e critério próprio.", "A daily letter with international news from different sources, with a short explanation of each story and your own judgment.")}</p></div>
      <div class="valor"><h3>${L("Comunidad", "Comunidade", "Community")}</h3><p>${L("Con Cartas al Mundo, las suscriptoras publican sus escritos para que otras personas los lean, con nombre o de forma anónima.", "Com Cartas ao Mundo, as assinantes publicam seus textos para que outras pessoas os leiam, com nome ou de forma anônima.", "With Letters to the World, subscribers publish their writing for other people to read, under their name or anonymously.")}</p></div>
    </div>
  </section>
  <section class="contacto-box">
    <div class="etiqueta">${tr("contacto")}</div>
    <h3>${L("¿Hablamos?", "Vamos conversar?", "Let's talk?")}</h3>
    <div class="fila"><div><b>Instagram:</b> @an_corvalan</div><div><b>${L("Proyecto", "Projeto", "Project")}:</b> Cartas del Mundo</div></div>
    <a class="btn" href="#contacto" style="margin-top:18px">${L("Escribinos desde Contacto", "Escreva para nós pelo Contato", "Write to us from Contact")}</a>
  </section>`;
}

function vContacto() {
  const motivos = [["Suscripción", L("Suscripción", "Assinatura", "Subscription")], ["Sugerencia", L("Sugerencia", "Sugestão", "Suggestion")], ["Otro", L("Otro", "Outro", "Other")]];
  return `
  <div class="titulo-pagina">
    <h1>${tr("contacto")}</h1>
    <p>${L("¿Tenés una pregunta sobre la suscripción, una noticia que deberíamos mirar o una sugerencia? Escribinos.", "Tem uma pergunta sobre a assinatura, uma notícia que deveríamos olhar ou uma sugestão? Escreva para nós.", "Do you have a question about the subscription, a story we should look at or a suggestion? Write to us.")}</p>
  </div>
  ${flashHTML("contacto")}
  <div class="grid-form">
    <form class="form-box" id="f-contacto">
      <h2>${L("Escribinos", "Escreva para nós", "Write to us")}</h2>
      <label for="c-nombre">${L("Tu nombre (opcional)", "Seu nome (opcional)", "Your name (optional)")}</label>
      <input type="text" id="c-nombre" name="nombre">
      <label for="c-correo">${L("Correo electrónico", "E-mail", "Email")}</label>
      <input type="email" id="c-correo" name="correo" required>
      <label>${L("¿Qué necesitás?", "O que você precisa?", "What do you need?")}</label>
      <div class="chips">${motivos.map(([m, etq]) => `<button type="button" class="chip ${vs.motivo === m ? "sel" : ""}" data-a="motivo" data-m="${m}">${etq}</button>`).join("")}</div>
      <label for="c-msg">${L("Mensaje", "Mensagem", "Message")}</label>
      <textarea id="c-msg" name="mensaje" required></textarea>
      <button class="btn" type="submit">${L("Enviar mensaje", "Enviar mensagem", "Send message")}</button>
    </form>
    <div class="lateral">
      <div class="bloque marron"><h3>${L("Preguntas frecuentes", "Perguntas frequentes", "Frequently asked questions")}</h3>
        <p>${L("¿Cómo cancelo? Desde tu cuenta, en cualquier momento, sin llamar a nadie.", "Como cancelo? Pela sua conta, a qualquer momento, sem precisar ligar para ninguém.", "How do I cancel? From your account, at any time, without calling anyone.")}</p>
        <p>${L("¿Cuánto cuesta? Nada: la suscripción es gratuita. Se pide y se confirma por correo.", "Quanto custa? Nada: a assinatura é gratuita. Pede-se e confirma-se por e-mail.", "How much does it cost? Nothing: the subscription is free. It is requested and confirmed by email.")}</p></div>
      <div class="bloque terra"><h3>${L("Tiempo de respuesta", "Tempo de resposta", "Response time")}</h3><p>${L("Respondemos por correo. Plazo: [a confirmar].", "Respondemos por e-mail. Prazo: [a confirmar].", "We reply by email. Timeframe: [to be confirmed].")}</p></div>
      <div class="dato">${L("Para pedir la suscripción o preguntar por tu pedido, escribí con el asunto \"Suscripción\" y el correo de tu cuenta.", "Para pedir a assinatura ou perguntar sobre o seu pedido, escreva com o assunto \"Assinatura\" e o e-mail da sua conta.", "To request the subscription or ask about your request, write with the subject \"Subscription\" and your account email.")}</div>
    </div>
  </div>`;
}

function vCompartir() {
  const tipos = [["Noticia o artículo", L("Noticia o artículo", "Notícia ou artigo", "News or article")], ["Ensayo", L("Ensayo", "Ensaio", "Essay")], ["Manifiesto", L("Manifiesto", "Manifesto", "Manifesto")]];
  const tipoCaja = (b, t) => `<div class="tipo" style="background:var(--verde);color:var(--crema-lima);border-radius:14px;padding:18px 20px;flex:1;min-width:180px"><b style="font-family:Georgia,serif;font-weight:normal;font-size:20px;display:block;margin-bottom:6px">${b}</b><span style="font-size:14px;color:#dfe3c4">${t}</span></div>`;
  return `
  <div class="titulo-pagina">
    <div class="etiqueta">${L("Participá", "Participe", "Get involved")}</div>
    <h1>${L("¿Quieres compartir algo?", "Quer compartilhar algo?", "Want to share something?")}</h1>
    <p>${L("Si tenés una noticia, un artículo, un ensayo o un manifiesto que te gustaría publicar, mandanoslo. Lo revisamos y, si encaja, lo sumamos a la próxima publicación con tu nombre.", "Se você tem uma notícia, um artigo, um ensaio ou um manifesto que gostaria de publicar, mande para nós. Revisamos e, se encaixar, incluímos na próxima publicação com o seu nome.", "If you have a news story, an article, an essay or a manifesto you would like to publish, send it to us. We review it and, if it fits, we add it to the next publication under your name.")}</p>
  </div>
  <div class="tipos" style="margin-top:30px">
    ${tipoCaja(L("Noticia o artículo", "Notícia ou artigo", "News or article"), L("Una noticia internacional o un análisis breve con fuentes.", "Uma notícia internacional ou uma análise breve com fontes.", "An international news story or a short analysis with sources."))}
    ${tipoCaja(L("Ensayo", "Ensaio", "Essay"), L("Una reflexión más extensa sobre un tema del mundo.", "Uma reflexão mais longa sobre um tema do mundo.", "A longer reflection on a topic from the world."))}
    ${tipoCaja(L("Manifiesto", "Manifesto", "Manifesto"), L("Un texto corto que defienda una idea o una postura propia.", "Um texto curto que defenda uma ideia ou uma posição própria.", "A short text that defends an idea or a personal stance."))}
  </div>
  ${flashHTML("compartir")}
  <form class="compartir-form" id="f-compartir">
    <div class="fila-campos">
      <div><label for="s-nombre">${L("Tu nombre o seudónimo (opcional)", "Seu nome ou pseudônimo (opcional)", "Your name or pen name (optional)")}</label><input type="text" id="s-nombre" placeholder="${L("Nombre o seudónimo", "Nome ou pseudônimo", "Name or pen name")}"></div>
      <div><label for="s-correo">${L("Tu correo", "Seu e-mail", "Your email")}</label><input type="email" id="s-correo" placeholder="correo@ejemplo.com" required></div>
    </div>
    <label>${L("¿Qué querés enviar?", "O que você quer enviar?", "What would you like to send?")}</label>
    <div class="chips">${tipos.map(([t, etq]) => `<button type="button" class="chip ${vs.tipo === t ? "sel" : ""}" data-a="tipo" data-m="${t}">${etq}</button>`).join("")}</div>
    <label for="s-titulo">${L("Título", "Título", "Title")}</label>
    <input type="text" id="s-titulo" placeholder="${L("Título de tu texto", "Título do seu texto", "Title of your text")}">
    <label for="s-texto">${L("Texto o enlace a la fuente", "Texto ou link para a fonte", "Text or link to the source")}</label>
    <textarea id="s-texto" placeholder="${L("Pegá tu texto aquí o el enlace a la noticia", "Cole seu texto aqui ou o link da notícia", "Paste your text here or the link to the story")}" required></textarea>
    <button type="button" class="check" data-a="consent" aria-pressed="${vs.consent}"><span class="caja ${vs.consent ? "on" : ""}"></span><span>${L("Confirmo que el texto es mío o que tengo permiso para compartirlo, y acepto que se publique con mi nombre o seudónimo.", "Confirmo que o texto é meu ou que tenho permissão para compartilhá-lo, e aceito que seja publicado com meu nome ou pseudônimo.", "I confirm that the text is mine or that I have permission to share it, and I agree that it may be published under my name or pen name.")}</span></button>
    <button class="btn" type="submit">${L("Enviar propuesta", "Enviar proposta", "Send proposal")}</button>
    <div class="aviso">${L("Tu envío llega a un correo privado del proyecto y no se publica automáticamente. Solo usamos tus datos para responderte sobre tu propuesta.", "Seu envio chega a um e-mail privado do projeto e não é publicado automaticamente. Usamos seus dados apenas para responder sobre sua proposta.", "Your submission goes to a private project inbox and is not published automatically. We only use your details to reply about your proposal.")}</div>
  </form>`;
}

function vCarta() {
  const todas = st.cartaCompleta;
  let h = `
  ${sesionBarra()}
  ${flashHTML("carta")}
  <header class="carta-cab">
    <div class="titulo">Cartas del Mundo</div>
    <div class="bajada">${todas ? tr("completa") : tr("vistaPrevia")}</div>
    <div class="fechac">${fmtLargo(fechaCarta())}</div>
    <div class="linea"></div>
  </header>`;
  const secs = [...new Set(CARTA.map(n => n.sec))];
  secs.forEach(sec => {
    h += `<section class="seccion"><h2>${secT(sec)}</h2>`;
    CARTA.filter(n => n.sec === sec).forEach(n => {
      const bloq = !todas && n !== C0();
      h += `<article class="noticia ${bloq ? "bloq" : ""}"><h3>${esc(nw(n, "t"))}</h3>${bloq ? "" : `${nw(n, "p") ? `<p>${esc(nw(n, "p"))}</p>` : ""}<div class="porque"><b>${tr("porQue")}</b>${esc(nw(n, "porque"))}</div><div class="fuentes">${tr("fuentes")}: ${esc(n.fuentes)}</div>`}</article>`;
    });
    h += `</section>`;
  });
  if (!todas) h += `<div class="muro"><h3>${tr("muroTit")}</h3><p>${tr("muroTxt")}</p><a class="btn" href="#suscribirse" data-a="pop">${tr("suscribirme")}</a></div>`;
  const tema = temaDia();
  if (tema) {
    h += `
  <section class="tema">
    <div class="etiqueta">${tr("temaEt")}</div>
    <h2>${esc(tema.t)}</h2>
    ${tema.p ? `<p>${esc(tema.p)}</p>` : ""}
    <ul>${(tema.preguntas || []).map(q => `<li>${esc(q)}</li>`).join("")}</ul>
    ${(tema.seguir || []).length ? `<p><b>${L("Para seguir mirando", "Para seguir olhando", "Keep an eye on")}</b></p><ul>${tema.seguir.map(s => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}
    <p>${tr("temaTxt")}</p>
  </section>`;
  }
  if (ACCESO()) {
    h += `<section class="envio"><h3>${tr("envioTit")}</h3>
      <form id="f-envio">
        <div class="fila-campos"><div><label for="e-nombre">${tr("nombre")}</label><input type="text" id="e-nombre"></div>
        <div><label for="e-correo">${tr("correo")}</label><input type="email" id="e-correo" value="${esc(st.sesion || "")}" required></div></div>
        <label for="e-texto">${tr("texto")}</label><textarea id="e-texto" placeholder="${tr("pegaAqui")}" required></textarea>
        <button class="btn" type="submit">${tr("enviarAnita")}</button>
        <div class="aviso">${tr("avisoEnvio")}</div>
      </form></section>`;
  } else {
    h += `<div class="muro"><h3>${tr("envioMuroTit")}</h3><p>${tr("envioMuroTxt")}</p><a class="btn" href="#suscribirse" data-a="pop">${tr("suscribirme")}</a></div>`;
  }
  h += `
  <div class="cierre">
    <p>${tr("cierreTxt")}</p>
    <a class="btn-sec" href="#archivo" style="color:var(--crema-lima);border-color:var(--crema-lima)">${tr("archivoCartas")}</a>
  </div>
  <div class="acciones">
    <button class="btn" data-a="copiar">${tr("compartirCarta")}</button>
    <a class="btn sec" href="#compartir">${tr("enviarPropuesta")}</a>
  </div>`;
  return h;
}

function vNoticia() {
  const full = st.cartaCompleta;
  return `
  ${sesionBarra()}
  ${flashHTML("noticia")}
  <header style="margin-top:34px">
    <div class="etiqueta">${tr("noticiaDia")}</div>
    <h1>${esc(nw(C0(), "t"))}</h1>
    <div class="fecha">${fmtLargo(fechaCarta())}</div>
  </header>
  <article class="noticia" style="border-left:8px solid var(--terracota);padding:34px 40px;margin-top:24px">
    <h2 style="font-size:28px;margin-bottom:14px;color:var(--carbon)">${esc(nw(C0(), "t"))}</h2>
    
    ${full ? `
      ${nw(C0(), "p") ? `<p>${esc(nw(C0(), "p"))}</p>` : ""}<div class="porque"><b>${tr("porQue")}</b>${esc(nw(C0(), "porque"))}</div>
      <div class="fuentes">${tr("fuentes")}: ${esc(C0().fuentes)}</div>` : `<div class="muro" style="margin-top:14px"><h3>${tr("muroNoticiaTit")}</h3><p>${tr("muroNoticiaTxt")}</p><a class="btn" href="#suscribirse" data-a="pop">${tr("suscribirme")} · ${desdeTxt()}</a></div>`}
  </article>
  ${full ? `<section class="mas" style="margin-top:36px"><div class="etiqueta">${tr("masCarta")}</div>${CARTA.slice(1, 4).map(n => `<div class="noticia"><h3 style="font-size:19px">${esc(nw(n, "t"))}</h3><div class="fuentes">${esc(secT(n.sec))}</div></div>`).join("")}</section>` : ""}
  <div class="acciones">
    <a class="btn" href="#carta">${tr("verCarta")}</a>
    <a class="btn-sec" href="#archivo">${tr("archivoAnteriores")}</a>
  </div>`;
}

function vCartasMundo() {
  return `
  <section class="hero-cm">
    <span class="badge">${L("Próximamente", "Em breve", "Coming soon")}</span>
    <h1>Cartas al Mundo</h1>
    <p>${L("El espacio donde las suscriptoras publican sus ensayos, escritos y manifiestos para que otras personas los lean. Cada texto puede salir con tu nombre o de forma anónima.", "O espaço onde as assinantes publicam seus ensaios, escritos e manifestos para que outras pessoas leiam. Cada texto pode sair com o seu nome ou de forma anônima.", "The space where subscribers publish their essays, writing and manifestos for other people to read. Each text can be published under your name or anonymously.")}</p>
  </section>
  ${flashHTML("cartas-al-mundo")}
  <section class="opciones">
    <div class="opcion"><h2>${L("Con autoría", "Com autoria", "With authorship")}</h2><p>${L("Tu nombre o seudónimo aparece junto al texto, con una breve bio si quieres agregarla.", "Seu nome ou pseudônimo aparece junto ao texto, com uma breve bio se quiser incluí-la.", "Your name or pen name appears with the text, with a short bio if you want to add one.")}</p><div class="firma">${L("Ejemplo: \"por Nombre Apellido\"", "Exemplo: \"por Nome Sobrenome\"", "Example: \"by First Last\"")}</div></div>
    <div class="opcion"><h2>${L("Anónimo", "Anônimo", "Anonymous")}</h2><p>${L("El texto se publica sin nombre visible. El equipo conoce a la autora solo para revisar el envío.", "O texto é publicado sem nome visível. A equipe conhece a autora apenas para revisar o envio.", "The text is published with no visible name. The team knows the author only to review the submission.")}</p><div class="firma">${L("Ejemplo: \"por una suscriptora\"", "Exemplo: \"por uma assinante\"", "Example: \"by a subscriber\"")}</div></div>
  </section>
  <div class="seccion" style="margin-top:44px"><h2>${L("Lo que se va a publicar", "O que será publicado", "What will be published")}</h2></div>
  <section class="grid-pronto">
    <div class="tarjeta"><div class="tipo">${L("Ensayo", "Ensaio", "Essay")}</div><h3>${L("Título de un ensayo", "Título de um ensaio", "Title of an essay")}</h3><div class="autor">${L("por Nombre o seudónimo", "por Nome ou pseudônimo", "by Name or pen name")}</div><div class="proximo">${L("Próximamente", "Em breve", "Coming soon")}</div></div>
    <div class="tarjeta"><div class="tipo">${L("Manifiesto", "Manifesto", "Manifesto")}</div><h3>${L("Título de un manifiesto", "Título de um manifesto", "Title of a manifesto")}</h3><div class="autor">${L("por una suscriptora", "por uma assinante", "by a subscriber")}</div><div class="proximo">${L("Próximamente", "Em breve", "Coming soon")}</div></div>
    <div class="tarjeta"><div class="tipo">${L("Escrito", "Escrito", "Writing")}</div><h3>${L("Título de un escrito", "Título de um escrito", "Title of a piece of writing")}</h3><div class="autor">${L("por Nombre o seudónimo", "por Nome ou pseudônimo", "by Name or pen name")}</div><div class="proximo">${L("Próximamente", "Em breve", "Coming soon")}</div></div>
  </section>
  <div class="normas"><b>${L("Cómo funciona:", "Como funciona:", "How it works:")}</b> ${L("solo pueden publicar suscriptoras activas. Cada texto se revisa antes de decidir si se publica. Los derechos sobre los textos enviados se regulan en los términos y condiciones.", "só podem publicar assinantes ativas. Cada texto é revisado antes de decidir se será publicado. Os direitos sobre os textos enviados seguem os termos e condições.", "only active subscribers can publish. Each text is reviewed before deciding whether to publish it. Rights over submitted texts follow the terms and conditions.")}</div>`;
}

function vSuscribirse() {
  if (st.sesion) {
    return `
    <div class="titulo-pagina"><div class="etiqueta">${L("Suscripción", "Assinatura", "Subscription")}</div><h1>${L("Tu suscripción", "Sua assinatura", "Your subscription")}</h1></div>
    ${flashHTML("suscribirse")}
    <div class="card">
      <h2>${esc(st.sesion)}</h2>
      ${st.subs[st.sesion] ? badge(st.subs[st.sesion]) : `<span class="estado-pill e-vencido">${L("Sin suscripción", "Sem assinatura", "No subscription")}</span>`}
      ${bloqueCuenta()}
      <div><button class="link" data-a="salir">${L("Salir", "Sair", "Log out")}</button></div>
    </div>
    <div class="acciones"><a class="btn sec" href="#carta">${L("Ver la carta de hoy", "Ver a carta de hoje", "See today's letter")}</a><a class="btn sec" href="#archivo">${L("Ir al archivo", "Ir ao arquivo", "Go to the archive")}</a></div>`;
  }
  if (st.pendiente) {
    return `
    <div class="titulo-pagina"><div class="etiqueta">${L("Entrá a tu cuenta", "Entre na sua conta", "Log in to your account")}</div><h1>${L("Revisá tu correo", "Confira seu e-mail", "Check your email")}</h1></div>
    <div class="card">
      <h2>${L("Enlace enviado", "Link enviado", "Link sent")}</h2>
      <p>${L("Mandamos un enlace de acceso a", "Enviamos um link de acesso para", "We sent an access link to")} <b>${esc(st.pendiente)}</b>.</p>
      <p class="nota">${L("Escribí aquí el código de 6 números que llegó al correo, o abrí el enlace desde este mismo navegador.", "Escreva aqui o código de 6 números que chegou ao e-mail, ou abra o link neste mesmo navegador.", "Type the 6-digit code from the email here, or open the link from this same browser.")}</p>
      ${formCodigo()}
    </div>`;
  }
  return `
  <div class="titulo-pagina">
    <div class="etiqueta">${tr("suscribirme")}</div>
    <h1>${L("Suscribite a Cartas del Mundo", "Assine o Cartas do Mundo", "Subscribe to Cartas del Mundo")}</h1>
    <p>${L("La suscripción es gratuita. Completás tus datos y entrás al instante a la carta completa, el archivo de noticias pasadas y el envío de tus textos.", "A assinatura é gratuita. Você preenche seus dados e entra na hora na carta completa, no arquivo de notícias passadas e no envio dos seus textos.", "The subscription is free. You fill in your details and get instant access to the full letter, the archive of past stories and sending your texts.")}</p>
  </div>
  ${flashHTML("suscribirse")}
  <div class="grid2" style="margin-top:30px">
    <form class="card" id="f-login" style="margin:0">
      <h2>${L("Entrá a tu cuenta", "Entre na sua conta", "Log in to your account")}</h2>
      <p class="nota">${L("Te enviamos un enlace al correo. No hace falta contraseña.", "Enviamos um link para o seu e-mail. Não é preciso senha.", "We send you a link by email. No password needed.")}</p>
      <label for="in-mail">${L("Tu correo", "Seu e-mail", "Your email")}</label>
      <input type="email" id="in-mail" placeholder="tu@correo.com" required>
      ${camposAlta()}
      <button class="btn" type="submit">${L("Enviar enlace de acceso", "Enviar link de acesso", "Send access link")}</button>
    </form>
    <div class="card" style="margin:0">
      <div class="etiqueta">${L("Gratis", "Grátis", "Free")}</div>
      <h2>${L("Cómo se registra", "Como se registra", "How you sign up")}</h2>
      ${notaPrecio()}
    </div>
  </div>
  <div class="pasos">
    <div><b>1. ${L("Tu correo", "Seu e-mail", "Your email")}</b>${L("Entrás con un enlace, sin contraseña.", "Você entra com um link, sem senha.", "You log in with a link, no password.")}</div>
    <div><b>2. ${L("Completar tus datos", "Preencher seus dados", "Fill in your details")}</b>${L("Nombre, apellido y celular. Acceso al instante.", "Nome, sobrenome e celular. Acesso imediato.", "Name, last name and mobile. Instant access.")}</div>
    <div><b>3. ${L("Leés todo", "Lê tudo", "Read everything")}</b>${L("Carta completa, archivo y envío de textos.", "Carta completa, arquivo e envio de textos.", "Full letter, archive and sending texts.")}</div>
  </div>`;
}

function vCuenta() {
  if (!st.sesion) {
    return `<div class="titulo-pagina"><h1>${tr("miCuenta")}</h1><p>${L("Para ver tu cuenta tenés que iniciar sesión.", "Para ver sua conta, você precisa entrar.", "To see your account you need to log in.")}</p></div>
      <a class="btn" href="#suscribirse">${tr("ingresar")}</a>`;
  }
  return `
  <div class="titulo-pagina"><div class="etiqueta">${tr("miCuenta")}</div><h1>${L("Tu suscripción", "Sua assinatura", "Your subscription")}</h1></div>
  ${flashHTML("cuenta")}
  <div class="card">
    <h2>${esc(st.sesion)}</h2>
    ${st.subs[st.sesion] ? badge(st.subs[st.sesion]) : `<span class="estado-pill e-vencido">${L("Sin suscripción", "Sem assinatura", "No subscription")}</span>`}
    ${bloqueCuenta()}
    <div><button class="link" data-a="salir">${L("Salir", "Sair", "Log out")}</button></div>
  </div>
  ${solicitudEliminar()}
  <div class="acciones"><a class="btn sec" href="#carta">${L("Ver la carta de hoy", "Ver a carta de hoje", "See today's letter")}</a><a class="btn sec" href="#archivo">${L("Ir al archivo", "Ir ao arquivo", "Go to the archive")}</a></div>`;
}

/* ---------- Gestión privada (solo la administradora) ---------- */
function campo(id) { const el = document.getElementById(id); return el ? el.value.trim() : ""; }
function cartasVisibles() { return ARCHIVO; }
function msgTipo(m) { return m.tabla + "/" + m.id; }
function parseRef(m) { const i = m.indexOf("|"); return { tipo: m.slice(0, i), ref: m.slice(i + 1) }; }
function confirmBtn(tipo, ref) {
  const c = st.confirmar;
  if (c && c.tipo === tipo && c.ref === ref) {
    return `<span class="acc-tabla"><button class="btn peligro chico" data-a="eliminar-ok" data-m="${esc(tipo)}|${esc(ref)}">${L("Sí, eliminar", "Sim, excluir", "Yes, delete")}</button><button class="btn sec chico" data-a="eliminar-no">${L("No", "Não", "No")}</button></span>`;
  }
  return `<button class="btn peligro chico" data-a="eliminar-pedir" data-m="${esc(tipo)}|${esc(ref)}">${L("Eliminar", "Excluir", "Delete")}</button>`;
}
function vGestion() {
  if (!st.admin) {
    return `
    <div class="titulo-pagina"><div class="etiqueta">${L("Área privada", "Área privada", "Private area")}</div><h1>${L("Gestión", "Gestão", "Management")}</h1>
      <p>${L("Solo puede entrar la administradora, con su correo de administración y un enlace de un solo uso.", "Só a administradora pode entrar, com o e-mail de administração e um link de uso único.", "Only the administrator can enter, with the admin email and a single-use link.")}</p></div>
    ${flashHTML("gestion")}
    <div class="card" style="max-width:520px">
      ${st.sesion
        ? `<p>${L("Estás conectada con otra cuenta.", "Você está conectada com outra conta.", "You are signed in with another account.")}</p><button class="btn" data-a="gestion-salir">${L("Salir", "Sair", "Log out")}</button>`
        : `<a class="btn" href="#suscribirse">${tr("ingresar")}</a>`}
    </div>`;
  }
  const sinLeer = st.mensajes.filter(m => !m.leido).length;
  const tabs = [["resumen", L("Resumen", "Resumo", "Summary")], ["suscriptoras", L("Suscriptoras", "Assinantes", "Subscribers")], ["mensajes", L("Mensajes", "Mensagens", "Messages") + (sinLeer ? " (" + sinLeer + ")" : "")]];
  const chips = `<div class="chips">${tabs.map(([k, t]) => `<button class="chip ${vs.gtab === k ? "sel" : ""}" data-a="gtab" data-m="${k}">${t}</button>`).join("")}</div>`;
  const subs = Object.values(st.subs);
  const activos = subs.filter(s => !s.cortesia && s.estado === "activa").length;
  const pendientes = subs.filter(s => !s.cortesia && s.estado === "pendiente").length;
  const cortesias = subs.filter(s => s.cortesia).length;
  let cuerpo = "";

  if (vs.gtab === "resumen") {
    cuerpo = `
    <div class="stats">
      <div class="stat"><span>${L("Suscriptoras activas", "Assinantes ativas", "Active subscribers")}</span><b>${activos}</b><small>+ ${cortesias} ${L("de cortesía", "de cortesia", "courtesy")}</small></div>
      <div class="stat"><span>${L("Pedidos por confirmar", "Pedidos a confirmar", "Requests to confirm")}</span><b>${pendientes}</b><small>${L("registrados en la base", "registrados na base", "recorded in the database")}</small></div>
      <div class="stat"><span>${L("Mensajes sin leer", "Mensagens não lidas", "Unread messages")}</span><b>${sinLeer}</b><small>${L("de", "de", "of")} ${st.mensajes.length} ${L("recibidos", "recebidas", "received")}</small></div>
    </div>`;
  } else if (vs.gtab === "suscriptoras") {
    const correos = Object.keys(st.subs);
    let tabla = `<p class="vacio">${L("Todavía no hay suscriptoras.", "Ainda não há assinantes.", "There are no subscribers yet.")}</p>`;
    if (correos.length) {
      tabla = `<div class="tabla-wrap"><table><thead><tr><th>${L("Correo", "E-mail", "Email")}</th><th>${L("Nombre", "Nome", "Name")}</th><th>${L("Celular", "Celular", "Mobile")}</th><th>${L("Estado", "Status", "Status")}</th><th>${L("Alta", "Adesão", "Joined")}</th><th>${L("Baja", "Cancelamento", "Unsubscribed")}</th><th>${L("Acciones", "Ações", "Actions")}</th></tr></thead><tbody>`;
      for (const e of correos) {
        const s = st.subs[e];
        const alta = s.cortesia ? L("Cortesía", "Cortesia", "Courtesy") : fmtCuando(s.altaHora);
        const baja = s.baja ? fmtCuando(s.baja) : "—";
        let acc = "";
        if (s.cortesia) acc += `<button class="btn sec chico" data-a="quitar-cortesia" data-m="${esc(e)}">${L("Quitar cortesía", "Remover cortesia", "Remove courtesy")}</button>`;
        else {
          if (s.estado === "pendiente") acc += `<button class="btn chico" data-a="confirmar" data-m="${esc(e)}">${L("Confirmar", "Confirmar", "Confirm")}</button>`;
          if (s.estado === "activa" || s.estado === "pendiente") acc += `<button class="btn peligro chico" data-a="cancelar-admin" data-m="${esc(e)}">${L("Dar de baja", "Dar baixa", "Unsubscribe")}</button>`;
        }
        acc += confirmBtn("suscriptora", e);
        tabla += `<tr><td>${esc(e)}</td><td>${esc(s.nombre + (s.apellido ? " " + s.apellido : "")) || "—"}</td><td>${esc(s.celular) || "—"}</td><td>${badge(s)}</td><td>${alta}</td><td>${baja}</td><td><div class="acc-tabla">${acc}</div></td></tr>`;
      }
      tabla += `</tbody></table></div>`;
    }
    cuerpo = `<div class="card"><h2>${L("Suscriptoras", "Assinantes", "Subscribers")}</h2>${tabla}
      <form id="f-cort" style="margin-top:18px">
        <label for="in-cort">${L("Agregar cuenta de cortesía (grupo)", "Adicionar conta de cortesia (grupo)", "Add courtesy account (group)")}</label>
        <input type="email" id="in-cort" placeholder="correo@ejemplo.com" required>
        <button class="btn" type="submit">${L("Agregar sin cobro", "Adicionar sem cobrança", "Add without charge")}</button>
      </form></div>`;
  } else if (vs.gtab === "mensajes") {
    const lista = st.mensajes.length ? st.mensajes.map(m => `
      <div class="carta-fila ${m.leido ? "" : "libre"}" style="cursor:default">
        <div class="fechaf">${esc(fmt(m.fecha))}<br><span class="nota">${esc(m.tipo)}</span></div>
        <div class="info"><h3 style="font-size:18px">${esc(m.de || L("Sin nombre", "Sem nome", "No name"))} · ${esc(m.correo)}</h3><div class="temas">${esc(m.texto)}</div></div>
        <div class="acc-tabla">${m.leido ? `<span class="nota">${L("Leído", "Lido", "Read")}</span>` : `<button class="btn sec chico" data-a="leido" data-m="${esc(msgTipo(m))}">${L("Marcar leído", "Marcar como lido", "Mark as read")}</button>`}${confirmBtn("mensaje", msgTipo(m))}</div>
      </div>`).join("") : `<p class="vacio">${L("No hay mensajes.", "Não há mensagens.", "No messages.")}</p>`;
    cuerpo = `<div class="card"><h2>${L("Mensajes", "Mensagens", "Messages")}</h2><p class="nota">${L("Contacto, propuestas para compartir, textos de suscriptoras y pedidos de eliminación de datos.", "Contato, propostas para compartilhar, textos de assinantes e pedidos de exclusão de dados.", "Contact, sharing proposals, subscriber texts and data deletion requests.")}</p>${lista}</div>`;
  }

  return `
  <div class="titulo-pagina"><div class="etiqueta">${L("Área privada · solo la administradora", "Área privada · só a administradora", "Private area · administrator only")}</div><h1>${L("Gestión", "Gestão", "Management")}</h1>
    <p>${L("Acá ves suscriptoras y mensajes. Lo que elimines se borra de la base.", "Aqui você vê assinantes e mensagens. O que você excluir é apagado da base.", "Here you see subscribers and messages. Anything you delete is erased from the database.")}</p>
  </div>
  ${flashHTML("gestion")}
  ${chips}
  ${cuerpo}
  <div class="acciones"><button class="link" data-a="gestion-salir">${L("Salir", "Sair", "Log out")}</button></div>`;
}

const RUTAS = {
  inicio: vInicio, archivo: vArchivo, quienes: vQuienes, contacto: vContacto,
  compartir: vCompartir, carta: vCarta, noticia: vNoticia, "cartas-al-mundo": vCartasMundo,
  suscribirse: vSuscribirse, cuenta: vCuenta, gestion: vGestion
};

/* ---------- Render ---------- */
function ruta() { const h = (location.hash || "#inicio").slice(1); return RUTAS[h] ? h : "inicio"; }
function render() {
  const name = ruta();
  if (vs.flash && vs.flash.v !== name) vs.flash = null;
  const main = document.getElementById("main");
  const contenido = RUTAS[name]();
  main.innerHTML = navHTML(name) + contenido + footerHTML() + cookiesBanner() + popHTML();
  if (vs.pop) { const pi = main.querySelector(".pop-caja input, .pop-caja button"); if (pi) pi.focus({ preventScroll: true }); }
  main.classList.toggle("con-banner", !vs.cookies);
  restaurarBorradores();
  if (vs.refocus) {
    const el = [...main.querySelectorAll("[data-a]")].find(b => b.dataset.a + (b.dataset.m ? "|" + b.dataset.m : "") === vs.refocus);
    if (el) el.focus({ preventScroll: true });
    vs.refocus = null;
  }
  const q = document.getElementById("q-archivo");
  if (q) q.addEventListener("input", () => { vs.q = q.value; const l = document.getElementById("lista-archivo"); if (l) l.innerHTML = listaArchivo(); });
  save();
}
function guardarBorradores() {
  document.querySelectorAll("#main input[id], #main textarea[id]").forEach(el => { if (el.type !== "password") draftVals[el.id] = el.value; });
}
function restaurarBorradores() {
  Object.keys(draftVals).forEach(id => { const el = document.getElementById(id); if (el) el.value = draftVals[id]; });
}
function go(route) { if (ruta() === route && location.hash === "#" + route) { render(); } else { location.hash = route; } }

window.addEventListener("hashchange", () => { window.scrollTo(0, 0); draftVals = {}; vs.refocus = null; vs.pop = false; render(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && vs.pop) { vs.pop = false; render(); } });

/* ---------- Acciones ---------- */
/* ---------- Conexión con Supabase ---------- */
const sb = (window.supabase && window.CDM_CONFIG)
  ? window.supabase.createClient(window.CDM_CONFIG.supabaseUrl, window.CDM_CONFIG.supabaseKey, { auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true } })
  : null;

/* Hora de Brasil (America/Sao_Paulo): antes de las 11:00 se muestra la carta de ayer; desde las 11:00, la de hoy. */
function ahoraSP() {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const g = k => p.find(x => x.type === k).value;
  return { fecha: `${g("year")}-${g("month")}-${g("day")}`, hora: parseInt(g("hour"), 10) };
}
function fechaCarta() { return vs.fechaCarta || st.hoy; }
/* Tema del manifiesto de la carta cargada; null si esa carta no trae tema. */
function temaDia() { return vs.tema && vs.tema.t ? vs.tema : null; }
/* Si la carta todavía no llegó, el texto de la noticia queda vacío sin romper la página. */
function C0() { return CARTA[0] || { t: "", p: "", porque: "", fuentes: "", sec: "", pt: {}, en: {} }; }
function flash(v, t) { vs.flash = { v, t }; }
function errTxt(err) {
  const m = (err && err.message) ? String(err.message) : String(err);
  const limite = (err && err.code === "over_email_send_rate_limit") || (err && err.status === 429) || /rate limit/i.test(m);
  if (limite) return L("Se enviaron demasiados enlaces seguidos. Esperá una hora y pedí un solo enlace de nuevo.", "Foram enviados links demais seguidos. Espere uma hora e peça um só link de novo.", "Too many links were sent in a row. Wait an hour and request a single link again.");
  return m;
}

/* ---------- Datos ---------- */
async function cargarCarta(fecha) {
  if (!sb) return;
  const { data, error } = await sb.rpc("carta_por_fecha", { p_fecha: fecha || null });
  if (error || !data) { CARTA = []; st.cartaCompleta = false; vs.fechaCarta = null; vs.tema = null; return; }
  CARTA = Array.isArray(data.items) ? data.items : [];
  st.cartaCompleta = !!data.completa;
  vs.fechaCarta = data.fecha || null;
  vs.tema = data.tema || null;
}
async function cargarArchivo() {
  if (!sb) return;
  const { data, error } = await sb.rpc("archivo_cartas");
  if (error) return;
  ARCHIVO = (data || []).map(r => ({
    f: r.fecha,
    t: r.t_es || "",
    tl: { pt: r.t_pt || r.t_es || "", en: r.t_en || r.t_es || "" },
    s: (r.secs || []).map(x => (SECCIONES.find(y => y.t === x) || {}).id).filter(Boolean)
  }));
}
function aSub(r, cortesia) {
  return { id: r.user_id, estado: r.estado, cortesia: !!cortesia, alta: (r.alta || "").slice(0, 10), altaHora: r.alta || null, baja: r.baja_at || null, nombre: r.nombre || "", apellido: r.apellido || "", celular: r.celular || "", edad: r.edad_adulta ? "adulto" : "menor", tutor: r.tutor_correo || null, aceptoTerminos: r.acepto_terminos };
}
async function cargarFila() {
  st.fila = null; st.subs = {};
  if (!sb || !st.sesion) return;
  const { data } = await sb.from("suscriptoras").select("user_id, correo, estado, edad_adulta, tutor_correo, acepto_terminos, alta, nombre, apellido, celular, baja_at").eq("correo", st.sesion).limit(1);
  if (data && data[0]) { st.fila = data[0]; st.subs[st.sesion] = aSub(data[0], false); }
}
async function cargarAdmin() {
  if (!sb) return;
  const [s, c, m, e, d] = await Promise.all([
    sb.from("suscriptoras").select("user_id, correo, estado, edad_adulta, tutor_correo, acepto_terminos, alta, nombre, apellido, celular, baja_at").order("alta", { ascending: false }),
    sb.from("cortesias").select("correo"),
    sb.from("mensajes_contacto").select("id, nombre, correo, motivo, mensaje, leido, creado").order("creado", { ascending: false }).limit(300),
    sb.from("envios").select("id, nombre, correo, tipo, titulo, texto, leido, creado").order("creado", { ascending: false }).limit(300),
    sb.from("solicitudes_eliminacion").select("id, correo, motivo, leido, creada").order("creada", { ascending: false }).limit(300)
  ]);
  const cort = new Set((c.data || []).map(x => x.correo));
  st.subs = {};
  (s.data || []).forEach(r => { st.subs[r.correo] = aSub(r, cort.has(r.correo)); });
  const msgs = [];
  (m.data || []).forEach(x => msgs.push({ id: x.id, tabla: "mensajes_contacto", tipo: "Contacto · " + x.motivo, de: x.nombre, correo: x.correo, texto: x.mensaje, fecha: x.creado.slice(0, 10), leido: x.leido }));
  (e.data || []).forEach(x => msgs.push({ id: x.id, tabla: "envios", tipo: "Propuesta · " + x.tipo, de: x.nombre, correo: x.correo, texto: (x.titulo ? x.titulo + " — " : "") + x.texto, fecha: x.creado.slice(0, 10), leido: x.leido }));
  (d.data || []).forEach(x => msgs.push({ id: x.id, tabla: "solicitudes_eliminacion", tipo: "Eliminación de datos", de: "", correo: x.correo, texto: x.motivo || L("Sin motivo indicado", "Sem motivo indicado", "No reason given"), fecha: x.creada.slice(0, 10), leido: x.leido }));
  msgs.sort((a, b) => b.fecha.localeCompare(a.fecha));
  st.mensajes = msgs;
}
async function aplicarSesion(session) {
  st.sesion = session && session.user ? session.user.email : null;
  st.admin = false; st.fila = null; st.subs = {}; st.mensajes = [];
  if (st.sesion && sb) {
    const { data: adm } = await sb.rpc("es_admin");
    st.admin = adm === true;
    if (st.admin) { await cargarAdmin(); try { localStorage.removeItem(CLAVE_ALTA); } catch (err) { /* nada */ } }
    else { await cargarFila(); if (!st.fila) await altaPendiente(); }
  }
}

/* ---------- Acciones de la suscriptora ---------- */
async function suscribir() {
  const rt = ruta();
  const error = t => { flash(rt, t); render(); };
  if (!st.sesion) return error(L("Entrá con tu correo para suscribirte.", "Entre com seu e-mail para se assinar.", "Log in with your email to subscribe."));
  const nombre = campo("s-nombre"), apellido = campo("s-apellido"), celular = campo("s-celular");
  if (!nombre || !apellido) return error(L("Completá tu nombre y apellido.", "Preencha seu nome e sobrenome.", "Please enter your first and last name."));
  if (!/^\+[0-9\s\-.()]{8,22}$/.test(celular)) return error(L("El celular tiene que empezar con + y el código de país, por ejemplo +595 981 123456.", "O celular precisa começar com + e o código do país, por exemplo +595 981 123456.", "The mobile number must start with + and the country code, for example +595 981 123456."));
  const { error: err } = await sb.rpc("solicitar_suscripcion", { p_nombre: nombre, p_apellido: apellido, p_celular: celular });
  if (err) return error(errTxt(err));
  await cargarFila();
  draftVals = {};
  vs.pop = false;
  flash("cuenta", L("Listo: tu suscripción ya está activa y podés leer la carta completa.", "Pronto: sua assinatura já está ativa e você pode ler a carta completa.", "Done: your subscription is active and you can read the full letter now."));
  location.hash = "cuenta";
  render();
}
/* Cierra la sesión solo en este navegador: no depende de que el servidor responda. */
async function cerrarSesion() {
  const rt = ruta();
  try {
    if (sb) {
      const { error } = await sb.auth.signOut({ scope: "local" });
      if (error) flash(rt, errTxt(error));
    }
  } catch (err) { flash(rt, errTxt(err)); }
  await aplicarSesion(null);
  vs.loginIniciado = false;
  render();
}
async function cancelarMia() {
  const rt = ruta();
  const { error } = await sb.rpc("cancelar_mi_suscripcion");
  if (error) { flash(rt, errTxt(error)); return; }
  await cargarFila();
  flash(rt, L("Listo. Diste de baja tu suscripción. Podés volver a pedirla cuando quieras.", "Pronto. Você cancelou a assinatura. Pode pedir de novo quando quiser.", "Done. You unsubscribed. You can request it again anytime."));
}

/* ---------- Acciones de la administradora ---------- */
async function cambiarEstado(correo, estado) {
  const s = st.subs[correo]; if (!s) return "Suscriptora no encontrada";
  const { error } = await sb.from("suscriptoras").update({ estado }).eq("user_id", s.id);
  return error ? errTxt(error) : null;
}
async function eliminarRegistro(ref) {
  if (ref.tipo === "suscriptora") {
    const s = st.subs[ref.ref]; if (!s) return "Suscriptora no encontrada";
    const { error } = await sb.from("suscriptoras").delete().eq("user_id", s.id);
    return error ? errTxt(error) : null;
  }
  if (ref.tipo === "mensaje") {
    const i = ref.ref.indexOf("/");
    const tabla = ref.ref.slice(0, i), id = ref.ref.slice(i + 1);
    const { error } = await sb.from(tabla).delete().eq("id", id);
    return error ? errTxt(error) : null;
  }
  return null;
}
async function marcarLeido(ref) {
  const i = ref.indexOf("/");
  const tabla = ref.slice(0, i), id = ref.slice(i + 1);
  const { error } = await sb.from(tabla).update({ leido: true }).eq("id", id);
  return error ? errTxt(error) : null;
}

/* ---------- Pantallas y eventos ---------- */
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-a]");
  if (!b) return;
  const a = b.dataset.a, m = b.dataset.m;
  guardarBorradores();
  vs.refocus = a + (m ? "|" + m : "");
  if (a === "pop") { e.preventDefault(); vs.pop = true; vs.refocus = null; render(); return; }
  if (a === "pop-cerrar") { vs.pop = false; vs.refocus = null; render(); return; }
  if (a === "vista") return;
  if (a === "motivo") { vs.motivo = m; render(); return; }
  if (a === "toggle-cuenta") { vs.yaCuenta = !vs.yaCuenta; render(); return; }
  if (a === "tipo") { vs.tipo = m; render(); return; }
  if (a === "idioma") { setIdioma(m); return; }
  if (a === "skip") { const h = document.querySelector("#main h1"); if (h) { h.setAttribute("tabindex", "-1"); h.focus(); } return; }
  if (a === "ck-solo" || a === "ck-todas") {
    vs.cookies = a === "ck-todas" ? "todas" : "necesarias";
    try { localStorage.setItem("cdm-cookies", vs.cookies); if (vs.cookies === "necesarias") localStorage.removeItem("cdm-idioma"); } catch (err) {}
    render(); return;
  }
  if (a === "edad-adulto") { vs.adulto = !vs.adulto; vs.menor = false; render(); return; }
  if (a === "edad-menor") { vs.menor = !vs.menor; vs.adulto = false; render(); return; }
  if (a === "tutor-ok") { vs.tutorOk = !vs.tutorOk; render(); return; }
  if (a === "acepta") { vs.acepta = !vs.acepta; render(); return; }
  if (a === "del-ok") { vs.delOk = !vs.delOk; render(); return; }
  if (a === "sec") { vs.sec = m; render(); return; }
  if (a === "consent") { vs.consent = !vs.consent; render(); return; }
  if (a === "verCarta") { vs.verCarta = m; return; } // el enlace lleva a #carta y el hashchange carga esa fecha
  if (a === "copiar") {
    try { await navigator.clipboard.writeText(location.href); flash("carta", L("Enlace copiado.", "Link copiado.", "Link copied.")); }
    catch (err) { flash("carta", L("No se pudo copiar el enlace.", "Não foi possível copiar o link.", "Could not copy the link.")); }
    render(); return;
  }
  if (a === "suscribir") { await suscribir(); return; }
  if (a === "cancelar") { await cancelarMia(); render(); return; }
  if (a === "salir" || a === "gestion-salir") { await cerrarSesion(); return; }
  if (a === "gtab") { vs.gtab = m; render(); return; }
  if (a === "confirmar") { const err = await cambiarEstado(m, "activa"); if (err) flash("gestion", err); await cargarAdmin(); render(); return; }
  if (a === "cancelar-admin") { const err = await cambiarEstado(m, "cancelada"); if (err) flash("gestion", err); await cargarAdmin(); render(); return; }
  if (a === "quitar-cortesia") {
    const { error } = await sb.from("cortesias").delete().eq("correo", m);
    if (error) flash("gestion", errTxt(error));
    else if (st.subs[m] && st.subs[m].estado === "activa") await cambiarEstado(m, "cancelada");
    await cargarAdmin(); render(); return;
  }
  if (a === "eliminar-pedir") { st.confirmar = parseRef(m); render(); return; }
  if (a === "eliminar-no") { st.confirmar = null; render(); return; }
  if (a === "eliminar-ok") {
    const err = await eliminarRegistro(parseRef(m));
    st.confirmar = null;
    if (err) flash("gestion", err);
    await cargarAdmin(); render(); return;
  }
  if (a === "leido") { const err = await marcarLeido(m); if (err) flash("gestion", err); await cargarAdmin(); render(); return; }
  return;
});

document.addEventListener("submit", async e => {
  e.preventDefault();
  draftVals = {};
  const id = e.target.id;
  if (id === "f-suscribir") { await suscribir(); return; }
  if (id === "f-codigo") {
    const token = e.target.querySelector("input").value.replace(/\s/g, "");
    if (!token || !sb || !st.pendiente) return;
    vs.codigoErr = null;
    vs.loginIniciado = true;
    const { error } = await sb.auth.verifyOtp({ email: st.pendiente, token, type: "email" });
    if (error) {
      vs.loginIniciado = false;
      vs.codigoErr = /invalid|expired/i.test(error.message || "")
        ? L("El código no es válido o ya venció. Pedí uno nuevo.", "O código não é válido ou já venceu. Peça um novo.", "The code is invalid or has expired. Request a new one.")
        : errTxt(error);
    }
    render(); return;
  }
  if (id === "f-login" || id === "f-login-pop") {
    const v = e.target.querySelector("input[type=email]").value.trim();
    if (!v || !sb) return;
    vs.loginIniciado = true;
    guardarAltaPendiente({ nombre: e.target.querySelector("[name=nombre]")?.value, apellido: e.target.querySelector("[name=apellido]")?.value, celular: e.target.querySelector("[name=celular]")?.value });
    const { error } = await sb.auth.signInWithOtp({ email: v, options: { emailRedirectTo: location.origin + location.pathname } });
    if (error) flash(ruta(), errTxt(error)); else st.pendiente = v;
    render(); return;
  }
  if (id === "f-eliminar") {
    const correo = campo("d-correo");
    if (!vs.delOk) { flash("cuenta", L("Marcá la casilla para confirmar la solicitud.", "Marque a caixa para confirmar a solicitação.", "Tick the box to confirm the request.")); render(); return; }
    const { error } = await sb.from("solicitudes_eliminacion").insert({ correo, motivo: campo("d-motivo") || null });
    vs.delOk = false;
    flash("cuenta", error ? errTxt(error) : L("Recibimos tu solicitud de eliminación. La revisamos y te escribimos a tu correo cuando esté procesada.", "Recebemos sua solicitação de exclusão. Revisamos e escrevemos para o seu e-mail quando for processada.", "We received your deletion request. We review it and email you once it is processed."));
    render(); return;
  }
  if (id === "f-cort") {
    const v = campo("in-cort");
    if (!v) return;
    const { error } = await sb.from("cortesias").insert({ correo: v });
    if (error) flash("gestion", errTxt(error));
    else { await sb.from("suscriptoras").update({ estado: "activa" }).eq("correo", v); flash("gestion", L("Cuenta de cortesía agregada.", "Conta de cortesia adicionada.", "Courtesy account added.")); }
    await cargarAdmin(); render(); return;
  }
  if (id === "f-contacto") {
    const { error } = await sb.from("mensajes_contacto").insert({ nombre: campo("c-nombre") || null, correo: campo("c-correo"), motivo: vs.motivo, mensaje: campo("c-msg") });
    flash("contacto", error ? errTxt(error) : L("Recibimos tu mensaje. Te respondemos por correo.", "Recebemos sua mensagem. Respondemos por e-mail.", "We received your message. We reply by email."));
    render(); return;
  }
  if (id === "f-compartir") {
    if (!vs.consent) { flash("compartir", L("Marcá la casilla de consentimiento para enviar tu propuesta.", "Marque a caixa de consentimento para enviar sua proposta.", "Tick the consent box to send your proposal.")); render(); return; }
    const { error } = await sb.from("envios").insert({ nombre: campo("s-nombre") || null, correo: campo("s-correo"), tipo: vs.tipo, titulo: campo("s-titulo") || null, texto: campo("s-texto") });
    flash("compartir", error ? errTxt(error) : L("Recibido. Lo revisa el equipo antes de publicarlo; nada se publica automáticamente.", "Recebido. A equipe revisa antes de publicar; nada é publicado automaticamente.", "Received. The team reviews it before publishing; nothing is published automatically."));
    render(); return;
  }
  if (id === "f-envio") {
    const { error } = await sb.from("envios").insert({ nombre: campo("e-nombre") || null, correo: campo("e-correo"), tipo: "Ensayo", titulo: null, texto: campo("e-texto") });
    flash("carta", error ? errTxt(error) : L("Tu texto llegó para leerlo. No se publica automáticamente.", "Seu texto chegou para leitura. Não é publicado automaticamente.", "Your text was received to read. It is not published automatically."));
    render(); return;
  }
});

/* Al cambiar de página: la carta se carga según la fecha pedida (o la de hoy). */
window.addEventListener("hashchange", async () => {
  const r = ruta();
  if (r !== "carta" && r !== "noticia") { vs.verCarta = null; return; }
  if (!sb) return;
  await cargarCarta(vs.verCarta);
  render();
});

/* ---------- Inicio ---------- */
async function iniciar() {
  if (!sb) {
    st.listo = true;
    flash("inicio", L("No se pudo conectar con la base. Revisá la conexión y volvé a cargar la página.", "Não foi possível conectar à base. Verifique a conexão e recarregue a página.", "Could not connect to the database. Check your connection and reload the page."));
    render(); return;
  }
  const { data } = await sb.auth.getSession();
  await aplicarSesion(data.session);
  sb.auth.onAuthStateChange(async (evt, session) => {
    if (evt === "SIGNED_IN" || evt === "SIGNED_OUT" || evt === "USER_UPDATED") {
      await aplicarSesion(session);
      if (evt === "SIGNED_IN" && vs.loginIniciado) {
        vs.loginIniciado = false; st.pendiente = null;
        if (st.sesion && !st.admin && !st.fila) flash("cuenta", L("Todavía no tenés suscripción. Completá tus datos abajo para suscribirte gratis.", "Você ainda não tem assinatura. Preencha seus dados abaixo para assinar grátis.", "You don't have a subscription yet. Fill in your details below to subscribe for free."));
        location.hash = "cuenta";
      }
      render();
    }
  });
  await cargarCarta(null);
  await cargarArchivo();
  st.listo = true;
  render();
}
render();
iniciar();
