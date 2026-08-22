/**
 * SISTEMA DE CONTROL DE INVENTARIOS MULTI-USUARIO (Emprendimiento JOSE HERRERA)
 * Módulo de Importación Masiva (CSV) y Descarga de Plantillas
 */

class ImportExportManager {
    /**
     * Descarga plantilla CSV de ejemplo según la entidad
     */
    downloadTemplate(entityType) {
        let headers = [];
        let sampleRow = [];
        let filename = "";

        if (entityType === "products") {
            headers = ["Nombre", "Descripcion", "Cantidad", "Precio_Compra", "Precio_Venta", "Categoria"];
            sampleRow = ["Harina de Trigo 1Kg", "Harina todo uso enriquecida", "50", "1.20", "1.80", "Víveres"];
            filename = "plantilla_productos_inventario.csv";
        } else if (entityType === "clients") {
            headers = ["Cedula_RIF", "Nombre_Cliente", "Telefono", "Direccion"];
            sampleRow = ["V-12345678", "María Pérez", "04149998877", "Av. Bolívar Edif 4 Ap 2B"];
            filename = "plantilla_clientes.csv";
        } else if (entityType === "suppliers") {
            headers = ["Nombre_Proveedor", "Telefono", "Direccion", "Correo", "Pagina_Web", "Instagram"];
            sampleRow = ["Distribuidora Central C.A.", "02125554433", "Zona Industrial II", "contacto@distcentral.com", "www.distcentral.com", "@distcentral"];
            filename = "plantilla_proveedores.csv";
        }

        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + sampleRow.join(",");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Parsea un archivo CSV subido por el usuario
     */
    parseCSV(fileContent) {
        const lines = fileContent.split(/\r\n|\n/);
        const result = [];
        if (lines.length <= 1) return result;

        const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
            const obj = {};
            headers.forEach((header, idx) => {
                obj[header] = values[idx] || "";
            });
            result.push(obj);
        }
        return result;
    }

    /**
     * Importa productos de forma masiva desde CSV
     */
    async importProductsCSV(file, businessId) {
        const text = await file.text();
        const rows = this.parseCSV(text);
        let importedCount = 0;

        for (const row of rows) {
            const name = row["Nombre"] || row["nombre"] || row["PRODUCTO"];
            if (!name) continue;

            const product = {
                id: "prod_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
                business_id: businessId,
                name: name,
                description: row["Descripcion"] || row["descripcion"] || "",
                image_url: null,
                quantity: parseInt(row["Cantidad"] || row["cantidad"] || 0),
                purchase_price: parseFloat(row["Precio_Compra"] || row["precio_compra"] || 0),
                sale_price: parseFloat(row["Precio_Venta"] || row["precio_venta"] || 0),
                category: row["Categoria"] || row["categoria"] || "General",
                created_at: new Date().toISOString()
            };

            await DB.query(
                `INSERT INTO products (id, business_id, name, description, quantity, purchase_price, sale_price, category) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [product.id, product.business_id, product.name, product.description, product.quantity, product.purchase_price, product.sale_price, product.category]
            );
            DB.setLocalRecord("products", product);
            importedCount++;
        }
        return importedCount;
    }

    /**
     * Importa clientes de forma masiva desde CSV
     */
    async importClientsCSV(file, businessId) {
        const text = await file.text();
        const rows = this.parseCSV(text);
        let importedCount = 0;

        for (const row of rows) {
            const name = row["Nombre_Cliente"] || row["Nombre"] || row["nombre"];
            if (!name) continue;

            const client = {
                id: "cli_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
                business_id: businessId,
                identity_card: row["Cedula_RIF"] || row["cedula"] || "N/A",
                name: name,
                phone: row["Telefono"] || row["telefono"] || "",
                address: row["Direccion"] || row["direccion"] || "",
                created_at: new Date().toISOString()
            };

            await DB.query(
                `INSERT INTO clients (id, business_id, identity_card, name, phone, address) VALUES (?, ?, ?, ?, ?, ?)`,
                [client.id, client.business_id, client.identity_card, client.name, client.phone, client.address]
            );
            DB.setLocalRecord("clients", client);
            importedCount++;
        }
        return importedCount;
    }

    /**
     * Importa proveedores de forma masiva desde CSV
     */
    async importSuppliersCSV(file, businessId) {
        const text = await file.text();
        const rows = this.parseCSV(text);
        let importedCount = 0;

        for (const row of rows) {
            const name = row["Nombre_Proveedor"] || row["Nombre"] || row["nombre"];
            if (!name) continue;

            const supplier = {
                id: "prov_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
                business_id: businessId,
                name: name,
                phone: row["Telefono"] || row["telefono"] || "",
                address: row["Direccion"] || row["direccion"] || "",
                email: row["Correo"] || row["correo"] || "",
                website: row["Pagina_Web"] || row["web"] || "",
                instagram: row["Instagram"] || row["instagram"] || "",
                created_at: new Date().toISOString()
            };

            await DB.query(
                `INSERT INTO suppliers (id, business_id, name, phone, address, email, website, instagram) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [supplier.id, supplier.business_id, supplier.name, supplier.phone, supplier.address, supplier.email, supplier.website, supplier.instagram]
            );
            DB.setLocalRecord("suppliers", supplier);
            importedCount++;
        }
        return importedCount;
    }
}

const ImportExport = new ImportExportManager();
