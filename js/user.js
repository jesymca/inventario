/**
 * SISTEMA DE CONTROL DE INVENTARIOS MULTI-USUARIO (Emprendimiento JOSE HERRERA)
 * Módulo de Usuario Comercio (Sección de Uso del Sistema)
 */

class UserManager {
    constructor() {
        this.saleCartItems = [];
        this.purchaseCartItems = [];
        this.productSearchQuery = "";
        this.clientSearchQuery = "";
        this.supplierSearchQuery = "";
    }

    /**
     * Renderiza la Sección del Comercio
     */
    async renderUserDashboard(containerId, activeTab = "tab-inventory") {
        const container = document.getElementById(containerId);
        if (!container) return;

        const currentBiz = Auth.currentBusiness || { name: "Mi Comercio", branding_color: "#0d6efd" };
        const status = Auth.getMembershipStatus();
        const daysLeft = status.daysLeft;
        const totalDurationDays = status.totalDays;
        const isExpired = status.isExpired;
        const isSuspended = status.isSuspended;

        // Calcular porcentaje y color de la barra de progreso
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

        // Buscar si hay reportes de pago pendientes del usuario actual
        const currentUserId = Auth.currentUser ? Auth.currentUser.id : "";
        const currentUserEmail = Auth.currentUser ? (Auth.currentUser.email || "").toLowerCase() : "";
        const allPayments = DB.getLocalTable("payments") || [];
        const pendingPayment = allPayments.find(p => 
            (p.user_id === currentUserId || (p.user_email && p.user_email.toLowerCase() === currentUserEmail)) &&
            p.status === "pendiente"
        );

        // BLOQUEO ABSOLUTO: Si la membresía venció o está suspendido y NO es SuperAdmin
        if (!Auth.isSuperAdmin() && (isExpired || isSuspended)) {
            container.innerHTML = `
                <div id="systemLockoutView" class="container py-5 my-auto text-center">
                    <div class="row justify-content-center">
                        <div class="col-lg-7 col-md-9">
                            <div class="card shadow-lg border-0 rounded-4 p-4 text-center">
                                <div class="card-body">
                                    <!-- Logo del Comercio Centrado -->
                                    <div class="mb-3">
                                        <img src="${CONFIG.LOGO_PATH}" alt="Logo" height="75" class="rounded border p-1 shadow-sm">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <i class="${isSuspended ? 'bi bi-shield-x text-danger' : 'bi bi-lock-fill text-warning'}" style="font-size: 3.5rem;"></i>
                                    </div>

                                    <h3 class="fw-extrabold ${isSuspended ? 'text-danger' : 'text-dark'} mb-2">
                                        ${isSuspended ? 'CUENTA SUSPENDIDA POR EL ADMINISTRADOR' : 'TIEMPO DE USO BLOQUEADO'}
                                    </h3>

                                    <p class="text-muted leading-relaxed mb-4 fs-6">
                                        ${isSuspended 
                                            ? 'Tu acceso al sistema ha sido suspendido temporalmente por el Administrador. Si deseas solventar tu situación o solicitar la reactivación, declara tu pago de membresía o envía un reporte de incidencia.' 
                                            : 'Tu período de prueba gratuita o membresía ha caducado. Para continuar utilizando la plataforma de control de inventarios, declara tu pago a continuación para que sea validado.'
                                        }
                                    </p>

                                    <!-- Indicador de Pago Pendiente -->
                                    ${pendingPayment ? `
                                        <div class="alert alert-warning border-warning shadow-sm py-3 px-3 mb-4 text-start">
                                            <div class="d-flex align-items-center">
                                                <i class="bi bi-hourglass-split fs-3 text-warning me-3"></i>
                                                <div>
                                                    <h6 class="alert-heading fw-bold mb-1"><i class="bi bi-info-circle me-1"></i> REPORTE DE PAGO EN ESPERA DE CONFIRMACIÓN</h6>
                                                    <small class="text-dark">Tienes un reporte de pago registrado (Ref: <code>${pendingPayment.reference_number || 'N/A'}</code> del ${pendingPayment.payment_date || 'hoy'}) en proceso de revisión por el SuperAdmin. Al ser verificado, tu sistema se activará inmediatamente.</small>
                                                </div>
                                            </div>
                                        </div>
                                    ` : ''}

                                    <!-- Tarifa Mensual y Tasa BCV -->
                                    <div class="bg-body-tertiary p-3 rounded-3 mb-4 border shadow-sm">
                                        <div class="row align-items-center g-2 text-center">
                                            <div class="col-6 border-end">
                                                <small class="text-muted d-block fw-semibold" style="font-size: 0.75rem;">MEMBRESÍA MENSUAL</small>
                                                <span class="fs-5 fw-bold text-dark">$${CONFIG.MEMBERSHIP_PRICE_USD.toFixed(2)} USD</span>
                                            </div>
                                            <div class="col-6">
                                                <small class="text-muted d-block fw-semibold" style="font-size: 0.75rem;">TASA OFICIAL BCV</small>
                                                <span class="fs-5 fw-bold text-primary">Bs. ${CONFIG.DEFAULT_BCV_RATE.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Unicos accesos permitidos -->
                                    <div class="d-grid gap-2 col-md-10 mx-auto">
                                        <button class="btn btn-success btn-lg py-2.5 fw-bold shadow-sm" onclick="User.openReportPaymentModal()"><i class="bi bi-credit-card-2-front me-2"></i> Declarar / Reportar Pago de Membresía</button>
                                        <button class="btn btn-outline-warning text-dark py-2 fw-semibold" onclick="User.openReportIncidentModal()"><i class="bi bi-headset me-2"></i> Reportar Incidencia al Administrador</button>
                                        <button class="btn btn-outline-secondary py-2" onclick="Auth.logout()"><i class="bi bi-box-arrow-right me-2"></i> Cerrar Sesión</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        // SISTEMA ACTIVO: Renderizar dashboard completo
        container.innerHTML = `
            <!-- Banner de Estado de Membresía con Barra de Progreso Animada y Código de Colores -->
            <div class="card shadow-sm border-0 mb-3 bg-body-tertiary">
                <div class="card-body p-3">
                    <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                        <div class="d-flex align-items-center">
                            <div class="fs-2 me-3 text-primary"><i class="bi bi-shield-check"></i></div>
                            <div>
                                <div class="d-flex align-items-center gap-2 mb-1">
                                    <h6 class="fw-bold mb-0 text-dark">${status.label}</h6>
                                    <span class="badge ${barClass}">Activo</span>
                                </div>
                                <small class="text-muted">Membresía Mensual: <strong>$${CONFIG.MEMBERSHIP_PRICE_USD.toFixed(2)} USD</strong> (Tasa Oficial BCV: Bs. ${CONFIG.DEFAULT_BCV_RATE.toFixed(2)})</small>
                            </div>
                        </div>

                        <!-- Barra de Progreso de Tiempo Restante -->
                        <div class="flex-grow-1 mx-md-3" style="max-width: 320px;">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <small class="fw-bold text-dark"><i class="bi bi-clock-history text-primary me-1"></i> Restan <strong>${daysLeft}</strong> día${daysLeft !== 1 ? 's' : ''}</small>
                                <small class="text-muted fw-semibold">${pct}%</small>
                            </div>
                            <div class="progress" style="height: 8px; background-color: rgba(0,0,0,0.1);" title="Vigencia Restante">
                                <div class="progress-bar ${barClass} progress-bar-striped progress-bar-animated" role="progressbar" style="width: ${pct}%;" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                        </div>

                        <div>
                            <button class="btn btn-dark btn-sm fw-semibold text-nowrap" onclick="User.openReportPaymentModal()"><i class="bi bi-credit-card me-1"></i> Reportar Pago / Historial</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Alerta de Vencimiento Próximo (si quedan 15 días o menos) -->
            ${daysLeft <= 15 && daysLeft > 0 ? `
                <div class="alert alert-warning border-warning shadow-sm py-2 px-3 mb-3 d-flex align-items-center justify-content-between">
                    <div class="small fw-semibold text-dark">
                        <i class="bi bi-exclamation-triangle-fill text-warning me-2 fs-5"></i>
                        <strong>Aviso de Vencimiento:</strong> Tu servicio se está agotando (restan ${daysLeft} día${daysLeft !== 1 ? 's' : ''}). Te sugerimos realizar tu reporte de pago a tiempo para extender tu suscripción sin interrupciones.
                    </div>
                    <button class="btn btn-sm btn-outline-dark fw-bold py-1 px-2 text-nowrap ms-2" onclick="User.openReportPaymentModal()">Renovar Ahora</button>
                </div>
            ` : ''}

            ${Number(currentBiz.is_demo_active || 0) === 1 ? `
                <!-- Banner de Modo Datos de Prueba Activo -->
                <div class="alert alert-warning border-warning shadow-sm d-flex justify-content-between align-items-center mb-4">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-flask fs-2 text-warning me-3"></i>
                        <div>
                            <h6 class="alert-heading mb-0 fw-bold"><i class="bi bi-info-circle me-1"></i> MODO DATOS DE PRUEBA / EJEMPLO ACTIVO</h6>
                            <small class="text-dark">Estás visualizando datos demostrativos de ejemplo para el rubro <strong>${(currentBiz.category_preset || 'General').toUpperCase()}</strong>. Puedes apagar este modo o cambiar de rubro en la barra superior o en <strong>Perfil Negocio</strong>.</small>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-outline-dark fw-semibold ms-2" onclick="AppUI.toggleDemoData(false)"><i class="bi bi-x-circle me-1"></i> Desactivar Datos Prueba</button>
                </div>
            ` : ''}

            <!-- Barra de Navegación por Pestañas del Comercio (Responsive Sub-Navbar) -->
            <nav class="navbar navbar-expand-lg navbar-dark bg-dark text-white rounded-3 shadow-sm mb-4 px-3 py-2">
                <div class="container-fluid px-0">
                    <span class="navbar-brand fs-6 fw-bold text-white me-3 d-flex align-items-center">
                        <i class="bi bi-grid-3x3-gap-fill me-2 text-warning"></i> Menú de Gestión
                    </span>
                    <button class="navbar-toggler border-0 shadow-none py-1 px-2" type="button" data-bs-toggle="collapse" data-bs-target="#userSubNavbarCollapse" aria-controls="userSubNavbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    
                    <div class="collapse navbar-collapse" id="userSubNavbarCollapse">
                        <ul class="nav nav-pills navbar-nav me-auto mb-2 mb-lg-0 flex-wrap gap-1" id="userPillsTab" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link ${activeTab === 'tab-inventory' ? 'active' : ''} text-white py-1 px-3 fw-semibold small" id="pills-inventory-tab" data-bs-toggle="pill" data-bs-target="#pills-inventory" type="button" role="tab" onclick="AppUI.closeMobileUserMenu()"><i class="bi bi-box-seam me-1 text-info"></i> Inventario</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link ${activeTab === 'tab-sales' ? 'active' : ''} text-white py-1 px-3 fw-semibold small" id="pills-sales-tab" data-bs-toggle="pill" data-bs-target="#pills-sales" type="button" role="tab" onclick="AppUI.closeMobileUserMenu()"><i class="bi bi-cart-check me-1 text-success"></i> Ventas</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link ${activeTab === 'tab-purchases' ? 'active' : ''} text-white py-1 px-3 fw-semibold small" id="pills-purchases-tab" data-bs-toggle="pill" data-bs-target="#pills-purchases" type="button" role="tab" onclick="AppUI.closeMobileUserMenu()"><i class="bi bi-bag-plus me-1 text-warning"></i> Compras</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link ${activeTab === 'tab-clients' ? 'active' : ''} text-white py-1 px-3 fw-semibold small" id="pills-clients-tab" data-bs-toggle="pill" data-bs-target="#pills-clients" type="button" role="tab" onclick="AppUI.closeMobileUserMenu()"><i class="bi bi-people me-1 text-primary"></i> Clientes</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link ${activeTab === 'tab-suppliers' ? 'active' : ''} text-white py-1 px-3 fw-semibold small" id="pills-suppliers-tab" data-bs-toggle="pill" data-bs-target="#pills-suppliers" type="button" role="tab" onclick="AppUI.closeMobileUserMenu()"><i class="bi bi-truck me-1 text-light"></i> Proveedores</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link ${activeTab === 'tab-reports' ? 'active' : ''} text-white py-1 px-3 fw-semibold small" id="pills-reports-tab" data-bs-toggle="pill" data-bs-target="#pills-reports" type="button" role="tab" onclick="User.loadDynamicReports(); AppUI.closeMobileUserMenu();"><i class="bi bi-file-earmark-bar-graph me-1 text-danger"></i> Reportes</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link ${activeTab === 'tab-stats' ? 'active' : ''} text-white py-1 px-3 fw-semibold small" id="pills-stats-tab" data-bs-toggle="pill" data-bs-target="#pills-stats" type="button" role="tab" onclick="User.loadStatisticsCharts(); AppUI.closeMobileUserMenu();"><i class="bi bi-graph-up-arrow me-1 text-info"></i> Estadísticas</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link ${activeTab === 'tab-maintenance' ? 'active' : ''} text-white py-1 px-3 fw-semibold small" id="pills-maintenance-tab" data-bs-toggle="pill" data-bs-target="#pills-maintenance" type="button" role="tab" onclick="User.loadMaintenanceTab(); AppUI.closeMobileUserMenu();"><i class="bi bi-database-down me-1 text-warning"></i> Mantenimiento & Respaldos</button>
                            </li>
                            <li class="nav-item ms-lg-auto" role="presentation">
                                <button class="nav-link ${activeTab === 'tab-profile' ? 'active' : ''} text-white py-1 px-3 fw-semibold small" id="pills-profile-tab" data-bs-toggle="pill" data-bs-target="#pills-profile" type="button" role="tab" onclick="AppUI.closeMobileUserMenu()"><i class="bi bi-gear me-1 text-success"></i> Perfil Negocio</button>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <div class="tab-content" id="userPillsContent">
                <!-- 1. TAB INVENTARIO -->
                <div class="tab-pane fade ${activeTab === 'tab-inventory' ? 'show active' : ''}" id="pills-inventory">
                    <div class="card shadow-sm border-0 mb-4">
                        <div class="card-header bg-body d-flex flex-wrap justify-content-between align-items-center gap-2 py-3">
                            <h5 class="mb-0 fw-bold"><i class="bi bi-boxes me-2"></i> Inventario de Productos</h5>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-outline-danger" onclick="PDFGenerator.generateInventoryPDF(DB.getLocalTable('products').filter(p=>p.business_id === Auth.currentBusiness.id), Auth.currentBusiness)"><i class="bi bi-file-earmark-pdf me-1"></i> PDF</button>
                                <button class="btn btn-sm btn-outline-secondary" onclick="User.openImportModal('products')"><i class="bi bi-file-earmark-spreadsheet me-1"></i> Carga Masiva CSV</button>
                                <button class="btn btn-sm btn-primary" onclick="User.openNewProductModal()"><i class="bi bi-plus-lg me-1"></i> Nuevo Producto</button>
                            </div>
                        </div>
                        <!-- Búsqueda en tiempo real Inventario -->
                        <div class="card-body border-bottom bg-light py-2">
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
                                <input type="text" class="form-control bg-white border-start-0" id="searchProductsInput" value="${this.productSearchQuery}" placeholder="🔍 Búsqueda en tiempo real por nombre, categoría o descripción..." oninput="User.filterProducts(this.value)">
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Imagen</th>
                                            <th>Producto</th>
                                            <th>Categoría</th>
                                            <th>Stock</th>
                                            <th>P. Compra ($)</th>
                                            <th>P. Venta ($)</th>
                                            <th class="text-end">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="userProductsTableBody">
                                        <!-- Productos dinámicos -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 2. TAB VENTAS -->
                <div class="tab-pane fade ${activeTab === 'tab-sales' ? 'show active' : ''}" id="pills-sales">
                    <div class="card shadow-sm border-0 mb-4">
                        <div class="card-header bg-body d-flex justify-content-between align-items-center py-3">
                            <h5 class="mb-0 fw-bold"><i class="bi bi-cart-plus me-2"></i> Registrar Nueva Venta</h5>
                            <button class="btn btn-sm btn-success" onclick="User.openNewSaleModal()"><i class="bi bi-plus-circle me-1"></i> Realizar Venta Multi-Producto</button>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-striped align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th># Venta</th>
                                            <th>Cliente</th>
                                            <th>Monto Total ($)</th>
                                            <th>Fecha</th>
                                            <th class="text-end">WhatsApp</th>
                                        </tr>
                                    </thead>
                                    <tbody id="userSalesTableBody">
                                        <!-- Ventas registradas -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 3. TAB COMPRAS -->
                <div class="tab-pane fade ${activeTab === 'tab-purchases' ? 'show active' : ''}" id="pills-purchases">
                    <div class="card shadow-sm border-0 mb-4">
                        <div class="card-header bg-body d-flex justify-content-between align-items-center py-3">
                            <h5 class="mb-0 fw-bold"><i class="bi bi-bag-check me-2"></i> Registrar Nueva Compra (Entrada Stock)</h5>
                            <button class="btn btn-sm btn-primary" onclick="User.openNewPurchaseModal()"><i class="bi bi-plus-circle me-1"></i> Registrar Compra Multi-Producto</button>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-striped align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th># Compra</th>
                                            <th>Proveedor</th>
                                            <th>Monto Total ($)</th>
                                            <th>Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody id="userPurchasesTableBody">
                                        <!-- Compras registradas -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 4. TAB CLIENTES -->
                <div class="tab-pane fade ${activeTab === 'tab-clients' ? 'show active' : ''}" id="pills-clients">
                    <div class="card shadow-sm border-0 mb-4">
                        <div class="card-header bg-body d-flex flex-wrap justify-content-between align-items-center gap-2 py-3">
                            <h5 class="mb-0 fw-bold"><i class="bi bi-person-lines-fill me-2"></i> Directorio de Clientes</h5>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-outline-danger" onclick="PDFGenerator.generateClientsPDF(DB.getLocalTable('clients').filter(c=>c.business_id === Auth.currentBusiness.id), Auth.currentBusiness)"><i class="bi bi-file-earmark-pdf me-1"></i> PDF</button>
                                <button class="btn btn-sm btn-outline-secondary" onclick="User.openImportModal('clients')"><i class="bi bi-file-earmark-spreadsheet me-1"></i> Carga Masiva CSV</button>
                                <button class="btn btn-sm btn-primary" onclick="User.openNewClientModal()"><i class="bi bi-plus-lg me-1"></i> Nuevo Cliente</button>
                            </div>
                        </div>
                        <!-- Búsqueda en tiempo real Clientes -->
                        <div class="card-body border-bottom bg-light py-2">
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
                                <input type="text" class="form-control bg-white border-start-0" id="searchClientsInput" value="${this.clientSearchQuery}" placeholder="🔍 Búsqueda en tiempo real por cédula/RIF, nombre, teléfono o dirección..." oninput="User.filterClients(this.value)">
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Cédula / RIF</th>
                                            <th>Nombre Completo</th>
                                            <th>Teléfono</th>
                                            <th>Dirección</th>
                                            <th class="text-end">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="userClientsTableBody">
                                        <!-- Clientes -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 5. TAB PROVEEDORES -->
                <div class="tab-pane fade ${activeTab === 'tab-suppliers' ? 'show active' : ''}" id="pills-suppliers">
                    <div class="card shadow-sm border-0 mb-4">
                        <div class="card-header bg-body d-flex flex-wrap justify-content-between align-items-center gap-2 py-3">
                            <h5 class="mb-0 fw-bold"><i class="bi bi-building me-2"></i> Directorio de Proveedores</h5>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-outline-danger" onclick="PDFGenerator.generateSuppliersPDF(DB.getLocalTable('suppliers').filter(s=>s.business_id === Auth.currentBusiness.id), Auth.currentBusiness)"><i class="bi bi-file-earmark-pdf me-1"></i> PDF</button>
                                <button class="btn btn-sm btn-outline-secondary" onclick="User.openImportModal('suppliers')"><i class="bi bi-file-earmark-spreadsheet me-1"></i> Carga Masiva CSV</button>
                                <button class="btn btn-sm btn-primary" onclick="User.openNewSupplierModal()"><i class="bi bi-plus-lg me-1"></i> Nuevo Proveedor</button>
                            </div>
                        </div>
                        <!-- Búsqueda en tiempo real Proveedores -->
                        <div class="card-body border-bottom bg-light py-2">
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
                                <input type="text" class="form-control bg-white border-start-0" id="searchSuppliersInput" value="${this.supplierSearchQuery}" placeholder="🔍 Búsqueda en tiempo real por nombre, teléfono, correo, instagram o dirección..." oninput="User.filterSuppliers(this.value)">
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Proveedor</th>
                                            <th>Teléfono</th>
                                            <th>Correo</th>
                                            <th>Web / Instagram</th>
                                            <th>Dirección</th>
                                            <th class="text-end">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="userSuppliersTableBody">
                                        <!-- Proveedores -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 6. TAB REPORTES DINÁMICOS -->
                <div class="tab-pane fade ${activeTab === 'tab-reports' ? 'show active' : ''}" id="pills-reports">
                    <div class="card shadow-sm border-0 mb-4">
                        <div class="card-header bg-body py-3">
                            <h5 class="mb-0 fw-bold"><i class="bi bi-file-earmark-bar-graph me-2 text-primary"></i> Generador Dinámico de Reportes</h5>
                        </div>
                        <div class="card-body bg-light border-bottom">
                            <div class="row g-3 align-items-end">
                                <div class="col-md-3">
                                    <label class="form-label fw-semibold">Tipo de Reporte</label>
                                    <select id="reportTypeSelect" class="form-select" onchange="User.loadDynamicReports()">
                                        <option value="sales">Ventas Realizadas</option>
                                        <option value="purchases">Compras Realizadas</option>
                                        <option value="products">Inventario de Productos</option>
                                        <option value="clients">Directorio de Clientes</option>
                                        <option value="suppliers">Directorio de Proveedores</option>
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label fw-semibold">Fecha Inicio</label>
                                    <input type="date" id="reportStartDate" class="form-control" onchange="User.loadDynamicReports()">
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label fw-semibold">Fecha Fin</label>
                                    <input type="date" id="reportEndDate" class="form-control" onchange="User.loadDynamicReports()">
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label fw-semibold d-block">Accesos Rápidos</label>
                                    <div class="btn-group btn-group-sm w-100">
                                        <button class="btn btn-outline-secondary" onclick="User.setReportDateShortcut('today')">Hoy</button>
                                        <button class="btn btn-outline-secondary" onclick="User.setReportDateShortcut('month')">Este Mes</button>
                                        <button class="btn btn-outline-secondary" onclick="User.setReportDateShortcut('year')">Año</button>
                                        <button class="btn btn-outline-secondary" onclick="User.setReportDateShortcut('all')">Todo</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-4" id="reportContainer">
                            <!-- Contenido dinámico del reporte o advertencia de no datos -->
                        </div>
                    </div>
                </div>

                <!-- 7. TAB ESTADÍSTICAS Y MÉTRICAS -->
                <div class="tab-pane fade ${activeTab === 'tab-stats' ? 'show active' : ''}" id="pills-stats">
                    <div class="card shadow-sm border-0 mb-4">
                        <div class="card-header bg-body d-flex justify-content-between align-items-center py-3">
                            <h5 class="mb-0 fw-bold"><i class="bi bi-graph-up-arrow me-2 text-success"></i> Estadísticas del Negocio</h5>
                            <div class="btn-group btn-group-sm" id="statsMetricSelector">
                                <button class="btn btn-outline-primary active" onclick="User.switchStatsMetric('usd', this)">$ USD</button>
                                <button class="btn btn-outline-primary" onclick="User.switchStatsMetric('ves', this)">Bs. VES</button>
                                <button class="btn btn-outline-primary" onclick="User.switchStatsMetric('qty', this)">Unidades</button>
                            </div>
                        </div>
                        <div class="card-body p-4">
                            <div class="row g-4">
                                <div class="col-md-7">
                                    <div class="card border shadow-sm p-3 h-100">
                                        <h6 class="fw-bold mb-3 text-secondary"><i class="bi bi-bar-chart-line me-1"></i> Comportamiento de Ventas vs Compras</h6>
                                        <div style="position: relative; min-height: 280px;">
                                            <canvas id="chartSalesVsPurchases"></canvas>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-5">
                                    <div class="card border shadow-sm p-3 h-100">
                                        <h6 class="fw-bold mb-3 text-secondary"><i class="bi bi-pie-chart me-1"></i> Productos y Categorías Más Vendidas</h6>
                                        <div style="position: relative; min-height: 280px;">
                                            <canvas id="chartTopProducts"></canvas>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 8. TAB MANTENIMIENTO Y RESPALDOS -->
                <div class="tab-pane fade ${activeTab === 'tab-maintenance' ? 'show active' : ''}" id="pills-maintenance">
                    <div class="card shadow-sm border-0 mb-4">
                        <div class="card-header bg-body py-3">
                            <h5 class="mb-0 fw-bold"><i class="bi bi-database-down me-2 text-warning"></i> Mantenimiento & Exportación de Respaldos</h5>
                        </div>
                        <div class="card-body p-4">
                            <div class="row g-4">
                                <div class="col-md-6">
                                    <div class="card border p-3 shadow-sm h-100">
                                        <h6 class="fw-bold text-primary mb-3"><i class="bi bi-download me-1"></i> Generar y Descargar Copia de Seguridad</h6>
                                        <p class="small text-muted mb-3">Selecciona los módulos y el formato para exportar tus datos locales.</p>
                                        <form onsubmit="User.executeDataBackup(event)">
                                            <div class="mb-3">
                                                <label class="form-label fw-semibold small">Módulos a Exportar:</label>
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" id="chkExpProducts" checked>
                                                    <label class="form-check-label" for="chkExpProducts">Inventario de Productos</label>
                                                </div>
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" id="chkExpSales" checked>
                                                    <label class="form-check-label" for="chkExpSales">Histórico de Ventas</label>
                                                </div>
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" id="chkExpPurchases" checked>
                                                    <label class="form-check-label" for="chkExpPurchases">Histórico de Compras</label>
                                                </div>
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" id="chkExpClients" checked>
                                                    <label class="form-check-label" for="chkExpClients">Directorio de Clientes</label>
                                                </div>
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" id="chkExpSuppliers" checked>
                                                    <label class="form-check-label" for="chkExpSuppliers">Directorio de Proveedores</label>
                                                </div>
                                            </div>
                                            <div class="mb-4">
                                                <label class="form-label fw-semibold small">Formato de Descarga:</label>
                                                <select id="exportFormatSelect" class="form-select">
                                                    <option value="SQL">Script SQL (Sentencias INSERT INTO)</option>
                                                    <option value="CSV">Archivos CSV (Separado por Comas)</option>
                                                    <option value="JSON">Estructura JSON (Para Respaldos)</option>
                                                </select>
                                            </div>
                                            <button type="submit" class="btn btn-warning w-100 fw-bold py-2"><i class="bi bi-cloud-arrow-down me-1"></i> Descargar Copia de Seguridad</button>
                                        </form>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card border p-3 shadow-sm h-100">
                                        <h6 class="fw-bold text-secondary mb-3"><i class="bi bi-clock-history me-1"></i> Histórico de Respaldos Descargados</h6>
                                        <div class="table-responsive">
                                            <table class="table table-sm table-striped align-middle mb-0 small">
                                                <thead>
                                                    <tr>
                                                        <th>Fecha/Hora</th>
                                                        <th>Módulos</th>
                                                        <th>Formato</th>
                                                        <th>Registros</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="exportHistoryTableBody">
                                                    <!-- Se llena dinámicamente -->
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 9. TAB PERFIL NEGOCIO -->
                <div class="tab-pane fade ${activeTab === 'tab-profile' ? 'show active' : ''}" id="pills-profile">
                    <div class="row g-4">
                        <div class="col-md-7">
                            <div class="card shadow-sm border-0 mb-4">
                                <div class="card-header bg-body fw-bold py-3"><i class="bi bi-sliders me-2"></i> Configuración del Negocio</div>
                                <div class="card-body">
                                    <form id="formBusinessProfile" onsubmit="User.saveBusinessProfile(event)">
                                        <div class="mb-3">
                                            <label class="form-label fw-semibold">Nombre del Comercio</label>
                                            <input type="text" class="form-control" name="name" value="${currentBiz.name || ''}" required>
                                        </div>
                                        <div class="row g-3 mb-3">
                                            <div class="col-md-4">
                                                <label class="form-label fw-semibold text-primary"><i class="bi bi-card-text me-1"></i> Número RIF</label>
                                                <input type="text" class="form-control fw-bold" name="rif" placeholder="Ej: J-12345678-9" value="${currentBiz.rif || ''}">
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label fw-semibold">Teléfono (WhatsApp)</label>
                                                <input type="text" class="form-control" name="phone" value="${currentBiz.phone || ''}">
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label fw-semibold">Correo Electrónico</label>
                                                <input type="email" class="form-control" name="email" value="${currentBiz.email || ''}">
                                            </div>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label fw-semibold">Dirección Física</label>
                                            <textarea class="form-control" name="address" rows="2">${currentBiz.address || ''}</textarea>
                                        </div>
                                        <div class="row g-3 mb-3">
                                            <div class="col-md-6">
                                                <label class="form-label fw-semibold">Página Web / Instagram</label>
                                                <input type="text" class="form-control" name="website" value="${currentBiz.website || ''}">
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label fw-semibold">Color de Branding (Tema)</label>
                                                <input type="color" class="form-control form-control-color w-100" name="branding_color" value="${currentBiz.branding_color || '#0d6efd'}">
                                            </div>
                                        </div>

                                        <!-- Rubro / Categoría del Comercio y Switch Demo -->
                                        <div class="card bg-light border-warning mb-4">
                                            <div class="card-body">
                                                <h6 class="fw-bold text-dark mb-2"><i class="bi bi-shop me-1 text-warning"></i> Rubro del Comercio y Modo Demo / Datos de Prueba</h6>
                                                <div class="row g-3">
                                                    <div class="col-md-6">
                                                        <label class="form-label small fw-semibold">Rubro / Categoría del Negocio</label>
                                                        <select class="form-select form-select-sm" name="category_preset" onchange="AppUI.changePresetProfile(this.value)">
                                                            <option value="custom" ${!currentBiz.category_preset || currentBiz.category_preset === 'custom' ? 'selected' : ''}>⭐ Perfil Propio (${currentBiz.name || 'Mi Comercio'})</option>
                                                            <optgroup label="Rubros de Ejemplo / Datos Demo">
                                                                <option value="panaderia" ${currentBiz.category_preset === 'panaderia' ? 'selected' : ''}>Panadería & Pastelería</option>
                                                                <option value="zapateria" ${currentBiz.category_preset === 'zapateria' ? 'selected' : ''}>Zapatería</option>
                                                                <option value="libreria" ${currentBiz.category_preset === 'libreria' ? 'selected' : ''}>Librería y Papelería</option>
                                                                <option value="farmacia" ${currentBiz.category_preset === 'farmacia' ? 'selected' : ''}>Farmacia & Botica</option>
                                                                <option value="ropa" ${currentBiz.category_preset === 'ropa' ? 'selected' : ''}>Tienda de Ropa & Boutique</option>
                                                                <option value="bolsos" ${currentBiz.category_preset === 'bolsos' ? 'selected' : ''}>Tienda de Bolsos & Maletas</option>
                                                                <option value="viveres" ${currentBiz.category_preset === 'viveres' ? 'selected' : ''}>Abasto & Víveres</option>
                                                                <option value="carniceria" ${currentBiz.category_preset === 'carniceria' ? 'selected' : ''}>Carnicería & Frigorífico</option>
                                                            </optgroup>
                                                        </select>
                                                    </div>
                                                    <div class="col-md-6 d-flex align-items-end">
                                                        <div class="form-check form-switch bg-white p-2 rounded border w-100 mb-0">
                                                            <input class="form-check-input ms-1 me-2" type="checkbox" id="switchDemoProfile" ${Number(currentBiz.is_demo_active || 0) === 1 ? 'checked' : ''} onchange="AppUI.toggleDemoData(this.checked)">
                                                            <label class="form-check-label small fw-bold text-dark" for="switchDemoProfile"><i class="bi bi-flask text-warning me-1"></i> Modo Datos de Prueba</label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Vista del Logo del Comercio -->
                                        <div class="mb-3">
                                            <label class="form-label fw-semibold">Logo del Comercio</label>
                                            <div class="d-flex align-items-center gap-3 p-3 bg-light rounded border mb-2">
                                                ${currentBiz.logo_url ? 
                                                    `<img src="${currentBiz.logo_url}" alt="Logo Comercio" class="rounded border bg-white p-1" style="height: 60px; width: 120px; object-fit: contain;">` :
                                                    `<div class="bg-secondary text-white rounded d-flex align-items-center justify-content-center" style="width:60px; height:60px;"><i class="bi bi-image fs-3"></i></div>`
                                                }
                                                <div class="flex-grow-1">
                                                    <span class="fw-bold d-block small mb-1">${currentBiz.logo_url ? '✓ Logo actualmente activo' : 'Sin logo personalizado (Cargar abajo)'}</span>
                                                    <input type="file" class="form-control form-control-sm" accept="image/png, image/jpeg" onchange="User.handleLogoChange(event)">
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Personalización de Encabezado y Footer en Reportes PDF -->
                                        <div class="card bg-light border-0 mb-4">
                                            <div class="card-body">
                                                <h6 class="fw-bold text-danger mb-2"><i class="bi bi-file-earmark-pdf-fill me-1"></i> Personalizar Encabezado y Pie de Reportes PDF</h6>
                                                <div class="mb-3">
                                                    <label class="form-label small fw-semibold">Encabezado Personalizado PDF (Debajo del nombre)</label>
                                                    <textarea class="form-control form-control-sm" name="pdf_header_text" rows="2" placeholder="Ej: RIF: J-12345678-9 | Sucursal Principal | Tlf: 0414-0000000">${currentBiz.pdf_header_text || ''}</textarea>
                                                </div>
                                                <div class="mb-0">
                                                    <label class="form-label small fw-semibold">Pie de Página Personalizado PDF (Al final de la hoja)</label>
                                                    <textarea class="form-control form-control-sm" name="pdf_footer_text" rows="2" placeholder="Ej: Documento expedido electrónicamente. ¡Gracias por preferirnos!">${currentBiz.pdf_footer_text || ''}</textarea>
                                                </div>
                                            </div>
                                        </div>

                                        <button type="submit" class="btn btn-primary"><i class="bi bi-save me-1"></i> Guardar Cambios del Perfil</button>
                                    </form>
                                </div>
                            </div>
                        </div>

                        <div class="col-md-5">
                            <!-- Delegación de Segundos Administradores -->
                            <div class="card shadow-sm border-0 mb-4">
                                <div class="card-header bg-body fw-bold py-3"><i class="bi bi-person-plus me-2"></i> Administradores Delegados</div>
                                <div class="card-body">
                                    <p class="small text-muted mb-3">Agrega a otro usuario registrado por correo para que pueda administrar este comercio con sus credenciales.</p>
                                    <form onsubmit="User.addDelegatedAdmin(event)">
                                        <div class="input-group mb-3">
                                            <input type="email" class="form-control" id="delegatedAdminEmail" placeholder="correo@ejemplo.com" required>
                                            <button class="btn btn-primary" type="submit">Agregar</button>
                                        </div>
                                    </form>
                                    <ul class="list-group list-group-flush small" id="delegatedAdminsList">
                                        <!-- Lista de administradores delegados -->
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        await this.loadProductsTable();
        await this.loadClientsTable();
        await this.loadSuppliersTable();
        await this.loadSalesTable();
        await this.loadPurchasesTable();
        await this.loadDelegatedAdminsList();
    }

    // --- MÓDULO INVENTARIO Y BÚSQUEDA ---
    filterProducts(query = "") {
        this.productSearchQuery = query.toLowerCase().trim();
        this.loadProductsTable();
    }

    async loadProductsTable() {
        const tbody = document.getElementById("userProductsTableBody");
        if (!tbody || !Auth.currentBusiness) return;

        let products = DB.getLocalTable("products").filter(p => p.business_id === Auth.currentBusiness.id);

        if (this.productSearchQuery) {
            const q = this.productSearchQuery;
            products = products.filter(p => 
                (p.name && p.name.toLowerCase().includes(q)) ||
                (p.category && p.category.toLowerCase().includes(q)) ||
                (p.description && p.description.toLowerCase().includes(q))
            );
        }

        if (products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No se encontraron productos en el inventario.</td></tr>`;
            return;
        }

        tbody.innerHTML = products.map(p => {
            const bcvRate = CONFIG.DEFAULT_BCV_RATE || 1;
            const unitCost = Number(p.purchase_price) || 0;
            const unitCostVes = unitCost * bcvRate;
            const salePrice = Number(p.sale_price) || 0;
            const salePriceVes = salePrice * bcvRate;
            const wholesalePrice = Number(p.wholesale_price) || 0;
            const wholesalePriceVes = wholesalePrice * bcvRate;
            const presentationText = p.presentation ? p.presentation : 'Unidad';
            const pkgInfo = (p.units_per_package && p.units_per_package > 1) ? ` (${p.units_per_package} und/bulto)` : '';

            return `
            <tr>
                <td>
                    ${p.image_url ? `<img src="${p.image_url}" class="rounded" style="width: 40px; height: 40px; object-fit: cover;">` : '<div class="bg-secondary text-white rounded d-flex align-items-center justify-content-center" style="width:40px;height:40px;"><i class="bi bi-box"></i></div>'}
                </td>
                <td>
                    <strong>${p.name}</strong>
                    <br><small class="text-muted">${p.description || ''}</small>
                </td>
                <td>
                    <span class="badge bg-light text-dark border">${p.category || 'General'}</span>
                    <br><span class="badge bg-info text-dark mt-1"><i class="bi bi-box2 me-1"></i>${presentationText}${pkgInfo}</span>
                </td>
                <td>
                    <span class="badge ${p.quantity > 5 ? 'bg-success' : 'bg-danger'} fs-6">${p.quantity} unds</span>
                    ${p.units_per_package > 1 ? `<br><small class="text-muted">~ ${(p.quantity / p.units_per_package).toFixed(1)} ${presentationText}s</small>` : ''}
                </td>
                <td>
                    <span class="fw-semibold">$${unitCost.toFixed(2)} USD</span>
                    <br><small class="text-muted">Bs. ${unitCostVes.toFixed(2)}</small>
                </td>
                <td>
                    <strong class="text-primary">$${salePrice.toFixed(2)} USD</strong>
                    <br><small class="text-muted">Bs. ${salePriceVes.toFixed(2)}</small>
                    ${(p.sell_type === 'wholesale' || p.sell_type === 'both') && wholesalePrice > 0 ? `
                    <div class="mt-1"><span class="badge bg-info text-dark" title="Precio a partir de ${p.wholesale_min_qty || 1} unidades"><i class="bi bi-tag-fill me-1"></i>Mayor: $${wholesalePrice.toFixed(2)} (≥${p.wholesale_min_qty || 1})</span></div>
                    ` : ''}
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="User.openEditProductModal('${p.id}')" title="Editar Producto"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="User.deleteProduct('${p.id}')" title="Eliminar Producto"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
        }).join("");
    }

