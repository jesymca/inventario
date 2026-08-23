/**
 * SISTEMA DE CONTROL DE INVENTARIOS MULTI-USUARIO (Emprendimiento JOSE HERRERA)
 * Orquestador Principal de Interfaz de Usuario y Vistas
 */

class AppUIManager {
    constructor() {
        this.currentTheme = localStorage.getItem("inv_theme") || "light";
        this.applyTheme(this.currentTheme);
    }

    init() {
        this.renderNavbar();
        this.renderApp();
        this.initGoogleAuth();
        // Actualiza precio de membresía en la landing desde localStorage al cargar
        this.updateLandingMembershipPrice();
    }

    /**
     * Inicializa Google Identity Services API si el SDK está cargado
     */
    initGoogleAuth() {
        if (window.google && google.accounts && google.accounts.id) {
            google.accounts.id.initialize({
                client_id: CONFIG.GOOGLE_CLIENT_ID,
                callback: (res) => {
                    // Ocultar modales si estuviesen abiertos
                    const modalLoginEl = document.getElementById("modalLogin");
                    const modalRegisterEl = document.getElementById("modalRegister");
                    if (modalLoginEl) {
                        const m = bootstrap.Modal.getInstance(modalLoginEl);
                        if (m) m.hide();
                    }
                    if (modalRegisterEl) {
                        const m = bootstrap.Modal.getInstance(modalRegisterEl);
                        if (m) m.hide();
                    }
                    Auth.handleGoogleCredentialResponse(res);
                }
            });

            const btnOptions = {
                theme: this.currentTheme === "dark" ? "filled_black" : "outline",
                size: "large",
                text: "continue_with",
                shape: "pill"
            };

            ["googleBtnContainer", "googleBtnContainerLogin", "googleBtnContainerRegister"].forEach(id => {
                const container = document.getElementById(id);
                if (container) {
                    google.accounts.id.renderButton(container, btnOptions);
                }
            });
        }
    }

    /**
     * Aplica el tema de Bootstrap (Claro / Oscuro)
     */
    applyTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute("data-bs-theme", theme);
        localStorage.setItem("inv_theme", theme);

