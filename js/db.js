/**
 * SISTEMA DE CONTROL DE INVENTARIOS MULTI-USUARIO (Emprendimiento JOSE HERRERA)
 * Gestor de Base de Datos (Turso libSQL REST API + Fallback LocalStorage)
 */

class DatabaseManager {
    constructor() {
        this.httpUrl = CONFIG.TURSO.httpUrl;
        this.token = CONFIG.TURSO.authToken;
        this.isOnline = true;
        this.storageKeyPrefix = "inv_db_";
        this.initLocalStorage();
    }

    /**
     * Inicializa las tablas predeterminadas en localStorage si no existen
     */
    initLocalStorage() {
        const tables = [
            "users", "businesses", "user_business_roles", "payment_methods",
            "payments", "clients", "suppliers", "products", "purchases",
            "purchase_items", "sales", "sale_items", "incidents", "settings"
        ];
        tables.forEach(table => {
            if (!localStorage.getItem(this.storageKeyPrefix + table)) {
                localStorage.setItem(this.storageKeyPrefix + table, JSON.stringify([]));
            }
        });

        // Configuración inicial en localStorage
        const settings = this.getLocalTable("settings");
        if (settings.length === 0) {
            this.setLocalRecord("settings", { key_name: "bcv_rate", value: String(CONFIG.DEFAULT_BCV_RATE) });
            this.setLocalRecord("settings", { key_name: "membership_price_usd", value: String(CONFIG.MEMBERSHIP_PRICE_USD) });
        } else {
            const priceSetting = settings.find(s => s.key_name === "membership_price_usd");
            const rateSetting = settings.find(s => s.key_name === "bcv_rate");
            if (priceSetting) CONFIG.MEMBERSHIP_PRICE_USD = parseFloat(priceSetting.value);
            if (rateSetting) CONFIG.DEFAULT_BCV_RATE = parseFloat(rateSetting.value);
        }

        // Cargar métodos de pago por defecto si no existen
        const pms = this.getLocalTable("payment_methods");
        if (pms.length === 0) {
            CONFIG.DEFAULT_PAYMENT_METHODS.forEach(pm => {
                this.setLocalRecord("payment_methods", pm);
            });
        }

        // Cargar SuperAdmin si no existe
        const users = this.getLocalTable("users");
        const adminExists = users.some(u => u.email === CONFIG.SUPER_ADMIN.email);
        if (!adminExists) {
            const adminUser = {
                id: "usr_superadmin",
                google_id: null,
                name: CONFIG.SUPER_ADMIN.name,
                email: CONFIG.SUPER_ADMIN.email,
                password_hash: CONFIG.SUPER_ADMIN.password,
                role: "superadmin",
                trial_starts_at: new Date().toISOString(),
                membership_expires_at: new Date(Date.now() + 3650 * 86400000).toISOString(), // 10 años
                is_active: 1,
                created_at: new Date().toISOString()
            };
            this.setLocalRecord("users", adminUser);
        }

        // Migración v1.9.0: Agregar columnas wholesale y presentación a productos existentes en localStorage
        const existingProducts = this.getLocalTable("products");
        if (existingProducts.length > 0) {
            let updated = false;
            existingProducts.forEach(p => {
                if (p.sell_type === undefined) { p.sell_type = 'retail'; updated = true; }
                if (p.wholesale_price === undefined) { p.wholesale_price = 0; updated = true; }
                if (p.wholesale_min_qty === undefined) { p.wholesale_min_qty = 1; updated = true; }
                if (p.units_per_package === undefined) { p.units_per_package = 1; updated = true; }
                if (p.presentation === undefined) { p.presentation = 'Unidad'; updated = true; }
                if (p.purchase_currency === undefined) { p.purchase_currency = 'USD'; updated = true; }
                if (p.package_purchase_price === undefined) { p.package_purchase_price = p.purchase_price || 0; updated = true; }
            });
            if (updated) this.setLocalTable("products", existingProducts);
        }

        // Migración Turso v1.9.0: agregar columnas wholesale y presentación
        this.runMigrations();
    }