    /**
     * Cálculo automático en vivo para los modals de Producto (Nuevo y Editar)
     */
    calcProductModalPrices(prefix = 'new') {
        const formId = prefix === 'new' ? 'modalNewProduct' : 'modalEditProduct';
        const modalEl = document.getElementById(formId);
        if (!modalEl) return;
        const form = modalEl.querySelector('form');
        if (!form) return;

        const bcvRate = CONFIG.DEFAULT_BCV_RATE || 1;

        const presentationSelect = form.querySelector('[name="presentation"]');
        const presentation = presentationSelect ? presentationSelect.value : 'Unidad';

        const unitsInput = form.querySelector('[name="units_per_package"]');
        let unitsPerPkg = parseInt(unitsInput ? unitsInput.value : 1) || 1;
        if (presentation === 'Unidad' && unitsInput) {
            unitsPerPkg = 1;
        }

        const currencySelect = form.querySelector('[name="purchase_currency"]');
        const currency = currencySelect ? currencySelect.value : 'USD';

        const pkgCostInput = form.querySelector('[name="package_purchase_price"]');
        const rawPkgCost = parseFloat(pkgCostInput ? pkgCostInput.value : 0) || 0;

        // Costo del empaque en USD y VES
        const pkgCostUsd = currency === 'VES' ? (rawPkgCost / bcvRate) : rawPkgCost;
        const pkgCostVes = pkgCostUsd * bcvRate;

        // Costo unitario individual calculado en USD y VES
        const unitCostUsd = unitsPerPkg > 0 ? (pkgCostUsd / unitsPerPkg) : 0;
        const unitCostVes = unitCostUsd * bcvRate;

        // Asignar al campo oculto purchase_price el costo unitario en USD
        const unitCostInput = form.querySelector('[name="purchase_price"]');
        if (unitCostInput) {
            unitCostInput.value = unitCostUsd.toFixed(4);
        }

        // Precios de Venta
        const salePriceInput = form.querySelector('[name="sale_price"]');
        const salePriceUsd = parseFloat(salePriceInput ? salePriceInput.value : 0) || 0;
        const salePriceVes = salePriceUsd * bcvRate;
        const retailMargin = unitCostUsd > 0 ? (((salePriceUsd - unitCostUsd) / unitCostUsd) * 100) : 0;

        const sellTypeSelect = form.querySelector('[name="sell_type"]');
        const sellType = sellTypeSelect ? sellTypeSelect.value : 'retail';

        const wholesalePriceInput = form.querySelector('[name="wholesale_price"]');
        const wholesalePriceUsd = parseFloat(wholesalePriceInput ? wholesalePriceInput.value : 0) || 0;
        const wholesalePriceVes = wholesalePriceUsd * bcvRate;
        const wholesaleMargin = unitCostUsd > 0 ? (((wholesalePriceUsd - unitCostUsd) / unitCostUsd) * 100) : 0;

        // Renderizar Tarjeta de Resumen Dinámico
        const summaryContainer = document.getElementById(`${prefix}ProductCalcSummary`);
        if (summaryContainer) {
            summaryContainer.innerHTML = `
                <div class="card bg-body-tertiary border shadow-sm p-3 mt-2 rounded-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="fw-bold text-primary small"><i class="bi bi-calculator me-1"></i> Resumen de Cálculo Automático</span>
                        <span class="badge bg-secondary">Tasa BCV: Bs. ${bcvRate.toFixed(2)}</span>
                    </div>
                    <div class="row g-2 small">
                        <div class="col-6">
                            <div class="p-2 border rounded bg-white dark:bg-dark">
                                <div class="text-muted fw-semibold">Costo Empaque (${presentation})</div>
                                <div class="fw-bold text-dark">$${pkgCostUsd.toFixed(2)} USD <small class="text-muted">(Bs. ${pkgCostVes.toFixed(2)})</small></div>
                                ${unitsPerPkg > 1 ? `<small class="text-primary d-block mt-1"><i class="bi bi-boxes me-1"></i> Contiene ${unitsPerPkg} unidades</small>` : ''}
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="p-2 border rounded bg-white dark:bg-dark">
                                <div class="text-muted fw-semibold">Costo Unitario Calculado</div>
                                <div class="fw-bold text-success">$${unitCostUsd.toFixed(2)} USD <small class="text-muted">(Bs. ${unitCostVes.toFixed(2)})</small></div>
                                <small class="text-muted d-block mt-1">Costo individual por unidad</small>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="p-2 border rounded bg-white dark:bg-dark">
                                <div class="text-muted fw-semibold">Venta Detal (${salePriceUsd > 0 ? '$' + salePriceUsd.toFixed(2) : '$0.00'})</div>
                                <div class="fw-bold text-primary">Bs. ${salePriceVes.toFixed(2)} <span class="badge ${retailMargin >= 0 ? 'bg-success' : 'bg-danger'} ms-1">${retailMargin >= 0 ? '+' : ''}${retailMargin.toFixed(1)}%</span></div>
                            </div>
                        </div>
                        ${(sellType === 'wholesale' || sellType === 'both') ? `
                        <div class="col-6">
                            <div class="p-2 border rounded bg-white dark:bg-dark">
                                <div class="text-muted fw-semibold">Venta Mayor (${wholesalePriceUsd > 0 ? '$' + wholesalePriceUsd.toFixed(2) : '$0.00'})</div>
                                <div class="fw-bold text-info">Bs. ${wholesalePriceVes.toFixed(2)} <span class="badge ${wholesaleMargin >= 0 ? 'bg-info text-dark' : 'bg-danger'} ms-1">${wholesaleMargin >= 0 ? '+' : ''}${wholesaleMargin.toFixed(1)}%</span></div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
    }

    async openNewProductModal() {
        const modal = new bootstrap.Modal(document.getElementById("modalNewProduct"));
        modal.show();
        setTimeout(() => this.calcProductModalPrices('new'), 200);
    }

    async saveNewProduct(event) {
        event.preventDefault();
        const form = event.target;
        const fileInput = form.querySelector('input[type="file"]');
        let imageUrl = null;

        if (fileInput && fileInput.files[0]) {
            const bizId = Auth.currentBusiness ? Auth.currentBusiness.id : "global";
            imageUrl = await Storage.uploadImage(fileInput.files[0], "products", bizId);
        }

        const bcvRate = CONFIG.DEFAULT_BCV_RATE || 1;
        const presentation = form.presentation ? form.presentation.value : 'Unidad';
        const unitsPerPkg = parseInt(form.units_per_package ? form.units_per_package.value : 1) || 1;
        const currency = form.purchase_currency ? form.purchase_currency.value : 'USD';
        const rawPkgCost = parseFloat(form.package_purchase_price ? form.package_purchase_price.value : 0) || 0;

        const pkgCostUsd = currency === 'VES' ? (rawPkgCost / bcvRate) : rawPkgCost;
        const unitCostUsd = unitsPerPkg > 0 ? (pkgCostUsd / unitsPerPkg) : 0;

        const newProd = {
            id: "prod_" + Date.now(),
            business_id: Auth.currentBusiness.id,
            name: form.name.value,
            description: form.description ? form.description.value : '',
            image_url: imageUrl,
            quantity: parseInt(form.quantity.value || 0),
            category: form.category ? form.category.value || "General" : "General",
            presentation: presentation,
            units_per_package: unitsPerPkg,
            purchase_currency: currency,
            package_purchase_price: pkgCostUsd,
            purchase_price: unitCostUsd,
            sale_price: parseFloat(form.sale_price ? form.sale_price.value : 0),
            sell_type: form.sell_type ? form.sell_type.value : 'retail',
            wholesale_price: parseFloat(form.wholesale_price ? form.wholesale_price.value : 0),
            wholesale_min_qty: parseInt(form.wholesale_min_qty ? form.wholesale_min_qty.value : 1),
            created_at: new Date().toISOString()
        };

        await DB.query(
            `INSERT INTO products (id, business_id, name, description, image_url, quantity, category, presentation, units_per_package, purchase_currency, package_purchase_price, purchase_price, sale_price, sell_type, wholesale_price, wholesale_min_qty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [newProd.id, newProd.business_id, newProd.name, newProd.description, newProd.image_url, newProd.quantity, newProd.category, newProd.presentation, newProd.units_per_package, newProd.purchase_currency, newProd.package_purchase_price, newProd.purchase_price, newProd.sale_price, newProd.sell_type, newProd.wholesale_price, newProd.wholesale_min_qty]
        );
        DB.setLocalRecord("products", newProd);

        bootstrap.Modal.getInstance(document.getElementById("modalNewProduct")).hide();
        form.reset();
        this.loadProductsTable();
    }

    openEditProductModal(productId) {
        const products = DB.getLocalTable("products");
        const prod = products.find(p => p.id === productId);
        if (!prod) return alert("Producto no encontrado.");

        document.getElementById("editProductId").value = prod.id;
        document.getElementById("editProductName").value = prod.name || "";
        document.getElementById("editProductDescription").value = prod.description || "";
        document.getElementById("editProductCategory").value = prod.category || "General";
        document.getElementById("editProductQuantity").value = prod.quantity || 0;

        const presEl = document.getElementById("editProductPresentation");
        if (presEl) presEl.value = prod.presentation || 'Unidad';

        const unitsEl = document.getElementById("editProductUnitsPerPkg");
        if (unitsEl) unitsEl.value = prod.units_per_package || 1;

        const currEl = document.getElementById("editProductPurchaseCurrency");
        if (currEl) currEl.value = prod.purchase_currency || 'USD';

        const pkgPriceEl = document.getElementById("editProductPackagePurchasePrice");
        if (pkgPriceEl) pkgPriceEl.value = (prod.package_purchase_price !== undefined ? prod.package_purchase_price : prod.purchase_price) || 0;

        const unitCostEl = document.getElementById("editProductPurchasePrice");
        if (unitCostEl) unitCostEl.value = prod.purchase_price || 0;

        document.getElementById("editProductSalePrice").value = prod.sale_price || 0;

        const sellTypeEl = document.getElementById("editProductSellType");
        if (sellTypeEl) sellTypeEl.value = prod.sell_type || 'retail';

        const wpEl = document.getElementById("editProductWholesalePrice");
        if (wpEl) wpEl.value = prod.wholesale_price || 0;

        const wmEl = document.getElementById("editProductWholesaleMinQty");
        if (wmEl) wmEl.value = prod.wholesale_min_qty || 1;

        const wsFields = document.getElementById("wholesaleFieldsEdit");
        if (wsFields) wsFields.style.display = (prod.sell_type === 'wholesale' || prod.sell_type === 'both') ? 'flex' : 'none';

        this.calcProductModalPrices('edit');

        const modal = new bootstrap.Modal(document.getElementById("modalEditProduct"));
        modal.show();
    }

    async saveEditProduct(event) {
        event.preventDefault();
        const form = event.target;
        const productId = form.id.value;
        const fileInput = form.querySelector('input[type="file"]');
        let imageUrl = null;

        const products = DB.getLocalTable("products");
        const idx = products.findIndex(p => p.id === productId);
        if (idx < 0) return alert("Producto no encontrado.");

        if (fileInput && fileInput.files[0]) {
            const bizId = Auth.currentBusiness ? Auth.currentBusiness.id : "global";
            if (products[idx].image_url) {
                await Storage.deleteImage(products[idx].image_url);
            }
            imageUrl = await Storage.uploadImage(fileInput.files[0], "products", bizId);
        }

        const bcvRate = CONFIG.DEFAULT_BCV_RATE || 1;
        const presentation = form.presentation ? form.presentation.value : 'Unidad';
        const unitsPerPkg = parseInt(form.units_per_package ? form.units_per_package.value : 1) || 1;
        const currency = form.purchase_currency ? form.purchase_currency.value : 'USD';
        const rawPkgCost = parseFloat(form.package_purchase_price ? form.package_purchase_price.value : 0) || 0;

        const pkgCostUsd = currency === 'VES' ? (rawPkgCost / bcvRate) : rawPkgCost;
        const unitCostUsd = unitsPerPkg > 0 ? (pkgCostUsd / unitsPerPkg) : 0;

        products[idx].name = form.name.value;
        products[idx].description = form.description ? form.description.value : '';
        products[idx].category = form.category ? form.category.value || "General" : "General";
        products[idx].quantity = parseInt(form.quantity.value || 0);
        products[idx].presentation = presentation;
        products[idx].units_per_package = unitsPerPkg;
        products[idx].purchase_currency = currency;
        products[idx].package_purchase_price = pkgCostUsd;
        products[idx].purchase_price = unitCostUsd;
        products[idx].sale_price = parseFloat(form.sale_price ? form.sale_price.value : 0);
        products[idx].sell_type = form.sell_type ? form.sell_type.value : (products[idx].sell_type || 'retail');
        products[idx].wholesale_price = parseFloat(form.wholesale_price ? form.wholesale_price.value : (products[idx].wholesale_price || 0));
        products[idx].wholesale_min_qty = parseInt(form.wholesale_min_qty ? form.wholesale_min_qty.value : (products[idx].wholesale_min_qty || 1));
        if (imageUrl) products[idx].image_url = imageUrl;

        await DB.query(
            `UPDATE products SET name = ?, description = ?, category = ?, quantity = ?, presentation = ?, units_per_package = ?, purchase_currency = ?, package_purchase_price = ?, purchase_price = ?, sale_price = ?, sell_type = ?, wholesale_price = ?, wholesale_min_qty = ? ${imageUrl ? ', image_url = ?' : ''} WHERE id = ?`,
            imageUrl ? 
            [products[idx].name, products[idx].description, products[idx].category, products[idx].quantity, products[idx].presentation, products[idx].units_per_package, products[idx].purchase_currency, products[idx].package_purchase_price, products[idx].purchase_price, products[idx].sale_price, products[idx].sell_type, products[idx].wholesale_price, products[idx].wholesale_min_qty, imageUrl, productId] :
            [products[idx].name, products[idx].description, products[idx].category, products[idx].quantity, products[idx].presentation, products[idx].units_per_package, products[idx].purchase_currency, products[idx].package_purchase_price, products[idx].purchase_price, products[idx].sale_price, products[idx].sell_type, products[idx].wholesale_price, products[idx].wholesale_min_qty, productId]
        );
        DB.setLocalTable("products", products);

        bootstrap.Modal.getInstance(document.getElementById("modalEditProduct")).hide();
        AppUI.showAlert("Producto Actualizado", "¡Producto actualizado con éxito!", "success");
        this.loadProductsTable();
    }

    async deleteProduct(productId) {
        if (!confirm("¿Deseas eliminar este producto del inventario?")) return;
        await DB.query("DELETE FROM products WHERE id = ?", [productId]);
        DB.deleteLocalRecord("products", productId);
        this.loadProductsTable();
    }

    // --- MÓDULO CLIENTES Y BÚSQUEDA ---
    filterClients(query = "") {
        this.clientSearchQuery = query.toLowerCase().trim();
        this.loadClientsTable();
    }

    async loadClientsTable() {
        const tbody = document.getElementById("userClientsTableBody");
        if (!tbody || !Auth.currentBusiness) return;

        let clients = DB.getLocalTable("clients").filter(c => c.business_id === Auth.currentBusiness.id);

        if (this.clientSearchQuery) {
            const q = this.clientSearchQuery;
            clients = clients.filter(c => 
                (c.name && c.name.toLowerCase().includes(q)) ||
                (c.identity_card && c.identity_card.toLowerCase().includes(q)) ||
                (c.phone && c.phone.toLowerCase().includes(q)) ||
                (c.address && c.address.toLowerCase().includes(q))
            );
        }

        if (clients.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No se encontraron clientes.</td></tr>`;
            return;
        }

        tbody.innerHTML = clients.map(c => `
            <tr>
                <td><code>${c.identity_card || 'N/A'}</code></td>
                <td><strong>${c.name}</strong></td>
                <td>${c.phone || 'N/A'}</td>
                <td>${c.address || 'N/A'}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="User.openEditClientModal('${c.id}')" title="Editar Cliente"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="User.deleteClient('${c.id}')" title="Eliminar Cliente"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `).join("");
    }

    openNewClientModal() {
        const modal = new bootstrap.Modal(document.getElementById("modalNewClient"));
        modal.show();
    }

    async saveNewClient(event) {
        event.preventDefault();
        const form = event.target;
        const newCli = {
            id: "cli_" + Date.now(),
            business_id: Auth.currentBusiness.id,
            identity_card: form.identity_card.value,
            name: form.name.value,
            phone: form.phone.value,
            address: form.address.value,
            created_at: new Date().toISOString()
        };

        await DB.query(
            `INSERT INTO clients (id, business_id, identity_card, name, phone, address) VALUES (?, ?, ?, ?, ?, ?)`,
            [newCli.id, newCli.business_id, newCli.identity_card, newCli.name, newCli.phone, newCli.address]
        );
        DB.setLocalRecord("clients", newCli);

        bootstrap.Modal.getInstance(document.getElementById("modalNewClient")).hide();
        form.reset();
        this.loadClientsTable();
    }

    openEditClientModal(clientId) {
        const clients = DB.getLocalTable("clients");
        const client = clients.find(c => c.id === clientId);
        if (!client) return alert("Cliente no encontrado.");

        document.getElementById("editClientId").value = client.id;
        document.getElementById("editClientIdentityCard").value = client.identity_card || "";
        document.getElementById("editClientName").value = client.name || "";
        document.getElementById("editClientPhone").value = client.phone || "";
        document.getElementById("editClientAddress").value = client.address || "";

        const modal = new bootstrap.Modal(document.getElementById("modalEditClient"));
        modal.show();
    }

    async saveEditClient(event) {
        event.preventDefault();
        const form = event.target;
        const clientId = form.id.value;
        const clients = DB.getLocalTable("clients");
        const idx = clients.findIndex(c => c.id === clientId);
        if (idx < 0) return alert("Cliente no encontrado.");

        clients[idx].identity_card = form.identity_card.value;
        clients[idx].name = form.name.value;
        clients[idx].phone = form.phone.value;
        clients[idx].address = form.address.value;

        await DB.query(
            `UPDATE clients SET identity_card = ?, name = ?, phone = ?, address = ? WHERE id = ?`,
            [clients[idx].identity_card, clients[idx].name, clients[idx].phone, clients[idx].address, clientId]
        );
        DB.setLocalTable("clients", clients);

        bootstrap.Modal.getInstance(document.getElementById("modalEditClient")).hide();
        AppUI.showAlert("Cliente Actualizado", "¡Cliente actualizado con éxito!", "success");
        this.loadClientsTable();
    }

    async deleteClient(clientId) {
        if (!confirm("¿Deseas eliminar este cliente?")) return;
        await DB.query("DELETE FROM clients WHERE id = ?", [clientId]);
        DB.deleteLocalRecord("clients", clientId);
        this.loadClientsTable();
    }

    // --- MÓDULO PROVEEDORES Y BÚSQUEDA ---
    filterSuppliers(query = "") {
        this.supplierSearchQuery = query.toLowerCase().trim();
        this.loadSuppliersTable();
    }

    async loadSuppliersTable() {
        const tbody = document.getElementById("userSuppliersTableBody");
        if (!tbody || !Auth.currentBusiness) return;

        let suppliers = DB.getLocalTable("suppliers").filter(s => s.business_id === Auth.currentBusiness.id);

        if (this.supplierSearchQuery) {
            const q = this.supplierSearchQuery;
            suppliers = suppliers.filter(s => 
                (s.name && s.name.toLowerCase().includes(q)) ||
                (s.phone && s.phone.toLowerCase().includes(q)) ||
                (s.email && s.email.toLowerCase().includes(q)) ||
                (s.instagram && s.instagram.toLowerCase().includes(q)) ||
                (s.website && s.website.toLowerCase().includes(q)) ||
                (s.address && s.address.toLowerCase().includes(q))
            );
        }

        if (suppliers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No se encontraron proveedores.</td></tr>`;
            return;
        }

        tbody.innerHTML = suppliers.map(s => `
            <tr>
                <td><strong>${s.name}</strong></td>
                <td>${s.phone || 'N/A'}</td>
                <td>${s.email || 'N/A'}</td>
                <td>${s.instagram || s.website || 'N/A'}</td>
                <td>${s.address || 'N/A'}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="User.openEditSupplierModal('${s.id}')" title="Editar Proveedor"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="User.deleteSupplier('${s.id}')" title="Eliminar Proveedor"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `).join("");
    }

    openNewSupplierModal() {
        const modal = new bootstrap.Modal(document.getElementById("modalNewSupplier"));
        modal.show();
    }

    async saveNewSupplier(event) {
        event.preventDefault();
        const form = event.target;
        const newSup = {
            id: "prov_" + Date.now(),
            business_id: Auth.currentBusiness.id,
            name: form.name.value,
            phone: form.phone.value,
            address: form.address.value,
            email: form.email.value,
            website: form.website.value,
            instagram: form.instagram.value,
            created_at: new Date().toISOString()
        };

        await DB.query(
            `INSERT INTO suppliers (id, business_id, name, phone, address, email, website, instagram) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [newSup.id, newSup.business_id, newSup.name, newSup.phone, newSup.address, newSup.email, newSup.website, newSup.instagram]
        );
        DB.setLocalRecord("suppliers", newSup);

        bootstrap.Modal.getInstance(document.getElementById("modalNewSupplier")).hide();
        form.reset();
        this.loadSuppliersTable();
    }

    openEditSupplierModal(supplierId) {
        const suppliers = DB.getLocalTable("suppliers");
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier) return alert("Proveedor no encontrado.");

        document.getElementById("editSupplierId").value = supplier.id;
        document.getElementById("editSupplierName").value = supplier.name || "";
        document.getElementById("editSupplierPhone").value = supplier.phone || "";
        document.getElementById("editSupplierEmail").value = supplier.email || "";
        document.getElementById("editSupplierWebsite").value = supplier.website || "";
        document.getElementById("editSupplierInstagram").value = supplier.instagram || "";
        document.getElementById("editSupplierAddress").value = supplier.address || "";

        const modal = new bootstrap.Modal(document.getElementById("modalEditSupplier"));
        modal.show();
    }

