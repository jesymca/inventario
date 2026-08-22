/**
 * SISTEMA DE CONTROL DE INVENTARIOS MULTI-USUARIO (Emprendimiento JOSE HERRERA)
 * Módulo de Usuario Comercio (Sección de Uso del Sistema)
 */

class UserManager {
    constructor() {
        this.cartItems = [];
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
                        <small>Membresía mensual: <strong>$10.00 USD</strong> (Tasa Oficial BCV: Bs. ${CONFIG.DEFAULT_BCV_RATE})</small>
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
                                <button class="btn btn-sm btn-outline-danger" onclick="PDFGenerator.generateInventoryPDF(DB.getLocalTable('products').filter(p=>p.business_id === Auth.currentBusiness.id), Auth.currentBusiness.name)"><i class="bi bi-file-earmark-pdf me-1"></i> PDF</button>
                                <button class="btn btn-sm btn-outline-secondary" onclick="User.openImportModal('products')"><i class="bi bi-file-earmark-spreadsheet me-1"></i> Carga Masiva CSV</button>
                                <button class="btn btn-sm btn-primary" onclick="User.openNewProductModal()"><i class="bi bi-plus-lg me-1"></i> Nuevo Producto</button>
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
                            <button class="btn btn-sm btn-success" onclick="User.openNewSaleModal()"><i class="bi bi-plus-circle me-1"></i> Realizar Venta</button>
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
                            <button class="btn btn-sm btn-primary" onclick="User.openNewPurchaseModal()"><i class="bi bi-plus-circle me-1"></i> Registrar Compra</button>
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
                                <button class="btn btn-sm btn-outline-danger" onclick="PDFGenerator.generateClientsPDF(DB.getLocalTable('clients').filter(c=>c.business_id === Auth.currentBusiness.id), Auth.currentBusiness.name)"><i class="bi bi-file-earmark-pdf me-1"></i> PDF</button>
                                <button class="btn btn-sm btn-outline-secondary" onclick="User.openImportModal('clients')"><i class="bi bi-file-earmark-spreadsheet me-1"></i> Carga Masiva CSV</button>
                                <button class="btn btn-sm btn-primary" onclick="User.openNewClientModal()"><i class="bi bi-plus-lg me-1"></i> Nuevo Cliente</button>
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
                                <button class="btn btn-sm btn-outline-danger" onclick="PDFGenerator.generateSuppliersPDF(DB.getLocalTable('suppliers').filter(s=>s.business_id === Auth.currentBusiness.id), Auth.currentBusiness.name)"><i class="bi bi-file-earmark-pdf me-1"></i> PDF</button>
                                <button class="btn btn-sm btn-outline-secondary" onclick="User.openImportModal('suppliers')"><i class="bi bi-file-earmark-spreadsheet me-1"></i> Carga Masiva CSV</button>
                                <button class="btn btn-sm btn-primary" onclick="User.openNewSupplierModal()"><i class="bi bi-plus-lg me-1"></i> Nuevo Proveedor</button>
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
                            <div class="card shadow-sm border-0">
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
                                        <div class="mb-3">
                                            <label class="form-label fw-semibold">Logo del Comercio (PNG / JPG)</label>
                                            <input type="file" class="form-control" accept="image/png, image/jpeg" onchange="User.handleLogoChange(event)">
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

    async loadProductsTable() {
        const tbody = document.getElementById("userProductsTableBody");
        if (!tbody || !Auth.currentBusiness) return;

        const products = DB.getLocalTable("products").filter(p => p.business_id === Auth.currentBusiness.id);

        if (products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No hay productos en inventario. ¡Agrega uno o carga datos de prueba!</td></tr>`;
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
                    <button class="btn btn-sm btn-outline-danger" onclick="User.deleteProduct('${p.id}')"><i class="bi bi-trash"></i></button>
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

    async deleteProduct(productId) {
        if (!confirm("¿Deseas eliminar este producto del inventario?")) return;
        await DB.query("DELETE FROM products WHERE id = ?", [productId]);
        DB.deleteLocalRecord("products", productId);
        this.loadProductsTable();
    }

    async loadClientsTable() {
        const tbody = document.getElementById("userClientsTableBody");
        if (!tbody || !Auth.currentBusiness) return;

        const clients = DB.getLocalTable("clients").filter(c => c.business_id === Auth.currentBusiness.id);

        if (clients.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No hay clientes registrados.</td></tr>`;
            return;
        }

        tbody.innerHTML = clients.map(c => `
            <tr>
                <td><code>${c.identity_card || 'N/A'}</code></td>
                <td><strong>${c.name}</strong></td>
                <td>${c.phone || 'N/A'}</td>
                <td>${c.address || 'N/A'}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" onclick="User.deleteClient('${c.id}')"><i class="bi bi-trash"></i></button>
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

    async deleteClient(clientId) {
        if (!confirm("¿Deseas eliminar este cliente?")) return;
        await DB.query("DELETE FROM clients WHERE id = ?", [clientId]);
        DB.deleteLocalRecord("clients", clientId);
        this.loadClientsTable();
    }

    async loadSuppliersTable() {
        const tbody = document.getElementById("userSuppliersTableBody");
        if (!tbody || !Auth.currentBusiness) return;

        const suppliers = DB.getLocalTable("suppliers").filter(s => s.business_id === Auth.currentBusiness.id);

        if (suppliers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No hay proveedores registrados.</td></tr>`;
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
                    <button class="btn btn-sm btn-outline-danger" onclick="User.deleteSupplier('${s.id}')"><i class="bi bi-trash"></i></button>
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

    async deleteSupplier(supplierId) {
        if (!confirm("¿Deseas eliminar este proveedor?")) return;
        await DB.query("DELETE FROM suppliers WHERE id = ?", [supplierId]);
        DB.deleteLocalRecord("suppliers", supplierId);
        this.loadSuppliersTable();
    }

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
        const modal = new bootstrap.Modal(document.getElementById("modalNewSale"));
        const clientSelect = document.getElementById("saleClientSelect");
        const productSelect = document.getElementById("saleProductSelect");

        const clients = DB.getLocalTable("clients").filter(c => c.business_id === Auth.currentBusiness.id);
        const products = DB.getLocalTable("products").filter(p => p.business_id === Auth.currentBusiness.id);

        clientSelect.innerHTML = clients.map(c => `<option value="${c.id}">${c.name} (${c.identity_card})</option>`).join("");
        productSelect.innerHTML = products.map(p => `<option value="${p.id}">${p.name} - Stock: ${p.quantity} - $${p.sale_price}</option>`).join("");

        modal.show();
    }

    async saveNewSale(event) {
        event.preventDefault();
        const form = event.target;
        const clientId = form.client_id.value;
        const productId = form.product_id.value;
        const qty = parseInt(form.quantity.value);

        const products = DB.getLocalTable("products");
        const pIdx = products.findIndex(p => p.id === productId);

        if (pIdx < 0) return alert("Producto no encontrado.");
        if (products[pIdx].quantity < qty) return alert("¡Stock insuficiente para realizar la venta!");

        // Descontar Stock automáticamente
        products[pIdx].quantity -= qty;
        DB.setLocalTable("products", products);

        const totalAmount = products[pIdx].sale_price * qty;
        const newSale = {
            id: "sale_" + Date.now(),
            business_id: Auth.currentBusiness.id,
            client_id: clientId,
            total_amount: totalAmount,
            sale_date: new Date().toISOString()
        };

        DB.setLocalRecord("sales", newSale);

        bootstrap.Modal.getInstance(document.getElementById("modalNewSale")).hide();
        form.reset();
        alert("¡Venta realizada con éxito! El inventario ha sido actualizado.");
        this.loadSalesTable();
        this.loadProductsTable();
    }

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
        const modal = new bootstrap.Modal(document.getElementById("modalNewPurchase"));
        const supplierSelect = document.getElementById("purchaseSupplierSelect");
        const productSelect = document.getElementById("purchaseProductSelect");

        const suppliers = DB.getLocalTable("suppliers").filter(s => s.business_id === Auth.currentBusiness.id);
        const products = DB.getLocalTable("products").filter(p => p.business_id === Auth.currentBusiness.id);

        supplierSelect.innerHTML = suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join("");
        productSelect.innerHTML = products.map(p => `<option value="${p.id}">${p.name} - Stock Actual: ${p.quantity}</option>`).join("");

        modal.show();
    }

    async saveNewPurchase(event) {
        event.preventDefault();
        const form = event.target;
        const supplierId = form.supplier_id.value;
        const productId = form.product_id.value;
        const qty = parseInt(form.quantity.value);
        const unitPrice = parseFloat(form.unit_price.value);

        const products = DB.getLocalTable("products");
        const pIdx = products.findIndex(p => p.id === productId);

        if (pIdx >= 0) {
            // Incrementar Stock automáticamente
            products[pIdx].quantity += qty;
            products[pIdx].purchase_price = unitPrice;
            DB.setLocalTable("products", products);
        }

        const totalAmount = unitPrice * qty;
        const newPurchase = {
            id: "purch_" + Date.now(),
            business_id: Auth.currentBusiness.id,
            supplier_id: supplierId,
            total_amount: totalAmount,
            purchase_date: new Date().toISOString()
        };

        DB.setLocalRecord("purchases", newPurchase);

        bootstrap.Modal.getInstance(document.getElementById("modalNewPurchase")).hide();
        form.reset();
        alert("¡Compra registrada! El stock del producto ha sido incrementado.");
        this.loadPurchasesTable();
        this.loadProductsTable();
    }

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
        const method = DB.getLocalTable("payment_methods").find(m => m.id === methodId);

        const amountUsd = 10.00;
        const amountVes = amountUsd * CONFIG.DEFAULT_BCV_RATE;

        const newPayment = {
            id: "pay_" + Date.now(),
            user_id: Auth.currentUser.id,
            business_id: Auth.currentBusiness.id,
            payment_method_id: methodId,
            amount_usd: amountUsd,
            amount_ves: amountVes,
            bcv_rate: CONFIG.DEFAULT_BCV_RATE,
            reference_number: form.reference_number.value,
            bank_origin: form.bank_origin.value,
            payment_date: form.payment_date.value,
            status: "pendiente",
            created_at: new Date().toISOString()
        };

        DB.setLocalRecord("payments", newPayment);
        bootstrap.Modal.getInstance(document.getElementById("modalReportPayment")).hide();
        form.reset();
        alert("Tu pago ha sido reportado con éxito. El Administrador verificará los datos en breve.");
    }