        const icon = document.getElementById("themeIcon");
        if (icon) {
            icon.className = theme === "dark" ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";
        }
    }

    toggleTheme() {
        const nextTheme = this.currentTheme === "light" ? "dark" : "light";
        this.applyTheme(nextTheme);
    }

    /**
     * Aplica el color de marca del comercio
     */
    applyBrandingColor(colorHex) {
        if (!colorHex) return;
        document.documentElement.style.setProperty("--bs-primary", colorHex);
        document.documentElement.style.setProperty("--bs-primary-rgb", this.hexToRgb(colorHex));
    }

    hexToRgb(hex) {
        let c = hex.replace("#", "");
        if (c.length === 3) c = c.split("").map(x => x + x).join("");
        const num = parseInt(c, 16);
        return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
    }

    /**
     * Renderiza la Navbar del Sistema
     */
    renderNavbar() {
        const user = Auth.currentUser;
        const biz = Auth.currentBusiness;
        const navContainer = document.getElementById("mainNavbarContainer");
        if (!navContainer) return;

        if (user) {
            if (biz && biz.branding_color) this.applyBrandingColor(biz.branding_color);

            navContainer.innerHTML = `
                <nav class="navbar navbar-expand-lg bg-body-tertiary shadow-sm border-bottom py-2">
                    <div class="container-fluid">
                        <a class="navbar-brand d-flex align-items-center fw-bold" href="#">
                            <img src="${CONFIG.LOGO_PATH}" alt="Logo" height="36" class="me-2 rounded">
                            <span>${biz ? biz.name : CONFIG.APP_NAME}</span>
                        </a>
                        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent">
                            <span class="navbar-toggler-icon"></span>
                        </button>
                        <div class="collapse navbar-collapse" id="navbarContent">
                            <ul class="navbar-nav me-auto mb-2 mb-lg-0 align-items-lg-center">
                                ${Auth.isSuperAdmin() ? `
                                    <li class="nav-item me-2">
                                        <span class="badge bg-danger fs-6"><i class="bi bi-shield-lock-fill me-1"></i> Módulo SuperAdmin</span>
                                    </li>
                                ` : ''}
                                ${Auth.userBusinesses.length > 1 ? `
                                    <li class="nav-item me-2">
                                        <button class="btn btn-sm btn-outline-primary" onclick="AppUI.openAccountSelectorModal()"><i class="bi bi-arrow-repeat me-1"></i> Cambiar Empresa (${Auth.userBusinesses.length})</button>
                                    </li>
                                ` : ''}
                            </ul>

                            <!-- Controles de Prueba / Demo Slider -->
                            ${!Auth.isSuperAdmin() ? `
                                <div class="d-flex align-items-center me-3 border rounded p-1 bg-body-secondary">
                                    <span class="small me-2 fw-semibold ms-1"><i class="bi bi-magic me-1"></i> Datos Prueba:</span>
                                    <div class="form-check form-switch mb-0">
                                        <input class="form-check-input" type="checkbox" role="switch" id="demoDataSwitch" onchange="AppUI.toggleDemoData(this.checked)">
                                    </div>
                                </div>

                                <div class="me-3">
                                    <select class="form-select form-select-sm" onchange="AppUI.changePresetProfile(this.value)">
                                        <option value="">-- Perfil Comercio --</option>
                                        <option value="panaderia">Panadería</option>
                                        <option value="zapateria">Zapatería</option>
                                        <option value="libreria">Librería</option>
                                        <option value="farmacia">Farmacia</option>
                                        <option value="ropa">Tienda Ropa</option>
                                        <option value="bolsos">Tienda Bolsos</option>
                                        <option value="viveres">Víveres</option>
                                        <option value="carniceria">Carnicería</option>
                                    </select>
                                </div>
                            ` : ''}

                            <div class="d-flex align-items-center gap-2">
                                <button class="btn btn-outline-secondary btn-sm" onclick="AppUI.toggleTheme()" title="Cambiar Tema">
                                    <i id="themeIcon" class="${this.currentTheme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill'}"></i>
                                </button>

                                <div class="dropdown">
                                    <button class="btn btn-primary btn-sm dropdown-toggle d-flex align-items-center" type="button" data-bs-toggle="dropdown">
                                        <i class="bi bi-person-circle me-1"></i> ${user.name.split(' ')[0]}
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end shadow">
                                        <li class="dropdown-header">${user.email}</li>
                                        <li><hr class="dropdown-divider"></li>
                                        <li><a class="dropdown-item text-danger" href="#" onclick="Auth.logout()"><i class="bi bi-box-arrow-right me-2"></i> Cerrar Sesión</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>
            `;
        } else {
            navContainer.innerHTML = `
                <nav class="navbar navbar-expand-lg bg-body-tertiary shadow-sm border-bottom py-2">
                    <div class="container">
                        <a class="navbar-brand d-flex align-items-center fw-bold" href="#">
                            <img src="${CONFIG.LOGO_PATH}" alt="Logo" height="40" class="me-2 rounded">
                            <span>${CONFIG.APP_NAME}</span>
                        </a>
                        <div class="d-flex align-items-center gap-2">
                            <button class="btn btn-outline-secondary btn-sm" onclick="AppUI.toggleTheme()" title="Cambiar Tema">
                                <i id="themeIcon" class="${this.currentTheme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill'}"></i>
                            </button>
                            <button class="btn btn-outline-primary btn-sm" onclick="AppUI.showLoginModal()"><i class="bi bi-box-arrow-in-right me-1"></i> Iniciar Sesión</button>
                            <button class="btn btn-primary btn-sm" onclick="AppUI.showRegisterModal()"><i class="bi bi-person-plus me-1"></i> Registrarse</button>
                        </div>
                    </div>
                </nav>
            `;
        }
    }

    /**
     * Alterna la vista activa (Landing pública vs Dashboard)
     */
    renderApp() {
        this.renderNavbar();
        this.updateLandingMembershipPrice();
        const landingView = document.getElementById("landingView");
        const appView = document.getElementById("appView");

        if (Auth.currentUser) {
            landingView.classList.add("d-none");
            appView.classList.remove("d-none");

            if (Auth.isSuperAdmin()) {
                Admin.renderAdminDashboard("appView");
            } else {
                User.renderUserDashboard("appView");
            }
        } else {
            landingView.classList.remove("d-none");
            appView.classList.add("d-none");
        }
    }

    /**
     * Actualiza dinámicamente el precio de membresía en la Landing Page
     * Lee directamente de localStorage para garantizar el valor más reciente
     */
    updateLandingMembershipPrice() {
        // Leer precio directamente de localStorage (fuente de verdad)
        let price = 10.00;
        try {
            const raw = localStorage.getItem("inv_db_settings");
            if (raw) {
                const settings = JSON.parse(raw);
                const found = settings.find(s => s.key_name === "membership_price_usd");
                if (found && found.value) {
                    const parsed = parseFloat(String(found.value).replace(/[^0-9.]/g, ''));
                    if (!isNaN(parsed) && parsed > 0) price = parsed;
                }
            }
        } catch (e) {
            price = CONFIG.MEMBERSHIP_PRICE_USD;
        }

        // Actualizar todos los elementos que muestran el precio de membresía
        ["membershipPriceLanding"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = price.toFixed(2);
        });
    }

    /**
     * Maneja el switch deslizante de datos de prueba
     */
    async toggleDemoData(isEnabled) {
        if (!Auth.currentBusiness) return;

        if (isEnabled) {
            const category = Auth.currentBusiness.category_preset || "viveres";
            await Presets.loadDemoData(Auth.currentBusiness.id, category);
            alert("¡Datos de prueba cargados con éxito!");
        } else {
            if (confirm("¿Deseas borrar los datos de prueba del negocio activo?")) {
                await Presets.clearDemoData(Auth.currentBusiness.id);
            }
        }
        User.renderUserDashboard("appView");
    }

    /**
     * Aplica un perfil preconfigurado (Panadería, Zapatería, etc.)
     */
    async changePresetProfile(presetKey) {
        if (!presetKey || !Auth.currentBusiness) return;
        await Presets.applyPresetProfile(presetKey, Auth.currentBusiness.id);
        alert(`¡Perfil cambiado a ${presetKey.toUpperCase()}! El nombre y color del negocio han sido adaptados.`);
        this.renderApp();
    }

    showLoginModal() {
        const modal = new bootstrap.Modal(document.getElementById("modalLogin"));
        modal.show();
    }

    showRegisterModal() {
        const modal = new bootstrap.Modal(document.getElementById("modalRegister"));
        modal.show();
    }

    openAccountSelectorModal() {
        const modal = new bootstrap.Modal(document.getElementById("modalAccountSelector"));
        const list = document.getElementById("accountSelectorList");

        list.innerHTML = Auth.userBusinesses.map(b => `
            <button class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3" onclick="AppUI.selectAccount('${b.id}')">
                <div>
                    <h6 class="mb-0 fw-bold">${b.name}</h6>
                    <small class="text-muted">Categoría: ${b.category_preset || 'General'}</small>
                </div>
                <span class="badge bg-primary rounded-pill">${b.roleName || 'Miembro'}</span>
            </button>
        `).join("");

        modal.show();
    }

    selectAccount(businessId) {
        const selected = Auth.userBusinesses.find(b => b.id === businessId);
        if (selected) {
            Auth.saveSession(Auth.currentUser, selected);
            bootstrap.Modal.getInstance(document.getElementById("modalAccountSelector")).hide();
            this.renderApp();
        }
    }
}

const AppUI = new AppUIManager();
window.addEventListener("DOMContentLoaded", () => AppUI.init());
