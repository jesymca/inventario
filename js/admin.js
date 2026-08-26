/**
 * SISTEMA DE CONTROL DE INVENTARIOS MULTI-USUARIO (Emprendimiento JOSE HERRERA)
 * Módulo de Administración del Sistema (Super Admin)
 */
class AdminManager {
    constructor() {
        this.paymentsSearchQuery = "";
        this.businessesSearchQuery = "";
        this.usersSearchQuery = "";
        this.productsSearchQuery = "";
        this.banksSearchQuery = "";
        this.cache = { users: [], businesses: [], products: [], payments: [], sales: [], sale_items: [], banks: [] };
    }

    async fetchAllAdminData() {
        try {
            const [bizRes, usrRes, payRes, prodRes, salesRes, itemsRes, bankRes] = await Promise.all([
                DB.query("SELECT * FROM businesses").catch(() => null),
                DB.query("SELECT * FROM users").catch(() => null),
                DB.query("SELECT * FROM payments").catch(() => null),
                DB.query("SELECT * FROM products").catch(() => null),
                DB.query("SELECT * FROM sales").catch(() => null),
                DB.query("SELECT * FROM sale_items").catch(() => null),
                DB.query("SELECT * FROM banks").catch(() => null)
            ]);

            // 1. Comercios con desduplicación estricta por id o por email/owner_user_id
            let bizList = (bizRes && bizRes.rows && bizRes.rows.length > 0) ? bizRes.rows : DB.getLocalTable("businesses");
            const localBiz = DB.getLocalTable("businesses");
            localBiz.forEach(lb => {
                if (!bizList.some(b => b.id === lb.id || (b.owner_user_id && b.owner_user_id === lb.owner_user_id))) {
                    bizList.push(lb);
                }
            });
            const bizMap = new Map();
            bizList.forEach(b => {
                const key = b.id || (b.owner_user_id ? "owner_" + b.owner_user_id : null) || (b.email ? "email_" + b.email.toLowerCase() : null);
                if (key && !bizMap.has(key)) bizMap.set(key, b);
            });
            this.cache.businesses = Array.from(bizMap.values());

            // 2. Usuarios con desduplicación estricta por id o por email
            let usrList = (usrRes && usrRes.rows && usrRes.rows.length > 0) ? usrRes.rows : DB.getLocalTable("users");
            const localUsers = DB.getLocalTable("users");
            usrList = usrList.map(tu => {
                const lu = localUsers.find(l => l.id === tu.id || (l.email && l.email.toLowerCase() === tu.email.toLowerCase()));
                return lu ? {
                    ...lu,
                    ...tu,
                    membership_expires_at: tu.membership_expires_at || lu.membership_expires_at,
                    membership_type: tu.membership_type || lu.membership_type,
                    is_active: tu.is_active !== undefined && tu.is_active !== null ? tu.is_active : lu.is_active
                } : tu;
            });
            localUsers.forEach(lu => {
                if (!usrList.some(u => u.id === lu.id || (u.email && u.email.toLowerCase() === lu.email.toLowerCase()))) {
                    usrList.push(lu);
                }
            });
            const usrMap = new Map();
            usrList.forEach(u => {
                const key = u.id || (u.email ? u.email.toLowerCase() : null);
                if (key && !usrMap.has(key)) usrMap.set(key, u);
            });
            this.cache.users = Array.from(usrMap.values());

            // 3. Pagos
            let payList = (payRes && payRes.rows && payRes.rows.length > 0) ? payRes.rows : DB.getLocalTable("payments");
            const localPay = DB.getLocalTable("payments");
            localPay.forEach(lp => {
                if (!payList.some(p => p.id === lp.id)) payList.push(lp);
            });
            this.cache.payments = payList;

            // 4. Productos
            let prodList = (prodRes && prodRes.rows && prodRes.rows.length > 0) ? prodRes.rows : DB.getLocalTable("products");
            const localProd = DB.getLocalTable("products");
            localProd.forEach(lp => {
                if (!prodList.some(p => p.id === lp.id)) prodList.push(lp);
            });
            this.cache.products = prodList;

            // 5. Ventas
            let salesList = (salesRes && salesRes.rows && salesRes.rows.length > 0) ? salesRes.rows : DB.getLocalTable("sales");
            const localSales = DB.getLocalTable("sales");
            localSales.forEach(ls => {
                if (!salesList.some(s => s.id === ls.id)) salesList.push(ls);
            });
            this.cache.sales = salesList;

            // 6. Ítems de venta
            let itemsList = (itemsRes && itemsRes.rows && itemsRes.rows.length > 0) ? itemsRes.rows : DB.getLocalTable("sale_items");
            const localItems = DB.getLocalTable("sale_items");
            localItems.forEach(li => {
                if (!itemsList.some(i => i.id === li.id)) itemsList.push(li);
            });
            this.cache.sale_items = itemsList;

            // 7. Bancos
            let bankList = (bankRes && bankRes.rows && bankRes.rows.length > 0) ? bankRes.rows : DB.getLocalTable("banks");
            const localBanks = DB.getLocalTable("banks");
            localBanks.forEach(lb => {
                if (!bankList.some(b => b.id === lb.id || b.name === lb.name)) bankList.push(lb);
            });
            this.cache.banks = bankList;
        } catch (e) {
            console.warn("Error loading admin data batch:", e);
        }
    }

