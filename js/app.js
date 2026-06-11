const API_URL = 'http://localhost:3000/api';

// --- Estado de la UI ---
let currentView = 'productos';
let categoriasList = [];

// --- Elementos del DOM ---
const viewProductos = document.getElementById('view-productos');
const viewCategorias = document.getElementById('view-categorias');
const tbodyProductos = document.getElementById('productos-tbody');
const tbodyCategorias = document.getElementById('categorias-tbody');
const pageTitle = document.getElementById('page-title');
const navLinks = document.querySelectorAll('.nav-links li');
const btnAdd = document.getElementById('btn-add');

// Elementos Modal
const modal = document.getElementById('form-modal');
const modalTitle = document.getElementById('modal-title');
const form = document.getElementById('crud-form');
const dynamicFields = document.getElementById('dynamic-form-fields');
const formId = document.getElementById('form-id');
const formType = document.getElementById('form-type');

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initModalEvents();
    loadCategorias().then(() => loadProductos()); // Cargar categorias primero para los select
});

// --- Navegación ---
function initNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const view = link.getAttribute('data-view');
            switchView(view);
            // Cerrar sidebar en móvil si estaba abierto
            document.getElementById('sidebar').classList.remove('open');
        });
    });

    const toggleBtn = document.getElementById('mobile-toggle');
    const sidebar = document.getElementById('sidebar');
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

function switchView(view) {
    currentView = view;
    if (view === 'productos') {
        viewProductos.classList.add('active');
        viewCategorias.classList.remove('active');
        pageTitle.textContent = 'Gestión de Productos';
        loadProductos();
    } else {
        viewCategorias.classList.add('active');
        viewProductos.classList.remove('active');
        pageTitle.textContent = 'Gestión de Categorías';
        loadCategorias();
    }
}

// --- Operaciones CRUD: Productos ---
async function loadProductos() {
    try {
        const res = await fetch(`${API_URL}/productos`);
        const json = await res.json();
        const data = json.data || json; // Extraemos el array 'data'
        renderProductos(data);
    } catch (error) {
        console.error(error);
        showError('No se pudo conectar con el backend. ¿Está encendido?');
    }
}

function renderProductos(productos) {
    tbodyProductos.innerHTML = '';
    productos.forEach(p => {
        // Buscar nombre de categoria
        const cat = categoriasList.find(c => c.IdCategoria === p.IdCategoria);
        const catName = cat ? cat.Nombre : 'Sin Categoría';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${p.IdProducto}</td>
            <td><strong>${p.Nombre}</strong></td>
            <td>€${p.Precio}</td>
            <td>${p.Stock}</td>
            <td><span class="badge">${catName}</span></td>
            <td class="actions-cell">
                <button class="btn-edit" onclick="openModalEdit('producto', ${p.IdProducto})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-danger" onclick="deleteEntity('producto', ${p.IdProducto})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbodyProductos.appendChild(tr);
    });
}

// --- Operaciones CRUD: Categorías ---
async function loadCategorias() {
    try {
        const res = await fetch(`${API_URL}/categorias`);
        const json = await res.json();
        const data = json.data || json; // Extraemos el array 'data'
        categoriasList = data; // Guardamos estado global
        renderCategorias(data);
    } catch (error) {
        console.error(error);
        showError('No se pudo conectar con el backend.');
    }
}

function renderCategorias(categorias) {
    tbodyCategorias.innerHTML = '';
    categorias.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${c.IdCategoria}</td>
            <td><strong>${c.Nombre}</strong></td>
            <td>${c.Descripcion || '-'}</td>
            <td class="actions-cell">
                <button class="btn-edit" onclick="openModalEdit('categoria', ${c.IdCategoria})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-danger" onclick="deleteEntity('categoria', ${c.IdCategoria})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbodyCategorias.appendChild(tr);
    });
}

