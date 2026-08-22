/**
 * SISTEMA DE CONTROL DE INVENTARIOS MULTI-USUARIO (Emprendimiento JOSE HERRERA)
 * Generador de Reportes PDF en Tablas para Inventario, Clientes y Proveedores
 */

class PDFReportGenerator {
    constructor() {
        this.companyLogo = CONFIG.LOGO_PATH;
    }

    /**
     * Encabezado estándar para los reportes
     */
    addHeader(doc, title, businessName = "Control de Inventario") {
        doc.setFontSize(16);
        doc.setTextColor(13, 110, 253); // Bootstrap Primary Color
        doc.text(businessName, 14, 15);

        doc.setFontSize(12);
        doc.setTextColor(50, 50, 50);
        doc.text(title, 14, 22);

        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(`Fecha de Generación: ${new Date().toLocaleString()}`, 14, 27);
        doc.text(`Producción: ${CONFIG.AUTHOR}`, 14, 31);
        doc.line(14, 33, 196, 33);
    }

    /**
     * Pie de página estándar
     */
    addFooter(doc, pageCount) {
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Página ${i} de ${pageCount} - ${CONFIG.APP_NAME}`, 196, 285, { align: "right" });
        }
    }

    /**
     * Genera Reporte PDF de Inventario
     */
    generateInventoryPDF(products, businessName = "Mi Comercio") {
        if (!window.jspdf) {
            alert("La librería jsPDF no está cargada correctamente.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        this.addHeader(doc, "REPORTE DE INVENTARIO Y STOCK DE PRODUCTOS", businessName);

        const tableColumn = ["#", "Producto", "Categoría", "Stock", "P. Compra ($)", "P. Venta ($)", "Valor Total ($)"];
        const tableRows = [];

        let totalStock = 0;
        let totalValuation = 0;

        products.forEach((p, index) => {
            const stock = Number(p.quantity) || 0;
            const purchasePrice = Number(p.purchase_price) || 0;
            const salePrice = Number(p.sale_price) || 0;
            const rowValuation = stock * salePrice;

            totalStock += stock;
            totalValuation += rowValuation;

            tableRows.push([
                index + 1,
                p.name,
                p.category || "General",
                stock,
                `$${purchasePrice.toFixed(2)}`,
                `$${salePrice.toFixed(2)}`,
                `$${rowValuation.toFixed(2)}`
            ]);
        });

        // Fila de Totales
        tableRows.push([
            "",
            "TOTALES GENERALES",
            "",
            totalStock,
            "",
            "",
            `$${totalValuation.toFixed(2)}`
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 36,
            theme: "grid",
            headStyles: { fillColor: [13, 110, 253], textColor: 255, fontStyle: "bold" },
            footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: "bold" },
            alternateRowStyles: { fillColor: [248, 249, 250] },
            styles: { fontSize: 8, cellPadding: 3 }
        });

        const pageCount = doc.internal.getNumberOfPages();
        this.addFooter(doc, pageCount);

        doc.save(`Reporte_Inventario_${new Date().toISOString().slice(0,10)}.pdf`);
    }

    /**
     * Genera Reporte PDF de Clientes
     */
    generateClientsPDF(clients, businessName = "Mi Comercio") {
        if (!window.jspdf) {
            alert("La librería jsPDF no está cargada.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        this.addHeader(doc, "DIRECTORIO GENERAL DE CLIENTES", businessName);

        const tableColumn = ["#", "Cédula / RIF", "Nombre Completo", "Teléfono", "Dirección"];
        const tableRows = [];

        clients.forEach((c, index) => {
            tableRows.push([
                index + 1,
                c.identity_card || "N/A",
                c.name,
                c.phone || "N/A",
                c.address || "N/A"
            ]);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 36,
            theme: "striped",
            headStyles: { fillColor: [25, 135, 84], textColor: 255, fontStyle: "bold" }, // Bootstrap Success
            styles: { fontSize: 9, cellPadding: 3 }
        });

        const pageCount = doc.internal.getNumberOfPages();
        this.addFooter(doc, pageCount);

        doc.save(`Reporte_Clientes_${new Date().toISOString().slice(0,10)}.pdf`);
    }

    /**
     * Genera Reporte PDF de Proveedores
     */
    generateSuppliersPDF(suppliers, businessName = "Mi Comercio") {
        if (!window.jspdf) {
            alert("La librería jsPDF no está cargada.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        this.addHeader(doc, "DIRECTORIO GENERAL DE PROVEEDORES", businessName);

        const tableColumn = ["#", "Proveedor", "Teléfono", "Correo Electronico", "Web / Instagram", "Dirección"];
        const tableRows = [];

        suppliers.forEach((s, index) => {
            tableRows.push([
                index + 1,
                s.name,
                s.phone || "N/A",
                s.email || "N/A",
                s.instagram || s.website || "N/A",
                s.address || "N/A"
            ]);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 36,
            theme: "striped",
            headStyles: { fillColor: [111, 66, 193], textColor: 255, fontStyle: "bold" }, // Bootstrap Purple
            styles: { fontSize: 8, cellPadding: 3 }
        });

        const pageCount = doc.internal.getNumberOfPages();
        this.addFooter(doc, pageCount);

        doc.save(`Reporte_Proveedores_${new Date().toISOString().slice(0,10)}.pdf`);
    }
}

const PDFGenerator = new PDFReportGenerator();