    openImportModal(entityType) {
        document.getElementById("importEntityType").value = entityType;
        document.getElementById("importEntityTitle").innerText = entityType === "products" ? "Productos" : (entityType === "clients" ? "Clientes" : "Proveedores");
        const modal = new bootstrap.Modal(document.getElementById("modalMassImport"));
        modal.show();
    }

    async handleMassImport(event) {
        event.preventDefault();
        const entityType = document.getElementById("importEntityType").value;
        const fileInput = document.getElementById("importCsvFile");
        if (!fileInput.files[0]) return alert("Selecciona un archivo CSV.");

        let count = 0;
        if (entityType === "products") {
            count = await ImportExport.importProductsCSV(fileInput.files[0], Auth.currentBusiness.id);
            this.loadProductsTable();
        } else if (entityType === "clients") {
            count = await ImportExport.importClientsCSV(fileInput.files[0], Auth.currentBusiness.id);
            this.loadClientsTable();
        } else if (entityType === "suppliers") {
            count = await ImportExport.importSuppliersCSV(fileInput.files[0], Auth.currentBusiness.id);
            this.loadSuppliersTable();
        }

        bootstrap.Modal.getInstance(document.getElementById("modalMassImport")).hide();
        alert(`¡Carga masiva completada! Se importaron ${count} registros.`);
    }

