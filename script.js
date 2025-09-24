let tareas = [];
let autoSaverTimer;

const STORAGE_KEY = "tareas_app";
const SCHEMA_VERSION = 1;

let input = document.getElementById("nuevaTarea");
let boton = document.getElementById("agregarTarea");
let lista = document.getElementById("listaTareas");
let contador = document.getElementById("contador");

console.log("Array inicial:", tareas);
console.log("Numero de tareas:", tareas.length);

const exportarBtn = document.getElementById("btnExportar");
const importarBtn = document.getElementById("btnImportar");
const importFile = document.getElementById("importFile");

importarBtn.addEventListener("click", () => importFile.click());

importFile.addEventListener("change", () => {
  const file = importFile.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);

      const itemsRaw = Array.isArray(data) ? data : data.items;
      if (!Array.isArray(itemsRaw)) throw new Error("Formato inválido");

      const sane = itemsRaw
        .filter(
          (t) => t && typeof t.id === "number" && typeof t.texto === "string"
        )
        .map((t) => ({
          id: t.id,
          texto: String(t.texto).trim(),
          categoria: t.categoria || "",
          fechaLimite: t.fechaLimite || "",
          completada: Boolean(t.completada),
        }));

      if (!confirm(`Se van a importar ${sane.length} tareas. ¿Continuar?`)) {
        importFile.value = "";
        return;
      }

      tareas = sane;
      guardarTareas();
      mostrarTareas();
      alert("Backup importado correctamente.");
    } catch (e) {
      console.error("Error leyendo el archivo:", e);
      alert("Error leyendo el archivo: " + e.message);
    } finally {
      importFile.value = "";
    }
  };
  reader.readAsText(file);
});

exportarBtn.addEventListener("click", () => {
  console.log("Exportando tareas a JSON");

  const sugerido = nombreBackupSugerido();
  const nombre = prompt("Nombre del archivo:", sugerido);
  if (nombre === null) return;

  const payload = { version: SCHEMA_VERSION, items: tareas };

  const json = JSON.stringify(payload, null, 2);

  console.log("Preview del JSON a exportar:\n", json);

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = nombre && nombre.trim() ? nombre.trim() : sugerido;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);

  console.log("Nombre elegido:", nombre);
});

function agregarTarea() {
  let textoTarea = input.value.trim();
  let categoriaSeleccionada = document.getElementById("categoria").value;
  let fechaLimite = document.getElementById("fechaLimite").value;

  if (textoTarea === "") {
    alert("Escribe algo.");
    return;
  }

  let nuevaTarea = {
    id: Date.now(),
    texto: textoTarea,
    categoria: categoriaSeleccionada,
    fechaLimite: fechaLimite,
    completada: false,
  };

  tareas.push(nuevaTarea);

  console.log("Nueva tarea agregada");
  console.log("Array actualizado:", tareas);
  console.log("Numero de tareas:", tareas.length);

  input.value = "";
  document.getElementById("categoria").value = "";
  mostrarTareas();
  guardarTareasDebounce();
}

boton.onclick = agregarTarea;

function mostrarTareas() {
  lista.innerHTML = "";
  if (tareas.length === 0) {
    renderEmptyState();
    return;
  }

  for (let i = 0; i < tareas.length; i++) {
    let tarea = tareas[i];
    let claseCSS = tarea.completada ? "tarea completada" : "tarea";

    let fechaVencida = "";
    if (tarea.fechaLimite && !tarea.completada) {
      let hoy = new Date();
      let limite = new Date(tarea.fechaLimite);
      if (limite < hoy) {
        fechaVencida = " Vencida";
        claseCSS += " vencida";
      }
    }

    let fechaTexto = tarea.fechaLimite
      ? ` | Fecha límite: ${tarea.fechaLimite}${fechaVencida}`
      : "";

    let tareaHTML = `
            <div class="${claseCSS}">
                <span>${tarea.texto}</span>
                <div class="categoria">${
                  tarea.categoria
                }${fechaTexto}${fechaVencida}</div>
                <div class="botones-tarea">
                    <button class="completar" data-id="${tarea.id}">
                        ${tarea.completada ? "Desmarcar" : "Completar"}
                    </button>
                    <button class="eliminar" data-id="${tarea.id}">Eliminar
                    </button>
                </div>
            </div>
            `;
    lista.innerHTML += tareaHTML;
  }

  updateContador();
}

function guardarTareas() {
  const payload = { version: SCHEMA_VERSION, items: tareas };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  console.log("Tareas guardadas:", payload);
}

function cargarTareas() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);

    let items;
    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (parsed && Array.isArray(parsed.items)) {
      items = parsed.items;
    } else {
      console.warn("Formato de datos desconocido; se ignoran los datos.");
      return;
    }

    tareas = items
      .filter(
        (t) => t && typeof t.id === "number" && typeof t.texto === "string"
      )
      .map((t) => ({
        id: t.id,
        texto: t.texto.trim(),
        categoria: t.categoria || "",
        fechaLimite: t.fechaLimite || "",
        completada: Boolean(t.completada),
      }));

    console.log(`Tareas cargadas: ${tareas.length}`);
    mostrarTareas();
  } catch (e) {
    console.error("Error al cargar tareas:", e);
  }
}

