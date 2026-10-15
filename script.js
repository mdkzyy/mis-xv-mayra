
// MIS XV | MAYRA
// Funcionamiento de la invitación digital.

const API_URL = "https://script.google.com/macros/s/AKfycbzJ6e_nGi_q3TNozsx2ijmKEwxZeAwbBIopquDiNFhcpwcH60DMZK8fGhI5MFmau256Ug/exec";

const $ = (id) => document.getElementById(id);

const pantallas = {
  portada: $("portada"),
  codigo: $("codigo"),
  cargando: $("cargando"),
  invitacion: $("invitacion"),
  misa: $("misa"),
  recepcion: $("recepcion"),
  dresscode: $("dresscode"),
  itinerario: $("itinerario"),
  confirmacion: $("confirmacion"),
  pase: $("pase"),
  cuentaRegresiva: $("cuentaRegresiva"),
  pantallaFinal: $("pantallaFinal")
};

let respuestaRsvp = "";
let invitacionActual = null;
let codigoActual = "";
let tipoActual = "Invitado";

function mostrarPantalla(pantalla) {
  if (!pantalla) return;

  document.querySelectorAll(".pantalla").forEach(p => {
    p.classList.remove("activa");
  });

  pantalla.classList.add("activa");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Conexión con Google Apps Script mediante JSONP.
function llamarAPI(parametros) {
  return new Promise((resolve, reject) => {
    if (!API_URL || API_URL.includes("PEGA_AQUI")) {
      reject(new Error("Configura la URL de Apps Script."));
      return;
    }

    const callback = "respuestaXV_" + Date.now() +
      "_" + Math.floor(Math.random() * 100000);

    const script = document.createElement("script");

    const temporizador = setTimeout(() => {
      limpiar();
      reject(new Error(
        "El servidor tardó demasiado. Intenta nuevamente."
      ));
    }, 15000);

    function limpiar() {
      clearTimeout(temporizador);
      delete window[callback];
      script.remove();
    }

    window[callback] = (datos) => {
      limpiar();
      resolve(datos);
    };

    const query = new URLSearchParams({
      ...parametros,
      callback
    });

    script.src = API_URL +
      (API_URL.includes("?") ? "&" : "?") +
      query.toString();

    script.onerror = () => {
      limpiar();
      reject(new Error(
        "No se pudo conectar con la hoja de cálculo."
      ));
    };

    document.body.appendChild(script);
  });
}

function ponerDatosInvitacion(datos) {
  invitacionActual = datos;
  codigoActual = String(datos.codigo || "");
  tipoActual = String(datos.tipoPase || "Invitado");

  if ($("nombreInvitado")) {
    $("nombreInvitado").textContent =
      datos.nombre || "Invitado especial";
  }

  if ($("numeroPases")) {
    $("numeroPases").textContent =
      String(datos.numeroPases || 1);
  }

  respuestaRsvp = "";

  if ($("mensajeRsvp")) {
    $("mensajeRsvp").textContent = "";
  }

  if ($("asistire")) {
    $("asistire").classList.remove("seleccionada");
  }

  if ($("noAsistire")) {
    $("noAsistire").classList.remove("seleccionada");
  }
}

// Añade el acceso para las amistades sin cambiar el HTML.
function agregarAccesoAmistades() {
  const seccion = $("codigo");

  if (!seccion || $("sinCodigo")) return;

  const boton = document.createElement("button");
  boton.id = "sinCodigo";
  boton.type = "button";
  boton.className = "boton-regresar";
  boton.textContent = "No tengo código";
  boton.style.display = "block";
  boton.style.margin = "12px auto";

  seccion.insertBefore(boton, $("regresar"));

  const formulario = document.createElement("div");
  formulario.id = "registroAmistad";
  formulario.style.display = "none";
  formulario.style.marginTop = "18px";

  formulario.innerHTML = `
    <p class="texto-codigo">
      Escribe tu nombre y apellido para registrar tu pase.
    </p>

    <input
      id="nombreAmistad"
      class="campo-codigo"
      type="text"
      placeholder="Nombre y apellido"
      autocomplete="name"
      maxlength="100"
    >

    <button
      id="registrarAmistad"
      class="boton-principal"
      type="button"
    >
      REGISTRARME
    </button>

    <button
      id="cancelarAmistad"
      class="boton-regresar"
      type="button"
    >
      ← Volver al código
    </button>
  `;

  seccion.insertBefore(formulario, $("regresar"));

  boton.addEventListener("click", () => {
    $("registroAmistad").style.display = "block";
    $("codigoInvitacion").style.display = "none";
    $("continuar").style.display = "none";
    boton.style.display = "none";
  });

  $("cancelarAmistad").addEventListener("click", () => {
    $("registroAmistad").style.display = "none";
    $("codigoInvitacion").style.display = "";
    $("continuar").style.display = "";
    boton.style.display = "block";
    $("nombreAmistad").value = "";
  });

  $("registrarAmistad").addEventListener("click", async () => {
    const nombre = $("nombreAmistad").value
      .trim()
      .replace(/\s+/g, " ");

    if (nombre.length < 3) {
      alert("Escribe tu nombre y apellido, por favor.");
      $("nombreAmistad").focus();
      return;
    }

    const botonRegistro = $("registrarAmistad");
    botonRegistro.disabled = true;
    botonRegistro.textContent = "REGISTRANDO...";

    try {
      const datos = await llamarAPI({
        accion: "registrar",
        nombre
      });

      if (!datos.ok) {
        throw new Error(
          datos.mensaje || "No se pudo registrar."
        );
      }

      ponerDatosInvitacion(datos);
      mostrarPantalla(pantallas.cargando);

      setTimeout(() => {
        mostrarPantalla(pantallas.invitacion);
      }, 900);

    } catch (error) {
      alert(error.message || "Ocurrió un error al registrarte.");
    } finally {
      botonRegistro.disabled = false;
      botonRegistro.textContent = "REGISTRARME";
    }
  });
}

// Botones de entrada y regreso.
if ($("entrar")) {
  $("entrar").addEventListener("click", () => {
    mostrarPantalla(pantallas.codigo);
  });
}

if ($("regresar")) {
  $("regresar").addEventListener("click", () => {
    mostrarPantalla(pantallas.portada);
  });
}

// Validación de códigos ya asignados.
if ($("continuar")) {
  $("continuar").addEventListener("click", async () => {
    const campo = $("codigoInvitacion");
    const codigoEscrito = campo.value.trim();

    if (!codigoEscrito) {
      alert("Por favor, escribe tu código de invitación.");
      campo.focus();
      return;
    }

    const boton = $("continuar");
    boton.disabled = true;

    try {
      mostrarPantalla(pantallas.cargando);

      const datos = await llamarAPI({
        accion: "buscar",
        codigo: codigoEscrito
      });

      if (!datos.ok) {
        mostrarPantalla(pantallas.codigo);
        alert(
          datos.mensaje ||
          "No encontramos ese código. Intenta otra vez."
        );
        campo.focus();
        return;
      }

      ponerDatosInvitacion(datos);

      setTimeout(() => {
        mostrarPantalla(pantallas.invitacion);
      }, 700);

    } catch (error) {
      mostrarPantalla(pantallas.codigo);
      alert(error.message || "No se pudo verificar el código.");
    } finally {
      boton.disabled = false;
    }
  });
}

agregarAccesoAmistades();

// Navegación entre las pantallas existentes.
const rutas = [
  ["verMisa", "misa"],
  ["verRecepcion", "recepcion"],
  ["volverMisa", "misa"],
  ["verDresscode", "dresscode"],
  ["volverRecepcion", "recepcion"],
  ["verItinerario", "itinerario"],
  ["volverDresscode", "dresscode"],
  ["verConfirmacion", "confirmacion"],
  ["volverItinerario", "itinerario"],
  ["volverConfirmacion", "confirmacion"],
  ["verCuentaRegresiva", "cuentaRegresiva"],
  ["volverPase", "pase"],
  ["verFinal", "pantallaFinal"],
  ["volverInicio", "portada"]
];

rutas.forEach(([id, destino]) => {
  if ($(id) && pantallas[destino]) {
    $(id).addEventListener("click", () => {
      mostrarPantalla(pantallas[destino]);
    });
  }
});

// Selección de asistencia.
if ($("asistire")) {
  $("asistire").addEventListener("click", () => {
    respuestaRsvp = "si";
    $("asistire").classList.add("seleccionada");

    if ($("noAsistire")) {
      $("noAsistire").classList.remove("seleccionada");
    }

    if ($("mensajeRsvp")) {
      $("mensajeRsvp").textContent =
        "¡Qué alegría! Nos encantará contar contigo. ✨";
    }
  });
}

if ($("noAsistire")) {
  $("noAsistire").addEventListener("click", () => {
    respuestaRsvp = "no";
    $("noAsistire").classList.add("seleccionada");

    if ($("asistire")) {
      $("asistire").classList.remove("seleccionada");
    }

    if ($("mensajeRsvp")) {
      $("mensajeRsvp").textContent =
        "Gracias por avisarnos. 🤍";
    }
  });
}

// Guardar respuesta y mostrar el pase si asistirá.
if ($("confirmarAsistencia")) {
  $("confirmarAsistencia").addEventListener(
    "click",
    async () => {
      if (!respuestaRsvp) {
        alert("Por favor, selecciona si asistirás o no.");
        return;
      }

      if (!invitacionActual || !codigoActual) {
        alert(
          "No encontramos los datos de tu invitación. Ingresa de nuevo."
        );
        mostrarPantalla(pantallas.codigo);
        return;
      }

      const boton = $("confirmarAsistencia");
      boton.disabled = true;

      try {
        const datos = await llamarAPI({
          accion: "rsvp",
          codigo: codigoActual,
          respuesta: respuestaRsvp
        });

        if (!datos.ok) {
          throw new Error(
            datos.mensaje || "No se pudo guardar tu respuesta."
          );
        }

        if (respuestaRsvp === "no") {
          alert(
            "Tu respuesta quedó registrada. Gracias por avisarnos. 🤍"
          );
          mostrarPantalla(pantallas.cuentaRegresiva);
          return;
        }

        if ($("nombrePase")) {
          $("nombrePase").textContent =
            invitacionActual.nombre || "Invitado especial";
        }

        if ($("pasesPase")) {
          $("pasesPase").textContent =
            String(invitacionActual.numeroPases || 1);
        }

        if ($("tipoPase")) {
          $("tipoPase").textContent = tipoActual;
        }

        if ($("codigoPase")) {
          $("codigoPase").textContent = codigoActual;
        }

        mostrarPantalla(pantallas.pase);

      } catch (error) {
        alert(
          error.message ||
          "No se pudo guardar la respuesta. Intenta de nuevo."
        );
      } finally {
        boton.disabled = false;
      }
    }
  );
}

// Cuenta regresiva para el 19 de diciembre de 2026.
function actualizarContador() {
  const fecha = new Date(
    "December 19, 2026 00:00:00"
  ).getTime();

  const diferencia = fecha - Date.now();

  const valores = diferencia <= 0
    ? [0, 0, 0, 0]
    : [
        Math.floor(diferencia / 86400000),
        Math.floor((diferencia / 3600000) % 24),
        Math.floor((diferencia / 60000) % 60),
        Math.floor((diferencia / 1000) % 60)
      ];

  ["dias", "horas", "minutos", "segundos"].forEach(
    (id, i) => {
      if ($(id)) {
        $(id).textContent = String(valores[i]).padStart(2, "0");
      }
    }
  );
}

actualizarContador();
setInterval(actualizarContador, 1000);

// Música: usa los controles solo si existen en el HTML.
const musicaXV = $("musicaXV");
const botonMusica = $("botonMusica");

if (musicaXV && botonMusica) {
  botonMusica.addEventListener("click", async () => {
    try {
      if (musicaXV.paused) {
        await musicaXV.play();
        botonMusica.textContent = "Pausar música";
      } else {
        musicaXV.pause();
        botonMusica.textContent = "Reproducir música";
      }
    } catch (error) {
      alert("Toca nuevamente el botón para iniciar la música.");
    }
  });
}
