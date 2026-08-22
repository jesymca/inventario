/**
 * SISTEMA DE CONTROL DE INVENTARIOS MULTI-USUARIO (Emprendimiento JOSE HERRERA)
 * Perfiles Precargados de Comercios y Generador de Datos de Prueba (Switch Demo)
 */

const PRESETS_DATA = {
    panaderia: {
        name: "Panadería & Pastelería La Espiga de Oro",
        category: "Panadería",
        color: "#d97706",
        products: [
            { name: "Pan Canilla 250g", description: "Pan salado tradicional crujiente", quantity: 120, purchase_price: 0.35, sale_price: 0.70, category: "Panes" },
            { name: "Pan Sobado Grande", description: "Pan suave mantequilloso", quantity: 60, purchase_price: 0.80, sale_price: 1.50, category: "Panes" },
            { name: "Cachito de Jamón y Queso", description: "Cachito hojaldrado relleno", quantity: 45, purchase_price: 0.90, sale_price: 1.80, category: "Bollería" },
            { name: "Torta Selva Negra por Porción", description: "Bizcocho de chocolate con crema y cerezas", quantity: 20, purchase_price: 1.50, sale_price: 3.00, category: "Repostería" },
            { name: "Café Marrón Mediano", description: "Café espresso en grano molido con leche", quantity: 200, purchase_price: 0.40, sale_price: 1.20, category: "Bebidas" }
        ],
        clients: [
            { identity_card: "V-18456123", name: "Carlos Mendoza", phone: "04125559911", address: "Calle Los Cedros Edif 3" },
            { identity_card: "V-22109483", name: "Elena Gómez", phone: "04143332211", address: "Av. Principal Nro 45" }
        ],
        suppliers: [
            { name: "Molinos Nacionales Monaca C.A.", phone: "02124001122", address: "Zona Industrial San Martín", email: "ventas@monaca.com", website: "www.monaca.com", instagram: "@monaca_ve" },
            { name: "Distribuidora Lácteos Los Andes", phone: "02129994455", address: "Av. Baralt Caracas", email: "contacto@losandes.com", website: "www.losandes.com", instagram: "@lacteoslosandes" }
        ]
    },
    zapateria: {
        name: "Zapatería Calzados Italia",
        category: "Zapatería",
        color: "#4f46e5",
        products: [
            { name: "Zapatos Formales de Cuero Marrón (Talla 41)", description: "Cuero 100% genuino costura reforzada", quantity: 15, purchase_price: 22.00, sale_price: 45.00, category: "Caballeros" },
            { name: "Tacones Elegantes Negros (Talla 37)", description: "Tacón fino 7cm acabado brillante", quantity: 12, purchase_price: 18.00, sale_price: 38.00, category: "Damas" },
            { name: "Zapatillas Deportivas Running", description: "Suela de eva ligera amortiguada", quantity: 30, purchase_price: 14.00, sale_price: 29.99, category: "Deporte" },
            { name: "Sandalias de Verano para Dama", description: "Diseño ergonómico correas ajustables", quantity: 25, purchase_price: 8.50, sale_price: 18.00, category: "Damas" }
        ],
        clients: [
            { identity_card: "V-15949430", name: "José Herrera", phone: "04141448515", address: "Urb. El Marqués Calle 5" }
        ],
        suppliers: [
            { name: "Importadora Calzados del Caribe", phone: "02418889900", address: "Valencia Zona Industrial", email: "ventas@calzadoscaribe.com", website: "www.calzadoscaribe.com", instagram: "@calzadoscaribe" }
        ]
    },
    libreria: {
        name: "Librería y Papelería El Saber",
        category: "Librería",
        color: "#0284c7",
        products: [
            { name: "Cuaderno Engrapado 100 Hojas Línea Sencilla", description: "Portada ilustrada papel 75g", quantity: 150, purchase_price: 0.60, sale_price: 1.20, category: "Papelería" },
            { name: "Caja de Lapiceros Azules x 12", description: "Punta fina 0.7mm tinta gel", quantity: 40, purchase_price: 2.10, sale_price: 4.50, category: "Oficina" },
            { name: "Resma de Papel Carta 500 Hojas", description: "Papel bond blanco 75g alto contraste", quantity: 80, purchase_price: 3.80, sale_price: 6.50, category: "Papelería" },
            { name: "Juego de Geometría Plástico Duro", description: "Regla 30cm, escuadras y transportador", quantity: 50, purchase_price: 1.10, sale_price: 2.50, category: "Escolar" }
        ],
        clients: [
            { identity_card: "J-304958210", name: "Unidad Educativa Simón Bolívar", phone: "02125551122", address: "Av. Universidad Caracas" }
        ],
        suppliers: [
            { name: "Distribuidora Escolar OfiPapel C.A.", phone: "02122345678", address: "Los Ruices Caracas", email: "pedidos@ofipapel.com", website: "www.ofipapel.com", instagram: "@ofipapel_ve" }
        ]
    },
    farmacia: {
        name: "Farmacia & Botica Vida Saludable",
        category: "Farmacia",
        color: "#16a34a",
        products: [
            { name: "Acetaminofén / Paracetamol 500mg (10 Tab)", description: "Analgésico y antipirético de rápida acción", quantity: 200, purchase_price: 0.40, sale_price: 1.00, category: "Analgésicos" },
            { name: "Amoxicilina 500mg Cápsulas (12 Tab)", description: "Antibiótico bactericida espectro amplio", quantity: 90, purchase_price: 1.80, sale_price: 3.50, category: "Antibióticos" },
            { name: "Vitamina C 1000mg Efervescente", description: "Suplemento inmunológico tubo 10 tabletas", quantity: 60, purchase_price: 1.20, sale_price: 2.80, category: "Vitaminas" },
            { name: "Alcohol Antiséptico 70% 500ml", description: "Desinfectante de uso externo", quantity: 100, purchase_price: 0.90, sale_price: 1.90, category: "Cuidado Personal" }
        ],
        clients: [
            { identity_card: "V-19876543", name: "Ana Isabel Rivas", phone: "04169990011", address: "Residencias La Floresta" }
        ],
        suppliers: [
            { name: "Droguería Nena C.A.", phone: "02418501000", address: "Barquisimeto Lara", email: "contacto@droguerianena.com", website: "www.droguerianena.com", instagram: "@droguerianena" }
        ]
    },
    ropa: {
        name: "Boutique Moda & Estilo Urbano",
        category: "Tienda de Ropa",
        color: "#db2777",
        products: [
            { name: "Franela Algodón 100% Básica Unisex", description: "Corte clásico varios colores", quantity: 80, purchase_price: 3.50, sale_price: 8.00, category: "Franelas" },
            { name: "Pantalón Jean Dama Tiro Alto", description: "Mezclilla stretch horma perfecta", quantity: 35, purchase_price: 11.00, sale_price: 24.99, category: "Pantalones" },
            { name: "Chaqueta Impermeable de Caballero", description: "Forro térmico cierre reforzado", quantity: 20, purchase_price: 15.00, sale_price: 32.00, category: "Abrigos" }
        ],
        clients: [
            { identity_card: "V-24555111", name: "Patricia Colmenares", phone: "04241112233", address: "Colinas del Bello Monte" }
        ],
        suppliers: [
            { name: "Textiles El Castillo C.A.", phone: "02127654321", address: "Sabana Grande Caracas", email: "info@elcastillo.com", website: "www.elcastillo.com", instagram: "@elcastillotextiles" }
        ]
    },
    bolsos: {
        name: "Tienda de Bolsos & Maletas Viajeras",
        category: "Tienda de Bolsos",
        color: "#ea580c",
        products: [
            { name: "Morral Escolar Ejecutivo con Compartimiento Laptop 15.6\"", description: "Material impermeable puerto USB carga", quantity: 25, purchase_price: 9.00, sale_price: 20.00, category: "Morrales" },
            { name: "Cartera de Mano Dama Ecopiel", description: "Acabado texturizado correa ajustable", quantity: 18, purchase_price: 8.00, sale_price: 18.50, category: "Carteras" },
            { name: "Maleta de Viaje Rígida 20 Pulgadas (Cabina)", description: "4 ruedas giratorias 360 candado TSA", quantity: 10, purchase_price: 28.00, sale_price: 55.00, category: "Equipaje" }
        ],
        clients: [
            { identity_card: "V-16789000", name: "Gabriel Zambrano", phone: "04120001122", address: "Urb. Las Mercedes" }
        ],
        suppliers: [
            { name: "Importadora BagWorld C.A.", phone: "02124445566", address: "Chacao Caracas", email: "ventas@bagworld.com", website: "www.bagworld.com", instagram: "@bagworld_ve" }
        ]
    },
    viveres: {
        name: "Abasto & Víveres El Buen Precio",
        category: "Tienda de Víveres",
        color: "#84cc16",
        products: [
            { name: "Harina de Maíz Blanco Precocida 1Kg", description: "Harina tradicional para arepas", quantity: 300, purchase_price: 0.85, sale_price: 1.25, category: "Granos y Harinas" },
            { name: "Aceite Vegetal de Girasol 1 Litro", description: "Aceite comestible vegetal puro", quantity: 120, purchase_price: 1.60, sale_price: 2.40, category: "Aceites" },
            { name: "Arroz Blanco Tipo A 1Kg", description: "Grano entero de primera calidad", quantity: 250, purchase_price: 0.90, sale_price: 1.35, category: "Granos y Harinas" },
            { name: "Azúcar Refinada Blanca 1Kg", description: "Azúcar de caña purificada", quantity: 180, purchase_price: 0.95, sale_price: 1.40, category: "Abarrotes" }
        ],
        clients: [
            { identity_card: "V-14222333", name: "Rosaura Blanco", phone: "04147778899", address: "Casco Central Calle 4" }
        ],
        suppliers: [
            { name: "Empresas Polar C.A.", phone: "0800POLAR00", address: "Los Cortijos Caracas", email: "atencion@empresaspolar.com", website: "www.empresaspolar.com", instagram: "@empresaspolar" }
        ]
    },
    carniceria: {
        name: "Carnicería & Frigorífico El Novillo de Oro",
        category: "Tienda de Carnicería",
        color: "#dc2626",
        products: [
            { name: "Carne de Res Solomo de Cuerito (Kg)", description: "Corte de res de primera tierno", quantity: 45, purchase_price: 5.50, sale_price: 8.50, category: "Carne de Res" },
            { name: "Carne Molida de Primera (Kg)", description: "100% pulpa magra sin grasa", quantity: 60, purchase_price: 4.80, sale_price: 7.20, category: "Carne de Res" },
            { name: "Pechuga de Pollo Entera con Hueso (Kg)", description: "Pollo fresco beneficiado del día", quantity: 80, purchase_price: 2.80, sale_price: 4.50, category: "Aves" },
            { name: "Chuleta de Cerdo Ahumada (Kg)", description: "Corte curado sabor ahumado intenso", quantity: 30, purchase_price: 4.20, sale_price: 6.90, category: "Cerdos" }
        ],
        clients: [
            { identity_card: "V-20111222", name: "Roberto Silva", phone: "04265554433", address: "Av. Fuerza Armadas Nro 12" }
        ],
        suppliers: [
            { name: "Matadero Industrial Frigorífico del Centro", phone: "02432334455", address: "Maracay Estado Aragua", email: "contacto@frigocentro.com", website: "www.frigocentro.com", instagram: "@frigocentro" }
        ]
    }
};

