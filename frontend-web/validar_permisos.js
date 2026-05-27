
function initPage(m) {
    return true;
}

function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}

function editarReporte(id) {
    alert('Editando ST-' + id);
}
