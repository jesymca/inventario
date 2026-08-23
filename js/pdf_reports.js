/**
 * SISTEMA DE CONTROL DE INVENTARIOS MULTI-USUARIO (Emprendimiento JOSE HERRERA)
 * Generador de Reportes PDF en Tablas para Inventario, Clientes y Proveedores (con Encabezados/Pie Personalizables)
 */

class PDFReportGenerator {
    constructor() {
        this.companyLogo = CONFIG.LOGO_PATH;
    }

    /**
     * Encabezado estándar y personalizable para los reportes
     */
    addHeader(doc, title, businessParam = "Control de Inventario") {
        let name = "Control de Inventario";
        let customHeader = "";
        let logoUrl = null;

        if (typeof businessParam === "object" && businessParam !== null) {
            name = businessParam.name || "Mi Comercio";
            customHeader = businessParam.pdf_header_text || "";
            logoUrl = businessParam.logo_url || null;
        } else if (typeof businessParam === "string") {
            name = businessParam;
        }

        doc.setFontSize(15);
        doc.setTextColor(13, 110, 253); // Primary Color
        doc.text(name, 14, 15);

        let currentY = 22;
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        doc.text(title, 14, currentY);

        if (customHeader) {
            currentY += 5;
            doc.setFontSize(8);
            doc.setTextColor(90, 90, 90);
            doc.text(customHeader.slice(0, 100), 14, currentY);
        }

        currentY += 5;
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`Fecha de Emisión: ${new Date().toLocaleString()} | ${CONFIG.AUTHOR}`, 14, currentY);
        doc.line(14, currentY + 3, 196, currentY + 3);

        // Si el comercio tiene logo asignado, renderizarlo en la esquina superior derecha
        if (logoUrl) {
            try {
                doc.addImage(logoUrl, 'PNG', 160, 8, 32, 22);
            } catch (e) {
                // Fallback silencioso en caso de error en formato o CORS
            }
        }
    }

    /**
     * Pie de página estándar y personalizable
     */
    addFooter(doc, pageCount, businessParam = null) {
        let customFooter = "";
        if (typeof businessParam === "object" && businessParam !== null) {
            customFooter = businessParam.pdf_footer_text || "";
        }

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(130, 130, 130);
            if (customFooter) {
                doc.text(customFooter.slice(0, 90), 14, 285);
            }
            doc.text(`Página ${i} de ${pageCount} - ${CONFIG.APP_NAME}`, 196, 285, { align: "right" });
        }
    }

    /**
     * Genera Reporte PDF de Inventario
     */
    generateInventoryPDF(products, businessParam = "Mi Comercio") {
        if (!window.jspdf) {
            alert("La librería jsPDF no está cargada correctamente.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        this.addHeader(doc, "REPORTE DE INVENTARIO Y STOCK DE PRODUCTOS", businessParam);

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
            startY: 40,
            theme: "grid",
            headStyles: { fillColor: [13, 110, 253], textColor: 255, fontStyle: "bold" },
            footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: "bold" },
            alternateRowStyles: { fillColor: [248, 249, 250] },
            styles: { fontSize: 8, cellPadding: 3 }
        });

        const pageCount = doc.internal.getNumberOfPages();
        this.addFooter(doc, pageCount, businessParam);

        doc.save(`Reporte_Inventario_${new Date().toISOString().slice(0,10)}.pdf`);
    }

    /**
     * Genera Reporte PDF de Clientes
     */
    generateClientsPDF(clients, businessParam = "Mi Comercio") {
        if (!window.jspdf) {
            alert("La librería jsPDF no está cargada.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        this.addHeader(doc, "DIRECTORIO GENERAL DE CLIENTES", businessParam);

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
            startY: 40,
            theme: "striped",
            headStyles: { fillColor: [25, 135, 84], textColor: 255, fontStyle: "bold" },
            styles: { fontSize: 9, cellPadding: 3 }
        });

        const pageCount = doc.internal.getNumberOfPages();
        this.addFooter(doc, pageCount, businessParam);

        doc.save(`Reporte_Clientes_${new Date().toISOString().slice(0,10)}.pdf`);
    }

    /**
     * Genera Reporte PDF de Proveedores
     */
    generateSuppliersPDF(suppliers, businessParam = "Mi Comercio") {
        if (!window.jspdf) {
            alert("La librería jsPDF no está cargada.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        this.addHeader(doc, "DIRECTORIO GENERAL DE PROVEEDORES", businessParam);

        const tableColumn = ["#", "Proveedor", "Teléfono", "Correo Electrónico", "Web / Instagram", "Dirección"];
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
            startY: 40,
            theme: "striped",
            headStyles: { fillColor: [111, 66, 193], textColor: 255, fontStyle: "bold" },
            styles: { fontSize: 8, cellPadding: 3 }
        });

        const pageCount = doc.internal.getNumberOfPages();
        this.addFooter(doc, pageCount, businessParam);

        doc.save(`Reporte_Proveedores_${new Date().toISOString().slice(0,10)}.pdf`);
    }
}

const PDFGenerator = new PDFReportGenerator();