// --- Formularios y Modales ---
function initModalEvents() {
    btnAdd.addEventListener('click', () => openModalCreate(currentView));
    document.querySelectorAll('#close-modal, #cancel-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    form.addEventListener('submit', handleFormSubmit);
}

function closeModal() {
    modal.classList.remove('active');
    form.reset();
}

function openModalCreate(type) {
    formType.value = type;
    formId.value = '';
    modalTitle.textContent = type === 'productos' ? 'Añadir Producto' : 'Añadir Categoría';
    buildFormFields(type);
    modal.classList.add('active');
}

async function openModalEdit(type, id) {
    // type viene como 'producto' o 'categoria'
    formType.value = type;
    formId.value = id;
    const endpoint = type === 'producto' ? 'productos' : 'categorias';
    modalTitle.textContent = type === 'producto' ? 'Editar Producto' : 'Editar Categoría';
    
    try {
        const res = await fetch(`${API_URL}/${endpoint}/${id}`);
        const data = await res.json();
        buildFormFields(type === 'producto' ? 'productos' : 'categorias', data);
        modal.classList.add('active');
    } catch (error) {
        showError('Error al cargar datos para edición');
    }
}

function buildFormFields(viewType, data = null) {
    dynamicFields.innerHTML = '';
    
    if (viewType === 'productos') {
        const catOptions = categoriasList.map(c => 
            `<option value="${c.IdCategoria}" ${data && data.IdCategoria == c.IdCategoria ? 'selected' : ''}>${c.Nombre}</option>`
        ).join('');
        
        dynamicFields.innerHTML = `
            <div class="form-group">
                <label>Nombre del Producto</label>
                <input type="text" name="Nombre" value="${data ? data.Nombre : ''}" required>
            </div>
            <div class="form-group">
                <label>Precio (€)</label>
                <input type="number" step="0.01" name="Precio" value="${data ? data.Precio : ''}" required>
            </div>
            <div class="form-group">
                <label>Stock</label>
                <input type="number" name="Stock" value="${data ? data.Stock : ''}" required>
            </div>
            <div class="form-group">
                <label>Categoría</label>
                <select name="IdCategoria" required>
                    <option value="">Selecciona una categoría...</option>
                    ${catOptions}
                </select>
            </div>
        `;
    } else {
        dynamicFields.innerHTML = `
            <div class="form-group">
                <label>Nombre de Categoría</label>
                <input type="text" name="Nombre" value="${data ? data.Nombre : ''}" required>
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <input type="text" name="Descripcion" value="${data ? data.Descripcion : ''}">
            </div>
        `;
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Normalizar a plural para el endpoint
    const endpointType = (formType.value === 'producto' || formType.value === 'productos') ? 'productos' : 'categorias';
    const id = formId.value;
    
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    const url = id ? `${API_URL}/${endpointType}/${id}` : `${API_URL}/${endpointType}`;
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await res.json();

        // Capturar errores de validación desde el servidor
        if (res.status === 422 || res.status === 400) {
            Swal.fire({
                icon: 'warning',
                title: 'Validación de Negocio',
                text: result.message || 'Error de validación.',
                confirmButtonColor: '#4F46E5'
            });
            return;
        }

        if (!res.ok) throw new Error(result.message || 'Error en el servidor');

        Swal.fire({
            icon: 'success',
            title: '¡Guardado!',
            text: id ? 'Actualizado correctamente' : 'Creado correctamente',
            timer: 1500,
            showConfirmButton: false
        });
        
        closeModal();
        if (endpointType === 'productos') loadProductos();
        else loadCategorias();

    } catch (error) {
        showError(error.message);
    }
}

// --- Borrado ---
async function deleteEntity(type, id) {
    const endpoint = type === 'producto' ? 'productos' : 'categorias';
    
    const confirm = await Swal.fire({
        title: '¿Eliminar registro?',
        text: "Esta acción es irreversible.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#64748B',
        confirmButtonText: 'Eliminar'
    });

    if (confirm.isConfirmed) {
        try {
            const res = await fetch(`${API_URL}/${endpoint}/${id}`, { method: 'DELETE' });
            const result = await res.json();
            
            // Validar restricción de borrado si la categoría tiene productos
            if (res.status === 400 || res.status === 409) {
                Swal.fire({
                    icon: 'error',
                    title: 'Restricción de Integridad',
                    text: result.message || 'No puedes borrar una categoría que tiene productos asignados.',
                    confirmButtonColor: '#4F46E5'
                });
                return;
            }

            if (!res.ok) throw new Error(result.message || 'Error al eliminar');

            Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                timer: 1500,
                showConfirmButton: false
            });
            
            if (type === 'producto') loadProductos();
            else loadCategorias();
            
        } catch (error) {
            showError(error.message);
        }
    }
}

// --- Utils ---
function showError(msg) {
    Swal.fire({
        icon: 'error',
        title: 'Error de Conexión',
        text: msg,
        confirmButtonColor: '#4F46E5'
    });
}