    /**
     * Renderiza el Panel Principal de Administración
     */
    async renderAdminDashboard(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Cargar Datos en Lote Paralelo Rápido
        await this.fetchAllAdminData();
        const stats = this.getGlobalStats();

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
                    <button class="nav-link active" id="tab-sales-tab" data-bs-toggle="tab" data-bs-target="#tab-sales" type="button" onclick="Admin.loadAdminSalesAnalytics()"><i class="bi bi-bar-chart-line-fill me-1 text-success"></i> Ventas Gestionadas</button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" id="tab-payments-tab" data-bs-toggle="tab" data-bs-target="#tab-payments" type="button"><i class="bi bi-cash-stack me-1"></i> Membresías y Pagos</button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" id="tab-users-tab" data-bs-toggle="tab" data-bs-target="#tab-users" type="button"><i class="bi bi-person-lines-fill me-1"></i> Registro de Usuarios (${stats.totalUsers})</button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" id="tab-clients-tab" data-bs-toggle="tab" data-bs-target="#tab-clients" type="button"><i class="bi bi-shop me-1"></i> Comercios y Licencias (${stats.totalBusinesses})</button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" id="tab-products-tab" data-bs-toggle="tab" data-bs-target="#tab-products" type="button" onclick="Admin.loadAdminProductsTable()"><i class="bi bi-box-seam me-1"></i> Catálogo de Productos (${stats.totalProducts})</button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" id="tab-banks-tab" data-bs-toggle="tab" data-bs-target="#tab-banks" type="button" onclick="Admin.loadAdminBanksTable()"><i class="bi bi-bank2 me-1 text-primary"></i> Bancos Venezolanos</button>
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
                <!-- 0. ESTADÍSTICAS Y VENTAS GESTIONADAS -->
                <div class="tab-pane fade show active" id="tab-sales">
                    <div id="adminSalesAnalyticsContainer">
                        <div class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2"></span> Cargando analítica general de ventas...</div>
                    </div>
                </div>

                <!-- 1. MEMBRESÍAS Y PAGOS -->
                <div class="tab-pane fade" id="tab-payments">
                    <!-- Configuración de Tarifa y Tasa BCV -->
                    <div class="card shadow-sm border-0 mb-4">
                        <div class="card-header bg-body text-body py-3">
                            <h5 class="mb-0 fw-bold"><i class="bi bi-gear-fill me-2 text-primary"></i> Configuración de Tarifas del Sistema</h5>
                        </div>
                        <div class="card-body">
                            <form class="row g-3 align-items-end" onsubmit="Admin.saveSystemSettings(event)">
                                <div class="col-md-4">
                                    <label class="form-label fw-semibold">Precio de Membresía ($ USD Mensual)</label>
                                    <div class="input-group">
                                        <span class="input-group-text">$</span>
                                        <input type="number" step="0.01" class="form-control" id="adminMembershipPriceInput" value="${CONFIG.MEMBERSHIP_PRICE_USD.toFixed(2)}" required>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label fw-semibold">Tasa Oficial BCV (Bs. / USD)</label>
                                    <div class="input-group">
                                        <span class="input-group-text">Bs.</span>
                                        <input type="number" step="0.01" class="form-control" id="adminBcvRateInput" value="${CONFIG.DEFAULT_BCV_RATE.toFixed(2)}" required>
                                        <button type="button" class="btn btn-outline-success" onclick="Admin.syncBcvFromApi(event)" title="Obtener tasa oficial en vivo desde ve.dolarapi.com"><i class="bi bi-arrow-repeat me-1"></i> DolarAPI</button>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <button type="submit" class="btn btn-primary w-100"><i class="bi bi-save me-1"></i> Guardar Tarifas</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-body text-body d-flex justify-content-between align-items-center py-3">
                            <h5 class="mb-0 fw-bold"><i class="bi bi-clock-history me-2"></i> Reportes de Pago Pendientes de Verificación</h5>
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
                                            <th>Monto</th>
                                            <th>Comprobante</th>
                                            <th>Fecha</th>
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

                <!-- 2. REGISTRO DE USUARIOS -->
                <div class="tab-pane fade" id="tab-users">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-body text-body d-flex justify-content-between align-items-center py-3">
                            <h5 class="mb-0 fw-bold"><i class="bi bi-person-lines-fill me-2 text-primary"></i> Usuarios Registrados en la Plataforma</h5>
                            <input type="text" id="adminUsersSearchInput" class="form-control form-control-sm" style="max-width: 320px;" placeholder="🔍 Buscar por nombre, correo, rol o Google..." oninput="Admin.filterUsers(this.value)">
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-striped align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th>#</th>
                                            <th>Persona / Dueño</th>
                                            <th>Correo Electrónico & Tlf</th>
                                            <th>Rol</th>
                                            <th>Registro</th>
                                            <th>Membresía / Estado</th>
                                            <th class="text-end">Gestión de Acceso</th>
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
                        <div class="card-header bg-body text-body d-flex justify-content-between align-items-center py-3">
                            <h5 class="mb-0 fw-bold"><i class="bi bi-shop me-2 text-success"></i> Directorio de Comercios Registrados</h5>
                            <input type="text" id="adminBusinessesSearchInput" class="form-control form-control-sm" style="max-width: 320px;" placeholder="🔍 Buscar por nombre de comercio o dueño..." oninput="Admin.filterBusinesses(this.value)">
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-striped align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Nombre del Comercio</th>
                                            <th>Propietario / Email</th>
                                            <th>Licencia Propietario</th>
                                            <th>Teléfono / WhatsApp</th>
                                            <th class="text-end">Detalles</th>
                                        </tr>
                                    </thead>
                                    <tbody id="adminBusinessesTableBody">
                                        <!-- Comercios dinámicos -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 4. CATÁLOGO GLOBAL DE PRODUCTOS MONTADOS -->
                <div class="tab-pane fade" id="tab-products">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-body text-body d-flex justify-content-between align-items-center py-3">
                            <h5 class="mb-0 fw-bold"><i class="bi bi-box-seam me-2 text-info"></i> Catálogo Global de Productos Montados en la Plataforma</h5>
                            <input type="text" id="adminProductsSearchInput" class="form-control form-control-sm" style="max-width: 340px;" placeholder="🔍 Buscar por producto, tienda, categoría..." oninput="Admin.filterProducts(this.value)">
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-striped align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th>#</th>
                                            <th>Producto</th>
                                            <th>Categoría</th>
                                            <th>Stock</th>
                                            <th>Precio ($ / Bs.)</th>
                                            <th>Comercio / Tienda Publicadora</th>
                                            <th class="text-end">Contacto WhatsApp</th>
                                        </tr>
                                    </thead>
                                    <tbody id="adminProductsTableBody">
                                        <!-- Productos dinámicos -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- BANCOS VENEZOLANOS -->
                <div class="tab-pane fade" id="tab-banks">
                    <div class="card shadow-sm border-0 mb-4">
                        <div class="card-header bg-body text-body d-flex justify-content-between align-items-center py-3">
                            <h5 class="mb-0 fw-bold"><i class="bi bi-bank2 me-2 text-primary"></i> Gestión de Bancos Venezolanos Aceptados</h5>
                            <button class="btn btn-sm btn-success fw-bold" onclick="Admin.openAddBankModal()"><i class="bi bi-plus-circle me-1"></i> Agregar Nuevo Banco</button>
                        </div>
                        <div class="card-body">
                            <div class="input-group input-group-sm mb-3">
                                <span class="input-group-text"><i class="bi bi-search"></i></span>
                                <input type="text" class="form-control" placeholder="Buscar banco registrado por nombre..." oninput="Admin.filterBanksTable(this.value)">
                            </div>
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0 small">
                                    <thead class="table-light">
                                        <tr>
                                            <th>#</th>
                                            <th>Nombre Oficial del Banco</th>
                                            <th>Estado</th>
                                            <th class="text-end">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="adminBanksTableBody">
                                        <tr><td colspan="4" class="text-center text-muted py-3">Cargando bancos oficiales...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 5. FORMAS DE PAGO ACEPTADAS -->
                <div class="tab-pane fade" id="tab-methods">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-body text-body d-flex justify-content-between align-items-center py-3">
                            <h5 class="mb-0 fw-bold"><i class="bi bi-bank me-2 text-primary"></i> Gestión de Formas de Pago Aceptadas (VES / USD)</h5>
                            <button class="btn btn-sm btn-primary" onclick="Admin.openNewPaymentMethodModal()"><i class="bi bi-plus-lg me-1"></i> Nueva Forma de Pago</button>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Icono / Tipo</th>
                                            <th>Título de Pago</th>
                                            <th>Moneda</th>
                                            <th>Detalles de Cuenta / Pago</th>
                                            <th>Estado</th>
                                            <th class="text-end">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="adminPaymentMethodsTableBody">
                                        <!-- Se llena dinámicamente -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 6. CONECTIVIDAD Y APIS -->
                <div class="tab-pane fade" id="tab-connectivity">
                    <div class="card shadow-sm border-0 mb-4">
                        <div class="card-header bg-body text-body py-3">
                            <h5 class="mb-0 fw-bold"><i class="bi bi-wifi me-2 text-success"></i> Monitor de Conectividad a Base de Datos y APIs</h5>
                        </div>
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-md-4">
                                    <div class="card border p-3 shadow-sm h-100">
                                        <h6 class="fw-bold"><i class="bi bi-database me-2 text-primary"></i> Estado de la Base de Datos Turso DB</h6>
                                        <p class="small text-muted mb-2">Motor primario SQLite distribuido en la nube.</p>
                                        <div id="statusTursoDB" class="badge bg-secondary p-2 mb-3">Verificando conexión...</div>
                                        
                                        <div class="mt-auto pt-2 border-top">
                                            <label class="form-label small fw-bold text-dark mb-1"><i class="bi bi-link-45deg"></i> Endpoint URL Configurado:</label>
                                            <div class="input-group input-group-sm mb-2">
                                                <input type="text" class="form-control bg-body-tertiary font-monospace" value="${CONFIG.TURSO ? (CONFIG.TURSO.httpUrl || CONFIG.TURSO.url) : 'https://inventarios-herrejose.aws-ap-northeast-1.turso.io'}" readonly>
                                            </div>
                                            <div class="alert alert-info py-2 px-2 small mb-0" style="font-size: 0.78rem; line-height: 1.3;">
                                                <i class="bi bi-info-circle-fill me-1 text-info"></i> <strong>¿Dónde modificar este enlace?</strong><br>
                                                Si este servicio cambia de dirección en el futuro, puedes editar el dato en el archivo <code class="fw-bold text-dark">js/config.js</code> en la variable <code class="fw-bold text-dark">CONFIG.TURSO.httpUrl</code> (y <code class="fw-bold text-dark">CONFIG.TURSO.url</code>).
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="card border p-3 shadow-sm h-100">
                                        <h6 class="fw-bold"><i class="bi bi-currency-dollar me-2 text-success"></i> API Tasa de Cambio</h6>
                                        <p class="small text-muted mb-2">Monitoreo en vivo de la tasa oficial BCV.</p>
                                        <div id="statusDolarAPI" class="badge bg-secondary p-2 mb-3">Verificando API...</div>
                                        
                                        <div class="mt-auto pt-2 border-top">
                                            <label class="form-label small fw-bold text-dark mb-1"><i class="bi bi-link-45deg"></i> Endpoint URL Configurado:</label>
                                            <div class="input-group input-group-sm mb-2">
                                                <input type="text" class="form-control bg-body-tertiary font-monospace" value="${CONFIG.DOLAR_API_URL || 'https://ve.dolarapi.com/v1/dolares'}" readonly>
                                            </div>
                                            <div class="alert alert-info py-2 px-2 small mb-0" style="font-size: 0.78rem; line-height: 1.3;">
                                                <i class="bi bi-info-circle-fill me-1 text-info"></i> <strong>¿Dónde modificar este enlace?</strong><br>
                                                Si este servicio cambia de dirección en el futuro, puedes editar el dato en el archivo <code class="fw-bold text-dark">js/config.js</code> en la variable <code class="fw-bold text-dark">CONFIG.DOLAR_API_URL</code>.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="card border p-3 shadow-sm h-100">
                                        <h6 class="fw-bold"><i class="bi bi-cloud-arrow-up me-2 text-info"></i> Alojamiento de Imágenes (Cloudflare R2)</h6>
                                        <p class="small text-muted mb-2">Servicio de almacenamiento de logos y fotos.</p>
                                        <div id="statusR2Storage" class="badge bg-secondary p-2 mb-3">Verificando servicio...</div>
                                        
                                        <div class="mt-auto pt-2 border-top">
                                            <label class="form-label small fw-bold text-dark mb-1"><i class="bi bi-link-45deg"></i> Endpoint URL Configurado:</label>
                                            <div class="input-group input-group-sm mb-2">
                                                <input type="text" class="form-control bg-body-tertiary font-monospace" value="${CONFIG.CLOUDFLARE_R2 ? CONFIG.CLOUDFLARE_R2.endpoint : 'https://da7c23add0ce839e4989c068fbfa4394.r2.cloudflarestorage.com'}" readonly>
                                            </div>
                                            <div class="alert alert-info py-2 px-2 small mb-0" style="font-size: 0.78rem; line-height: 1.3;">
                                                <i class="bi bi-info-circle-fill me-1 text-info"></i> <strong>¿Dónde modificar este enlace?</strong><br>
                                                Si este servicio cambia de dirección en el futuro, puedes editar el dato en el archivo <code class="fw-bold text-dark">js/config.js</code> en la variable <code class="fw-bold text-dark">CONFIG.CLOUDFLARE_R2.endpoint</code>.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 7. INCIDENCIAS REPORTADAS -->
                <div class="tab-pane fade" id="tab-incidents">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-body text-body py-3">
                            <h5 class="mb-0 fw-bold"><i class="bi bi-exclamation-diamond me-2 text-warning"></i> Incidencias y Soporte de Usuarios</h5>
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

        this.loadAdminSalesAnalytics();
        this.loadAdminPaymentsTable();
        this.loadAdminUsersTable();
        this.loadAdminBusinessesTable();
        this.loadAdminProductsTable();
        this.loadAdminBanksTable();
        this.loadAdminPaymentMethods();
        this.loadAdminIncidentsTable();
        this.runConnectivityTests();
    }

