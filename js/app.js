/**
 * SISTEMA DE CONTROL DE INVENTARIOS MULTI-USUARIO (Emprendimiento JOSE HERRERA)
 * Orquestador Principal de Interfaz de Usuario y Vistas
 */

class AppUIManager {
    constructor() {
        this.currentTheme = localStorage.getItem("inv_theme") || "light";
        this.applyTheme(this.currentTheme);
    }

    async init() {
        this.renderNavbar();
        this.renderApp();
        this.initGoogleAuth();
        // Cargar precio desde Turso/localStorage y actualizar landing
        await this.loadAndUpdateMembershipPrice();
    }

    /**
     * Consulta la API en vivo https://ve.dolarapi.com/v1/dolares y extrae la tasa promedio del Dólar Oficial
     */
    async fetchLiveBcvRate(silent = false) {
        try {
            const res = await fetch("https://ve.dolarapi.com/v1/dolares");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            
            let oficialItem = null;
            if (Array.isArray(data)) {
                oficialItem = data.find(item => item.fuente === "oficial") || 
                              data.find(item => item.nombre && item.nombre.toLowerCase().includes("dólar") && item.fuente === "oficial") ||
                              data[0];
            }

            if (oficialItem) {
                const rate = parseFloat(oficialItem.promedio || oficialItem.venta || oficialItem.compra);
                if (!isNaN(rate) && rate > 0) {
                    CONFIG.DEFAULT_BCV_RATE = rate;
                    DB.setLocalRecord("settings", { key_name: "bcv_rate", value: String(rate) });
                    try {
                        await DB.query("INSERT OR REPLACE INTO settings (key_name, value) VALUES ('bcv_rate', ?)", [String(rate)]);
                    } catch (e) {}

                    if (!silent) {
                        console.log(`[DolarAPI] Tasa BCV Oficial obtenida: ${rate} Bs./USD`);
                    }
                    return { success: true, rate, item: oficialItem };
                }
            }
        } catch (err) {
            console.warn("[DolarAPI] No se pudo obtener la tasa BCV en vivo:", err.message);
        }
        return { success: false, rate: CONFIG.DEFAULT_BCV_RATE };
    }

    /**
     * Carga el precio de membresía y tasa BCV desde Turso / DolarAPI / localStorage
     */
    async loadAndUpdateMembershipPrice() {
        // Consultar tasa BCV en vivo desde DolarAPI primero
        await this.fetchLiveBcvRate(true);

        try {
            const result = await DB.query(
                "SELECT key_name, value FROM settings WHERE key_name IN ('membership_price_usd', 'bcv_rate')"
            );
            if (result && result.rows && result.rows.length > 0) {
                result.rows.forEach(row => {
                    if (row.key_name === 'membership_price_usd') {
                        const parsed = parseFloat(String(row.value).replace(/[^0-9.]/g, ''));
                        if (!isNaN(parsed) && parsed > 0) {
                            CONFIG.MEMBERSHIP_PRICE_USD = parsed;
                            DB.setLocalRecord("settings", { key_name: "membership_price_usd", value: String(parsed) });
                        }
                    }
                });
            }
        } catch (e) {
            console.warn("Error al cargar tarifas desde Turso, usando valores locales:", e.message);
        }
        this.updateLandingMembershipPrice(CONFIG.MEMBERSHIP_PRICE_USD);
    }

    /**
     * Inicializa Google Identity Services API si el SDK está cargado
     */
    initGoogleAuth() {
        if (!window.google || !google.accounts || !google.accounts.id) {
            setTimeout(() => this.initGoogleAuth(), 300);
            return;
        }

        if (this._googleAuthInitialized) {
            this.renderGoogleButtons();
            return;
        }

        this._googleAuthInitialized = true;
        google.accounts.id.initialize({
            client_id: CONFIG.GOOGLE_CLIENT_ID,
            callback: (res) => {
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
                Auth.handleGoogleCredentialResponse(res).then(r => {
                    AppUI.renderApp();
                    if (r && r.multiple) AppUI.openAccountSelectorModal();
                }).catch(e => AppUI.showAlert("Error", e.message, "danger"));
            }
        });

        this.renderGoogleButtons();

        // Escuchar la apertura de los modales para re-renderizar botones cuando ya son visibles
        ["modalLogin", "modalRegister"].forEach(modalId => {
            const el = document.getElementById(modalId);
            if (el) {
                el.addEventListener("shown.bs.modal", () => {
                    this.renderGoogleButtons();
                });
            }
        });
    }