    /**
     * Ejecuta migraciones de esquema idempotentes en Turso
     */
    async runMigrations() {
        const migrations = [
            "ALTER TABLE users ADD COLUMN phone TEXT",
            "ALTER TABLE businesses ADD COLUMN rif TEXT",
            "ALTER TABLE businesses ADD COLUMN pdf_header_text TEXT",
            "ALTER TABLE businesses ADD COLUMN pdf_footer_text TEXT",
            "ALTER TABLE products ADD COLUMN sell_type TEXT DEFAULT 'retail'",
            "ALTER TABLE products ADD COLUMN wholesale_price REAL DEFAULT 0",
            "ALTER TABLE products ADD COLUMN wholesale_min_qty INTEGER DEFAULT 1",
            "ALTER TABLE products ADD COLUMN units_per_package INTEGER DEFAULT 1",
            "ALTER TABLE products ADD COLUMN presentation TEXT DEFAULT 'Unidad'",
            "ALTER TABLE products ADD COLUMN purchase_currency TEXT DEFAULT 'USD'",
            "ALTER TABLE products ADD COLUMN package_purchase_price REAL DEFAULT 0"
        ];
        for (const sql of migrations) {
            try {
                await this.query(sql);
            } catch (e) {
                // Column already exists - ignorar silenciosamente
            }
        }
    }

    /**
     * Ejecuta una consulta SQL a Turso mediante la API HTTP pipeline (/v2/pipeline)
     * Caerá en fallback local en caso de desconexión o error de red
     */
    async query(sql, params = []) {
        try {
            const response = await fetch(`${this.httpUrl}/v2/pipeline`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    requests: [
                        { type: "execute", stmt: { sql, args: params.map(p => this.formatArg(p)) } },
                        { type: "close" }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`Turso HTTP error status: ${response.status}`);
            }

            const data = await response.json();
            const result = data.results[0];
            if (result.type === "error") {
                throw new Error(result.error.message);
            }

            return this.transformTursoResult(result.response.result);
        } catch (err) {
            console.warn("Turso API inaccesible o error de red. Usando motor LocalStorage:", err.message);
            return this.queryLocalStorageFallback(sql, params);
        }
    }

    formatArg(val) {
        if (val === null || val === undefined) return { type: "null" };
        if (typeof val === "number") return Number.isInteger(val) ? { type: "integer", value: String(val) } : { type: "float", value: val };
        return { type: "text", value: String(val) };
    }

    transformTursoResult(res) {
        if (!res || !res.cols) return { rows: [], rowsAffected: res ? res.affected_row_count : 0 };
        const cols = res.cols.map(c => c.name);
        const rows = res.rows.map(r => {
            const rowObj = {};
            r.forEach((cell, idx) => {
                rowObj[cols[idx]] = cell.value;
            });
            return rowObj;
        });
        return { rows, rowsAffected: res.affected_row_count || rows.length };
    }

    // --- Métodos de Fallback LocalStorage ---
    getLocalTable(tableName) {
        const raw = localStorage.getItem(this.storageKeyPrefix + tableName);
        return raw ? JSON.parse(raw) : [];
    }

    setLocalTable(tableName, rows) {
        localStorage.setItem(this.storageKeyPrefix + tableName, JSON.stringify(rows));
    }

    setLocalRecord(tableName, record) {
        const rows = this.getLocalTable(tableName);
        const primaryKey = tableName === "settings" ? "key_name" : "id";
        const idx = rows.findIndex(r => r[primaryKey] === record[primaryKey]);
        if (idx >= 0) {
            rows[idx] = { ...rows[idx], ...record };
        } else {
            rows.push(record);
        }
        this.setLocalTable(tableName, rows);
    }

    deleteLocalRecord(tableName, id) {
        const primaryKey = tableName === "settings" ? "key_name" : "id";
        const rows = this.getLocalTable(tableName).filter(r => r[primaryKey] !== id);
        this.setLocalTable(tableName, rows);
    }