    getGlobalStats() {
        return {
            totalBusinesses: this.cache.businesses ? this.cache.businesses.length : 0,
            totalUsers: this.cache.users ? this.cache.users.length : 0,
            pendingPayments: this.cache.payments ? this.cache.payments.filter(p => p.status === "pendiente").length : 0,
            totalProducts: this.cache.products ? this.cache.products.length : 0
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

    filterProducts(query = "") {
        this.productsSearchQuery = query.toLowerCase().trim();
        this.loadAdminProductsTable();
    }

    loadAdminProductsTable() {
        const tbody = document.getElementById("adminProductsTableBody");
        if (!tbody) return;

        let products = this.cache.products || DB.getLocalTable("products");
        const businesses = this.cache.businesses || DB.getLocalTable("businesses");
        const users = this.cache.users || DB.getLocalTable("users");

        if (this.productsSearchQuery) {
            const q = this.productsSearchQuery.toLowerCase();
            products = products.filter(p => {
                const biz = businesses.find(b => b.id === p.business_id) || {};
                return (p.name && p.name.toLowerCase().includes(q)) ||
                       (p.category && p.category.toLowerCase().includes(q)) ||
                       (p.description && p.description.toLowerCase().includes(q)) ||
                       (biz.name && biz.name.toLowerCase().includes(q));
            });
        }

        if (products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No hay productos registrados en la plataforma.</td></tr>`;
            return;
        }

        const bcvRate = CONFIG.DEFAULT_BCV_RATE || 36.50;

        tbody.innerHTML = products.map((p, i) => {
            const biz = businesses.find(b => b.id === p.business_id) || { name: "Comercio Desconocido" };
            const owner = users.find(u => u.id === biz.owner_user_id || (biz.email && u.email === biz.email)) || {};

            const priceUsd = parseFloat(p.sale_price || 0).toFixed(2);
            const priceVes = (parseFloat(p.sale_price || 0) * bcvRate).toFixed(2);
            const stock = parseInt(p.quantity || 0);
            const stockBadge = stock > 10 
                ? `<span class="badge bg-success">${stock}</span>` 
                : (stock > 0 
                    ? `<span class="badge bg-warning text-dark">${stock}</span>` 
                    : `<span class="badge bg-danger">Agotado</span>`);

            let phoneStr = biz.phone || owner.phone || "";
            let phoneClean = phoneStr.replace(/[^0-9]/g, '');
            if (phoneClean.startsWith('0')) phoneClean = '58' + phoneClean.substring(1);
            if (phoneClean && !phoneClean.startsWith('58') && phoneClean.length === 10) {
                phoneClean = '58' + phoneClean;
            }

            const waBtn = phoneClean 
                ? `<a href="https://wa.me/${phoneClean}" target="_blank" class="btn btn-xs btn-outline-success py-0 px-2 small" title="Contactar por WhatsApp"><i class="bi bi-whatsapp"></i></a>`
                : `<span class="text-muted small">-</span>`;

            return `
                <tr>
                    <td>${i + 1}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            ${p.image_url ? `<img src="${p.image_url}" class="rounded me-2 border" style="width: 36px; height: 36px; object-fit: cover;">` : '<div class="bg-light border rounded me-2 d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;"><i class="bi bi-box-seam text-muted"></i></div>'}
                            <div>
                                <strong>${p.name}</strong>
                                ${p.description ? `<br><small class="text-muted">${p.description.substring(0, 50)}${p.description.length > 50 ? '...' : ''}</small>` : ''}
                            </div>
                        </div>
                    </td>
                    <td><span class="badge bg-body-secondary text-body">${p.category || 'General'}</span></td>
                    <td>${stockBadge}</td>
                    <td>$${priceUsd} USD<br><small class="text-muted">Bs. ${priceVes}</small></td>
                    <td>
                        <strong><i class="bi bi-shop me-1 text-primary"></i>${biz.name}</strong>
                        ${owner.name ? `<br><small class="text-muted">${owner.name}</small>` : ''}
                    </td>
                    <td class="text-end">${waBtn}</td>
                </tr>
            `;
        }).join("");
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

        const now = new Date();
        payments[idx].status = newStatus;
        payments[idx].verified_at = now.toISOString();

        if (newStatus === "aprobado") {
            const userId = payments[idx].user_id;
            const payEmail = payments[idx].user_email || "";
            const targetUser = this.getUserById(userId) || (payEmail ? this.getUserById(payEmail) : null);

            if (targetUser) {
                const currentExpire = targetUser.membership_expires_at ? new Date(targetUser.membership_expires_at) : now;
                const baseDate = (currentExpire > now) ? currentExpire : now;
                const newExpire = new Date(baseDate.getTime() + 30 * 86400000);
                
                const expIso = newExpire.toISOString();
                payments[idx].valid_from = baseDate.toISOString();
                payments[idx].valid_until = expIso;

                this.updateUserInCacheAndStorage(targetUser.id, {
                    membership_expires_at: expIso,
                    membership_type: "comercial",
                    is_active: 1
                });

                try {
                    await DB.query(
                        "UPDATE users SET membership_expires_at = ?, membership_type = 'comercial', is_active = 1 WHERE id = ?",
                        [expIso, targetUser.id]
                    );
                } catch (e) {}

                try {
                    await DB.query(
                        "UPDATE payments SET status = 'aprobado', verified_at = ?, valid_from = ?, valid_until = ? WHERE id = ?",
                        [payments[idx].verified_at, payments[idx].valid_from, payments[idx].valid_until, paymentId]
                    );
                } catch (e) {}
            }

            AppUI.showAlert("Pago Aprobado", "¡Pago aprobado con éxito! Se han sumado 30 días adicionales a la membresía del cliente.", "success");
        } else {
            try {
                await DB.query("UPDATE payments SET status = 'rechazado', verified_at = ? WHERE id = ?", [payments[idx].verified_at, paymentId]);
            } catch (e) {}
            AppUI.showAlert("Pago Rechazado", "El reporte de pago ha sido marcado como rechazado.", "warning");
        }

        DB.setLocalTable("payments", payments);
        await this.loadAdminPaymentsTable();
        await this.loadAdminUsersTable();
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

    // Helper robusto para buscar usuario en Cache y LocalStorage por ID o Email
    getUserById(userId) {
        if (!userId) return null;
        const cacheUsers = this.cache.users || [];
        const localUsers = DB.getLocalTable("users") || [];
        const targetStr = String(userId).toLowerCase();
        
        return cacheUsers.find(u => String(u.id).toLowerCase() === targetStr || (u.email && u.email.toLowerCase() === targetStr)) ||
               localUsers.find(u => String(u.id).toLowerCase() === targetStr || (u.email && u.email.toLowerCase() === targetStr));
    }

    // Helper para actualizar datos de usuario simultáneamente en memoria (cache) y almacenamiento local
    updateUserInCacheAndStorage(userId, updatedFields) {
        if (!userId) return;
        const targetStr = String(userId).toLowerCase();

        // 1. LocalStorage
        const localUsers = DB.getLocalTable("users") || [];
        const localIdx = localUsers.findIndex(u => String(u.id).toLowerCase() === targetStr || (u.email && u.email.toLowerCase() === targetStr));
        if (localIdx >= 0) {
            localUsers[localIdx] = { ...localUsers[localIdx], ...updatedFields };
            DB.setLocalTable("users", localUsers);
        }

        // 2. Cache en Memoria
        if (this.cache.users) {
            const cacheIdx = this.cache.users.findIndex(u => String(u.id).toLowerCase() === targetStr || (u.email && u.email.toLowerCase() === targetStr));
            if (cacheIdx >= 0) {
                this.cache.users[cacheIdx] = { ...this.cache.users[cacheIdx], ...updatedFields };
            } else if (localIdx >= 0) {
                this.cache.users.push(localUsers[localIdx]);
            }
        }
    }

    loadAdminUsersTable() {
        const tbody = document.getElementById("adminUsersTableBody");
        if (!tbody) return;

        let users = this.cache.users || DB.getLocalTable("users");
        const businesses = this.cache.businesses || DB.getLocalTable("businesses");
        const roles = DB.getLocalTable("user_business_roles");

        // Ordenar por fecha más reciente
        users = [...users].sort((a, b) => new Date(b.created_at || b.trial_starts_at || 0) - new Date(a.created_at || a.trial_starts_at || 0));

        if (this.usersSearchQuery) {
            const q = this.usersSearchQuery.toLowerCase();
            users = users.filter(u => 
                (u.name && u.name.toLowerCase().includes(q)) ||
                (u.email && u.email.toLowerCase().includes(q)) ||
                (u.role && u.role.toLowerCase().includes(q)) ||
                (u.created_at && u.created_at.includes(q)) ||
                (u.google_id && (q.includes("google") || u.google_id.toLowerCase().includes(q)))
            );
        }

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No hay usuarios registrados que coincidan con la búsqueda.</td></tr>`;
            return;
        }

        const now = new Date();

        tbody.innerHTML = users.map((u, i) => {
            const dateStr = u.created_at || u.trial_starts_at;
            const regDate = dateStr ? new Date(dateStr).toLocaleDateString() + " " + new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Reciente";
            const roleBadge = u.role === "superadmin" ? '<span class="badge bg-danger">SuperAdmin</span>' : '<span class="badge bg-primary">Usuario / Dueño</span>';

            // Buscar comercio y teléfono
            const uRole = roles.find(r => r.user_email === u.email);
            const biz = businesses.find(b => (uRole && b.id === uRole.business_id) || b.owner_user_id === u.id || b.email === u.email) || {};
            
            let phoneStr = biz.phone || u.phone || "";
            let phoneClean = phoneStr.replace(/[^0-9]/g, '');
            if (phoneClean.startsWith('0')) phoneClean = '58' + phoneClean.substring(1);
            if (phoneClean && !phoneClean.startsWith('58') && !phoneClean.startsWith('56') && !phoneClean.startsWith('52') && phoneClean.length === 10) {
                phoneClean = '58' + phoneClean;
            }

            const waBtn = phoneClean 
                ? `<a href="https://wa.me/${phoneClean}" target="_blank" class="btn btn-xs btn-outline-success py-0 px-2 small ms-1" title="Contactar por WhatsApp"><i class="bi bi-whatsapp"></i> ${phoneStr}</a>`
                : `<span class="text-muted small">${phoneStr || 'Sin tlf'}</span>`;

            // Distintivo de Método de Registro (Google vs Registro Directo)
            const isGoogle = (u.google_id || (u.id && String(u.id).startsWith("usr_g_")));
            const originBadge = isGoogle
                ? '<span class="badge bg-danger text-white me-1"><i class="bi bi-google me-1"></i> Google OAuth</span>'
                : '<span class="badge bg-secondary text-white me-1"><i class="bi bi-person-check me-1"></i> Directo</span>';

            // Membresía, Fecha de Vencimiento y Cálculo de Días Restantes
            let expDate = null;
            let totalDurationDays = 15;

            if (u.membership_expires_at) {
                expDate = new Date(u.membership_expires_at);
                totalDurationDays = u.membership_type === "cortesia" ? 365 : 30;
            } else if (u.trial_starts_at || u.created_at) {
                expDate = new Date(new Date(u.trial_starts_at || u.created_at).getTime() + 15 * 86400000);
                totalDurationDays = 15;
            } else {
                expDate = new Date(now.getTime() + 15 * 86400000);
                totalDurationDays = 15;
            }

            const diffTime = expDate ? (expDate.getTime() - now.getTime()) : 0;
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let statusBadge = '<span class="badge bg-info text-dark">En Prueba (15 días)</span>';
            if (u.membership_type === "cortesia") {
                statusBadge = `<span class="badge bg-warning text-dark"><i class="bi bi-gift-fill me-1"></i> Cortesía (${expDate ? expDate.toLocaleDateString() : 'Indefinida'})</span>`;
            } else if (u.membership_expires_at) {
                if (daysLeft > 0) {
                    statusBadge = `<span class="badge bg-success"><i class="bi bi-patch-check-fill me-1"></i> Comercial (${expDate.toLocaleDateString()})</span>`;
                } else {
                    statusBadge = `<span class="badge bg-danger"><i class="bi bi-exclamation-triangle-fill me-1"></i> Vencida (${expDate.toLocaleDateString()})</span>`;
                }
            }

            // Calcular porcentaje y clase de la barra de progreso
            let pct = 0;
            let barClass = "bg-danger";

            if (daysLeft > 0) {
                pct = Math.min(100, Math.max(5, Math.round((daysLeft / totalDurationDays) * 100)));
                if (daysLeft > 7) barClass = "bg-success";
                else if (daysLeft > 3) barClass = "bg-warning";
                else barClass = "bg-danger";
            } else {
                pct = 0;
                barClass = "bg-danger";
            }

            const daysRemainingHtml = daysLeft > 0
                ? `<small class="fw-bold text-dark d-block mt-1"><i class="bi bi-clock-history me-1 text-primary"></i> Restan <strong>${daysLeft}</strong> día${daysLeft !== 1 ? 's' : ''}</small>`
                : `<small class="fw-bold text-danger d-block mt-1"><i class="bi bi-x-circle me-1"></i> Membresía Vencida</small>`;

            const progressBarHtml = `
                <div class="my-1" style="min-width: 130px;">
                    <div class="progress" style="height: 6px; background-color: rgba(0,0,0,0.1);" title="${daysLeft > 0 ? 'Restan ' + daysLeft + ' días' : 'Vencida'}">
                        <div class="progress-bar ${barClass} progress-bar-striped progress-bar-animated" role="progressbar" style="width: ${pct}%;" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    ${daysRemainingHtml}
                </div>
            `;

            const isSuspended = Number(u.is_active) === 0;
            const accountStateBadge = isSuspended
                ? '<span class="badge bg-danger"><i class="bi bi-person-x-fill me-1"></i> Suspendido</span>'
                : '<span class="badge bg-success"><i class="bi bi-person-check-fill me-1"></i> Activo</span>';

            return `
                <tr>
                    <td>${i + 1}</td>
                    <td>
                        <strong class="fs-6 text-dark">${u.name}</strong><br>
                        ${originBadge}
                        ${biz.name ? `<br><small class="text-muted fw-semibold"><i class="bi bi-shop me-1"></i> Comercio: ${biz.name}</small>` : ''}
                    </td>
                    <td>
                        <code>${u.email}</code><br>
                        ${waBtn}
                    </td>
                    <td>${roleBadge}</td>
                    <td><i class="bi bi-calendar-event me-1 text-muted"></i> ${regDate}</td>
                    <td>${statusBadge}${progressBarHtml}${accountStateBadge}</td>
                    <td class="text-end">
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-warning text-dark fw-semibold" onclick="Admin.openEditUserModal('${u.id}')" title="Editar Usuario"><i class="bi bi-pencil-square"></i> Editar</button>
                            <button class="btn btn-outline-success fw-semibold" onclick="Admin.openGrantMembershipModal('${u.id}')" title="Asignar Membresía o Cortesía"><i class="bi bi-gift"></i> Cortesía</button>
                            ${isSuspended 
                                ? `<button class="btn btn-outline-primary fw-semibold" onclick="Admin.toggleUserStatus('${u.id}', 1)" title="Activar Cuenta"><i class="bi bi-check-circle"></i> Activar</button>` 
                                : `<button class="btn btn-outline-danger fw-semibold" onclick="Admin.toggleUserStatus('${u.id}', 0)" title="Suspender Cuenta"><i class="bi bi-slash-circle"></i> Suspender</button>`
                            }
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    openEditUserModal(userId) {
        const u = this.getUserById(userId);
        if (!u) return AppUI.showAlert("Error", "Usuario no encontrado", "warning");

        const businesses = this.cache.businesses || DB.getLocalTable("businesses");
        const roles = DB.getLocalTable("user_business_roles");
        const uRole = roles.find(r => r.user_email === u.email);
        const biz = businesses.find(b => (uRole && b.id === uRole.business_id) || b.owner_user_id === u.id || b.email === u.email) || {};

        document.getElementById("editUserId").value = u.id;
        document.getElementById("editUserName").value = u.name || "";
        document.getElementById("editUserEmail").value = u.email || "";
        document.getElementById("editUserPhone").value = u.phone || biz.phone || "";
        document.getElementById("editUserBusinessName").value = biz.name || "";
        document.getElementById("editUserRole").value = u.role || "user";
        document.getElementById("editUserMembershipType").value = u.membership_type || "prueba";
        document.getElementById("editUserIsActive").value = (u.is_active !== undefined && u.is_active !== null ? u.is_active : 1).toString();

        const expDate = u.membership_expires_at ? new Date(u.membership_expires_at).toISOString().split("T")[0] : "";
        document.getElementById("editUserMembershipExpDate").value = expDate;

        const modal = new bootstrap.Modal(document.getElementById("modalEditUser"));
        modal.show();
    }

    async saveEditUser(event) {
        event.preventDefault();
        const userId = document.getElementById("editUserId").value;
        const name = document.getElementById("editUserName").value.trim();
        const email = document.getElementById("editUserEmail").value.trim();
        const phone = document.getElementById("editUserPhone").value.trim();
        const bizName = document.getElementById("editUserBusinessName").value.trim();
        const role = document.getElementById("editUserRole").value;
        const membershipType = document.getElementById("editUserMembershipType").value;
        const expDateStr = document.getElementById("editUserMembershipExpDate").value;
        const isActive = parseInt(document.getElementById("editUserIsActive").value);

        if (!userId || !name || !email) return;

        const expIso = expDateStr ? new Date(expDateStr + "T23:59:59").toISOString() : null;

        // Actualizar usuario en Memoria y LocalStorage
        this.updateUserInCacheAndStorage(userId, {
            name, email, phone, role,
            membership_type: membershipType,
            membership_expires_at: expIso,
            is_active: isActive
        });

        // Actualizar comercio asociado en LocalStorage
        const businesses = DB.getLocalTable("businesses");
        const bizIdx = businesses.findIndex(b => b.owner_user_id === userId || b.email === email);
        if (bizIdx >= 0) {
            if (bizName) businesses[bizIdx].name = bizName;
            if (phone) businesses[bizIdx].phone = phone;
            DB.setLocalTable("businesses", businesses);
        }

        // Actualizar en Turso DB
        try {
            await DB.query(
                "UPDATE users SET name = ?, email = ?, role = ?, membership_type = ?, membership_expires_at = ?, is_active = ? WHERE id = ?",
                [name, email, role, membershipType, expIso, isActive, userId]
            );
        } catch (e) {
            console.warn("Turso DB user update fallback:", e);
        }

        if (bizIdx >= 0 && bizName) {
            try {
                await DB.query(
                    "UPDATE businesses SET name = ?, phone = ? WHERE id = ?",
                    [bizName, phone, businesses[bizIdx].id]
                );
            } catch (e) {}
        }

        bootstrap.Modal.getInstance(document.getElementById("modalEditUser")).hide();
        AppUI.showAlert("Usuario Actualizado", `Los datos de <strong>${name}</strong> han sido actualizados exitosamente.`, "success");
        
        await this.loadAdminUsersTable();
        await this.loadAdminBusinessesTable();
    }

    openGrantMembershipModal(userId) {
        const u = this.getUserById(userId);
        if (!u) return AppUI.showAlert("Error", "Usuario no encontrado", "warning");

        document.getElementById("grantMembershipUserId").value = u.id;
        document.getElementById("grantMembershipUserName").value = `${u.name} (${u.email})`;
        document.getElementById("grantMembershipType").value = u.membership_type || "cortesia";

        const expDate = u.membership_expires_at ? new Date(u.membership_expires_at) : new Date(Date.now() + 30 * 86400000);
        document.getElementById("grantMembershipExpDate").value = expDate.toISOString().split("T")[0];

        const modal = new bootstrap.Modal(document.getElementById("modalGrantMembership"));
        modal.show();
    }

    quickSetGrantDate(daysStr) {
        if (!daysStr) return;
        const days = parseInt(daysStr);
        if (isNaN(days)) return;

        const date = new Date(Date.now() + days * 86400000);
        document.getElementById("grantMembershipExpDate").value = date.toISOString().split("T")[0];
    }

    async saveGrantMembership(event) {
        event.preventDefault();
        const userId = document.getElementById("grantMembershipUserId").value;
        const type = document.getElementById("grantMembershipType").value;
        const expDateStr = document.getElementById("grantMembershipExpDate").value;

        if (!userId || !expDateStr) return;

        const expIso = new Date(expDateStr + "T23:59:59").toISOString();

        // Actualizar usuario en Memoria y LocalStorage
        this.updateUserInCacheAndStorage(userId, {
            membership_expires_at: expIso,
            membership_type: type,
            is_active: 1
        });

        try {
            await DB.query(
                "UPDATE users SET membership_expires_at = ?, membership_type = ?, is_active = 1 WHERE id = ?",
                [expIso, type, userId]
            );
        } catch (e) {}

        bootstrap.Modal.getInstance(document.getElementById("modalGrantMembership")).hide();
        AppUI.showAlert("Membresía Otorgada", `¡Licencia de ${type.toUpperCase()} asignada con éxito hasta el ${new Date(expIso).toLocaleDateString()}!`, "success");
        this.loadAdminUsersTable();
    }

    async toggleUserStatus(userId, newStatus) {
        const u = this.getUserById(userId);
        if (!u) return AppUI.showAlert("Error", "Usuario no encontrado", "warning");

        const actionLabel = newStatus === 0 ? "suspender" : "activar";

        AppUI.showConfirm(
            `Confirmar Acción`,
            `¿Estás seguro de que deseas ${actionLabel} la cuenta de <strong>${u.name}</strong> (${u.email})?`,
            async () => {
                this.updateUserInCacheAndStorage(userId, { is_active: newStatus });
                try {
                    await DB.query("UPDATE users SET is_active = ? WHERE id = ?", [newStatus, userId]);
                } catch (e) {}

                AppUI.showAlert("Estado Actualizado", `La cuenta ha sido ${newStatus === 0 ? 'SUSPENDIDA' : 'ACTIVADA'} correctamente.`, newStatus === 0 ? "warning" : "success");
                Admin.loadAdminUsersTable();
            }
        );
    }

    showBusinessDetailsModal(businessId) {
        const businesses = DB.getLocalTable("businesses");
        const b = businesses.find(item => item.id === businessId);
        if (!b) return AppUI.showAlert("Error", "Comercio no encontrado", "warning");

        const users = DB.getLocalTable("users");
        const owner = users.find(u => u.id === b.owner_user_id) || { name: "Propietario", email: b.email || "N/A" };

        let phoneClean = b.phone ? b.phone.replace(/[^0-9]/g, '') : '';
        if (phoneClean.startsWith('0')) phoneClean = '58' + phoneClean.substring(1);
        if (phoneClean && !phoneClean.startsWith('58') && !phoneClean.startsWith('56') && !phoneClean.startsWith('52') && phoneClean.length === 10) {
            phoneClean = '58' + phoneClean;
        }

        const body = document.getElementById("businessDetailsModalBody");
        if (body) {
            body.innerHTML = `
                <div class="text-center mb-3">
                    ${b.logo_url ? `<img src="${b.logo_url}" class="rounded border p-1 mb-2" style="max-height: 80px;">` : `<div class="mx-auto rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mb-2" style="width: 64px; height: 64px; font-size: 28px;"><i class="bi bi-shop"></i></div>`}
                    <h5 class="fw-bold mb-1">${b.name}</h5>
                    <span class="badge bg-primary">${b.category_preset ? b.category_preset.toUpperCase() : 'GENERAL'}</span>
                </div>
                <hr>
                <div class="row g-3 small">
                    <div class="col-6">
                        <strong class="text-muted d-block">Número RIF:</strong>
                        <span>${b.rif || 'No registrado'}</span>
                    </div>
                    <div class="col-6">
                        <strong class="text-muted d-block">Fecha Registro:</strong>
                        <span>${b.created_at ? new Date(b.created_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div class="col-12">
                        <strong class="text-muted d-block">Propietario de Cuenta:</strong>
                        <span>${owner.name} (<code>${owner.email}</code>)</span>
                    </div>
                    <div class="col-6">
                        <strong class="text-muted d-block">Teléfono / WhatsApp:</strong>
                        <span>${b.phone || 'N/A'}</span>
                        ${phoneClean ? `<a href="https://wa.me/${phoneClean}" target="_blank" class="btn btn-sm btn-success d-block mt-1 py-1"><i class="bi bi-whatsapp me-1"></i> Abrir WhatsApp</a>` : ''}
                    </div>
                    <div class="col-6">
                        <strong class="text-muted d-block">Dirección:</strong>
                        <span>${b.address || 'Principal'}</span>
                    </div>
                </div>
            `;
        }

        const modal = new bootstrap.Modal(document.getElementById("modalBusinessDetails"));
        modal.show();
    }

    async loadAdminPaymentMethods() {
        const tbody = document.getElementById("adminPaymentMethodsTableBody");
        if (!tbody) return;

        const methods = DB.getLocalTable("payment_methods");
        if (methods.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No hay formas de pago configuradas.</td></tr>`;
            return;
        }

        const iconMap = { 'PagoMovil': 'bi-phone', 'Transferencia': 'bi-bank2', 'Binance': 'bi-currency-bitcoin', 'USDT': 'bi-coin', 'Zinli': 'bi-wallet2' };

        tbody.innerHTML = methods.map(m => {
            const icon = iconMap[m.type] || 'bi-credit-card';
            const statusBadge = Number(m.is_active) === 1 
                ? '<span class="badge bg-success">Activo</span>' 
                : '<span class="badge bg-secondary">Inactivo</span>';
            const currBadge = m.currency === 'USD' 
                ? '<span class="badge bg-success">USD</span>' 
                : '<span class="badge bg-primary">VES</span>';

            let details = '';
            if (m.bank_name) details += `Banco: ${m.bank_name}<br>`;
            if (m.account_number) details += `Cuenta/ID: <code>${m.account_number}</code><br>`;
            if (m.holder_name) details += `Titular: ${m.holder_name} ${m.holder_id ? '(' + m.holder_id + ')' : ''}<br>`;
            if (m.wallet_address) details += `Billetera: <code class="text-break">${m.wallet_address}</code>`;
            if (!details) details = '<span class="text-muted">Sin detalles</span>';

            return `
                <tr>
                    <td><i class="bi ${icon} fs-5 me-1 text-primary"></i> ${m.type}</td>
                    <td><strong>${m.title}</strong></td>
                    <td>${currBadge}</td>
                    <td class="small">${details}</td>
                    <td>${statusBadge}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-warning fw-semibold" onclick="Admin.openEditPaymentMethodModal('${m.id}')"><i class="bi bi-pencil-square me-1"></i> Editar</button>
                    </td>
                </tr>
            `;
        }).join("");
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

    loadAdminBusinessesTable() {
        const tbody = document.getElementById("adminBusinessesTableBody");
        if (!tbody) return;

        let businesses = this.cache.businesses || DB.getLocalTable("businesses");
        const users = this.cache.users || DB.getLocalTable("users");

        // Deduplicación estricta por id / owner_user_id / email
        const bizMap = new Map();
        businesses.forEach(b => {
            const key = b.id || (b.owner_user_id ? "owner_" + b.owner_user_id : null) || (b.email ? "email_" + b.email.toLowerCase() : null);
            if (key && !bizMap.has(key)) bizMap.set(key, b);
        });
        businesses = Array.from(bizMap.values());

        // Ordenar por fecha más reciente
        businesses.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        if (this.businessesSearchQuery) {
            const q = this.businessesSearchQuery.toLowerCase();
            businesses = businesses.filter(b => {
                const owner = users.find(u => u.id === b.owner_user_id || u.email === b.email) || {};
                return (b.name && b.name.toLowerCase().includes(q)) ||
                       (b.email && b.email.toLowerCase().includes(q)) ||
                       (b.category_preset && b.category_preset.toLowerCase().includes(q)) ||
                       (owner.name && owner.name.toLowerCase().includes(q)) ||
                       (owner.email && owner.email.toLowerCase().includes(q));
            });
        }

        if (businesses.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No se encontraron comercios registrados.</td></tr>`;
            return;
        }

        tbody.innerHTML = businesses.map(b => {
            const owner = users.find(u => u.id === b.owner_user_id || u.email === b.email) || { name: "Propietario Sin Registrar", email: b.email || "N/A" };
            
            // Estado de Membresía del Propietario
            let membershipBadge = '<span class="badge bg-info text-dark">Prueba (15 días)</span>';
            if (owner.membership_type === "cortesia") {
                membershipBadge = `<span class="badge bg-warning text-dark"><i class="bi bi-gift-fill me-1"></i> Cortesía (${owner.membership_expires_at ? new Date(owner.membership_expires_at).toLocaleDateString() : 'Indefinida'})</span>`;
            } else if (owner.membership_expires_at) {
                const exp = new Date(owner.membership_expires_at);
                if (exp > new Date()) {
                    membershipBadge = `<span class="badge bg-success"><i class="bi bi-patch-check-fill me-1"></i> Comercial (${exp.toLocaleDateString()})</span>`;
                } else {
                    membershipBadge = `<span class="badge bg-danger"><i class="bi bi-exclamation-triangle-fill me-1"></i> Vencida (${exp.toLocaleDateString()})</span>`;
                }
            }

            let phoneStr = b.phone || owner.phone || "";
            let phoneClean = phoneStr.replace(/[^0-9]/g, '');
            if (phoneClean.startsWith('0')) phoneClean = '58' + phoneClean.substring(1);
            if (phoneClean && !phoneClean.startsWith('58') && !phoneClean.startsWith('56') && !phoneClean.startsWith('52') && phoneClean.length === 10) {
                phoneClean = '58' + phoneClean;
            }

            const waBtn = phoneClean 
                ? `<a href="https://wa.me/${phoneClean}" target="_blank" class="btn btn-xs btn-outline-success py-0 px-2 small ms-1" title="Contactar por WhatsApp"><i class="bi bi-whatsapp"></i> ${phoneStr}</a>`
                : `<span class="text-muted small">${phoneStr || 'Sin tlf'}</span>`;

            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            ${b.logo_url ? `<img src="${b.logo_url}" class="rounded me-2 border shadow-sm" style="width: 38px; height: 38px; object-fit: contain;">` : '<div class="bg-primary text-white rounded me-2 d-flex align-items-center justify-content-center fw-bold fs-5" style="width: 38px; height: 38px;"><i class="bi bi-building"></i></div>'}
                            <div>
                                <strong class="fs-6 text-dark"><i class="bi bi-shop me-1 text-primary"></i> ${b.name}</strong><br>
                                <small class="text-muted">Categoría: ${b.category_preset || 'General'} ${b.rif ? '| RIF: ' + b.rif : ''}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <strong>${owner.name}</strong><br>
                        <small class="text-muted">${owner.email}</small>
                    </td>
                    <td>${membershipBadge}</td>
                    <td>${waBtn}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary fw-semibold" onclick="Admin.showBusinessDetailsModal('${b.id}')"><i class="bi bi-eye"></i> Detalles</button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    async runConnectivityTests() {
        await this.testTursoConnection();
        await this.testDolarApiConnection();
        await this.testR2Connection();
    }

    async testTursoConnection() {
        const badge = document.getElementById("statusTursoDB");
        if (!badge) return;
        badge.className = 'badge bg-warning text-dark p-2';
        badge.innerHTML = `<i class="bi bi-hourglass-split me-1"></i> Probando conexión...`;

        try {
            const res = await fetch(`${CONFIG.TURSO.httpUrl}/v2/pipeline`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${CONFIG.TURSO.authToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ requests: [{ type: "execute", stmt: { sql: "SELECT 1 AS alive" } }, { type: "close" }] })
            });
            if (res.ok) {
                badge.className = 'badge bg-success p-2';
                badge.innerHTML = `<i class="bi bi-check-circle me-1"></i> Conexión Turso DB Exitosa`;
            } else {
                throw new Error(`HTTP ${res.status}`);
            }
        } catch (e) {
            badge.className = 'badge bg-info text-dark p-2';
            badge.innerHTML = `<i class="bi bi-hdd-fill me-1"></i> Modo LocalStorage Activo (Turso inaccesible)`;
        }
    }

    async testDolarApiConnection() {
        const badge = document.getElementById("statusDolarAPI");
        if (!badge) return;
        badge.className = 'badge bg-warning text-dark p-2';
        badge.innerHTML = `<i class="bi bi-hourglass-split me-1"></i> Verificando API...`;

        try {
            const apiUrl = CONFIG.DOLAR_API_URL || "https://ve.dolarapi.com/v1/dolares";
            const res = await fetch(apiUrl);
            if (res.ok) {
                const data = await res.json();
                const oficial = Array.isArray(data) ? data.find(d => d.fuente === "oficial") : null;
                const rate = oficial ? oficial.promedio : null;
                badge.className = 'badge bg-success p-2';
                badge.innerHTML = `<i class="bi bi-check-circle me-1"></i> API DolarAPI Conectada${rate ? ' (Tasa: ' + rate + ' Bs.)' : ''}`;
            } else {
                throw new Error(`HTTP ${res.status}`);
            }
        } catch (e) {
            badge.className = 'badge bg-danger p-2';
            badge.innerHTML = `<i class="bi bi-x-circle me-1"></i> API DolarAPI Inaccesible`;
        }
    }

    async testR2Connection() {
        const badge = document.getElementById("statusR2Storage");
        if (!badge) return;
        badge.className = 'badge bg-warning text-dark p-2';
        badge.innerHTML = `<i class="bi bi-hourglass-split me-1"></i> Verificando servicio R2...`;

        try {
            const isAlive = await Storage.testR2Connection();
            if (isAlive) {
                badge.className = 'badge bg-success p-2';
                badge.innerHTML = `<i class="bi bi-check-circle me-1"></i> Cloudflare R2 Conectado (${CONFIG.CLOUDFLARE_R2.bucketName})`;
            } else {
                badge.className = 'badge bg-info text-dark p-2';
                badge.innerHTML = `<i class="bi bi-cloud-upload me-1"></i> Cloudflare R2 Configurado (${CONFIG.CLOUDFLARE_R2.bucketName})`;
            }
        } catch (e) {
            badge.className = 'badge bg-danger p-2';
            badge.innerHTML = `<i class="bi bi-x-circle me-1"></i> Cloudflare R2 No Configurado`;
        }
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

    async syncBcvFromApi(event) {
        const btn = event ? event.currentTarget : null;
        let origHtml = "";
        if (btn) {
            origHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>`;
        }

        const res = await AppUI.fetchLiveBcvRate(false);
        if (res.success) {
            const input = document.getElementById("adminBcvRateInput");
            if (input) input.value = res.rate.toFixed(2);
            alert(`¡Tasa Oficial BCV obtenida exitosamente desde ve.dolarapi.com!\n\nTasa Promedio Oficial: ${res.rate} Bs. / USD\nFecha Actualización: ${res.item && res.item.fechaActualizacion ? res.item.fechaActualizacion : 'Reciente'}`);
        } else {
            alert("No se pudo conectar a ve.dolarapi.com. Se mantendrá el valor actual.");
        }

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = origHtml;
        }
    }

    // ==========================================
    // 🏦 GESTIÓN DE BANCOS VENEZOLANOS (SUPERADMIN)
    // ==========================================

    loadAdminBanksTable() {
        const tbody = document.getElementById("adminBanksTableBody");
        if (!tbody) return;

        const banks = (this.cache.banks && this.cache.banks.length > 0) ? this.cache.banks : (DB.getLocalTable("banks") || []);
        const query = (this.banksSearchQuery || "").trim().toLowerCase();

        let filtered = banks;
        if (query) {
            filtered = banks.filter(b => b.name && b.name.toLowerCase().includes(query));
        }

        filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No hay bancos registrados que coincidan con la búsqueda.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map((b, i) => {
            const isActive = Number(b.is_active) === 1;

            return `
                <tr>
                    <td>${i + 1}</td>
                    <td>
                        <strong class="text-dark fs-6">${b.name}</strong><br>
                        <small class="text-muted">ID: <code>${b.id}</code></small>
                    </td>
                    <td>
                        <span class="badge ${isActive ? 'bg-success' : 'bg-secondary'} px-2 py-1 fs-6">
                            <i class="bi ${isActive ? 'bi-check-circle-fill' : 'bi-slash-circle-fill'} me-1"></i>
                            ${isActive ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td class="text-end">
                        <button class="btn btn-sm ${isActive ? 'btn-outline-warning' : 'btn-outline-success'} me-1" onclick="Admin.toggleAdminBankStatus('${b.id}')" title="${isActive ? 'Desactivar' : 'Activar'}">
                            <i class="bi ${isActive ? 'bi-pause-circle' : 'bi-play-circle'} me-1"></i> ${isActive ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="Admin.openEditBankModal('${b.id}')" title="Editar nombre">
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="Admin.deleteAdminBank('${b.id}')" title="Eliminar banco">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    filterBanksTable(query) {
        this.banksSearchQuery = query;
        this.loadAdminBanksTable();
    }

    openAddBankModal() {
        document.getElementById("adminBankIdInput").value = "";
        document.getElementById("adminBankNameInput").value = "";
        document.getElementById("adminBankStatusInput").value = "1";
        document.getElementById("modalAdminAddEditBankTitle").textContent = "Agregar Nuevo Banco Venezolano";

        const modal = new bootstrap.Modal(document.getElementById("modalAdminAddEditBank"));
        modal.show();
    }

    openEditBankModal(bankId) {
        const banks = (this.cache.banks && this.cache.banks.length > 0) ? this.cache.banks : (DB.getLocalTable("banks") || []);
        const bank = banks.find(b => b.id === bankId);
        if (!bank) return;

        document.getElementById("adminBankIdInput").value = bank.id;
        document.getElementById("adminBankNameInput").value = bank.name;
        document.getElementById("adminBankStatusInput").value = String(bank.is_active !== undefined ? bank.is_active : 1);
        document.getElementById("modalAdminAddEditBankTitle").textContent = "Editar Banco Venezolano";

        const modal = new bootstrap.Modal(document.getElementById("modalAdminAddEditBank"));
        modal.show();
    }

    async saveAdminBank(event) {
        event.preventDefault();
        const id = document.getElementById("adminBankIdInput").value;
        const name = document.getElementById("adminBankNameInput").value.trim();
        const isActive = parseInt(document.getElementById("adminBankStatusInput").value);

        if (!name) return alert("Por favor ingresa el nombre del banco.");

        const banks = (this.cache.banks && this.cache.banks.length > 0) ? this.cache.banks : (DB.getLocalTable("banks") || []);

        if (id) {
            // Editar existente
            const idx = banks.findIndex(b => b.id === id);
            if (idx >= 0) {
                banks[idx].name = name;
                banks[idx].is_active = isActive;
            }
            try {
                await DB.query("UPDATE banks SET name = ?, is_active = ? WHERE id = ?", [name, isActive, id]);
            } catch (e) {}
        } else {
            // Crear nuevo
            const newBank = {
                id: "bnk_" + Date.now(),
                name: name,
                is_active: isActive,
                created_at: new Date().toISOString()
            };
            banks.push(newBank);
            try {
                await DB.query("INSERT INTO banks (id, name, is_active, created_at) VALUES (?, ?, ?, ?)", [newBank.id, newBank.name, newBank.is_active, newBank.created_at]);
            } catch (e) {}
        }

        this.cache.banks = banks;
        DB.setLocalTable("banks", banks);

        const modalEl = document.getElementById("modalAdminAddEditBank");
        if (modalEl) {
            const inst = bootstrap.Modal.getInstance(modalEl);
            if (inst) inst.hide();
        }
        this.loadAdminBanksTable();
        if (typeof AppUI !== 'undefined' && AppUI.showAlert) {
            AppUI.showAlert("Banco Guardado", `El banco "${name}" se ha guardado exitosamente.`, "success");
        }
    }

    async toggleAdminBankStatus(bankId) {
        const banks = (this.cache.banks && this.cache.banks.length > 0) ? this.cache.banks : (DB.getLocalTable("banks") || []);
        const idx = banks.findIndex(b => b.id === bankId);
        if (idx < 0) return;

        const newStatus = Number(banks[idx].is_active) === 1 ? 0 : 1;
        banks[idx].is_active = newStatus;

        this.cache.banks = banks;
        DB.setLocalTable("banks", banks);

        try {
            await DB.query("UPDATE banks SET is_active = ? WHERE id = ?", [newStatus, bankId]);
        } catch (e) {}

        this.loadAdminBanksTable();
    }

    async deleteAdminBank(bankId) {
        const banks = (this.cache.banks && this.cache.banks.length > 0) ? this.cache.banks : (DB.getLocalTable("banks") || []);
        const bank = banks.find(b => b.id === bankId);
        if (!bank) return;

        if (!confirm(`¿Estás seguro de eliminar el banco "${bank.name}" de la lista?`)) return;

        const updated = banks.filter(b => b.id !== bankId);
        this.cache.banks = updated;
        DB.setLocalTable("banks", updated);

        try {
            await DB.query("DELETE FROM banks WHERE id = ?", [bankId]);
        } catch (e) {}

        this.loadAdminBanksTable();
    }

    // ==========================================
    // 📊 ANALÍTICA GENERAL Y VENTAS POR TIENDA
    // ==========================================
    // Helper para obtener el total en USD de cualquier registro de venta
    getSaleTotalUsd(s, saleItems = []) {
        if (!s) return 0;
        let usd = parseFloat(
            s.total_amount !== undefined && s.total_amount !== null ? s.total_amount :
            (s.total_amount_usd !== undefined && s.total_amount_usd !== null ? s.total_amount_usd :
            (s.total_usd !== undefined && s.total_usd !== null ? s.total_usd :
            (s.total_price !== undefined && s.total_price !== null ? s.total_price :
            (s.total !== undefined && s.total !== null ? s.total : 0))))
        );

        if (!isNaN(usd) && usd > 0) return usd;

        // Fallback: Sumar ítems de la venta si el total es 0 o indefinido
        const items = (saleItems || this.cache.sale_items || []).filter(item => item.sale_id === s.id);
        if (items.length > 0) {
            let sum = 0;
            items.forEach(it => {
                const qty = parseFloat(it.quantity || 1);
                const price = parseFloat(it.unit_price || it.price || 0);
                if (!isNaN(qty) && !isNaN(price)) {
                    sum += (qty * price);
                }
            });
            if (sum > 0) return sum;
        }

        return 0;
    }

    // Helper para obtener el nombre del cliente de una venta
    getClientNameForSale(s) {
        if (!s) return "Cliente de Contado";
        if (s.client_name && s.client_name.trim()) return s.client_name;

        const clients = this.cache.clients || DB.getLocalTable("clients") || [];
        if (s.client_id) {
            const c = clients.find(cl => cl.id === s.client_id);
            if (c && c.name) return c.name + (c.identification ? " (" + c.identification + ")" : "");
        }
        return "Cliente de Contado";
    }

    // ==========================================
    // 📊 ANALÍTICA GENERAL Y VENTAS POR TIENDA
    // ==========================================

    async loadAdminSalesAnalytics() {
        const container = document.getElementById("adminSalesAnalyticsContainer");
        if (!container) return;

        await this.fetchAllAdminData();

        const sales = this.cache.sales || [];
        const saleItems = this.cache.sale_items || [];
        const bcvRate = CONFIG.DEFAULT_BCV_RATE;

        let totalSalesCount = sales.length;
        let totalSalesUsd = 0;
        let currentMonthCount = 0;
        let currentMonthUsd = 0;

        const now = new Date();
        const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        sales.forEach(s => {
            const usd = this.getSaleTotalUsd(s, saleItems);
            totalSalesUsd += usd;

            const saleDate = s.created_at || s.sale_date || "";
            if (saleDate.startsWith(currentYearMonth)) {
                currentMonthCount++;
                currentMonthUsd += usd;
            }
        });

        const totalSalesVes = totalSalesUsd * bcvRate;
        const currentMonthVes = currentMonthUsd * bcvRate;

        // Renderizar Métricas de Ventas
        container.innerHTML = `
            <div class="row g-3 mb-4">
                <div class="col-md-3">
                    <div class="card bg-success text-white shadow-sm border-0 h-100">
                        <div class="card-body d-flex align-items-center">
                            <div class="fs-1 me-3"><i class="bi bi-cart-check-fill"></i></div>
                            <div>
                                <h6 class="card-title mb-0">Total Ventas Gestionadas</h6>
                                <h3 class="fw-bold mb-0">${totalSalesCount.toLocaleString()}</h3>
                                <small class="text-white-50">Plataforma Completa</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-primary text-white shadow-sm border-0 h-100">
                        <div class="card-body d-flex align-items-center">
                            <div class="fs-1 me-3"><i class="bi bi-currency-dollar"></i></div>
                            <div>
                                <h6 class="card-title mb-0">Volumen Total ($ USD)</h6>
                                <h3 class="fw-bold mb-0">$${totalSalesUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                                <small class="text-white-50">Acumulado General</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white shadow-sm border-0 h-100">
                        <div class="card-body d-flex align-items-center">
                            <div class="fs-1 me-3"><i class="bi bi-cash-stack"></i></div>
                            <div>
                                <h6 class="card-title mb-0">Volumen Total (Bs. VES)</h6>
                                <h3 class="fw-bold mb-0">Bs. ${totalSalesVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                                <small class="text-white-50">Tasa BCV (${bcvRate.toFixed(2)})</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-dark shadow-sm border-0 h-100">
                        <div class="card-body d-flex align-items-center">
                            <div class="fs-1 me-3"><i class="bi bi-graph-up-arrow"></i></div>
                            <div>
                                <h6 class="card-title mb-0">Ventas Este Mes</h6>
                                <h3 class="fw-bold mb-0">${currentMonthCount} (${'$' + currentMonthUsd.toFixed(2)})</h3>
                                <small class="text-dark-50">Bs. ${currentMonthVes.toFixed(2)}</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TABLA DE VENTAS POR TIENDA Y COMERCIO -->
            <div class="card shadow-sm border-0">
                <div class="card-header bg-body text-body d-flex justify-content-between align-items-center py-3">
                    <h5 class="mb-0 fw-bold"><i class="bi bi-shop me-2 text-success"></i> Ventas Gestionadas por Tienda / Comercio</h5>
                    <div class="input-group input-group-sm w-auto">
                        <span class="input-group-text"><i class="bi bi-search"></i></span>
                        <input type="text" class="form-control" placeholder="Buscar tienda o propietario..." oninput="Admin.filterStoreSalesTable(this.value)">
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0 small">
                            <thead class="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>Nombre del Comercio / Tienda</th>
                                    <th>Propietario / Correo</th>
                                    <th>Cant. Ventas</th>
                                    <th>Total ($ USD)</th>
                                    <th>Total (Bs. VES)</th>
                                    <th>Última Venta</th>
                                    <th class="text-end">Acción</th>
                                </tr>
                            </thead>
                            <tbody id="adminStoreSalesTableBody">
                                <!-- Se renderiza con renderStoreSalesTable() -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        this.renderStoreSalesTable();
    }

    renderStoreSalesTable(query = "") {
        const tbody = document.getElementById("adminStoreSalesTableBody");
        if (!tbody) return;

        const sales = this.cache.sales || [];
        const saleItems = this.cache.sale_items || [];
        const businesses = this.cache.businesses || [];
        const users = this.cache.users || [];
        const bcvRate = CONFIG.DEFAULT_BCV_RATE;

        // Agrupar ventas por business_id
        const storeStats = new Map();
        businesses.forEach(b => {
            const owner = users.find(u => u.id === b.owner_user_id || u.email === b.email) || {};
            storeStats.set(b.id, {
                business: b,
                owner: owner,
                count: 0,
                totalUsd: 0,
                lastSaleDate: null
            });
        });

        sales.forEach(s => {
            const bizId = s.business_id;
            let stat = storeStats.get(bizId);
            if (!stat) {
                const biz = businesses.find(b => b.id === bizId) || { id: bizId, name: "Comercio Anónimo" };
                stat = { business: biz, owner: {}, count: 0, totalUsd: 0, lastSaleDate: null };
                storeStats.set(bizId, stat);
            }
            stat.count++;
            const usd = this.getSaleTotalUsd(s, saleItems);
            stat.totalUsd += usd;

            const d = new Date(s.created_at || s.sale_date || 0);
            if (!stat.lastSaleDate || d > stat.lastSaleDate) {
                stat.lastSaleDate = d;
            }
        });

        let list = Array.from(storeStats.values());
        if (query && query.trim()) {
            const q = query.trim().toLowerCase();
            list = list.filter(item => 
                (item.business.name && item.business.name.toLowerCase().includes(q)) ||
                (item.owner.name && item.owner.name.toLowerCase().includes(q)) ||
                (item.owner.email && item.owner.email.toLowerCase().includes(q))
            );
        }

        list.sort((a, b) => b.totalUsd - a.totalUsd);

        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No se encontraron tiendas que coincidan con la búsqueda.</td></tr>`;
            return;
        }

        tbody.innerHTML = list.map((item, idx) => {
            const biz = item.business;
            const ownerName = item.owner.name || biz.owner_user_id || "Propietario";
            const ownerEmail = item.owner.email || biz.email || "N/A";
            const totalVes = item.totalUsd * bcvRate;
            const lastDateStr = item.lastSaleDate ? item.lastSaleDate.toLocaleDateString() + ' ' + item.lastSaleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Sin ventas";

            return `
                <tr>
                    <td>${idx + 1}</td>
                    <td>
                        <strong class="text-dark fs-6">${biz.name}</strong><br>
                        <small class="text-muted">ID: <code>${biz.id}</code></small>
                    </td>
                    <td>
                        <div class="fw-semibold">${ownerName}</div>
                        <small class="text-muted">${ownerEmail}</small>
                    </td>
                    <td>
                        <span class="badge bg-light text-dark border px-2 py-1 fs-6">${item.count} ventas</span>
                    </td>
                    <td>
                        <strong class="text-success fs-6">$${item.totalUsd.toFixed(2)} USD</strong>
                    </td>
                    <td>
                        <span class="text-primary fw-semibold">Bs. ${totalVes.toFixed(2)}</span>
                    </td>
                    <td>
                        <small class="text-muted"><i class="bi bi-clock-history me-1"></i> ${lastDateStr}</small>
                    </td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary" onclick="Admin.openBusinessSalesDetailModal('${biz.id}')">
                            <i class="bi bi-eye-fill me-1"></i> Ver Detalles
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    filterStoreSalesTable(query) {
        this.renderStoreSalesTable(query);
    }

    openBusinessSalesDetailModal(bizId) {
        const businesses = this.cache.businesses || [];
        const users = this.cache.users || [];
        const sales = this.cache.sales || [];
        const saleItems = this.cache.sale_items || [];
        const bcvRate = CONFIG.DEFAULT_BCV_RATE;

        const biz = businesses.find(b => b.id === bizId) || { id: bizId, name: "Comercio" };
        const owner = users.find(u => u.id === biz.owner_user_id || u.email === biz.email) || {};

        this._currentModalBizSales = sales.filter(s => s.business_id === bizId);
        this._currentModalBizSalesItems = saleItems;

        const titleEl = document.getElementById("adminStoreSalesName");
        const ownerEl = document.getElementById("adminStoreSalesOwner");
        const totalAmountEl = document.getElementById("adminStoreSalesTotalAmount");
        const totalCountEl = document.getElementById("adminStoreSalesTotalCount");

        if (titleEl) titleEl.textContent = `Comercio: ${biz.name}`;
        if (ownerEl) ownerEl.textContent = `Propietario: ${owner.name || 'N/A'} (${owner.email || biz.email || 'N/A'})`;

        const totalUsd = this._currentModalBizSales.reduce((sum, s) => sum + this.getSaleTotalUsd(s, saleItems), 0);
        if (totalAmountEl) totalAmountEl.textContent = `$${totalUsd.toFixed(2)} USD (Bs. ${(totalUsd * bcvRate).toFixed(2)})`;
        if (totalCountEl) totalCountEl.textContent = `${this._currentModalBizSales.length} Ventas Registradas`;

        this.renderStoreSalesDetailTable("");

        const modal = new bootstrap.Modal(document.getElementById("modalAdminBusinessSalesDetail"));
        modal.show();
    }

    renderStoreSalesDetailTable(query = "") {
        const tbody = document.getElementById("adminStoreSalesDetailTableBody");
        if (!tbody) return;

        const sales = this._currentModalBizSales || [];
        const saleItems = this._currentModalBizSalesItems || [];
        const products = this.cache.products || DB.getLocalTable("products") || [];
        const bcvRate = CONFIG.DEFAULT_BCV_RATE;

        let filtered = sales;
        if (query && query.trim()) {
            const q = query.trim().toLowerCase();
            filtered = sales.filter(s => {
                const clientName = this.getClientNameForSale(s).toLowerCase();
                return clientName.includes(q) ||
                    (s.reference_number && s.reference_number.toLowerCase().includes(q)) ||
                    (s.id && s.id.toLowerCase().includes(q));
            });
        }

        filtered.sort((a, b) => new Date(b.created_at || b.sale_date || 0) - new Date(a.created_at || a.sale_date || 0));

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No hay ventas registradas para este comercio.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map((s, i) => {
            const items = saleItems.filter(item => item.sale_id === s.id);
            const itemsHtml = items.length > 0
                ? items.map(it => {
                    const p = products.find(prod => prod.id === it.product_id) || {};
                    const pName = it.product_name || p.name || 'Producto';
                    const qty = parseFloat(it.quantity || 1);
                    const price = parseFloat(it.unit_price || it.price || p.price || 0);
                    return `<div class="small">• <strong>${pName}</strong> x${qty} ($${price.toFixed(2)})</div>`;
                }).join("")
                : '<span class="text-muted small">Sin detalle de productos</span>';

            const clientName = this.getClientNameForSale(s);
            const dateStr = s.created_at || s.sale_date ? new Date(s.created_at || s.sale_date).toLocaleString() : "Fecha N/A";
            const usd = this.getSaleTotalUsd(s, saleItems);
            const ves = usd * bcvRate;

            return `
                <tr>
                    <td><code>${s.id}</code></td>
                    <td><small class="text-muted"><i class="bi bi-calendar-event me-1"></i> ${dateStr}</small></td>
                    <td class="fw-semibold text-dark">${clientName}</td>
                    <td>${itemsHtml}</td>
                    <td><span class="badge bg-light text-dark border">${s.payment_method || 'Efectivo / Transferencia'}</span></td>
                    <td><strong class="text-success">$${usd.toFixed(2)} USD</strong></td>
                    <td><span class="text-primary fw-semibold">Bs. ${ves.toFixed(2)}</span></td>
                </tr>
            `;
        }).join("");
    }

    filterStoreSalesDetailTable(query) {
        this.renderStoreSalesDetailTable(query);
    }
}

const Admin = new AdminManager();
