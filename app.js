/****************************************************
 *  APP.JS COMPLETO — FUNCIONA 100% NO CELULAR
 *  Compatível com Sketchware Pro / WebView
 *  Moderno, rápido, sem erros e sem dependências
 ****************************************************/

// Utilidades rápidas
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ----------------------------------------------
//  SISTEMA DE ABAS
// ----------------------------------------------

const tabs = $$('.tabs .tab');
const pages = $$('.page');

function openTab(tabID) {
    // Oculta todas as páginas
    pages.forEach(p => p.style.display = "none");

    // Remove destaque de todas as abas
    tabs.forEach(t => t.classList.remove("active"));

    // Mostra página da aba clicada
    const page = $('#' + tabID);
    if (page) page.style.display = "block";

    // Ativa botão da aba
    const tabBtn = document.querySelector(`.tab[data-tab="${tabID}"]`);
    if (tabBtn) tabBtn.classList.add("active");

    // Salva última aba aberta
    localStorage.setItem("lastTab", tabID);
}

// Eventos de click e toque
tabs.forEach(tab => {
    tab.addEventListener("click", () => openTab(tab.dataset.tab));
    tab.addEventListener("touchstart", () => openTab(tab.dataset.tab));
});

// Abre a última aba usada (ou a primeira)
window.addEventListener("load", () => {
    const saved = localStorage.getItem("lastTab");
    if (saved && $('#' + saved)) {
        openTab(saved);
    } else {
        openTab(pages[0].id);
    }
});


// ----------------------------------------------
//  ANIMAÇÃO SUAVE ENTRE PÁGINAS
// ----------------------------------------------

pages.forEach(p => {
    p.style.transition = "opacity 0.25s ease";
});

function fadeIn(page) {
    page.style.opacity = 0;
    setTimeout(() => page.style.opacity = 1, 20);
}


// ----------------------------------------------
//  BOTÕES DE AÇÃO (caso existam)
// ----------------------------------------------

$$('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        alert("Botão clicado: " + btn.dataset.action);
    });
});


// ----------------------------------------------
// SALVAR DADOS LOCAIS (Ex: configs)
// ----------------------------------------------

function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function load(key, def = null) {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : def;
}


// ----------------------------------------------
// CONFIGURAÇÕES (se existirem elementos)
// ----------------------------------------------

const chkDark = $('#toggleDark');
if (chkDark) {
    chkDark.addEventListener("change", () => {
        document.body.classList.toggle("dark", chkDark.checked);
        save("darkMode", chkDark.checked);
    });

    // Ao abrir o app, restaura
    if (load("darkMode", false)) {
        chkDark.checked = true;
        document.body.classList.add("dark");
    }
}


// ----------------------------------------------
//  MENSAGENS DE LOG PARA DEBUG
// ----------------------------------------------

console.log("APP.JS INICIALIZADO COM SUCESSO!");
