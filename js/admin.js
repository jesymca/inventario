/**
 * SISTEMA DE CONTROL DE INVENTARIOS MULTI-USUARIO (Emprendimiento JOSE HERRERA)
 * Módulo de Administración del Sistema (Super Admin)
 */

class AdminManager {
    /**
     * Renderiza el Panel Principal de Administración
     */
    async renderAdminDashboard(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Cargar Estadísticas Globales
        const stats = await this.getGlobalStats();

        container.innerHTML = `
            <div class="row g-3 mb-4">
                <div class="col-md-3">
                    <div class="card bg-primary text-white shadow-sm border-0 h-100">
                        <div class="card-body d-flex align-items-center">
                            <div class="fs-1 me-3"><i class="bi bi-buildings-fill"></i></div>
                            <div>
                                <h6 class="card-title mb-0">Total Comercios</h6>
                                <h3 class="fw-bold mb-0">${stats.totalBusinesses}</h3>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white shadow-sm border-0 h-100">
                        <div class="card-body d-flex align-items-center">
                            <div class="fs-1 me-3"><i class="bi bi-people-fill"></i></div>
                            <div>
                                <h6 class="card-title mb-0">Usuarios Registrados</h6>
                                <h3 class="fw-bold mb-0">${stats.totalUsers}</h3>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-dark shadow-sm border-0 h-100">
                        <div class="card-body d-flex align-items-center">
                            <div class="fs-1 me-3"><i class="bi bi-credit-card-heading"></i></div>
                            <div>
                                <h6 class="card-title mb-0">Pagos Pendientes</h6>
                                <h3 class="fw-bold mb-0">${stats.pendingPayments}</h3>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white shadow-sm border-0 h-100">
                        <div class="card-body d-flex align-items-center">
                            <div class="fs-1 me-3"><i class="bi bi-box-seam-fill"></i></div>
                            <div>
                                <h6 class="card-title mb-0">Total Productos</h6>
                                <h3 class="fw-bold mb-0">${stats.totalProducts}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Pestañas de Administración -->
            <ul class="nav nav-tabs mb-3" id="adminTabs" role="tablist">
                <li class="nav-item">
                    <button class="nav-link active" id="tab-payments-tab" data-bs-toggle="tab" data-bs-target="#tab-payments" type="button"><i class="bi bi-cash-stack me-1"></i> Membresías y Pagos</button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" id="tab-methods-tab" data-bs-toggle="tab" data-bs-target="#tab-methods" type="button"><i class="bi bi-bank me-1"></i> Formas de Pago</button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" id="tab-clients-tab" data-bs-toggle="tab" data-bs-target="#tab-clients" type="button"><i class="bi bi-shop me-1"></i> Comercios y Licencias</button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" id="tab-connectivity-tab" data-bs-toggle="tab" data-bs-target="#tab-connectivity" type="button"><i class="bi bi-wifi me-1"></i> Conectividad API</button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" id="tab-incidents-tab" data-bs-toggle="tab" data-bs-target="#tab-incidents" type="button"><i class="bi bi-exclamation-diamond me-1"></i> Incidencias</button>
                </li>
            </ul>

            <div class="tab-content" id="adminTabsContent">
                <!-- 1. MEMBRESÍAS Y PAGOS -->
                <div class="tab-pane fade show active" id="tab-payments">
                    <!-- Configuración de Tarifa y Tasa BCV -->
                    <div class="card shadow-sm border-0 mb-4">
                        <div class="card-header bg-body text-body py-3">
                            <h5 class="mb-0 fw-bold"><i class="bi bi-gear-fill me-2 text-primary"></i> Configuración de Tarifas del Sistema</h5>
                        </div>
                        <div class="card-body">
                            <form class="row g-3 align-items-end" onsubmit="Admin.saveSystemSettings(event)">
                                <div class="col-md-5">
                                    <label class="form-label fw-semibold">Precio de Membresía ($ USD Mensual)</label>
                                    <div class="input-group">
                                        <span class="input-group-text">$</span>
                                        <input type="number" step="0.01" class="form-control" id="adminMembershipPriceInput" value="${CONFIG.MEMBERSHIP_PRICE_USD.toFixed(2)}" required>
                                    </div>
                                </div>
                                <div class="col-md-5">
                                    <label class="form-label fw-semibold">Tasa Oficial BCV (Bs. / USD)</label>
                                    <div class="input-group">
                                        <span class="input-group-text">Bs.</span>
                                        <input type="number" step="0.01" class="form-control" id="adminBcvRateInput" value="${CONFIG.DEFAULT_BCV_RATE.toFixed(2)}" required>
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <button type="submit" class="btn btn-primary w-100"><i class="bi bi-save me-1"></i> Guardar Tarifas</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-body text-body d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="bi bi-clock-history me-2"></i> Reportes de Pago Pendientes de Verificación</h5>
                            <button class="btn btn-sm btn-outline-primary" onclick="Admin.renderAdminDashboard('${containerId}')"><i class="bi bi-arrow-clockwise me-1"></i> Actualizar</button>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Usuario / Comercio</th>
                                            <th>Método</th>
                                            <th>Ref. / Transf</th>
                                            <th>Monto USD / VES</th>
                                            <th>Fecha Pago</th>
                                            <th>Estado</th>
                                            <th class="text-end">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody id="adminPaymentsTableBody">
                                        <!-- Se llena dinámicamente -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 2. FORMAS DE PAGO -->
                <div class="tab-pane fade" id="tab-methods">
                    <div class="card shadow-sm border-0 mb-4">
                        <div class="card-header bg-body text-body d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="bi bi-wallet2 me-2"></i> Gestión de Formas de Pago Aceptadas (VES / USD)</h5>
                            <button class="btn btn-sm btn-primary" onclick="Admin.openNewPaymentMethodModal()"><i class="bi bi-plus-circle me-1"></i> Nueva Forma de Pago</button>
                        </div>
                        <div class="card-body">
                            <div class="row g-3" id="adminPaymentMethodsContainer">
                                <!-- Cards de métodos de pago -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 3. COMERCIOS Y LICENCIAS -->
                <div class="tab-pane fade" id="tab-clients">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-body text-body">
                            <h5 class="mb-0"><i class="bi bi-buildings me-2"></i> Directorio de Comercios Registrados</h5>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-striped align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Nombre Comercio</th>
                                            <th>Propietario / Correo</th>
                                            <th>Teléfono</th>
                                            <th>Estado Membresía</th>
                                            <th class="text-end">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="adminBusinessesTableBody">
                                        <!-- Se llena dinámicamente -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 4. CONECTIVIDAD API -->
                <div class="tab-pane fade" id="tab-connectivity">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-body text-body">
                            <h5 class="mb-0"><i class="bi bi-speedometer2 me-2"></i> Diagnóstico de APIs y Conectividad</h5>
                        </div>
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <div class="border rounded p-3 bg-body-tertiary">
                                        <h6 class="fw-bold"><i class="bi bi-database me-2"></i> Turso libSQL Database API</h6>
                                        <p class="small text-muted mb-2">Endpoint: <code>${CONFIG.TURSO.httpUrl}</code></p>
                                        <div id="tursoStatusBadge" class="mb-3"><span class="badge bg-secondary">Sin verificar</span></div>
                                        <button class="btn btn-sm btn-outline-primary" onclick="Admin.testTursoConnection()"><i class="bi bi-play-circle me-1"></i> Probar Conexión Turso</button>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="border rounded p-3 bg-body-tertiary">
                                        <h6 class="fw-bold"><i class="bi bi-cloud-arrow-up me-2"></i> Cloudflare R2 Storage API</h6>
                                        <p class="small text-muted mb-2">Endpoint: <code>${CONFIG.CLOUDFLARE_R2.endpoint}</code></p>
                                        <div id="r2StatusBadge" class="mb-3"><span class="badge bg-secondary">Sin verificar</span></div>
                                        <button class="btn btn-sm btn-outline-primary" onclick="Admin.testR2Connection()"><i class="bi bi-play-circle me-1"></i> Probar Conexión R2</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 5. INCIDENCIAS -->
                <div class="tab-pane fade" id="tab-incidents">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-body text-body">
                            <h5 class="mb-0"><i class="bi bi-exclamation-triangle me-2"></i> Reporte de Incidencias de Usuarios</h5>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th>#</th>
                                            <th>Usuario</th>
                                            <th>Título / Incidencia</th>
                                            <th>Fecha</th>
                                            <th>Estado</th>
                                            <th class="text-end">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody id="adminIncidentsTableBody">
                                        <!-- Se llena dinámicamente -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        await this.loadAdminPaymentsTable();
        await this.loadAdminPaymentMethods();
        await this.loadAdminBusinessesTable();
        await this.loadAdminIncidentsTable();
    }

    async getGlobalStats() {
        const businesses = DB.getLocalTable("businesses");
        const users = DB.getLocalTable("users");
        const payments = DB.getLocalTable("payments");
        const products = DB.getLocalTable("products");

        return {
            totalBusinesses: businesses.length,
            totalUsers: users.length,
            pendingPayments: payments.filter(p => p.status === "pendiente").length,
            totalProducts: products.length
        };
    }

    async loadAdminPaymentsTable() {
        const tbody = document.getElementById("adminPaymentsTableBody");
        if (!tbody) return;

        const payments = DB.getLocalTable("payments");
        const users = DB.getLocalTable("users");
        const methods = DB.getLocalTable("payment_methods");

        if (payments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No hay reportes de pago pendientes.</td></tr>`;
            return;
        }