    queryLocalStorageFallback(sql, params) {
        const cleanSql = sql.trim().toLowerCase();
        
        // Simulación básica de consultas SQL recurrentes en LocalStorage
        if (cleanSql.startsWith("select")) {
            if (cleanSql.includes("from users")) {
                let users = this.getLocalTable("users");
                if (cleanSql.includes("email =")) {
                    const emailParam = params[0];
                    users = users.filter(u => u.email.toLowerCase() === String(emailParam).toLowerCase());
                }
                if (cleanSql.includes("id =")) {
                    const idParam = params[0];
                    users = users.filter(u => u.id === idParam);
                }
                return { rows: users, rowsAffected: 0 };
            }

            if (cleanSql.includes("from businesses")) {
                let businesses = this.getLocalTable("businesses");
                if (cleanSql.includes("owner_user_id =")) {
                    businesses = businesses.filter(b => b.owner_user_id === params[0]);
                } else if (cleanSql.includes("id =")) {
                    businesses = businesses.filter(b => b.id === params[0]);
                }
                return { rows: businesses, rowsAffected: 0 };
            }

            if (cleanSql.includes("from user_business_roles")) {
                let roles = this.getLocalTable("user_business_roles");
                if (cleanSql.includes("user_email =")) {
                    roles = roles.filter(r => r.user_email.toLowerCase() === String(params[0]).toLowerCase());
                }
                return { rows: roles, rowsAffected: 0 };
            }

            if (cleanSql.includes("from payment_methods")) {
                let pms = this.getLocalTable("payment_methods");
                if (cleanSql.includes("is_active = 1")) {
                    pms = pms.filter(p => Number(p.is_active) === 1);
                }
                return { rows: pms, rowsAffected: 0 };
            }

            if (cleanSql.includes("from payments")) {
                let payments = this.getLocalTable("payments");
                if (cleanSql.includes("user_id =")) {
                    payments = payments.filter(p => p.user_id === params[0]);
                } else if (cleanSql.includes("status =")) {
                    payments = payments.filter(p => p.status === params[0]);
                }
                return { rows: payments, rowsAffected: 0 };
            }

            if (cleanSql.includes("from clients")) {
                let clients = this.getLocalTable("clients");
                if (cleanSql.includes("business_id =")) {
                    clients = clients.filter(c => c.business_id === params[0]);
                }
                return { rows: clients, rowsAffected: 0 };
            }

            if (cleanSql.includes("from suppliers")) {
                let suppliers = this.getLocalTable("suppliers");
                if (cleanSql.includes("business_id =")) {
                    suppliers = suppliers.filter(s => s.business_id === params[0]);
                }
                return { rows: suppliers, rowsAffected: 0 };
            }

            if (cleanSql.includes("from products")) {
                let products = this.getLocalTable("products");
                if (cleanSql.includes("business_id =")) {
                    products = products.filter(p => p.business_id === params[0]);
                }
                return { rows: products, rowsAffected: 0 };
            }

            if (cleanSql.includes("from purchases")) {
                let purchases = this.getLocalTable("purchases");
                if (cleanSql.includes("business_id =")) {
                    purchases = purchases.filter(p => p.business_id === params[0]);
                }
                return { rows: purchases, rowsAffected: 0 };
            }

            if (cleanSql.includes("from sales")) {
                let sales = this.getLocalTable("sales");
                if (cleanSql.includes("business_id =")) {
                    sales = sales.filter(s => s.business_id === params[0]);
                }
                return { rows: sales, rowsAffected: 0 };
            }

            if (cleanSql.includes("from incidents")) {
                let incidents = this.getLocalTable("incidents");
                return { rows: incidents, rowsAffected: 0 };
            }

            if (cleanSql.includes("from settings")) {
                let settings = this.getLocalTable("settings");
                if (cleanSql.includes("key_name =")) {
                    settings = settings.filter(s => s.key_name === params[0]);
                }
                return { rows: settings, rowsAffected: 0 };
            }
        }

        // Tratar escrituras/modificaciones en LocalStorage si no coincidió con SELECT
        return { rows: [], rowsAffected: 1 };
    }
}

// Instancia Global
const DB = new DatabaseManager();
