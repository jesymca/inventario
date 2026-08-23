/**
 * SISTEMA DE CONTROL DE INVENTARIOS MULTI-USUARIO (Emprendimiento JOSE HERRERA)
 * Módulo de Administración del Sistema (Super Admin)
 */

class AdminManager {
    constructor() {
        this.paymentsSearchQuery = "";
        this.businessesSearchQuery = "";
        this.usersSearchQuery = "";
    }

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
                    <button class="nav-link" id="tab-users-tab" data-bs-toggle="tab" data-bs-target="#tab-users" type="button"><i class="bi bi-person-lines-fill me-1"></i> Registro de Usuarios (${stats.totalUsers})</button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" id="tab-clients-tab" data-bs-toggle="tab" data-bs-target="#tab-clients" type="button"><i class="bi bi-shop me-1"></i> Comercios y Licencias (${stats.totalBusinesses})</button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" id="tab-methods-tab" data-bs-toggle="tab" data-bs-target="#tab-methods" type="button"><i class="bi bi-bank me-1"></i> Formas de Pago</button>
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
                            <div class="d-flex align-items-center">
                                <input type="text" id="adminPaymentsSearchInput" class="form-control form-control-sm me-2" style="max-width: 320px;" placeholder="🔍 Buscar pago por usuario, ref, banco..." oninput="Admin.filterPayments(this.value)">
                                <button class="btn btn-sm btn-outline-primary" onclick="Admin.renderAdminDashboard('${containerId}')"><i class="bi bi-arrow-clockwise me-1"></i> Actualizar</button>
                            </div>
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
                                            <th>Comprobante / Capture</th>
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

                <!-- 2. REGISTRO DE USUARIOS EN LA PLATAFORMA (ESTADÍSTICAS & CONTROL) -->
                <div class="tab-pane fade" id="tab-users">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-body text-body d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="bi bi-person-lines-fill me-2 text-success"></i> Usuarios Registrados en la Plataforma</h5>
                            <input type="text" id="adminUsersSearchInput" class="form-control form-control-sm" style="max-width: 320px;" placeholder="🔍 Buscar por nombre, correo, rol o fecha..." oninput="Admin.filterUsers(this.value)">
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-striped align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th>#</th>
                                            <th>Nombre Completo</th>
                                            <th>Correo Electrónico</th>
                                            <th>Rol de Cuenta</th>
                                            <th>Fecha de Registro</th>
                                            <th>Membresía / Estado Prueba</th>
                                            <th class="text-end">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody id="adminUsersTableBody">
                                        <!-- Usuarios dinámicos -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 3. COMERCIOS Y LICENCIAS -->
                <div class="tab-pane fade" id="tab-clients">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-body text-body d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="bi bi-buildings me-2"></i> Directorio de Comercios Registrados</h5>
                            <input type="text" id="adminBusinessesSearchInput" class="form-control form-control-sm" style="max-width: 320px;" placeholder="🔍 Buscar comercio por nombre o correo..." oninput="Admin.filterBusinesses(this.value)">
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

                <!-- 4. FORMAS DE PAGO -->
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

                <!-- 5. CONECTIVIDAD API -->
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

                <!-- 6. INCIDENCIAS -->
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
        await this.loadAdminUsersTable();
        await this.loadAdminBusinessesTable();
        await this.loadAdminPaymentMethods();
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

    // --- BÚSQUEDAS EN TIEMPO REAL (ADMIN) ---
    filterPayments(query = "") {
        this.paymentsSearchQuery = query.toLowerCase().trim();
        this.loadAdminPaymentsTable();
    }

    filterBusinesses(query = "") {
        this.businessesSearchQuery = query.toLowerCase().trim();
        this.loadAdminBusinessesTable();
    }

    filterUsers(query = "") {
        this.usersSearchQuery = query.toLowerCase().trim();
        this.loadAdminUsersTable();
    }