    async saveBusinessProfile(event) {
        event.preventDefault();
        const form = event.target;
        const updatedBiz = {
            ...Auth.currentBusiness,
            name: form.name.value,
            phone: form.phone.value,
            email: form.email.value,
            address: form.address.value,
            website: form.website.value,
            branding_color: form.branding_color.value
        };

        DB.setLocalRecord("businesses", updatedBiz);
        Auth.saveSession(Auth.currentUser, updatedBiz);
        alert("Perfil del negocio actualizado.");
        AppUI.applyBrandingColor(updatedBiz.branding_color);
    }

    async addDelegatedAdmin(event) {
        event.preventDefault();
        const emailInput = document.getElementById("delegatedAdminEmail");
        const email = emailInput.value.trim().toLowerCase();

        const roleId = "ubr_" + Date.now();
        const newRole = {
            id: roleId,
            user_email: email,
            business_id: Auth.currentBusiness.id,
            role: "delegated_admin",
            created_at: new Date().toISOString()
        };

        DB.setLocalRecord("user_business_roles", newRole);
        emailInput.value = "";
        alert(`El usuario ${email} ha sido asignado como Administrador Delegado de ${Auth.currentBusiness.name}.`);
        this.loadDelegatedAdminsList();
    }

    async loadDelegatedAdminsList() {
        const list = document.getElementById("delegatedAdminsList");
        if (!list || !Auth.currentBusiness) return;

        const roles = DB.getLocalTable("user_business_roles").filter(r => r.business_id === Auth.currentBusiness.id);
        list.innerHTML = roles.map(r => `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <i class="bi bi-person-badge me-2"></i> ${r.user_email}
                    <span class="badge ${r.role === 'owner' ? 'bg-primary' : 'bg-info text-dark'} ms-1">${r.role === 'owner' ? 'Propietario' : 'Delegado'}</span>
                </div>
            </li>
        `).join("");
    }
}

const User = new UserManager();
