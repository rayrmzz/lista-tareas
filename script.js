let tareas = [];

let input = document.getElementById("nuevaTarea");
let boton = document.getElementById("agregarTarea");
let lista = document.getElementById("listaTareas");
let contador = document.getElementById("contador");

console.log("Array inicial:", tareas);
console.log("Numero de tareas:", tareas.length);

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
  guardarTareas();
}

boton.onclick = agregarTarea;

function mostrarTareas() {
  lista.innerHTML = "";

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
                    <button onclick="completarTarea(${i})" class="completar">
                        ${tarea.completada ? "Desmarcar" : "Completar"}
                    </button>
                    <button onclick="eliminarTarea(${i})" class="eliminar">Eliminar</button>
                </div>
            </div>
            `;
    lista.innerHTML += tareaHTML;
  }

  let pendientes = tareas.filter((tarea) => !tarea.completada).length;
  contador.textContent = "Tareas pendientes: " + pendientes;
}

function eliminarTarea(indice) {
  console.log("Eliminando tarea en el indice:", indice);
  console.log("Tarea a eliminar:", tareas[indice]);

  tareas.splice(indice, 1);

  console.log("Array actualizado:", tareas);

  mostrarTareas();
  guardarTareas();
}

function completarTarea(indice) {
  tareas[indice].completada = !tareas[indice].completada;

  let estado = tareas[indice].completada ? "completada" : "pendiente";
  console.log(`Tarea en el indice ${indice} marcada como ${estado}`);

  mostrarTareas();
  guardarTareas();
}

function guardarTareas() {
  localStorage.setItem("tareas", JSON.stringify(tareas));
  console.log("Tareas guardadas:", tareas);
}

function cargarTareas() {
  let tareasGuardadas = localStorage.getItem("tareas");
  if (tareasGuardadas) {
    tareas = JSON.parse(tareasGuardadas);
    console.log("Tareas cargadas:", tareas);
    mostrarTareas();
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

  for (let i = 0; i < tareasFiltradas.length; i++) {
    let tarea = tareasFiltradas[i];
    let claseCSS = tarea.completada ? "tarea completada" : "tarea";

    let tareaHTML = `
            <div class="${claseCSS}">
              <span>${tarea.texto}</span>
              <div class="categoria">[${tarea.categoria}]</div>
              <div class="botones-tarea">
                <button onclick="completarTarea(${i})" class="completar">
                  ${tarea.completada ? "Desmarcar" : "Completar"}
                </button>
                <button onclick="eliminarTarea(${i})" class="eliminar">Eliminar</button>
              </div>
            </div>
            `;
    lista.innerHTML += tareaHTML;
  }
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

cargarTareas();