class PresetsManager {
    /**
     * Aplica el perfil seleccionado al comercio activo
     */
    async applyPresetProfile(presetKey, businessId) {
        const preset = PRESETS_DATA[presetKey];
        if (!preset) return;

        // Actualizar datos del negocio
        const bizUpdate = {
            name: preset.name,
            category_preset: presetKey,
            branding_color: preset.color
        };

        await DB.query(
            "UPDATE businesses SET name = ?, category_preset = ?, branding_color = ? WHERE id = ?",
            [bizUpdate.name, bizUpdate.category_preset, bizUpdate.branding_color, businessId]
        );

        const currentBiz = Auth.currentBusiness;
        if (currentBiz) {
            currentBiz.name = preset.name;
            currentBiz.category_preset = presetKey;
            currentBiz.branding_color = preset.color;
            Auth.saveSession(Auth.currentUser, currentBiz);
        }
    }

    /**
     * Carga masiva de datos de prueba según el perfil activo
     */
    async loadDemoData(businessId, presetKey = "viveres") {
        const preset = PRESETS_DATA[presetKey] || PRESETS_DATA.viveres;

        // 1. Cargar Productos Demo
        for (const p of preset.products) {
            const product = {
                id: "prod_demo_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
                business_id: businessId,
                name: p.name,
                description: p.description,
                image_url: null,
                quantity: p.quantity,
                purchase_price: p.purchase_price,
                sale_price: p.sale_price,
                category: p.category,
                created_at: new Date().toISOString()
            };
            await DB.query(
                `INSERT INTO products (id, business_id, name, description, quantity, purchase_price, sale_price, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [product.id, product.business_id, product.name, product.description, product.quantity, product.purchase_price, product.sale_price, product.category]
            );
            DB.setLocalRecord("products", product);
        }

        // 2. Cargar Clientes Demo
        for (const c of preset.clients) {
            const client = {
                id: "cli_demo_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
                business_id: businessId,
                identity_card: c.identity_card,
                name: c.name,
                phone: c.phone,
                address: c.address,
                created_at: new Date().toISOString()
            };
            await DB.query(
                `INSERT INTO clients (id, business_id, identity_card, name, phone, address) VALUES (?, ?, ?, ?, ?, ?)`,
                [client.id, client.business_id, client.identity_card, client.name, client.phone, client.address]
            );
            DB.setLocalRecord("clients", client);
        }

        // 3. Cargar Proveedores Demo
        for (const s of preset.suppliers) {
            const supplier = {
                id: "prov_demo_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
                business_id: businessId,
                name: s.name,
                phone: s.phone,
                address: s.address,
                email: s.email,
                website: s.website,
                instagram: s.instagram,
                created_at: new Date().toISOString()
            };
            await DB.query(
                `INSERT INTO suppliers (id, business_id, name, phone, address, email, website, instagram) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [supplier.id, supplier.business_id, supplier.name, supplier.phone, supplier.address, supplier.email, supplier.website, supplier.instagram]
            );
            DB.setLocalRecord("suppliers", supplier);
        }

        return true;
    }

    /**
     * Elimina todos los datos de prueba / catálogo del negocio activo
     */
    async clearDemoData(businessId) {
        await DB.query("DELETE FROM products WHERE business_id = ?", [businessId]);
        await DB.query("DELETE FROM clients WHERE business_id = ?", [businessId]);
        await DB.query("DELETE FROM suppliers WHERE business_id = ?", [businessId]);
        await DB.query("DELETE FROM sales WHERE business_id = ?", [businessId]);
        await DB.query("DELETE FROM purchases WHERE business_id = ?", [businessId]);

        // Limpiar LocalStorage de este negocio
        ["products", "clients", "suppliers", "sales", "purchases"].forEach(tbl => {
            const rows = DB.getLocalTable(tbl).filter(r => r.business_id !== businessId);
            DB.setLocalTable(tbl, rows);
        });

        return true;
    }
}

const Presets = new PresetsManager();