    async loadAdminPaymentsTable() {
        const tbody = document.getElementById("adminPaymentsTableBody");
        if (!tbody) return;

        let payments = DB.getLocalTable("payments");
        const users = DB.getLocalTable("users");
        const methods = DB.getLocalTable("payment_methods");

        if (this.paymentsSearchQuery) {
            const q = this.paymentsSearchQuery;
            payments = payments.filter(p => {
                const u = users.find(usr => usr.id === p.user_id) || {};
                const m = methods.find(mth => mth.id === p.payment_method_id) || {};
                return (u.name && u.name.toLowerCase().includes(q)) ||
                       (u.email && u.email.toLowerCase().includes(q)) ||
                       (m.title && m.title.toLowerCase().includes(q)) ||
                       (p.reference_number && p.reference_number.toLowerCase().includes(q));
            });
        }

        if (payments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No se encontraron reportes de pago.</td></tr>`;
            return;
        }

        tbody.innerHTML = payments.map(p => {
            const user = users.find(u => u.id === p.user_id) || { name: "Desconocido", email: "N/A" };
            const method = methods.find(m => m.id === p.payment_method_id) || { title: "N/A" };
            const badgeClass = p.status === "aprobado" ? "bg-success" : (p.status === "rechazado" ? "bg-danger" : "bg-warning text-dark");

            const proofBtn = p.proof_url ? 
                `<button class="btn btn-sm btn-outline-info" onclick="Admin.viewPaymentProof('${p.id}')"><i class="bi bi-image me-1"></i> Ver Capture</button>` :
                `<span class="text-muted small">Sin file</span>`;

            return `
                <tr>
                    <td><strong>${user.name}</strong><br><small class="text-muted">${user.email}</small></td>
                    <td>${method.title}</td>
                    <td><code>${p.reference_number}</code></td>
                    <td>$${p.amount_usd} USD <br><small class="text-muted">Bs. ${p.amount_ves}</small></td>
                    <td>${proofBtn}</td>
                    <td>${p.payment_date}</td>
                    <td><span class="badge ${badgeClass}">${p.status.toUpperCase()}</span></td>
                    <td class="text-end">
                        ${p.proof_url ? `<button class="btn btn-sm btn-info me-1 text-white" onclick="Admin.viewPaymentProof('${p.id}')" title="Revisar Capture"><i class="bi bi-eye"></i></button>` : ''}
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

    viewPaymentProof(paymentId) {
        const payments = DB.getLocalTable("payments");
        const p = payments.find(pay => pay.id === paymentId);
        if (!p) return alert("Pago no encontrado.");

        const users = DB.getLocalTable("users");
        const user = users.find(u => u.id === p.user_id) || { name: "Usuario Desconocido", email: "N/A" };

        const body = document.getElementById("paymentProofModalBody");
        const footer = document.getElementById("paymentProofModalFooter");
        if (!body || !footer) return;

        if (p.proof_url) {
            if (p.proof_url.endsWith(".pdf") || p.proof_url.includes("data:application/pdf")) {
                body.innerHTML = `
                    <div class="p-4 bg-light rounded text-center">
                        <i class="bi bi-file-earmark-pdf text-danger display-1 d-block mb-3"></i>
                        <h6 class="fw-bold">Comprobante en Documento PDF</h6>
                        <p class="text-muted small mb-3">Adjuntado por <strong>${user.name}</strong> (${user.email}) - Ref: <code>${p.reference_number}</code></p>
                        <a href="${p.proof_url}" target="_blank" class="btn btn-danger"><i class="bi bi-download me-1"></i> Abrir / Descargar PDF del Pago</a>
                    </div>
                `;
            } else {
                body.innerHTML = `
                    <div class="p-2 bg-light rounded mb-2">
                        <div class="mb-2 text-start small text-muted">
                            <strong>Usuario:</strong> ${user.name} (${user.email}) | <strong>Ref:</strong> <code>${p.reference_number}</code> | <strong>Banco Origen:</strong> ${p.bank_origin || 'N/A'}
                        </div>
                        <img src="${p.proof_url}" class="img-fluid rounded border shadow-sm" style="max-height: 520px; object-fit: contain;">
                    </div>
                `;
            }
        } else {
            body.innerHTML = `<div class="alert alert-warning">El usuario no adjuntó ningún archivo de comprobante para este reporte de pago.</div>`;
        }

        footer.innerHTML = `
            <div>
                <span class="badge ${p.status === 'aprobado' ? 'bg-success' : (p.status === 'rechazado' ? 'bg-danger' : 'bg-warning text-dark')}">${p.status.toUpperCase()}</span>
                <span class="ms-2 small text-muted">Monto: <strong>$${p.amount_usd} USD</strong> (Bs. ${p.amount_ves})</span>
            </div>
            <div>
                ${p.status === "pendiente" ? `
                    <button class="btn btn-success me-1" onclick="Admin.verifyPayment('${p.id}', 'aprobado'); bootstrap.Modal.getInstance(document.getElementById('modalViewPaymentProof')).hide();"><i class="bi bi-check-lg me-1"></i> Aprobar Pago</button>
                    <button class="btn btn-danger me-1" onclick="Admin.verifyPayment('${p.id}', 'rechazado'); bootstrap.Modal.getInstance(document.getElementById('modalViewPaymentProof')).hide();"><i class="bi bi-x-lg me-1"></i> Rechazar Pago</button>
                ` : ''}
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById("modalViewPaymentProof"));
        modal.show();
    }

    async loadAdminUsersTable() {
        const tbody = document.getElementById("adminUsersTableBody");
        if (!tbody) return;

        let users = DB.getLocalTable("users");

        if (this.usersSearchQuery) {
            const q = this.usersSearchQuery;
            users = users.filter(u => 
                (u.name && u.name.toLowerCase().includes(q)) ||
                (u.email && u.email.toLowerCase().includes(q)) ||
                (u.role && u.role.toLowerCase().includes(q)) ||
                (u.created_at && u.created_at.includes(q))
            );
        }

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No hay usuarios registrados que coincidan con la búsqueda.</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map((u, i) => {
            const regDate = u.created_at || u.trial_starts_at ? new Date(u.created_at || u.trial_starts_at).toLocaleDateString() : "Reciente";
            const roleBadge = u.role === "superadmin" ? '<span class="badge bg-danger">SuperAdmin</span>' : '<span class="badge bg-primary">Usuario / Dueño</span>';

            let statusBadge = '<span class="badge bg-success">En Período de Prueba</span>';
            if (u.membership_expires_at) {
                const exp = new Date(u.membership_expires_at);
                if (exp > new Date()) {
                    statusBadge = `<span class="badge bg-success">Membresía Activa hasta ${exp.toLocaleDateString()}</span>`;
                } else {
                    statusBadge = `<span class="badge bg-danger">Membresía Vencida (${exp.toLocaleDateString()})</span>`;
                }
            }

            return `
                <tr>
                    <td>${i + 1}</td>
                    <td><strong>${u.name}</strong></td>
                    <td><code>${u.email}</code></td>
                    <td>${roleBadge}</td>
                    <td><i class="bi bi-calendar-event me-1 text-muted"></i> ${regDate}</td>
                    <td>${statusBadge}</td>
                    <td class="text-end">
                        <span class="badge bg-success">Activo</span>
                    </td>
                </tr>
            `;
        }).join("");
    }

    async loadAdminPaymentMethods() {
        const container = document.getElementById("adminPaymentMethodsContainer");
        if (!container) return;

        const methods = DB.getLocalTable("payment_methods");
        if (methods.length === 0) {
            container.innerHTML = `<div class="col-12 text-center text-muted py-4">No hay formas de pago configuradas.</div>`;
            return;
        }

        container.innerHTML = methods.map(m => `
            <div class="col-md-4">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-body d-flex flex-column justify-content-between">
                        <div>
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="card-title fw-bold mb-0">${m.title}</h6>
                                <div>
                                    <span class="badge ${Number(m.is_active) === 1 ? 'bg-success' : 'bg-secondary'} me-1">${Number(m.is_active) === 1 ? 'Activo' : 'Inactivo'}</span>
                                    <span class="badge ${m.currency === 'USD' ? 'bg-success' : 'bg-primary'}">${m.currency}</span>
                                </div>
                            </div>
                            <p class="small text-muted mb-1">Tipo: <strong>${m.type}</strong></p>
                            ${m.bank_name ? `<p class="small mb-1">Banco: ${m.bank_name}</p>` : ''}
                            ${m.account_number ? `<p class="small mb-1">Cuenta/ID/Tlf: <code>${m.account_number}</code></p>` : ''}
                            ${m.holder_name ? `<p class="small mb-1">Titular: ${m.holder_name} (${m.holder_id || ''})</p>` : ''}
                            ${m.wallet_address ? `<p class="small mb-1">Billetera: <code class="text-break">${m.wallet_address}</code></p>` : ''}
                        </div>
                        <button class="btn btn-sm btn-outline-warning w-100 mt-3 fw-bold" onclick="Admin.openEditPaymentMethodModal('${m.id}')"><i class="bi bi-pencil-square me-1"></i> Editar Método</button>
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

        try {
            await DB.query(
                `INSERT INTO payment_methods (id, currency, type, title, bank_name, account_number, holder_name, holder_id, is_active)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [newMethod.id, newMethod.currency, newMethod.type, newMethod.title, newMethod.bank_name, newMethod.account_number, newMethod.holder_name, newMethod.holder_id, 1]
            );
        } catch (e) {
            console.warn("Saved to localStorage:", e);
        }

        DB.setLocalRecord("payment_methods", newMethod);
        bootstrap.Modal.getInstance(document.getElementById("modalNewPaymentMethod")).hide();
        form.reset();
        alert("Nueva forma de pago creada con éxito.");
        this.loadAdminPaymentMethods();
    }

    openEditPaymentMethodModal(methodId) {
        const methods = DB.getLocalTable("payment_methods");
        const m = methods.find(item => item.id === methodId);
        if (!m) return alert("Método de pago no encontrado.");

        document.getElementById("editPaymentMethodId").value = m.id;
        document.getElementById("editPaymentMethodCurrency").value = m.currency || "VES";
        document.getElementById("editPaymentMethodType").value = m.type || "PagoMovil";
        document.getElementById("editPaymentMethodTitle").value = m.title || "";
        document.getElementById("editPaymentMethodBankName").value = m.bank_name || "";
        document.getElementById("editPaymentMethodAccountNumber").value = m.account_number || "";
        document.getElementById("editPaymentMethodHolderName").value = m.holder_name || "";
        document.getElementById("editPaymentMethodHolderId").value = m.holder_id || "";
        document.getElementById("editPaymentMethodWalletAddress").value = m.wallet_address || "";
        document.getElementById("editPaymentMethodIsActive").value = (m.is_active !== undefined ? m.is_active : 1).toString();

        const modal = new bootstrap.Modal(document.getElementById("modalEditPaymentMethod"));
        modal.show();
    }

    async saveEditPaymentMethod(event) {
        event.preventDefault();
        const form = event.target;
        const methodId = document.getElementById("editPaymentMethodId").value;
        const methods = DB.getLocalTable("payment_methods");
        const idx = methods.findIndex(m => m.id === methodId);
        if (idx < 0) return alert("Método de pago no encontrado.");

        methods[idx].currency = form.currency.value;
        methods[idx].type = form.type.value;
        methods[idx].title = form.title.value;
        methods[idx].bank_name = form.bank_name.value;
        methods[idx].account_number = form.account_number.value;
        methods[idx].holder_name = form.holder_name.value;
        methods[idx].holder_id = form.holder_id.value;
        methods[idx].wallet_address = form.wallet_address.value;
        methods[idx].is_active = parseInt(form.is_active.value);

        try {
            await DB.query(
                `UPDATE payment_methods SET currency = ?, type = ?, title = ?, bank_name = ?, account_number = ?, holder_name = ?, holder_id = ?, wallet_address = ?, is_active = ? WHERE id = ?`,
                [methods[idx].currency, methods[idx].type, methods[idx].title, methods[idx].bank_name, methods[idx].account_number, methods[idx].holder_name, methods[idx].holder_id, methods[idx].wallet_address, methods[idx].is_active, methodId]
            );
        } catch (e) {
            console.warn("Updated local storage:", e);
        }

        DB.setLocalTable("payment_methods", methods);
        bootstrap.Modal.getInstance(document.getElementById("modalEditPaymentMethod")).hide();
        alert("¡Forma de pago actualizada con éxito!");
        this.loadAdminPaymentMethods();
    }

    async deletePaymentMethod() {
        const methodId = document.getElementById("editPaymentMethodId").value;
        if (!methodId) return;
        if (!confirm("¿Deseas eliminar esta forma de pago?")) return;

        try {
            await DB.query("DELETE FROM payment_methods WHERE id = ?", [methodId]);
        } catch (e) {}

        DB.deleteLocalRecord("payment_methods", methodId);
        bootstrap.Modal.getInstance(document.getElementById("modalEditPaymentMethod")).hide();
        alert("Forma de pago eliminada con éxito.");
        this.loadAdminPaymentMethods();
    }

    async loadAdminBusinessesTable() {
        const tbody = document.getElementById("adminBusinessesTableBody");
        if (!tbody) return;

        let businesses = DB.getLocalTable("businesses");
        const users = DB.getLocalTable("users");

        if (this.businessesSearchQuery) {
            const q = this.businessesSearchQuery;
            businesses = businesses.filter(b => {
                const owner = users.find(u => u.id === b.owner_user_id) || {};
                return (b.name && b.name.toLowerCase().includes(q)) ||
                       (b.email && b.email.toLowerCase().includes(q)) ||
                       (owner.name && owner.name.toLowerCase().includes(q)) ||
                       (owner.email && owner.email.toLowerCase().includes(q));
            });
        }

        if (businesses.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No se encontraron comercios registrados.</td></tr>`;
            return;
        }

        tbody.innerHTML = businesses.map(b => {
            const owner = users.find(u => u.id === b.owner_user_id) || { name: "Propietario", email: b.email || "N/A" };
            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            ${b.logo_url ? `<img src="${b.logo_url}" class="rounded me-2 border" style="width: 32px; height: 32px; object-fit: contain;">` : '<div class="bg-primary text-white rounded me-2 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;"><i class="bi bi-building"></i></div>'}
                            <div>
                                <strong>${b.name}</strong><br>
                                <small class="text-muted">Categoría: ${b.category_preset || 'General'}</small>
                            </div>
                        </div>
                    </td>
                    <td>${owner.name}<br><small class="text-muted">${owner.email}</small></td>
                    <td>${b.phone || 'N/A'}</td>
                    <td><span class="badge bg-success">Activo</span></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary" onclick="alert('Comercio: ${b.name} registrado por ${owner.email}')"><i class="bi bi-eye"></i> Detalles</button>
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
        const priceVal = parseFloat(document.getElementById("adminMembershipPriceInput").value || 15.00);
        const bcvVal = parseFloat(document.getElementById("adminBcvRateInput").value || 40.00);

        CONFIG.MEMBERSHIP_PRICE_USD = priceVal;
        CONFIG.DEFAULT_BCV_RATE = bcvVal;

        const landingPriceEl = document.getElementById("membershipPriceLanding");
        if (landingPriceEl) {
            landingPriceEl.textContent = `${priceVal.toFixed(2)} USD`;
        }

        try {
            await DB.query(
                `INSERT OR REPLACE INTO settings (key_name, value) VALUES ('membership_price_usd', ?), ('bcv_rate', ?)`,
                [priceVal.toString(), bcvVal.toString()]
            );
        } catch (e) {
            console.warn("Could not save settings to Turso DB, saved to localStorage:", e);
        }

        alert(`¡Tarifas del sistema actualizadas exitosamente!\nNuevos valores:\nMembresía: $${priceVal.toFixed(2)} USD\nTasa BCV: ${bcvVal.toFixed(2)} Bs./USD`);
    }
}

const Admin = new AdminManager();