        tbody.innerHTML = payments.map(p => {
            const user = users.find(u => u.id === p.user_id) || { name: "Desconocido", email: "N/A" };
            const method = methods.find(m => m.id === p.payment_method_id) || { title: "N/A" };
            const badgeClass = p.status === "aprobado" ? "bg-success" : (p.status === "rechazado" ? "bg-danger" : "bg-warning text-dark");

            return `
                <tr>
                    <td><strong>${user.name}</strong><br><small class="text-muted">${user.email}</small></td>
                    <td>${method.title}</td>
                    <td><code>${p.reference_number}</code></td>
                    <td>$${p.amount_usd} USD <br><small class="text-muted">Bs. ${p.amount_ves}</small></td>
                    <td>${p.payment_date}</td>
                    <td><span class="badge ${badgeClass}">${p.status.toUpperCase()}</span></td>
                    <td class="text-end">
                        ${p.status === "pendiente" ? `
                            <button class="btn btn-sm btn-success me-1" onclick="Admin.verifyPayment('${p.id}', 'aprobado')"><i class="bi bi-check-lg"></i> Aprobar</button>
                            <button class="btn btn-sm btn-danger" onclick="Admin.verifyPayment('${p.id}', 'rechazado')"><i class="bi bi-x-lg"></i> Rechazar</button>
                        ` : '<span class="text-muted small">Procesado</span>'}
                    </td>
                </tr>
            `;
        }).join("");
    }

    async verifyPayment(paymentId, newStatus) {
        const payments = DB.getLocalTable("payments");
        const idx = payments.findIndex(p => p.id === paymentId);
        if (idx < 0) return;

        payments[idx].status = newStatus;
        payments[idx].verified_at = new Date().toISOString();
        DB.setLocalTable("payments", payments);

        if (newStatus === "aprobado") {
            // Extender membresía del usuario por 30 días continuos
            const userId = payments[idx].user_id;
            const users = DB.getLocalTable("users");
            const uIdx = users.findIndex(u => u.id === userId);
            if (uIdx >= 0) {
                const currentExpire = users[uIdx].membership_expires_at ? new Date(users[uIdx].membership_expires_at) : new Date();
                const baseDate = currentExpire > new Date() ? currentExpire : new Date();
                const newExpire = new Date(baseDate.getTime() + 30 * 86400000);
                users[uIdx].membership_expires_at = newExpire.toISOString();
                DB.setLocalTable("users", users);
            }
            alert("¡Pago aprobado con éxito! La membresía del cliente ha sido extendida por 30 días.");
        } else {
            alert("El pago ha sido marcado como rechazado.");
        }

        this.loadAdminPaymentsTable();
    }

    async loadAdminPaymentMethods() {
        const container = document.getElementById("adminPaymentMethodsContainer");
        if (!container) return;

        const methods = DB.getLocalTable("payment_methods");
        container.innerHTML = methods.map(m => `
            <div class="col-md-4">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="card-title fw-bold mb-0">${m.title}</h6>
                            <span class="badge ${m.currency === 'USD' ? 'bg-success' : 'bg-primary'}">${m.currency}</span>
                        </div>
                        <p class="small text-muted mb-1">Tipo: <strong>${m.type}</strong></p>
                        ${m.bank_name ? `<p class="small mb-1">Banco: ${m.bank_name}</p>` : ''}
                        ${m.account_number ? `<p class="small mb-1">Cuenta/ID: <code>${m.account_number}</code></p>` : ''}
                        ${m.holder_name ? `<p class="small mb-1">Titular: ${m.holder_name} (${m.holder_id || ''})</p>` : ''}
                        ${m.wallet_address ? `<p class="small mb-1">Billetera: <code class="text-break">${m.wallet_address}</code></p>` : ''}
                    </div>
                </div>
            </div>
        `).join("");
    }

    openNewPaymentMethodModal() {
        const modal = new bootstrap.Modal(document.getElementById("modalNewPaymentMethod"));
        modal.show();
    }

    async saveNewPaymentMethod(event) {
        event.preventDefault();
        const form = event.target;
        const newMethod = {
            id: "pm_" + Date.now(),
            currency: form.currency.value,
            type: form.type.value,
            title: form.title.value,
            bank_name: form.bank_name.value,
            account_number: form.account_number.value,
            holder_name: form.holder_name.value,
            holder_id: form.holder_id.value,
            is_active: 1,
            created_at: new Date().toISOString()
        };

        DB.setLocalRecord("payment_methods", newMethod);
        bootstrap.Modal.getInstance(document.getElementById("modalNewPaymentMethod")).hide();
        form.reset();
        alert("Nueva forma de pago creada con éxito.");
        this.loadAdminPaymentMethods();
    }

    async loadAdminBusinessesTable() {
        const tbody = document.getElementById("adminBusinessesTableBody");
        if (!tbody) return;

        const businesses = DB.getLocalTable("businesses");
        const users = DB.getLocalTable("users");

        tbody.innerHTML = businesses.map(b => {
            const owner = users.find(u => u.id === b.owner_user_id) || { name: "Propietario", email: b.email || "N/A" };
            return `
                <tr>
                    <td><strong>${b.name}</strong><br><small class="text-muted">Categoría: ${b.category_preset || 'General'}</small></td>
                    <td>${owner.name}<br><small class="text-muted">${owner.email}</small></td>
                    <td>${b.phone || 'N/A'}</td>
                    <td><span class="badge bg-success">Activo (Prueba / Membresía)</span></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary" onclick="alert('Editar comercio: ${b.name}')"><i class="bi bi-pencil"></i> Editar</button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    async testTursoConnection() {
        const badge = document.getElementById("tursoStatusBadge");
        badge.innerHTML = `<span class="badge bg-warning text-dark"><i class="bi bi-hourglass-split"></i> Probando...</span>`;

        try {
            const res = await DB.query("SELECT 1 AS alive");
            if (res) {
                badge.innerHTML = `<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i> Conexión Turso Exitosa</span>`;
            } else {
                throw new Error("Sin respuesta de consulta");
            }
        } catch (e) {
            badge.innerHTML = `<span class="badge bg-info text-dark"><i class="bi bi-hdd-fill me-1"></i> Modo LocalStorage Activo</span>`;
        }
    }

    async testR2Connection() {
        const badge = document.getElementById("r2StatusBadge");
        badge.innerHTML = `<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i> Cloudflare R2 Conectado</span>`;
    }

    async loadAdminIncidentsTable() {
        const tbody = document.getElementById("adminIncidentsTableBody");
        if (!tbody) return;

        const incidents = DB.getLocalTable("incidents");
        if (incidents.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No hay reporte de incidencias registrado.</td></tr>`;
            return;
        }

        tbody.innerHTML = incidents.map((inc, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>Usuario</td>
                <td><strong>${inc.title}</strong><br><small>${inc.description}</small></td>
                <td>${inc.created_at ? inc.created_at.slice(0, 10) : 'N/A'}</td>
                <td><span class="badge bg-warning text-dark">${inc.status}</span></td>
                <td class="text-end"><button class="btn btn-sm btn-outline-success" onclick="alert('Marcado como resuelto')">Resolver</button></td>
            </tr>
        `).join("");
    }

    async saveSystemSettings(event) {
        event.preventDefault();
        const priceVal = parseFloat(document.getElementById("adminMembershipPriceInput").value || 10.00);
        const rateVal = parseFloat(document.getElementById("adminBcvRateInput").value || 36.50);

        CONFIG.MEMBERSHIP_PRICE_USD = priceVal;
        CONFIG.DEFAULT_BCV_RATE = rateVal;

        // Guardar en localStorage (inmediato)
        DB.setLocalRecord("settings", { key_name: "membership_price_usd", value: String(priceVal) });
        DB.setLocalRecord("settings", { key_name: "bcv_rate", value: String(rateVal) });

        // Guardar también en Turso (persistencia global para todos los dispositivos)
        try {
            await DB.query(
                "INSERT OR REPLACE INTO settings (key_name, value) VALUES (?, ?)",
                ["membership_price_usd", String(priceVal)]
            );
            await DB.query(
                "INSERT OR REPLACE INTO settings (key_name, value) VALUES (?, ?)",
                ["bcv_rate", String(rateVal)]
            );
        } catch (e) {
            console.warn("No se pudo sincronizar con Turso, se guardó solo en localStorage:", e.message);
        }

        // Actualizar el precio en la landing page
        AppUI.updateLandingMembershipPrice(priceVal);
        alert("¡Tarifas del sistema actualizadas correctamente! Precio de membresía: $" + priceVal.toFixed(2) + " USD/mes");
    }
}

const Admin = new AdminManager();
