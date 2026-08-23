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
        const trialDays = Auth.getRemainingTrialDays();
        const membershipDays = Auth.getRemainingMembershipDays();

        container.innerHTML = `
            <!-- Banner de Estado de Membresía / Prueba -->
            <div class="alert ${membershipDays > 0 ? 'alert-success' : (trialDays > 0 ? 'alert-info' : 'alert-warning')} shadow-sm d-flex justify-content-between align-items-center mb-4">
                <div class="d-flex align-items-center">
                    <i class="bi bi-clock-history fs-3 me-3"></i>
                    <div>
                        <h6 class="alert-heading mb-0 fw-bold">
                            ${membershipDays > 0 ? `Membresía Activa: Te quedan ${membershipDays} días de servicio` : 
                              (trialDays > 0 ? `Período de Prueba Gratuito: Te quedan ${trialDays} días de uso libre (15 Días)` : 
                              'Tu período de prueba o membresía ha caducado. Por favor realiza tu pago.')}
                        </h6>
                        <small>Membresía mensual: <strong>$${CONFIG.MEMBERSHIP_PRICE_USD.toFixed(2)} USD</strong> (Tasa Oficial BCV: Bs. ${CONFIG.DEFAULT_BCV_RATE.toFixed(2)})</small>
                    </div>
                </div>
                <button class="btn btn-sm btn-dark" onclick="User.openReportPaymentModal()"><i class="bi bi-credit-card me-1"></i> Reportar Pago</button>
            </div>

            <!-- Navegación por Pestañas del Comercio -->
            <ul class="nav nav-pills mb-4 gap-2" id="userPillsTab" role="tablist">
                <li class="nav-item">
                    <button class="nav-link ${activeTab === 'tab-inventory' ? 'active' : ''}" id="pills-inventory-tab" data-bs-toggle="pill" data-bs-target="#pills-inventory" type="button"><i class="bi bi-box-seam me-1"></i> Inventario</button>
                </li>
                <li class="nav-item">
                    <button class="nav-link ${activeTab === 'tab-sales' ? 'active' : ''}" id="pills-sales-tab" data-bs-toggle="pill" data-bs-target="#pills-sales" type="button"><i class="bi bi-cart-check me-1"></i> Ventas</button>
                </li>
                <li class="nav-item">
                    <button class="nav-link ${activeTab === 'tab-purchases' ? 'active' : ''}" id="pills-purchases-tab" data-bs-toggle="pill" data-bs-target="#pills-purchases" type="button"><i class="bi bi-bag-plus me-1"></i> Compras</button>
                </li>
                <li class="nav-item">
                    <button class="nav-link ${activeTab === 'tab-clients' ? 'active' : ''}" id="pills-clients-tab" data-bs-toggle="pill" data-bs-target="#pills-clients" type="button"><i class="bi bi-people me-1"></i> Clientes</button>
                </li>
                <li class="nav-item">
                    <button class="nav-link ${activeTab === 'tab-suppliers' ? 'active' : ''}" id="pills-suppliers-tab" data-bs-toggle="pill" data-bs-target="#pills-suppliers" type="button"><i class="bi bi-truck me-1"></i> Proveedores</button>
                </li>
                <li class="nav-item">
                    <button class="nav-link ${activeTab === 'tab-profile' ? 'active' : ''}" id="pills-profile-tab" data-bs-toggle="pill" data-bs-target="#pills-profile" type="button"><i class="bi bi-gear me-1"></i> Perfil Negocio</button>
                </li>
            </ul>

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

                <!-- 6. TAB PERFIL NEGOCIO -->
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
                                            <div class="col-md-6">
                                                <label class="form-label fw-semibold">Teléfono (WhatsApp)</label>
                                                <input type="text" class="form-control" name="phone" value="${currentBiz.phone || ''}">
                                            </div>
                                            <div class="col-md-6">
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

        tbody.innerHTML = products.map(p => `
            <tr>
                <td>
                    ${p.image_url ? `<img src="${p.image_url}" class="rounded" style="width: 40px; height: 40px; object-fit: cover;">` : '<div class="bg-secondary text-white rounded d-flex align-items-center justify-content-center" style="width:40px;height:40px;"><i class="bi bi-box"></i></div>'}
                </td>
                <td><strong>${p.name}</strong><br><small class="text-muted">${p.description || ''}</small></td>
                <td><span class="badge bg-light text-dark border">${p.category || 'General'}</span></td>
                <td><span class="badge ${p.quantity > 5 ? 'bg-success' : 'bg-danger'} fs-6">${p.quantity}</span></td>
                <td>$${Number(p.purchase_price).toFixed(2)}</td>
                <td><strong class="text-primary">$${Number(p.sale_price).toFixed(2)}</strong></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="User.openEditProductModal('${p.id}')" title="Editar Producto"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="User.deleteProduct('${p.id}')" title="Eliminar Producto"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `).join("");
    }

    async openNewProductModal() {
        const modal = new bootstrap.Modal(document.getElementById("modalNewProduct"));
        modal.show();
    }

    async saveNewProduct(event) {
        event.preventDefault();
        const form = event.target;
        const fileInput = form.querySelector('input[type="file"]');
        let imageUrl = null;

        if (fileInput && fileInput.files[0]) {
            imageUrl = await Storage.uploadImage(fileInput.files[0]);
        }

        const newProd = {
            id: "prod_" + Date.now(),
            business_id: Auth.currentBusiness.id,
            name: form.name.value,
            description: form.description.value,
            image_url: imageUrl,
            quantity: parseInt(form.quantity.value || 0),
            purchase_price: parseFloat(form.purchase_price.value || 0),
            sale_price: parseFloat(form.sale_price.value || 0),
            category: form.category.value || "General",
            created_at: new Date().toISOString()
        };

        await DB.query(
            `INSERT INTO products (id, business_id, name, description, image_url, quantity, purchase_price, sale_price, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [newProd.id, newProd.business_id, newProd.name, newProd.description, newProd.image_url, newProd.quantity, newProd.purchase_price, newProd.sale_price, newProd.category]
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
        document.getElementById("editProductPurchasePrice").value = prod.purchase_price || 0;
        document.getElementById("editProductSalePrice").value = prod.sale_price || 0;

        const modal = new bootstrap.Modal(document.getElementById("modalEditProduct"));
        modal.show();
    }

    async saveEditProduct(event) {
        event.preventDefault();
        const form = event.target;
        const productId = form.id.value;
        const fileInput = form.querySelector('input[type="file"]');
        let imageUrl = null;

        if (fileInput && fileInput.files[0]) {
            imageUrl = await Storage.uploadImage(fileInput.files[0]);
        }

        const products = DB.getLocalTable("products");
        const idx = products.findIndex(p => p.id === productId);
        if (idx < 0) return alert("Producto no encontrado.");

        products[idx].name = form.name.value;
        products[idx].description = form.description.value;
        products[idx].category = form.category.value || "General";
        products[idx].quantity = parseInt(form.quantity.value || 0);
        products[idx].purchase_price = parseFloat(form.purchase_price.value || 0);
        products[idx].sale_price = parseFloat(form.sale_price.value || 0);
        if (imageUrl) products[idx].image_url = imageUrl;

        await DB.query(
            `UPDATE products SET name = ?, description = ?, category = ?, quantity = ?, purchase_price = ?, sale_price = ? ${imageUrl ? ', image_url = ?' : ''} WHERE id = ?`,
            imageUrl ? 
            [products[idx].name, products[idx].description, products[idx].category, products[idx].quantity, products[idx].purchase_price, products[idx].sale_price, imageUrl, productId] :
            [products[idx].name, products[idx].description, products[idx].category, products[idx].quantity, products[idx].purchase_price, products[idx].sale_price, productId]
        );
        DB.setLocalTable("products", products);

        bootstrap.Modal.getInstance(document.getElementById("modalEditProduct")).hide();
        alert("¡Producto actualizado con éxito!");
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
        alert("¡Cliente actualizado con éxito!");
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
        alert("¡Proveedor actualizado con éxito!");
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

        if (existingIdx >= 0) {
            this.saleCartItems[existingIdx].quantity += qty;
        } else {
            this.saleCartItems.push({
                product_id: prod.id,
                name: prod.name,
                unit_price: prod.sale_price,
                quantity: qty,
                available_stock: prod.quantity
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
            return `
                <tr>
                    <td><strong>${item.name}</strong></td>
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

        if (totalText) totalText.innerText = `$${total.toFixed(2)} USD (Bs. ${(total * CONFIG.DEFAULT_BCV_RATE).toFixed(2)})`;
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
            sale_date: new Date().toISOString()
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
        alert("¡Venta realizada con éxito! El inventario ha sido actualizado para todos los productos.");
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
        alert("¡Compra registrada! El stock y costo de los productos han sido incrementados.");
        this.loadPurchasesTable();
        this.loadProductsTable();
    }

    // --- REPORTAR PAGO Y PERFIL DE NEGOCIO ---
    openReportPaymentModal() {
        const modal = new bootstrap.Modal(document.getElementById("modalReportPayment"));
        const methodSelect = document.getElementById("paymentMethodSelect");
        const methods = DB.getLocalTable("payment_methods").filter(m => Number(m.is_active) === 1);

        methodSelect.innerHTML = methods.map(m => `<option value="${m.id}">${m.title} (${m.currency})</option>`).join("");
        modal.show();
    }

    async saveReportPayment(event) {
        event.preventDefault();
        const form = event.target;
        const methodId = form.method_id.value;
        const proofInput = document.getElementById("paymentProofFile");
        let proofUrl = "";

        if (proofInput && proofInput.files && proofInput.files[0]) {
            proofUrl = await Storage.uploadImage(proofInput.files[0]);
        }

        const amountUsd = CONFIG.MEMBERSHIP_PRICE_USD;
        const amountVes = amountUsd * CONFIG.DEFAULT_BCV_RATE;

        const newPayment = {
            id: "pay_" + Date.now(),
            user_id: Auth.currentUser ? Auth.currentUser.id : "",
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
        alert("¡Comprobante de pago enviado con éxito! El Administrador revisará tu archivo adjunto para verificar y activar tu membresía.");
    }

    async saveBusinessProfile(event) {
        event.preventDefault();
        const form = event.target;
        const bizId = Auth.currentBusiness.id;

        const businesses = DB.getLocalTable("businesses");
        const idx = businesses.findIndex(b => b.id === bizId);
        if (idx >= 0) {
            businesses[idx].name = form.name.value;
            businesses[idx].phone = form.phone.value;
            businesses[idx].email = form.email.value;
            businesses[idx].address = form.address.value;
            businesses[idx].website = form.website.value;
            businesses[idx].branding_color = form.branding_color.value;
            businesses[idx].pdf_header_text = form.pdf_header_text ? form.pdf_header_text.value : "";
            businesses[idx].pdf_footer_text = form.pdf_footer_text ? form.pdf_footer_text.value : "";

            try {
                await DB.query(
                    `UPDATE businesses SET name = ?, phone = ?, email = ?, address = ?, website = ?, branding_color = ?, pdf_header_text = ?, pdf_footer_text = ? WHERE id = ?`,
                    [businesses[idx].name, businesses[idx].phone, businesses[idx].email, businesses[idx].address, businesses[idx].website, businesses[idx].branding_color, businesses[idx].pdf_header_text, businesses[idx].pdf_footer_text, bizId]
                );
            } catch (e) {
                await DB.query(
                    `UPDATE businesses SET name = ?, phone = ?, email = ?, address = ?, website = ?, branding_color = ? WHERE id = ?`,
                    [businesses[idx].name, businesses[idx].phone, businesses[idx].email, businesses[idx].address, businesses[idx].website, businesses[idx].branding_color, bizId]
                );
            }

            DB.setLocalTable("businesses", businesses);
            Auth.currentBusiness = businesses[idx];
            sessionStorage.setItem("inv_current_biz", JSON.stringify(businesses[idx]));
        }

        alert("¡Perfil del negocio y preferencias de PDF actualizadas con éxito!");
        AppUI.renderApp();
    }

    async handleLogoChange(event) {
        const file = event.target.files[0];
        if (!file || !Auth.currentBusiness) return;

        const logoUrl = await Storage.uploadImage(file);
        if (logoUrl) {
            const businesses = DB.getLocalTable("businesses");
            const idx = businesses.findIndex(b => b.id === Auth.currentBusiness.id);
            if (idx >= 0) {
                businesses[idx].logo_url = logoUrl;
                await DB.query("UPDATE businesses SET logo_url = ? WHERE id = ?", [logoUrl, Auth.currentBusiness.id]);
                DB.setLocalTable("businesses", businesses);
                Auth.currentBusiness = businesses[idx];
                sessionStorage.setItem("inv_current_biz", JSON.stringify(businesses[idx]));
                alert("¡Logo actualizado con éxito!");
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
        alert(`¡Usuario ${email} agregado como Administrador Delegado!`);
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
}

const User = new UserManager();