    async saveEditSupplier(event) {
        event.preventDefault();
        const form = event.target;
        const supplierId = form.id.value;
        const suppliers = DB.getLocalTable("suppliers");
        const idx = suppliers.findIndex(s => s.id === supplierId);
        if (idx < 0) return alert("Proveedor no encontrado.");

        suppliers[idx].name = form.name.value;
        suppliers[idx].phone = form.phone.value;
        suppliers[idx].email = form.email.value;
        suppliers[idx].website = form.website.value;
        suppliers[idx].instagram = form.instagram.value;
        suppliers[idx].address = form.address.value;

        await DB.query(
            `UPDATE suppliers SET name = ?, phone = ?, email = ?, website = ?, instagram = ?, address = ? WHERE id = ?`,
            [suppliers[idx].name, suppliers[idx].phone, suppliers[idx].email, suppliers[idx].website, suppliers[idx].instagram, suppliers[idx].address, supplierId]
        );
        DB.setLocalTable("suppliers", suppliers);

        bootstrap.Modal.getInstance(document.getElementById("modalEditSupplier")).hide();
        AppUI.showAlert("Proveedor Actualizado", "¡Proveedor actualizado con éxito!", "success");
        this.loadSuppliersTable();
    }

    async deleteSupplier(supplierId) {
        if (!confirm("¿Deseas eliminar este proveedor?")) return;
        await DB.query("DELETE FROM suppliers WHERE id = ?", [supplierId]);
        DB.deleteLocalRecord("suppliers", supplierId);
        this.loadSuppliersTable();
    }