function filtrarPor(categoria) {
  let tareasFiltradas;

  if (categoria === "todas") {
    tareasFiltradas = tareas;
  } else {
    tareasFiltradas = tareas.filter((tarea) => tarea.categoria === categoria);
  }

  mostrarTareasFiltradas(tareasFiltradas);
  console.log(`Filtrando por: ${categoria}`, tareasFiltradas);
}

function mostrarTareasFiltradas(tareasFiltradas) {
  lista.innerHTML = "";
  if (tareasFiltradas.length === 0) {
    renderEmptyState("No hay tareas para mostrar en esta categoría.");
    return;
  }

  for (let i = 0; i < tareasFiltradas.length; i++) {
    let tarea = tareasFiltradas[i];
    let claseCSS = tarea.completada ? "tarea completada" : "tarea";

    let tareaHTML = `
            <div class="${claseCSS}">
              <span>${tarea.texto}</span>
              <div class="categoria">[${tarea.categoria}]</div>
              <div class="botones-tarea">
                <button class="completar" data-id="${tarea.id}">
                  ${tarea.completada ? "Desmarcar" : "Completar"}
                </button>
                <button class="eliminar" data-id="${tarea.id}">Eliminar</button>
              </div>
            </div>
            `;
    lista.innerHTML += tareaHTML;
  }

  updateContador();
}

function buscarTareas() {
  let textoBusqueda = document.getElementById("buscador").value.toLowerCase();

  let tareasEncontradas = tareas.filter((tarea) =>
    tarea.texto.toLowerCase().includes(textoBusqueda)
  );

  mostrarTareasFiltradas(tareasEncontradas);
  console.log("Buscando:", textoBusqueda, tareasEncontradas.length);
}

document.getElementById("buscador").addEventListener("input", buscarTareas);

function ordenarPor(criterio) {
  let tareasOrdenadas = [...tareas];

  if (criterio === "texto") {
    tareasOrdenadas.sort((a, b) => a.texto.localeCompare(b.texto));
  } else if (criterio === "categoria") {
    tareasOrdenadas.sort((a, b) => a.categoria.localeCompare(b.categoria));
  } else if (criterio === "fecha") {
    tareasOrdenadas.sort((a, b) => {
      if (!a.fechaLimite) return 1;
      if (!b.fechaLimite) return -1;
      return new Date(a.fechaLimite) - new Date(b.fechaLimite);
    });
  }

  tareas = tareasOrdenadas;
  mostrarTareas();
  console.log(`Tareas ordenadas por ${criterio}`);
}

function idxById(id) {
  return tareas.findIndex((t) => t.id === id);
}

lista.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = Number(btn.dataset.id);
  if (!id) return;

  if (btn.classList.contains("completar")) {
    completarTareaPorId(id);
  } else if (btn.classList.contains("eliminar")) {
    eliminarTareaPorId(id);
  }
});

function completarTareaPorId(id) {
  const i = idxById(id);
  if (i === -1) return;
  tareas[i].completada = !tareas[i].completada;
  mostrarTareas();
  guardarTareasDebounce();
}

function eliminarTareaPorId(id) {
  const i = idxById(id);
  if (i === -1) return;
  tareas.splice(i, 1);
  mostrarTareas();
  guardarTareasDebounce();
}

function nombreBackupSugerido() {
  const dt = new Date();

  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");

  const hh = String(dt.getHours()).padStart(2, "0");
  const min = String(dt.getMinutes()).padStart(2, "0");

  return `tareas_backup_${yyyy}${mm}${dd}_${hh}${min}.json`;
}

function guardarTareasDebounce() {
  clearTimeout(autoSaverTimer);
  autoSaverTimer = setTimeout(guardarTareas, 300);
}

function updateContador() {
  const ahora = new Date();
  const DIA_MS = 24 * 60 * 60 * 1000;

  const pendientes = tareas.filter((t) => !t.completada).length;

  const vencidas = tareas.filter(
    (t) => !t.completada && t.fechaLimite && new Date(t.fechaLimite) < ahora
  ).length;

  const proximas24h = tareas.filter((t) => {
    if (t.completada || !t.fechaLimite) return false;
    const limite = new Date(t.fechaLimite);
    const diff = limite - ahora;
    return diff >= 0 && diff <= DIA_MS;
  }).length;

  contador.innerHTML = `
    Tareas pendientes: ${pendientes}
    <span class="badges">
      <span class="badges badge--amarilla">Proximas 24h: ${proximas24h}</span>
      <span class="badges badge--roja">Vencidas: ${vencidas}</span>
    </span>
  `;
}

function renderEmptyState(msg = "No hay tareas para mostrar.") {
  lista.innerHTML = `
    <div class="empty-state" role="status" aria-live="polite">
      </h3>${msg}</h3>
      <p>Agrega una nueva tarea para comenzar.</p>
      <div class="cta">Sugerencia: usa categorias y fechas para organizar mejor tus tareas.</div>
    </div>
  `;
  updateContador();
}

console.log(nombreBackupSugerido());

cargarTareas();