    /**
     * Renderiza los botones de Google en sus contenedores respectivos
     */
    renderGoogleButtons() {
        if (window.google && google.accounts && google.accounts.id) {
            const isDark = this.currentTheme === "dark";

            const containerLogin = document.getElementById("googleBtnContainerLogin");
            if (containerLogin) {
                containerLogin.innerHTML = "";
                google.accounts.id.renderButton(containerLogin, {
                    theme: isDark ? "filled_black" : "outline",
                    size: "large",
                    text: "signin_with", // "Iniciar sesión con Google"
                    shape: "pill",
                    width: "280"
                });
            }

            const containerRegister = document.getElementById("googleBtnContainerRegister");
            if (containerRegister) {
                containerRegister.innerHTML = "";
                google.accounts.id.renderButton(containerRegister, {
                    theme: isDark ? "filled_black" : "outline",
                    size: "large",
                    text: "signup_with", // "Registrarse con Google"
                    shape: "pill",
                    width: "280"
                });
            }

            const containerLanding = document.getElementById("googleBtnContainer");
            if (containerLanding) {
                containerLanding.innerHTML = "";
                google.accounts.id.renderButton(containerLanding, {
                    theme: isDark ? "filled_black" : "outline",
                    size: "large",
                    text: "continue_with",
                    shape: "pill",
                    width: "280"
                });
            }
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
                            <!-- Logo Principal del Sistema -->
                            <img src="${CONFIG.LOGO_PATH}" alt="Logo Sistema" height="36" class="me-2 rounded" title="Sistema de Inventarios">
                            
                            <!-- Logo Personalizado del Usuario / Comercio (Si existe) -->
                            ${biz && biz.logo_url ? `
                                <img src="${biz.logo_url}" alt="Logo ${biz.name}" height="36" class="me-2 rounded border bg-white p-1 shadow-sm" style="max-width: 75px; object-fit: contain;" title="Logo de tu Comercio">
                            ` : ''}
                            
                            <span class="text-truncate d-inline-block" style="max-width: 40vw">${biz ? biz.name : CONFIG.APP_NAME}</span>
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
                            ${!Auth.isSuperAdmin() && biz ? `
                                <div class="d-flex align-items-center me-3 border rounded p-1 bg-body-secondary" title="Habilitar/Deshabilitar Datos de Prueba o Ejemplo">
                                    <span class="small me-2 fw-semibold ms-1"><i class="bi bi-flask me-1 text-warning"></i> Datos Prueba:</span>
                                    <div class="form-check form-switch mb-0">
                                        <input class="form-check-input" type="checkbox" role="switch" id="demoDataSwitch" ${Number(biz.is_demo_active || 0) === 1 ? 'checked' : ''} onchange="AppUI.toggleDemoData(this.checked)">
                                    </div>
                                </div>

                                <div class="me-3">
                                    <select class="form-select form-select-sm" onchange="AppUI.changePresetProfile(this.value)">
                                        <option value="custom" ${!biz.category_preset || biz.category_preset === 'custom' ? 'selected' : ''}>⭐ Perfil Propio (${biz.name || 'Mi Comercio'})</option>
                                        <optgroup label="Rubros de Ejemplo / Datos Demo">
                                            <option value="panaderia" ${biz.category_preset === 'panaderia' ? 'selected' : ''}>Panadería & Pastelería</option>
                                            <option value="zapateria" ${biz.category_preset === 'zapateria' ? 'selected' : ''}>Zapatería</option>
                                            <option value="libreria" ${biz.category_preset === 'libreria' ? 'selected' : ''}>Librería y Papelería</option>
                                            <option value="farmacia" ${biz.category_preset === 'farmacia' ? 'selected' : ''}>Farmacia & Botica</option>
                                            <option value="ropa" ${biz.category_preset === 'ropa' ? 'selected' : ''}>Tienda de Ropa & Boutique</option>
                                            <option value="bolsos" ${biz.category_preset === 'bolsos' ? 'selected' : ''}>Tienda de Bolsos & Maletas</option>
                                            <option value="viveres" ${biz.category_preset === 'viveres' ? 'selected' : ''}>Abasto & Víveres</option>
                                            <option value="carniceria" ${biz.category_preset === 'carniceria' ? 'selected' : ''}>Carnicería & Frigorífico</option>
                                        </optgroup>
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
                                    <ul class="dropdown-menu dropdown-menu-start dropdown-menu-lg-end shadow">
                                        <li class="dropdown-header text-break py-1 px-3">${user.email}</li>
                                        <li><hr class="dropdown-divider my-1"></li>
                                        <li><a class="dropdown-item text-danger fw-semibold" href="#" onclick="Auth.logout()"><i class="bi bi-box-arrow-right me-2"></i> Cerrar Sesión</a></li>
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
                            <span class="text-truncate d-inline-block" style="max-width: 50vw">${CONFIG.APP_NAME}</span>
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
            if (Number(Auth.currentUser.is_active) === 0) {
                landingView.classList.add("d-none");
                appView.classList.add("d-none");
                const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("modalAccountSuspended"));
                modal.show();
                return;
            }

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
     * @param {number|null} forcedPrice - Si se provee, usa este valor directamente sin leer localStorage
     */
    updateLandingMembershipPrice(forcedPrice = null) {
        let price = 10.00;

        if (forcedPrice !== null && !isNaN(forcedPrice) && forcedPrice > 0) {
            price = forcedPrice;
        } else {
            // Leer precio directamente de localStorage (fuente de verdad local)
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
        }

        // Actualizar el span en la landing page
        const el = document.getElementById("membershipPriceLanding");
        if (el) el.innerText = price.toFixed(2);

        const bcvEl = document.getElementById("bcvRateLanding");
        if (bcvEl) bcvEl.innerText = CONFIG.DEFAULT_BCV_RATE.toFixed(2);
    }


    showLoginModal() {
        const el = document.getElementById("modalLogin");
        if (el) {
            const modal = bootstrap.Modal.getOrCreateInstance(el);
            modal.show();
            setTimeout(() => this.renderGoogleButtons(), 150);
        }
    }

    showRegisterModal() {
        const el = document.getElementById("modalRegister");
        if (el) {
            const modal = bootstrap.Modal.getOrCreateInstance(el);
            modal.show();
            setTimeout(() => this.renderGoogleButtons(), 150);
        }
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

    /**
     * Muestra un Alerta integrado en Modal de Bootstrap 5
     */
    showAlert(title, message, type = "info") {
        const modalEl = document.getElementById("modalSystemAlert");
        if (!modalEl) {
            alert(`${title}: ${message}`);
            return;
        }

        const headerEl = document.getElementById("modalSystemAlertHeader");
        const titleEl = document.getElementById("modalSystemAlertTitle");
        const bodyEl = document.getElementById("modalSystemAlertBody");

        let bgClass = "bg-primary";
        let iconClass = "bi-info-circle";
        if (type === "success") { bgClass = "bg-success"; iconClass = "bi-check-circle"; }
        if (type === "warning") { bgClass = "bg-warning text-dark"; iconClass = "bi-exclamation-triangle"; }
        if (type === "danger" || type === "error") { bgClass = "bg-danger"; iconClass = "bi-exclamation-octagon"; }

        if (headerEl) headerEl.className = `modal-header text-white ${bgClass}`;
        if (titleEl) titleEl.innerHTML = `<i class="bi ${iconClass} me-2"></i> ${title}`;
        if (bodyEl) bodyEl.innerHTML = message;

        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    }

    /**
     * Muestra un Modal de Confirmación
     */
    showConfirm(title, message, onConfirm) {
        const modalEl = document.getElementById("modalSystemConfirm");
        if (!modalEl) {
            if (confirm(message)) onConfirm();
            return;
        }

        const titleEl = document.getElementById("modalSystemConfirmTitle");
        const bodyEl = document.getElementById("modalSystemConfirmBody");
        const btnEl = document.getElementById("modalSystemConfirmBtn");

        if (titleEl) titleEl.innerHTML = `<i class="bi bi-question-circle me-2"></i> ${title}`;
        if (bodyEl) bodyEl.innerHTML = message;

        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

        const newBtn = btnEl.cloneNode(true);
        btnEl.parentNode.replaceChild(newBtn, btnEl);

        newBtn.addEventListener("click", () => {
            modal.hide();
            if (typeof onConfirm === "function") onConfirm();
        });

        modal.show();
    }

    openTermsModal(event) {
        if (event) event.preventDefault();
        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("modalTermsAndPrivacy"));
        modal.show();
    }

    async toggleDemoData(isEnabled) {
        if (!Auth.currentBusiness) return;
        const bizId = Auth.currentBusiness.id;
        const presetKey = Auth.currentBusiness.category_preset || "viveres";

        if (isEnabled) {
            this.showAlert("Cargando Datos de Prueba", `Generando productos, clientes y proveedores de ejemplo para el rubro <strong>${presetKey}</strong>...`, "info");
            await Presets.clearDemoData(bizId);
            await Presets.loadDemoData(bizId, presetKey);
            Auth.currentBusiness.is_demo_active = 1;
        } else {
            this.showAlert("Modo Limpio", "Se han ocultado y removido los datos de prueba. Ahora verás solo tus registros reales.", "info");
            await Presets.clearDemoData(bizId);
            Auth.currentBusiness.is_demo_active = 0;
        }

        const businesses = DB.getLocalTable("businesses");
        const idx = businesses.findIndex(b => b.id === bizId);
        if (idx >= 0) {
            businesses[idx].is_demo_active = Auth.currentBusiness.is_demo_active;
            DB.setLocalTable("businesses", businesses);
            try {
                await DB.query("UPDATE businesses SET is_demo_active = ? WHERE id = ?", [Auth.currentBusiness.is_demo_active, bizId]);
            } catch (e) {}
        }

        this.renderApp();
    }

    async changePresetProfile(presetKey) {
        if (!presetKey || !Auth.currentBusiness) return;
        const bizId = Auth.currentBusiness.id;
        const isDemoActive = Number(Auth.currentBusiness.is_demo_active || 0) === 1;

        if (presetKey === 'custom') {
            Auth.currentBusiness.category_preset = 'custom';
            const businesses = DB.getLocalTable("businesses");
            const idx = businesses.findIndex(b => b.id === bizId);
            if (idx >= 0) {
                businesses[idx].category_preset = 'custom';
                DB.setLocalTable("businesses", businesses);
            }
            try {
                await DB.query("UPDATE businesses SET category_preset = 'custom' WHERE id = ?", [bizId]);
            } catch (e) {}

            if (isDemoActive) {
                this.showAlert("Perfil Propio Activo", `Se ha activado tu <strong>Perfil Personalizado (${Auth.currentBusiness.name})</strong>. Se removieron los datos de prueba.`, "success");
                await Presets.clearDemoData(bizId);
            } else {
                this.showAlert("Perfil Propio Activo", `Estás utilizando tu <strong>Perfil Personalizado (${Auth.currentBusiness.name})</strong>.`, "success");
            }
            this.renderApp();
            return;
        }

        await Presets.applyPresetProfile(presetKey, bizId);

        if (isDemoActive) {
            this.showAlert("Rubro de Prueba Activo", `Cargando catálogo de productos de ejemplo para el rubro <strong>${presetKey.toUpperCase()}</strong> en tu comercio (${Auth.currentBusiness.name})...`, "info");
            await Presets.clearDemoData(bizId);
            await Presets.loadDemoData(bizId, presetKey);
        } else {
            this.showAlert("Rubro Asignado", `Tu comercio (${Auth.currentBusiness.name}) ahora está asociado al rubro <strong>${presetKey.toUpperCase()}</strong>.`, "success");
        }

        this.renderApp();
    }

    closeMobileUserMenu() {
        const el = document.getElementById("userSubNavbarCollapse");
        if (el && el.classList.contains("show")) {
            try {
                const bsCollapse = bootstrap.Collapse.getInstance(el) || new bootstrap.Collapse(el, { toggle: false });
                bsCollapse.hide();
            } catch (e) {
                el.classList.remove("show");
            }
        }
    }

    showPhoneRequestModal(user) {
        this._phoneRequestUser = user;
        const modal = new bootstrap.Modal(document.getElementById('modalRequestPhone'));
        modal.show();
    }

    async saveRequestedPhone() {
        const input = document.getElementById('requestPhoneInput');
        if (!input || !input.value.trim()) {
            this.showAlert('Atención', 'Por favor ingresa tu número de teléfono.', 'warning');
            return;
        }
        const phone = input.value.trim();
        const user = this._phoneRequestUser || Auth.currentUser;
        if (!user) return;

        // 1. Actualizar usuario en memoria
        user.phone = phone;
        if (Auth.currentUser) {
            Auth.currentUser.phone = phone;
        }

        // 2. Actualizar tabla de usuarios en LocalStorage
        const users = DB.getLocalTable("users");
        const uIdx = users.findIndex(u => u.id === user.id || u.email === user.email);
        if (uIdx >= 0) {
            users[uIdx].phone = phone;
            DB.setLocalTable("users", users);
        } else {
            users.push(user);
            DB.setLocalTable("users", users);
        }

        // 3. Actualizar tabla de usuarios en Turso DB con fallback de migración
        try {
            await DB.query('UPDATE users SET phone = ? WHERE id = ? OR email = ?', [phone, user.id, user.email]);
        } catch (e) {
            try {
                await DB.query('ALTER TABLE users ADD COLUMN phone TEXT').catch(() => {});
                await DB.query('UPDATE users SET phone = ? WHERE id = ? OR email = ?', [phone, user.id, user.email]);
            } catch (err) {
                console.warn('Error guardando teléfono en Turso:', err);
            }
        }

        // 4. Actualizar teléfono en el comercio también (si estaba vacío)
        if (Auth.currentBusiness && (!Auth.currentBusiness.phone || Auth.currentBusiness.phone === '0414-0000000' || Auth.currentBusiness.phone === '')) {
            Auth.currentBusiness.phone = phone;
            const businesses = DB.getLocalTable("businesses");
            const bIdx = businesses.findIndex(b => b.id === Auth.currentBusiness.id);
            if (bIdx >= 0) {
                businesses[bIdx].phone = phone;
                DB.setLocalTable("businesses", businesses);
            }
            try {
                await DB.query('UPDATE businesses SET phone = ? WHERE id = ?', [phone, Auth.currentBusiness.id]);
            } catch (e) {}
        }

        // 5. Guardar sesión actualizada
        Auth.saveSession(Auth.currentUser || user, Auth.currentBusiness);

        // 6. Ocultar modal y notificar
        const modalEl = document.getElementById('modalRequestPhone');
        if (modalEl) {
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
        }
        input.value = "";
        this.showAlert('Teléfono Guardado', '¡Tu número de contacto ha sido registrado exitosamente!', 'success');
    }
}

const AppUI = new AppUIManager();
window.addEventListener("DOMContentLoaded", () => AppUI.init());