    // --- MÓDULO VENTAS MULTI-PRODUCTO ---
    async loadSalesTable() {
        const tbody = document.getElementById("userSalesTableBody");
        if (!tbody || !Auth.currentBusiness) return;

        const sales = DB.getLocalTable("sales").filter(s => s.business_id === Auth.currentBusiness.id);
        const clients = DB.getLocalTable("clients");

        if (sales.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No hay ventas registradas.</td></tr>`;
            return;
        }

        tbody.innerHTML = sales.map((s, idx) => {
            const client = clients.find(c => c.id === s.client_id) || { name: "Cliente General", phone: "" };
            const whatsappMessage = encodeURIComponent(`Hola ${client.name}, adjuntamos el resumen de tu compra #${idx + 1} en ${Auth.currentBusiness.name} por un monto total de $${s.total_amount.toFixed(2)} USD.`);

            return `
                <tr>
                    <td>#${idx + 1}</td>
                    <td><strong>${client.name}</strong></td>
                    <td><strong class="text-success">$${Number(s.total_amount).toFixed(2)}</strong></td>
                    <td>${s.sale_date ? s.sale_date.slice(0, 10) : 'N/A'}</td>
                    <td class="text-end">
                        ${client.phone ? `<a href="https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${whatsappMessage}" target="_blank" class="btn btn-sm btn-success"><i class="bi bi-whatsapp me-1"></i> WhatsApp</a>` : '<span class="text-muted small">Sin teléfono</span>'}
                    </td>
                </tr>
            `;
        }).join("");
    }

    openNewSaleModal() {
        this.saleCartItems = [];
        const clientSearch = document.getElementById("saleClientSearch");
        const productSearch = document.getElementById("saleProductSearch");
        if (clientSearch) clientSearch.value = "";
        if (productSearch) productSearch.value = "";

        this.filterSaleClientsSelect("");
        this.filterSaleProductsSelect("");
        this.renderSaleCart();

        const modal = new bootstrap.Modal(document.getElementById("modalNewSale"));
        modal.show();
    }

    filterSaleClientsSelect(query = "") {
        const clientSelect = document.getElementById("saleClientSelect");
        if (!clientSelect || !Auth.currentBusiness) return;
        const q = query.toLowerCase().trim();
        const clients = DB.getLocalTable("clients").filter(c => c.business_id === Auth.currentBusiness.id);
        const filtered = q ? clients.filter(c => 
            (c.name && c.name.toLowerCase().includes(q)) ||
            (c.identity_card && c.identity_card.toLowerCase().includes(q))
        ) : clients;

        clientSelect.innerHTML = filtered.length > 0 ? 
            filtered.map((c, i) => `<option value="${c.id}" ${i === 0 ? 'selected' : ''}>${c.name} (C.I./RIF: ${c.identity_card || 'N/A'})</option>`).join("") :
            '<option value="" disabled>No se encontraron clientes coincidentes</option>';
    }

    openQuickClientModalFromSale() {
        const modal = new bootstrap.Modal(document.getElementById("modalQuickClientFromSale"));
        modal.show();
    }

    async saveQuickClientFromSale(event) {
        event.preventDefault();
        const form = event.target;
        const identityCard = form.identity_card.value.trim();
        const name = form.name.value.trim();
        const phone = form.phone ? form.phone.value.trim() : "";
        const address = form.address ? form.address.value.trim() : "";

        if (!name) return alert("Por favor ingresa el nombre del cliente.");

        const newCli = {
            id: "cli_" + Date.now(),
            business_id: Auth.currentBusiness.id,
            identity_card: identityCard,
            name: name,
            phone: phone,
            address: address,
            created_at: new Date().toISOString()
        };

        await DB.query(
            `INSERT INTO clients (id, business_id, identity_card, name, phone, address) VALUES (?, ?, ?, ?, ?, ?)`,
            [newCli.id, newCli.business_id, newCli.identity_card, newCli.name, newCli.phone, newCli.address]
        );
        DB.setLocalRecord("clients", newCli);

        const modalEl = document.getElementById("modalQuickClientFromSale");
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
        form.reset();

        this.loadClientsTable();

        const clientSearch = document.getElementById("saleClientSearch");
        if (clientSearch) clientSearch.value = "";

        this.filterSaleClientsSelect("");
        const clientSelect = document.getElementById("saleClientSelect");
        if (clientSelect) {
            clientSelect.value = newCli.id;
        }

        if (typeof AppUI !== 'undefined' && AppUI.showAlert) {
            AppUI.showAlert("¡Cliente Registrado!", `El cliente "${name}" se creó exitosamente y quedó seleccionado para esta venta.`, "success");
        } else {
            alert(`¡Cliente "${name}" registrado y seleccionado exitosamente!`);
        }
    }

    filterSaleProductsSelect(query = "") {
        const productSelect = document.getElementById("saleProductSelect");
        if (!productSelect || !Auth.currentBusiness) return;

        const q = query.toLowerCase().trim();
        const products = DB.getLocalTable("products").filter(p => p.business_id === Auth.currentBusiness.id);
        const filtered = q ? products.filter(p => 
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q)) ||
            (p.description && p.description.toLowerCase().includes(q))
        ) : products;

        productSelect.innerHTML = filtered.length > 0 ?
            filtered.map((p, i) => `<option value="${p.id}" ${i === 0 ? 'selected' : ''}>${p.name} - Stock: ${p.quantity} - $${p.sale_price.toFixed(2)}</option>`).join("") :
            '<option value="" disabled>No se encontraron productos coincidentes</option>';
    }

    adjustSaleTempQty(delta) {
        const input = document.getElementById("saleItemQtyInput");
        if (!input) return;
        let val = parseInt(input.value || 1) + delta;
        if (val < 1) val = 1;
        input.value = val;
    }

    addSaleCartItem() {
        const productSelect = document.getElementById("saleProductSelect");
        const qtyInput = document.getElementById("saleItemQtyInput");
        if (!productSelect || !qtyInput) return;

        const productId = productSelect.value;
        const qty = parseInt(qtyInput.value || 1);
        if (!productId) return alert("Selecciona un producto.");

        const products = DB.getLocalTable("products");
        const prod = products.find(p => p.id === productId);
        if (!prod) return alert("Producto no encontrado.");

        const existingIdx = this.saleCartItems.findIndex(i => i.product_id === productId);
        const currentQtyInCart = existingIdx >= 0 ? this.saleCartItems[existingIdx].quantity : 0;
        const totalReq = currentQtyInCart + qty;

        if (prod.quantity < totalReq) {
            return alert(`¡Stock insuficiente! Solo quedan ${prod.quantity} unidades disponibles de "${prod.name}".`);
        }

        if (prod.sell_type === 'wholesale' && totalReq < (prod.wholesale_min_qty || 1)) {
            alert(`⚠️ Este producto está configurado para VENTA SOLO AL MAYOR (Mínimo ${prod.wholesale_min_qty} unidades).`);
        }

        const isWholesale = (prod.sell_type === 'wholesale' || prod.sell_type === 'both') && totalReq >= (prod.wholesale_min_qty || 1) && prod.wholesale_price > 0;
        const appliedUnitPrice = isWholesale ? prod.wholesale_price : prod.sale_price;

        if (existingIdx >= 0) {
            this.saleCartItems[existingIdx].quantity = totalReq;
            this.saleCartItems[existingIdx].unit_price = appliedUnitPrice;
            this.saleCartItems[existingIdx].is_wholesale = isWholesale;
        } else {
            this.saleCartItems.push({
                product_id: prod.id,
                name: prod.name,
                unit_price: appliedUnitPrice,
                quantity: totalReq,
                available_stock: prod.quantity,
                is_wholesale: isWholesale
            });
        }

        qtyInput.value = 1;
        this.renderSaleCart();
    }

    updateSaleCartQty(productId, newQty) {
        const item = this.saleCartItems.find(i => i.product_id === productId);
        if (!item) return;

        const parsedQty = parseInt(newQty);
        if (isNaN(parsedQty) || parsedQty < 1) return;

        if (parsedQty > item.available_stock) {
            alert(`¡Stock insuficiente! Solo hay ${item.available_stock} unidades disponibles de "${item.name}".`);
            this.renderSaleCart();
            return;
        }

        item.quantity = parsedQty;

        const products = DB.getLocalTable("products");
        const prod = products.find(p => p.id === productId);
        if (prod) {
            const isWholesale = (prod.sell_type === 'wholesale' || prod.sell_type === 'both') && parsedQty >= (prod.wholesale_min_qty || 1) && prod.wholesale_price > 0;
            item.unit_price = isWholesale ? prod.wholesale_price : prod.sale_price;
            item.is_wholesale = isWholesale;
        }

        this.renderSaleCart();
    }

    removeSaleCartItem(productId) {
        this.saleCartItems = this.saleCartItems.filter(i => i.product_id !== productId);
        this.renderSaleCart();
    }

    renderSaleCart() {
        const tbody = document.getElementById("saleCartTableBody");
        const totalText = document.getElementById("saleCartTotalText");
        if (!tbody) return;

        if (this.saleCartItems.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">No has agregado productos a la venta aún.</td></tr>`;
            if (totalText) totalText.innerText = "$0.00 USD";
            return;
        }

        let total = 0;
        tbody.innerHTML = this.saleCartItems.map(item => {
            const subtotal = item.unit_price * item.quantity;
            total += subtotal;
            const priceBadge = item.is_wholesale ? '<span class="badge bg-info text-dark ms-1">Mayor</span>' : '<span class="badge bg-light text-dark border ms-1">Detal</span>';

            return `
                <tr>
                    <td><strong>${item.name}</strong>${priceBadge}</td>
                    <td>$${item.unit_price.toFixed(2)}</td>
                    <td>
                        <div class="input-group input-group-sm" style="width: 120px;">
                            <button type="button" class="btn btn-outline-secondary px-2" onclick="User.updateSaleCartQty('${item.product_id}', ${item.quantity - 1})">-</button>
                            <input type="number" class="form-control text-center px-1" value="${item.quantity}" min="1" max="${item.available_stock}" onchange="User.updateSaleCartQty('${item.product_id}', this.value)">
                            <button type="button" class="btn btn-outline-secondary px-2" onclick="User.updateSaleCartQty('${item.product_id}', ${item.quantity + 1})">+</button>
                        </div>
                    </td>
                    <td><strong>$${subtotal.toFixed(2)}</strong></td>
                    <td class="text-center">
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="User.removeSaleCartItem('${item.product_id}')" title="Eliminar"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join("");

        if (totalText) totalText.innerText = `$${total.toFixed(2)} USD (Bs. ${(total * (CONFIG.DEFAULT_BCV_RATE || 1)).toFixed(2)})`;
    }

    async saveNewSale(event) {
        event.preventDefault();
        const form = event.target;
        const clientId = form.client_id.value;
        if (!clientId) return alert("Selecciona un cliente.");
        if (this.saleCartItems.length === 0) return alert("Agrega al menos un producto a la venta.");

        const products = DB.getLocalTable("products");

        // Validar stock de todos los productos antes de procesar
        for (const item of this.saleCartItems) {
            const p = products.find(prod => prod.id === item.product_id);
            if (!p || p.quantity < item.quantity) {
                return alert(`Stock insuficiente para ${item.name}. Disponibles: ${p ? p.quantity : 0}`);
            }
        }

        // Calcular Total General
        let totalAmount = 0;
        this.saleCartItems.forEach(item => {
            totalAmount += item.unit_price * item.quantity;
        });

        const saleId = "sale_" + Date.now();
        const newSale = {
            id: saleId,
            business_id: Auth.currentBusiness.id,
            client_id: clientId,
            total_amount: totalAmount,
            total_amount_usd: totalAmount,
            total_usd: totalAmount,
            sale_date: new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        // Guardar venta principal
        await DB.query(
            `INSERT INTO sales (id, business_id, client_id, total_amount) VALUES (?, ?, ?, ?)`,
            [newSale.id, newSale.business_id, newSale.client_id, newSale.total_amount]
        );
        DB.setLocalRecord("sales", newSale);

        // Procesar descontado de stock y guardar sale_items
        for (const item of this.saleCartItems) {
            const pIdx = products.findIndex(prod => prod.id === item.product_id);
            if (pIdx >= 0) {
                products[pIdx].quantity -= item.quantity;
                await DB.query(`UPDATE products SET quantity = ? WHERE id = ?`, [products[pIdx].quantity, item.product_id]);
            }

            const saleItemId = "sitem_" + Date.now() + "_" + Math.floor(Math.random()*1000);
            const saleItemRecord = {
                id: saleItemId,
                sale_id: saleId,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price
            };
            await DB.query(
                `INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)`,
                [saleItemId, saleId, item.product_id, item.quantity, item.unit_price]
            );
            DB.setLocalRecord("sale_items", saleItemRecord);
        }

        DB.setLocalTable("products", products);

        bootstrap.Modal.getInstance(document.getElementById("modalNewSale")).hide();
        form.reset();
        this.saleCartItems = [];
        AppUI.showAlert("Venta Registrada", "¡Venta realizada con éxito! El inventario ha sido actualizado para todos los productos.", "success");
        this.loadSalesTable();
        this.loadProductsTable();
    }

    // --- MÓDULO COMPRAS MULTI-PRODUCTO ---
    async loadPurchasesTable() {
        const tbody = document.getElementById("userPurchasesTableBody");
        if (!tbody || !Auth.currentBusiness) return;

        const purchases = DB.getLocalTable("purchases").filter(p => p.business_id === Auth.currentBusiness.id);
        const suppliers = DB.getLocalTable("suppliers");

        if (purchases.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No hay compras registradas.</td></tr>`;
            return;
        }

        tbody.innerHTML = purchases.map((p, idx) => {
            const supplier = suppliers.find(s => s.id === p.supplier_id) || { name: "Proveedor General" };
            return `
                <tr>
                    <td>#${idx + 1}</td>
                    <td><strong>${supplier.name}</strong></td>
                    <td><strong>$${Number(p.total_amount).toFixed(2)}</strong></td>
                    <td>${p.purchase_date ? p.purchase_date.slice(0, 10) : 'N/A'}</td>
                </tr>
            `;
        }).join("");
    }

    openNewPurchaseModal() {
        this.purchaseCartItems = [];
        const supplierSearch = document.getElementById("purchaseSupplierSearch");
        const productSearch = document.getElementById("purchaseProductSearch");
        if (supplierSearch) supplierSearch.value = "";
        if (productSearch) productSearch.value = "";

        this.filterPurchaseSuppliersSelect("");
        this.filterPurchaseProductsSelect("");
        this.renderPurchaseCart();

        const modal = new bootstrap.Modal(document.getElementById("modalNewPurchase"));
        modal.show();
    }

    filterPurchaseSuppliersSelect(query = "") {
        const supplierSelect = document.getElementById("purchaseSupplierSelect");
        if (!supplierSelect || !Auth.currentBusiness) return;
        const q = query.toLowerCase().trim();
        const suppliers = DB.getLocalTable("suppliers").filter(s => s.business_id === Auth.currentBusiness.id);
        const filtered = q ? suppliers.filter(s => 
            (s.name && s.name.toLowerCase().includes(q)) ||
            (s.phone && s.phone.toLowerCase().includes(q)) ||
            (s.email && s.email.toLowerCase().includes(q))
        ) : suppliers;

        supplierSelect.innerHTML = filtered.length > 0 ? 
            filtered.map((s, i) => `<option value="${s.id}" ${i === 0 ? 'selected' : ''}>${s.name} ${s.phone ? '(' + s.phone + ')' : ''}</option>`).join("") :
            '<option value="" disabled>No se encontraron proveedores coincidentes</option>';
    }

    filterPurchaseProductsSelect(query = "") {
        const productSelect = document.getElementById("purchaseProductSelect");
        if (!productSelect || !Auth.currentBusiness) return;

        const q = query.toLowerCase().trim();
        const products = DB.getLocalTable("products").filter(p => p.business_id === Auth.currentBusiness.id);
        const filtered = q ? products.filter(p => 
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q)) ||
            (p.description && p.description.toLowerCase().includes(q))
        ) : products;

        productSelect.innerHTML = filtered.length > 0 ? 
            filtered.map((p, i) => `<option value="${p.id}" ${i === 0 ? 'selected' : ''}>${p.name} (Stock: ${p.quantity}) - Costo: $${p.purchase_price.toFixed(2)}</option>`).join("") :
            '<option value="" disabled>No se encontraron productos coincidentes</option>';
    }

    adjustPurchaseTempQty(delta) {
        const input = document.getElementById("purchaseItemQtyInput");
        if (!input) return;
        let val = parseInt(input.value || 1) + delta;
        if (val < 1) val = 1;
        input.value = val;
    }

    calcPurchaseTotalUnits() {
        const bulkInput = document.getElementById("purchaseBulkQtyInput");
        const unitsInput = document.getElementById("purchaseUnitsPerPkgInput");
        const totalInput = document.getElementById("purchaseItemQtyInput");
        if (!bulkInput || !unitsInput || !totalInput) return;
        const bulks = parseInt(bulkInput.value || 1);
        const units = parseInt(unitsInput.value || 1);
        totalInput.value = bulks * units;
    }

    addPurchaseCartItem() {
        const productSelect = document.getElementById("purchaseProductSelect");
        const qtyInput = document.getElementById("purchaseItemQtyInput");
        const priceInput = document.getElementById("purchaseItemPriceInput");
        if (!productSelect || !qtyInput || !priceInput) return;

        const productId = productSelect.value;
        const qty = parseInt(qtyInput.value || 1);
        const unitPrice = parseFloat(priceInput.value || 0);

        if (!productId) return alert("Selecciona un producto.");
        if (unitPrice < 0) return alert("Ingresa un costo válido.");

        const products = DB.getLocalTable("products");
        const prod = products.find(p => p.id === productId);
        if (!prod) return alert("Producto no encontrado.");

        const existingIdx = this.purchaseCartItems.findIndex(i => i.product_id === productId);
        if (existingIdx >= 0) {
            this.purchaseCartItems[existingIdx].quantity += qty;
            this.purchaseCartItems[existingIdx].unit_price = unitPrice;
        } else {
            this.purchaseCartItems.push({
                product_id: prod.id,
                name: prod.name,
                unit_price: unitPrice,
                quantity: qty
            });
        }

        qtyInput.value = 1;
        const bulkInput = document.getElementById("purchaseBulkQtyInput");
        if (bulkInput) bulkInput.value = 1;
        const unitsPerPkgInput = document.getElementById("purchaseUnitsPerPkgInput");
        if (unitsPerPkgInput) unitsPerPkgInput.value = 1;
        this.renderPurchaseCart();
    }

    updatePurchaseCartQty(productId, newQty) {
        const item = this.purchaseCartItems.find(i => i.product_id === productId);
        if (!item) return;
        const parsedQty = parseInt(newQty);
        if (isNaN(parsedQty) || parsedQty < 1) return;
        item.quantity = parsedQty;
        this.renderPurchaseCart();
    }

    removePurchaseCartItem(productId) {
        this.purchaseCartItems = this.purchaseCartItems.filter(i => i.product_id !== productId);
        this.renderPurchaseCart();
    }

    renderPurchaseCart() {
        const tbody = document.getElementById("purchaseCartTableBody");
        const totalText = document.getElementById("purchaseCartTotalText");
        if (!tbody) return;

        if (this.purchaseCartItems.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">No has agregado productos a la compra aún.</td></tr>`;
            if (totalText) totalText.innerText = "$0.00 USD";
            return;
        }

        let total = 0;
        tbody.innerHTML = this.purchaseCartItems.map(item => {
            const subtotal = item.unit_price * item.quantity;
            total += subtotal;
            return `
                <tr>
                    <td><strong>${item.name}</strong></td>
                    <td>
                        <div class="input-group input-group-sm" style="width: 120px;">
                            <button type="button" class="btn btn-outline-secondary px-2" onclick="User.updatePurchaseCartQty('${item.product_id}', ${item.quantity - 1})">-</button>
                            <input type="number" class="form-control text-center px-1" value="${item.quantity}" min="1" onchange="User.updatePurchaseCartQty('${item.product_id}', this.value)">
                            <button type="button" class="btn btn-outline-secondary px-2" onclick="User.updatePurchaseCartQty('${item.product_id}', ${item.quantity + 1})">+</button>
                        </div>
                    </td>
                    <td>$${item.unit_price.toFixed(2)}</td>
                    <td><strong>$${subtotal.toFixed(2)}</strong></td>
                    <td class="text-center">
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="User.removePurchaseCartItem('${item.product_id}')" title="Eliminar"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join("");

        if (totalText) totalText.innerText = `$${total.toFixed(2)} USD`;
    }

    async saveNewPurchase(event) {
        event.preventDefault();
        const form = event.target;
        const supplierId = form.supplier_id.value;
        if (!supplierId) return alert("Selecciona un proveedor.");
        if (this.purchaseCartItems.length === 0) return alert("Agrega al menos un producto a la compra.");

        const products = DB.getLocalTable("products");

        let totalAmount = 0;
        this.purchaseCartItems.forEach(item => {
            totalAmount += item.unit_price * item.quantity;
        });

        const purchaseId = "purch_" + Date.now();
        const newPurchase = {
            id: purchaseId,
            business_id: Auth.currentBusiness.id,
            supplier_id: supplierId,
            total_amount: totalAmount,
            purchase_date: new Date().toISOString()
        };

        await DB.query(
            `INSERT INTO purchases (id, business_id, supplier_id, total_amount) VALUES (?, ?, ?, ?)`,
            [newPurchase.id, newPurchase.business_id, newPurchase.supplier_id, newPurchase.total_amount]
        );
        DB.setLocalRecord("purchases", newPurchase);

        for (const item of this.purchaseCartItems) {
            const pIdx = products.findIndex(prod => prod.id === item.product_id);
            if (pIdx >= 0) {
                products[pIdx].quantity += item.quantity;
                products[pIdx].purchase_price = item.unit_price;
                await DB.query(
                    `UPDATE products SET quantity = ?, purchase_price = ? WHERE id = ?`,
                    [products[pIdx].quantity, item.unit_price, item.product_id]
                );
            }

            const pItemId = "pitem_" + Date.now() + "_" + Math.floor(Math.random()*1000);
            const pItemRecord = {
                id: pItemId,
                purchase_id: purchaseId,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price
            };
            await DB.query(
                `INSERT INTO purchase_items (id, purchase_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)`,
                [pItemId, purchaseId, item.product_id, item.quantity, item.unit_price]
            );
            DB.setLocalRecord("purchase_items", pItemRecord);
        }

        DB.setLocalTable("products", products);

        bootstrap.Modal.getInstance(document.getElementById("modalNewPurchase")).hide();
        form.reset();
        this.purchaseCartItems = [];
        AppUI.showAlert("Compra Registrada", "¡Compra registrada! El stock y costo de los productos han sido incrementados.", "success");
        this.loadPurchasesTable();
        this.loadProductsTable();
    }

    // --- REPORTAR PAGO Y PERFIL DE NEGOCIO ---
    openReportPaymentModal() {
        const modal = new bootstrap.Modal(document.getElementById("modalReportPayment"));
        const methodSelect = document.getElementById("paymentMethodSelect");
        const methods = DB.getLocalTable("payment_methods").filter(m => Number(m.is_active) === 1);

        const priceUsd = CONFIG.MEMBERSHIP_PRICE_USD;
        const bcvRate = CONFIG.DEFAULT_BCV_RATE;
        const priceVes = (priceUsd * bcvRate).toFixed(2);

        const usdBanner = document.getElementById("modalPaymentUsdBanner");
        const vesBanner = document.getElementById("modalPaymentVesBanner");
        const bcvBanner = document.getElementById("modalPaymentBcvBanner");
        const dateInput = document.getElementById("paymentReportDateInput");

        if (usdBanner) usdBanner.textContent = `$${priceUsd.toFixed(2)} USD`;
        if (vesBanner) vesBanner.textContent = `(Bs. ${priceVes})`;
        if (bcvBanner) bcvBanner.textContent = `1 USD = ${bcvRate.toFixed(2)} Bs.`;
        if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

        methodSelect.innerHTML = methods.map((m, i) => `<option value="${m.id}" ${i === 0 ? 'selected' : ''}>${m.title} (${m.currency})</option>`).join("");
        
        this.populateBankSelect();

        if (methods.length > 0) {
            this.handlePaymentMethodChange(methods[0].id);
        }

        this.loadUserPaymentHistory();
        modal.show();
    }

    populateBankSelect(query = "") {
        const select = document.getElementById("bankOriginSelect");
        if (!select) return;

        const allBanks = DB.getLocalTable("banks") || [];
        const activeBanks = allBanks.filter(b => Number(b.is_active) === 1);

        let filtered = activeBanks;
        if (query && query.trim()) {
            const q = query.trim().toLowerCase();
            filtered = activeBanks.filter(b => b.name.toLowerCase().includes(q));
        }

        if (filtered.length === 0) {
            select.innerHTML = `<option value="">Sin resultados ("${query}")</option>`;
            return;
        }

        select.innerHTML = `<option value="">-- Seleccionar Banco de Origen --</option>` +
            filtered.map(b => `<option value="${b.name}">${b.name}</option>`).join("");
    }

    filterBankSelect(query) {
        this.populateBankSelect(query);
    }

    loadUserPaymentHistory() {
        const tbody = document.getElementById("userPaymentHistoryTableBody");
        if (!tbody) return;

        const currentUserId = Auth.currentUser ? Auth.currentUser.id : "";
        const currentUserEmail = Auth.currentUser ? (Auth.currentUser.email || "").toLowerCase() : "";
        const allPayments = DB.getLocalTable("payments") || [];
        const userPayments = allPayments.filter(p => 
            p.user_id === currentUserId || 
            (p.user_email && p.user_email.toLowerCase() === currentUserEmail)
        );

        userPayments.sort((a, b) => new Date(b.created_at || b.payment_date || 0) - new Date(a.created_at || a.payment_date || 0));

        if (userPayments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No has registrado ningún reporte de pago aún.</td></tr>`;
            return;
        }

        const methods = DB.getLocalTable("payment_methods") || [];

        tbody.innerHTML = userPayments.map((p, i) => {
            const m = methods.find(item => item.id === p.payment_method_id) || {};
            const methodTitle = m.title || m.type || "Pago Directo";
            const dateStr = p.payment_date || (p.created_at ? p.created_at.substring(0, 10) : "Reciente");
            
            let statusBadge = '<span class="badge bg-warning text-dark"><i class="bi bi-hourglass-split me-1"></i> Pendiente</span>';
            if (p.status === "aprobado") {
                statusBadge = '<span class="badge bg-success"><i class="bi bi-check-circle-fill me-1"></i> Aprobado</span>';
            } else if (p.status === "rechazado") {
                statusBadge = '<span class="badge bg-danger"><i class="bi bi-x-circle-fill me-1"></i> Rechazado</span>';
            }

            let coverageStr = '<span class="text-muted small">Por verificar</span>';
            if (p.valid_from && p.valid_until) {
                coverageStr = `<small class="fw-semibold text-dark"><i class="bi bi-calendar-check text-success me-1"></i> ${new Date(p.valid_from).toLocaleDateString()} - ${new Date(p.valid_until).toLocaleDateString()}</small>`;
            } else if (p.status === "aprobado") {
                coverageStr = `<small class="fw-semibold text-success">Membresía Extendida +30 Días</small>`;
            }

            return `
                <tr>
                    <td>${i + 1}</td>
                    <td><i class="bi bi-calendar-event me-1 text-muted"></i> ${dateStr}</td>
                    <td>
                        <strong>${methodTitle}</strong><br>
                        <small class="text-muted">Ref: <code>${p.reference_number || 'N/A'}</code> ${p.bank_origin ? '| ' + p.bank_origin : ''}</small>
                    </td>
                    <td>
                        <strong>$${parseFloat(p.amount_usd || 10).toFixed(2)} USD</strong><br>
                        <small class="text-muted">Bs. ${parseFloat(p.amount_ves || 0).toFixed(2)}</small>
                    </td>
                    <td>${statusBadge}</td>
                    <td>${coverageStr}</td>
                </tr>
            `;
        }).join("");
    }

    handlePaymentMethodChange(methodId) {
        const methods = DB.getLocalTable("payment_methods");
        const method = methods.find(m => m.id === methodId);
        const detailsBox = document.getElementById("paymentMethodDetailsBox");
        const detailsContent = document.getElementById("paymentMethodDetailsContent");
        const vesContainer = document.getElementById("vesAmountContainer");
        const vesInput = document.getElementById("paymentAmountVesInput");
        const bankContainer = document.getElementById("bankOriginContainer");
        const bankSelect = document.getElementById("bankOriginSelect");

        if (!method) return;

        // Mostrar caja de datos del método seleccionado
        if (detailsBox && detailsContent) {
            detailsBox.style.display = "block";
            let html = `<strong class="text-primary d-block mb-1"><i class="bi bi-info-circle me-1"></i> Datos para efectuar el pago (${method.currency}):</strong>`;
            html += `<div class="bg-white p-2 rounded border">`;
            if (method.bank_name) html += `<div class="mb-1"><strong>Banco / Plataforma:</strong> ${method.bank_name}</div>`;
            if (method.account_number) html += `<div class="mb-1"><strong>Cuenta / Teléfono / ID / Correo:</strong> <code class="fs-6 text-break">${method.account_number}</code></div>`;
            if (method.wallet_address && method.wallet_address !== method.account_number) {
                html += `<div class="mb-1"><strong>Dirección / Billetera / Detalle:</strong> <code class="text-break">${method.wallet_address}</code></div>`;
            } else if (!method.account_number && (method.wallet_address || method.email)) {
                html += `<div class="mb-1"><strong>Billetera / Correo:</strong> <code class="text-break">${method.wallet_address || method.email}</code></div>`;
            }
            if (method.holder_name) html += `<div class="mb-1"><strong>Titular:</strong> ${method.holder_name} ${method.holder_id ? '(' + method.holder_id + ')' : ''}</div>`;
            html += `</div>`;
            detailsContent.innerHTML = html;
        }

        // Mostrar/Ocultar campo de monto en Bolívares y Banco de Origen según la moneda
        if (method.currency === "VES") {
            if (vesContainer && vesInput) {
                vesContainer.style.display = "block";
                const expectedVes = (CONFIG.MEMBERSHIP_PRICE_USD * CONFIG.DEFAULT_BCV_RATE).toFixed(2);
                vesInput.value = expectedVes;
                vesInput.required = true;
            }
            if (bankContainer) {
                bankContainer.style.display = "block";
                this.populateBankSelect();
            }
        } else {
            // Pagos en USD (Zelle, Binance, USDT, Zinli, etc): Ocultar monto VES y Ocultar Banco de Origen
            if (vesContainer && vesInput) {
                vesContainer.style.display = "none";
                vesInput.value = "";
                vesInput.required = false;
            }
            if (bankContainer) {
                bankContainer.style.display = "none";
                if (bankSelect) bankSelect.value = "";
            }
        }
    }

    async saveReportPayment(event) {
        event.preventDefault();
        const form = event.target;
        const methodId = form.method_id.value;
        const proofInput = document.getElementById("paymentProofFile");
        let proofUrl = "";

        if (proofInput && proofInput.files && proofInput.files[0]) {
            const userId = Auth.currentUser ? Auth.currentUser.id : "global";
            proofUrl = await Storage.uploadImage(proofInput.files[0], "payments", userId);
        }

        const methods = DB.getLocalTable("payment_methods");
        const method = methods.find(m => m.id === methodId) || { currency: "USD" };

        let amountUsd = CONFIG.MEMBERSHIP_PRICE_USD;
        let amountVes = (amountUsd * CONFIG.DEFAULT_BCV_RATE).toFixed(2);

        if (method.currency === "VES" && form.amount_ves_input && form.amount_ves_input.value) {
            amountVes = parseFloat(form.amount_ves_input.value);
            amountUsd = CONFIG.MEMBERSHIP_PRICE_USD;
        }

        const newPayment = {
            id: "pay_" + Date.now(),
            user_id: Auth.currentUser ? Auth.currentUser.id : "",
            user_email: Auth.currentUser ? Auth.currentUser.email : "",
            business_id: Auth.currentBusiness ? Auth.currentBusiness.id : "",
            payment_method_id: methodId,
            amount_usd: amountUsd,
            amount_ves: amountVes,
            bcv_rate: CONFIG.DEFAULT_BCV_RATE,
            reference_number: form.reference_number.value,
            bank_origin: form.bank_origin.value,
            payment_date: form.payment_date.value,
            proof_url: proofUrl,
            status: "pendiente",
            created_at: new Date().toISOString()
        };

        try {
            await DB.query(
                `INSERT INTO payments (id, user_id, business_id, payment_method_id, amount_usd, amount_ves, bcv_rate, reference_number, bank_origin, payment_date, proof_url, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [newPayment.id, newPayment.user_id, newPayment.business_id, newPayment.payment_method_id, newPayment.amount_usd, newPayment.amount_ves, newPayment.bcv_rate, newPayment.reference_number, newPayment.bank_origin, newPayment.payment_date, newPayment.proof_url, newPayment.status]
            );
        } catch (e) {
            try {
                await DB.query(
                    `INSERT INTO payments (id, user_id, business_id, payment_method_id, amount_usd, amount_ves, bcv_rate, reference_number, bank_origin, payment_date, status)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [newPayment.id, newPayment.user_id, newPayment.business_id, newPayment.payment_method_id, newPayment.amount_usd, newPayment.amount_ves, newPayment.bcv_rate, newPayment.reference_number, newPayment.bank_origin, newPayment.payment_date, newPayment.status]
                );
            } catch (err) {
                console.warn("Saving to local storage:", err);
            }
        }
        DB.setLocalRecord("payments", newPayment);

        bootstrap.Modal.getInstance(document.getElementById("modalReportPayment")).hide();
        form.reset();
        AppUI.showAlert("Reporte Enviado", "¡Comprobante de pago enviado con éxito! El Administrador revisará tu reporte para verificar y activar tu membresía.", "success");
        
        // Re-renderizar app para actualizar vista en caso de estar en pantalla de bloqueo
        AppUI.renderApp();
    }

    async saveBusinessProfile(event) {
        event.preventDefault();
        const form = event.target;
        const bizId = Auth.currentBusiness.id;

        const name = form.name ? form.name.value.trim() : Auth.currentBusiness.name;
        const rif = form.rif ? form.rif.value.trim() : (Auth.currentBusiness.rif || "");
        const phone = form.phone ? form.phone.value.trim() : (Auth.currentBusiness.phone || "");
        const email = form.email ? form.email.value.trim() : (Auth.currentBusiness.email || "");
        const address = form.address ? form.address.value.trim() : (Auth.currentBusiness.address || "");
        const website = form.website ? form.website.value.trim() : (Auth.currentBusiness.website || "");
        const brandingColor = form.branding_color ? form.branding_color.value : (Auth.currentBusiness.branding_color || "#0d6efd");
        const categoryPreset = form.category_preset ? form.category_preset.value : (Auth.currentBusiness.category_preset || "custom");
        const pdfHeader = form.pdf_header_text ? form.pdf_header_text.value.trim() : "";
        const pdfFooter = form.pdf_footer_text ? form.pdf_footer_text.value.trim() : "";

        const businesses = DB.getLocalTable("businesses");
        const idx = businesses.findIndex(b => b.id === bizId);
        if (idx >= 0) {
            businesses[idx].name = name;
            businesses[idx].rif = rif;
            businesses[idx].phone = phone;
            businesses[idx].email = email;
            businesses[idx].address = address;
            businesses[idx].website = website;
            businesses[idx].branding_color = brandingColor;
            businesses[idx].category_preset = categoryPreset;
            businesses[idx].pdf_header_text = pdfHeader;
            businesses[idx].pdf_footer_text = pdfFooter;

            try {
                await DB.query(
                    `UPDATE businesses SET name = ?, rif = ?, phone = ?, email = ?, address = ?, website = ?, branding_color = ?, category_preset = ?, pdf_header_text = ?, pdf_footer_text = ? WHERE id = ?`,
                    [name, rif, phone, email, address, website, brandingColor, categoryPreset, pdfHeader, pdfFooter, bizId]
                );
            } catch (e) {
                try {
                    await DB.query(`ALTER TABLE businesses ADD COLUMN rif TEXT`).catch(() => {});
                    await DB.query(`ALTER TABLE businesses ADD COLUMN pdf_header_text TEXT`).catch(() => {});
                    await DB.query(`ALTER TABLE businesses ADD COLUMN pdf_footer_text TEXT`).catch(() => {});
                    await DB.query(
                        `UPDATE businesses SET name = ?, rif = ?, phone = ?, email = ?, address = ?, website = ?, branding_color = ?, category_preset = ?, pdf_header_text = ?, pdf_footer_text = ? WHERE id = ?`,
                        [name, rif, phone, email, address, website, brandingColor, categoryPreset, pdfHeader, pdfFooter, bizId]
                    );
                } catch (err) {
                    await DB.query(
                        `UPDATE businesses SET name = ?, phone = ?, email = ?, address = ?, website = ?, branding_color = ? WHERE id = ?`,
                        [name, phone, email, address, website, brandingColor, bizId]
                    );
                }
            }

            DB.setLocalTable("businesses", businesses);
            Auth.currentBusiness = businesses[idx];
            Auth.saveSession(Auth.currentUser, businesses[idx]);
        }

        if (typeof AppUI !== 'undefined' && AppUI.showAlert) {
            AppUI.showAlert("Perfil Actualizado", `¡Los datos de tu negocio (${name}) y la configuración de reportes PDF se han guardado exitosamente!`, "success");
        }
        AppUI.renderApp();
    }

    async handleLogoChange(event) {
        const file = event.target.files[0];
        if (!file || !Auth.currentBusiness) return;

        if (Auth.currentBusiness.logo_url) {
            await Storage.deleteImage(Auth.currentBusiness.logo_url);
        }

        const bizId = Auth.currentBusiness.id;
        const logoUrl = await Storage.uploadImage(file, "logos", bizId);
        if (logoUrl) {
            const businesses = DB.getLocalTable("businesses");
            const idx = businesses.findIndex(b => b.id === Auth.currentBusiness.id);
            if (idx >= 0) {
                businesses[idx].logo_url = logoUrl;
                await DB.query("UPDATE businesses SET logo_url = ? WHERE id = ?", [logoUrl, Auth.currentBusiness.id]);
                DB.setLocalTable("businesses", businesses);
                Auth.currentBusiness = businesses[idx];
                sessionStorage.setItem("inv_current_biz", JSON.stringify(businesses[idx]));
                AppUI.showAlert("Logo Actualizado", "¡Logo actualizado con éxito en Cloudflare R2!", "success");
                AppUI.renderApp();
            }
        }
    }

    async addDelegatedAdmin(event) {
        event.preventDefault();
        const email = document.getElementById("delegatedAdminEmail").value.toLowerCase().trim();
        if (!email) return;

        const roleId = "ubr_" + Date.now();
        const newRole = {
            id: roleId,
            user_email: email,
            business_id: Auth.currentBusiness.id,
            role: "delegated_admin",
            created_at: new Date().toISOString()
        };

        await DB.query(
            `INSERT INTO user_business_roles (id, user_email, business_id, role) VALUES (?, ?, ?, ?)`,
            [newRole.id, newRole.user_email, newRole.business_id, newRole.role]
        );
        DB.setLocalRecord("user_business_roles", newRole);

        document.getElementById("delegatedAdminEmail").value = "";
        AppUI.showAlert("Administrador Delegado", `¡Usuario ${email} agregado como Administrador Delegado!`, "success");
        this.loadDelegatedAdminsList();
    }

    async loadDelegatedAdminsList() {
        const list = document.getElementById("delegatedAdminsList");
        if (!list || !Auth.currentBusiness) return;

        const roles = DB.getLocalTable("user_business_roles").filter(r => r.business_id === Auth.currentBusiness.id);

        if (roles.length === 0) {
            list.innerHTML = `<li class="list-group-item text-muted">No hay administradores adicionales agregados.</li>`;
            return;
        }

        list.innerHTML = roles.map(r => `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <strong>${r.user_email}</strong><br>
                    <span class="badge ${r.role === 'owner' ? 'bg-primary' : 'bg-secondary'}">${r.role === 'owner' ? 'Propietario' : 'Administrador Delegado'}</span>
                </div>
                ${r.role !== 'owner' ? `<button class="btn btn-sm btn-outline-danger" onclick="User.removeDelegatedAdmin('${r.id}')"><i class="bi bi-trash"></i></button>` : ''}
            </li>
        `).join("");
    }

    async removeDelegatedAdmin(roleId) {
        if (!confirm("¿Deseas remover a este administrador delegado del negocio?")) return;
        await DB.query("DELETE FROM user_business_roles WHERE id = ?", [roleId]);
        DB.deleteLocalRecord("user_business_roles", roleId);
        this.loadDelegatedAdminsList();
    }

    openImportModal(type) {
        document.getElementById("importEntityType").value = type;
        const titles = { products: "Productos", clients: "Clientes", suppliers: "Proveedores" };
        document.getElementById("importEntityTitle").innerText = titles[type] || "Datos";

        const modal = new bootstrap.Modal(document.getElementById("modalMassImport"));
        modal.show();
    }

    async handleMassImport(event) {
        event.preventDefault();
        const type = document.getElementById("importEntityType").value;
        const fileInput = document.getElementById("importCsvFile");

        if (!fileInput.files[0]) return alert("Selecciona un archivo CSV.");

        const res = await ImportExport.parseAndImportCSV(fileInput.files[0], type, Auth.currentBusiness.id);
        alert(res.message);

        bootstrap.Modal.getInstance(document.getElementById("modalMassImport")).hide();
        fileInput.value = "";

        if (type === "products") this.loadProductsTable();
        if (type === "clients") this.loadClientsTable();
        if (type === "suppliers") this.loadSuppliersTable();
    }

    openReportIncidentModal() {
        const modal = new bootstrap.Modal(document.getElementById("modalReportIncident"));
        modal.show();
    }

    async saveReportIncident(event) {
        event.preventDefault();
        const form = event.target;
        const title = form.title.value.trim();
        const description = form.description.value.trim();

        if (!title || !description) {
            AppUI.showAlert("Error", "Por favor llena todos los campos.", "warning");
            return;
        }

        const currentUser = Auth.currentUser || {};
        const incident = {
            id: "inc_" + Date.now(),
            user_id: currentUser.id || "anonymous",
            user_email: currentUser.email || "desconocido",
            title: title,
            description: description,
            status: "Pendiente",
            created_at: new Date().toISOString()
        };

        try {
            await DB.query(
                `INSERT INTO incidents (id, user_id, user_email, title, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [incident.id, incident.user_id, incident.user_email, incident.title, incident.description, incident.status, incident.created_at]
            );
        } catch (e) {
            console.warn("Incident saved to localStorage only:", e);
        }

        DB.setLocalRecord("incidents", incident);
        bootstrap.Modal.getInstance(document.getElementById("modalReportIncident")).hide();
        form.reset();
        AppUI.showAlert("Incidencia Reportada", "Tu reporte ha sido enviado al administrador. Te contactaremos pronto.", "success");
    }

    // --- MÓDULO REPORTES DINÁMICOS ---
    setReportDateShortcut(shortcut) {
        const startInput = document.getElementById("reportStartDate");
        const endInput = document.getElementById("reportEndDate");
        if (!startInput || !endInput) return;

        const now = new Date();
        let start = new Date();
        let end = new Date();

        if (shortcut === 'today') {
            start = now;
            end = now;
        } else if (shortcut === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (shortcut === 'year') {
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
        } else if (shortcut === 'all') {
            startInput.value = "";
            endInput.value = "";
            this.loadDynamicReports();
            return;
        }

        startInput.value = start.toISOString().split("T")[0];
        endInput.value = end.toISOString().split("T")[0];
        this.loadDynamicReports();
    }

    async loadDynamicReports() {
        const container = document.getElementById("reportContainer");
        if (!container || !Auth.currentBusiness) return;

        const typeSelect = document.getElementById("reportTypeSelect");
        const startInput = document.getElementById("reportStartDate");
        const endInput = document.getElementById("reportEndDate");

        const type = typeSelect ? typeSelect.value : "sales";
        const startDateStr = startInput ? startInput.value : "";
        const endDateStr = endInput ? endInput.value : "";

        let items = DB.getLocalTable(type).filter(i => i.business_id === Auth.currentBusiness.id);

        if (startDateStr || endDateStr) {
            items = items.filter(i => {
                const itemDate = new Date(i.sale_date || i.purchase_date || i.created_at || i.date || 0);
                if (startDateStr && itemDate < new Date(startDateStr + "T00:00:00")) return false;
                if (endDateStr && itemDate > new Date(endDateStr + "T23:59:59")) return false;
                return true;
            });
        }

        if (items.length === 0) {
            container.innerHTML = `
                <div class="alert alert-warning text-center p-4 my-3 rounded-3 border-warning shadow-sm">
                    <i class="bi bi-exclamation-triangle-fill display-4 text-warning mb-2 d-block"></i>
                    <h5 class="fw-bold text-dark">No existen registros para generar el reporte</h5>
                    <p class="text-muted mb-0">No se encontraron datos que coincidan con la categoría seleccionada (${type.toUpperCase()}) ${startDateStr ? 'del ' + startDateStr : ''} ${endDateStr ? 'al ' + endDateStr : ''}. Prueba con otro rango de fechas o agrega nuevos registros.</p>
                </div>
            `;
            return;
        }

        let tableHtml = "";

        if (type === "sales") {
            const clients = DB.getLocalTable("clients");
            const saleItems = DB.getLocalTable("sale_items");
            const allProducts = DB.getLocalTable("products");
            const bcvRate = CONFIG.DEFAULT_BCV_RATE || 1;
            const totalUsd = items.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
            const totalVes = totalUsd * bcvRate;

            tableHtml = `
                <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <div>
                        <h6 class="fw-bold mb-0">Reporte de Ventas (${items.length} Registros)</h6>
                        <small class="text-muted">Total acumulado: <strong class="text-success">$${totalUsd.toFixed(2)} USD</strong> (Bs. ${totalVes.toFixed(2)})</small>
                    </div>
                    <button class="btn btn-sm btn-outline-danger fw-bold" onclick="PDFGenerator.generateSalesPDF(DB.getLocalTable('sales').filter(s => s.business_id === Auth.currentBusiness.id), Auth.currentBusiness)"><i class="bi bi-file-earmark-pdf me-1"></i> Descargar PDF</button>
                </div>
                <div class="table-responsive">
                    <table class="table table-striped align-middle mb-0">
                        <thead class="table-dark">
                            <tr>
                                <th>#</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Productos</th>
                                <th>Total ($ USD)</th>
                                <th>Total (Bs)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map((s, idx) => {
                                const saleDate = s.sale_date || s.created_at;
                                const dateStr = saleDate ? new Date(saleDate).toLocaleString() : 'N/A';
                                const client = clients.find(c => c.id === s.client_id);
                                const clientName = client ? client.name : 'Cliente Ocasional';
                                const thisItems = saleItems.filter(si => si.sale_id === s.id);
                                const prodNames = thisItems.map(si => {
                                    const p = allProducts.find(pr => pr.id === si.product_id);
                                    return (p ? p.name : 'Producto') + ' (x' + si.quantity + ')';
                                }).join(', ');
                                const totalAmt = Number(s.total_amount || 0);
                                const totalBs = totalAmt * bcvRate;
                                return `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td>${dateStr}</td>
                                    <td>${clientName}</td>
                                    <td><small>${prodNames || 'Sin detalle'}</small></td>
                                    <td><strong class="text-success">$${totalAmt.toFixed(2)}</strong></td>
                                    <td>Bs. ${totalBs.toFixed(2)}</td>
                                </tr>`;
                            }).join("")}
                        </tbody>
                    </table>
                </div>
            `;
        } else if (type === "purchases") {
            const suppliers = DB.getLocalTable("suppliers");
            const purchaseItemsAll = DB.getLocalTable("purchase_items");
            const allProducts = DB.getLocalTable("products");
            const totalUsd = items.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);

            tableHtml = `
                <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <div>
                        <h6 class="fw-bold mb-0">Reporte de Compras (${items.length} Registros)</h6>
                        <small class="text-muted">Inversión Total: <strong class="text-danger">$${totalUsd.toFixed(2)} USD</strong></small>
                    </div>
                    <button class="btn btn-sm btn-outline-danger fw-bold" onclick="PDFGenerator.generatePurchasesPDF(DB.getLocalTable('purchases').filter(p => p.business_id === Auth.currentBusiness.id), Auth.currentBusiness)"><i class="bi bi-file-earmark-pdf me-1"></i> Descargar PDF</button>
                </div>
                <div class="table-responsive">
                    <table class="table table-striped align-middle mb-0">
                        <thead class="table-dark">
                            <tr>
                                <th>#</th>
                                <th>Fecha</th>
                                <th>Proveedor</th>
                                <th>Productos</th>
                                <th>Total ($ USD)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map((p, idx) => {
                                const purchDate = p.purchase_date || p.created_at;
                                const dateStr = purchDate ? new Date(purchDate).toLocaleString() : 'N/A';
                                const supplier = suppliers.find(sup => sup.id === p.supplier_id);
                                const supplierName = supplier ? supplier.name : 'Proveedor General';
                                const thisItems = purchaseItemsAll.filter(pi => pi.purchase_id === p.id);
                                const prodNames = thisItems.map(pi => {
                                    const pr = allProducts.find(prod => prod.id === pi.product_id);
                                    return (pr ? pr.name : 'Producto') + ' (x' + pi.quantity + ')';
                                }).join(', ');
                                const totalAmt = Number(p.total_amount || 0);
                                return `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td>${dateStr}</td>
                                    <td>${supplierName}</td>
                                    <td><small>${prodNames || 'Mercancía'}</small></td>
                                    <td><strong class="text-danger">$${totalAmt.toFixed(2)}</strong></td>
                                </tr>`;
                            }).join("")}
                        </tbody>
                    </table>
                </div>
            `;
        } else if (type === "products") {
            tableHtml = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="fw-bold mb-0">Reporte de Inventario de Productos (${items.length} Productos)</h6>
                    <button class="btn btn-sm btn-outline-danger fw-bold" onclick="PDFGenerator.generateInventoryPDF(DB.getLocalTable('products').filter(p=>p.business_id === Auth.currentBusiness.id), Auth.currentBusiness)"><i class="bi bi-file-earmark-pdf me-1"></i> Descargar PDF</button>
                </div>
                <div class="table-responsive">
                    <table class="table table-striped align-middle mb-0">
                        <thead class="table-dark">
                            <tr>
                                <th>#</th>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>Presentación</th>
                                <th>Stock</th>
                                <th>P. Compra Unit. ($)</th>
                                <th>P. Venta Detal ($)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map((p, idx) => `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td><strong>${p.name}</strong></td>
                                    <td><span class="badge bg-secondary">${p.category || 'General'}</span></td>
                                    <td><span class="badge bg-info text-dark">${p.presentation || 'Unidad'} ${p.units_per_package > 1 ? '(' + p.units_per_package + ' unds)' : ''}</span></td>
                                    <td><span class="badge ${p.quantity > 5 ? 'bg-success' : 'bg-danger'}">${p.quantity} unds</span></td>
                                    <td>$${Number(p.purchase_price).toFixed(2)}</td>
                                    <td><strong class="text-primary">$${Number(p.sale_price).toFixed(2)}</strong></td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            tableHtml = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="fw-bold mb-0">Reporte (${items.length} Registros)</h6>
                </div>
                <div class="table-responsive">
                    <table class="table table-striped align-middle">
                        <thead class="table-dark">
                            <tr><th>#</th><th>Nombre / Identificación</th><th>Contacto</th><th>Dirección</th></tr>
                        </thead>
                        <tbody>
                            ${items.map((i, idx) => `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td><strong>${i.name}</strong> ${i.identity_card ? '(' + i.identity_card + ')' : ''}</td>
                                    <td>${i.phone || i.email || 'N/A'}</td>
                                    <td>${i.address || 'N/A'}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            `;
        }

        container.innerHTML = tableHtml;
    }

    // --- MÓDULO ESTADÍSTICAS (CHART.JS) ---
    switchStatsMetric(metric, btn) {
        this.currentStatsMetric = metric;
        if (btn && btn.parentNode) {
            const btns = btn.parentNode.querySelectorAll("button");
            btns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        }
        this.loadStatisticsCharts();
    }

    async loadStatisticsCharts() {
        if (!Auth.currentBusiness) return;
        const metric = this.currentStatsMetric || "usd";

        const ctx1 = document.getElementById("chartSalesVsPurchases");
        const ctx2 = document.getElementById("chartTopProducts");

        if (!ctx1 || !ctx2 || typeof Chart === "undefined") return;

        const sales = DB.getLocalTable("sales").filter(s => s.business_id === Auth.currentBusiness.id);
        const purchases = DB.getLocalTable("purchases").filter(p => p.business_id === Auth.currentBusiness.id);

        const monthMap = {};
        sales.forEach(s => {
            const month = s.created_at ? s.created_at.slice(0, 7) : "Mes Actual";
            if (!monthMap[month]) monthMap[month] = { sales: 0, purchases: 0 };
            monthMap[month].sales += metric === "usd" ? Number(s.total_usd || 0) : (metric === "ves" ? Number(s.total_ves || 0) : (s.items || []).reduce((q, item) => q + Number(item.quantity || 1), 0));
        });

        purchases.forEach(p => {
            const month = p.created_at ? p.created_at.slice(0, 7) : "Mes Actual";
            if (!monthMap[month]) monthMap[month] = { sales: 0, purchases: 0 };
            monthMap[month].purchases += metric === "usd" ? Number(p.total_usd || 0) : (metric === "ves" ? Number(p.total_usd * CONFIG.DEFAULT_BCV_RATE || 0) : (p.items || []).reduce((q, item) => q + Number(item.quantity || 1), 0));
        });

        const labels = Object.keys(monthMap).sort();
        if (labels.length === 0) labels.push("Sin datos");

        const salesData = labels.map(l => monthMap[l] ? monthMap[l].sales : 0);
        const purchasesData = labels.map(l => monthMap[l] ? monthMap[l].purchases : 0);

        if (this._chart1) this._chart1.destroy();
        this._chart1 = new Chart(ctx1, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [
                    { label: `Ventas (${metric.toUpperCase()})`, data: salesData, backgroundColor: "rgba(25, 135, 84, 0.7)", borderColor: "#198754", borderWidth: 1 },
                    { label: `Compras (${metric.toUpperCase()})`, data: purchasesData, backgroundColor: "rgba(220, 53, 69, 0.7)", borderColor: "#dc3545", borderWidth: 1 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        const prodMap = {};
        sales.forEach(s => {
            (s.items || []).forEach(item => {
                const name = item.name || "Producto";
                prodMap[name] = (prodMap[name] || 0) + Number(item.quantity || 1);
            });
        });

        const topProds = Object.keys(prodMap).sort((a, b) => prodMap[b] - prodMap[a]).slice(0, 5);
        const topQty = topProds.map(p => prodMap[p]);

        if (this._chart2) this._chart2.destroy();
        this._chart2 = new Chart(ctx2, {
            type: "doughnut",
            data: {
                labels: topProds.length > 0 ? topProds : ["Sin ventas aún"],
                datasets: [{
                    data: topQty.length > 0 ? topQty : [1],
                    backgroundColor: ["#0d6efd", "#198754", "#ffc107", "#0dcaf0", "#6c757d"]
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // --- MÓDULO MANTENIMIENTO Y RESPALDOS ---
    async loadMaintenanceTab() {
        const tbody = document.getElementById("exportHistoryTableBody");
        if (!tbody || !Auth.currentBusiness) return;

        const exportsList = DB.getLocalTable("data_exports").filter(e => e.business_id === Auth.currentBusiness.id);

        if (exportsList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">No has realizado descargas de respaldo aún.</td></tr>`;
            return;
        }

        tbody.innerHTML = exportsList.map(e => `
            <tr>
                <td>${new Date(e.created_at).toLocaleString()}</td>
                <td><small>${e.modules}</small></td>
                <td><span class="badge bg-primary">${e.format}</span></td>
                <td><strong>${e.record_count}</strong> reg.</td>
            </tr>
        `).join("");
    }

    async executeDataBackup(event) {
        event.preventDefault();
        if (!Auth.currentBusiness) return;

        const selectedModules = [];
        if (document.getElementById("chkExpProducts").checked) selectedModules.push("products");
        if (document.getElementById("chkExpSales").checked) selectedModules.push("sales");
        if (document.getElementById("chkExpPurchases").checked) selectedModules.push("purchases");
        if (document.getElementById("chkExpClients").checked) selectedModules.push("clients");
        if (document.getElementById("chkExpSuppliers").checked) selectedModules.push("suppliers");

        if (selectedModules.length === 0) {
            return AppUI.showAlert("Aviso", "Selecciona al menos un módulo para exportar.", "warning");
        }

        const format = document.getElementById("exportFormatSelect").value;
        const result = await ImportExport.generateBackupDownload(selectedModules, format, Auth.currentBusiness.id);

        AppUI.showAlert("Respaldo Exitoso", `Se han descargado ${result.count} registros en formato ${format}.`, "success");
        this.loadMaintenanceTab();
    }
}

const User = new UserManager();
