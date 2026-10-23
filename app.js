const lista = document.querySelector('#lista');
const offlineMessage = document.querySelector('#offline-message');
const productsUrl = 'https://apipwa.onrender.com/api/products';
const form = document.querySelector('#product-form');
const message = document.querySelector('#message');
const formTitle = document.querySelector('#form-title');
const saveButton = document.querySelector('#save-button');
const cancelButton = document.querySelector('#cancel-button');
let editingId = null;
let products = [];

function updateConnectionStatus() {
    offlineMessage.hidden = navigator.onLine;
    saveButton.disabled = !navigator.onLine;
    loadProducts();
}

async function loadProducts() {
    try {
        if (!navigator.onLine) throw new Error('Sin conexión');
        const response = await fetch(productsUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        products = await response.json();
        localStorage.setItem('products', JSON.stringify(products));
        renderProducts();
    } catch (error) {
        const savedProducts = localStorage.getItem('products');
        if (savedProducts) {
            products = JSON.parse(savedProducts);
            renderProducts();
            if (navigator.onLine) message.textContent = 'Mostrando el último catálogo guardado.';
        } else {
            lista.textContent = 'No hay productos guardados. Conéctate a internet para cargar el catálogo.';
        }
    }
}

function renderProducts() {
        lista.replaceChildren();

        if (products.length === 0) {
            lista.textContent = 'No hay productos en el catálogo.';
            return;
        }

        for (const product of products) {
            const card = document.createElement('article');
            card.className = 'card';
            const name = document.createElement('h2');
            name.textContent = product.name;
            const description = document.createElement('p');
            description.textContent = product.description || 'Sin descripción';
            const price = document.createElement('p');
            price.textContent = `Precio: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(product.price)}`;
            const stock = document.createElement('p');
            stock.textContent = `Existencias: ${product.stock}`;
            const actions = document.createElement('div');
            actions.className = 'actions';
            const edit = document.createElement('button');
            edit.type = 'button';
            edit.textContent = 'Editar';
            edit.disabled = !navigator.onLine;
            edit.addEventListener('click', () => startEdit(product));
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.textContent = 'Eliminar';
            remove.disabled = !navigator.onLine;
            remove.addEventListener('click', () => deleteProduct(product));
            actions.append(edit, remove);
            card.append(name, description, price, stock, actions);
            lista.append(card);
        }
}

function resetForm() {
    editingId = null;
    form.reset();
    formTitle.textContent = 'Nuevo producto';
    saveButton.textContent = 'Agregar producto';
    cancelButton.hidden = true;
}

function startEdit(product) {
    editingId = product.id;
    form.elements.name.value = product.name;
    form.elements.description.value = product.description || '';
    form.elements.price.value = product.price;
    form.elements.stock.value = product.stock;
    formTitle.textContent = `Editar producto #${product.id}`;
    saveButton.textContent = 'Guardar cambios';
    cancelButton.hidden = false;
    form.scrollIntoView({ behavior: 'smooth' });
}

form.addEventListener('submit', async event => {
    event.preventDefault();
    const product = {
        name: form.elements.name.value.trim(),
        description: form.elements.description.value.trim(),
        price: Number(form.elements.price.value),
        stock: Number(form.elements.stock.value)
    };
    const isEditing = editingId !== null;
    saveButton.disabled = true;
    try {
        const response = await fetch(isEditing ? `${productsUrl}/${editingId}` : productsUrl, {
            method: isEditing ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        message.textContent = isEditing ? 'Producto actualizado.' : 'Producto agregado.';
        resetForm();
        await loadProducts();
    } catch (error) {
        message.textContent = 'No se pudo guardar el producto. Comprueba la conexión e inténtalo de nuevo.';
    } finally {
        saveButton.disabled = !navigator.onLine;
    }
});

cancelButton.addEventListener('click', resetForm);

async function deleteProduct(product) {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return;
    try {
        const response = await fetch(`${productsUrl}/${product.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (editingId === product.id) resetForm();
        message.textContent = 'Producto eliminado.';
        await loadProducts();
    } catch (error) {
        message.textContent = 'No se pudo eliminar el producto. Comprueba la conexión e inténtalo de nuevo.';
    }
}

window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);
updateConnectionStatus();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => console.error('No se pudo registrar el service worker.'));
}
