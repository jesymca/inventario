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
    /**
     * Encabezado estándar y personalizable para los reportes
     */
    addHeader(doc, title, businessParam = "Control de Inventario") {
        let name = "Control de Inventario";
        let rif = "";
        let phone = "";
        let email = "";
        let address = "";
        let website = "";
        let customHeader = "";
        let logoUrl = null;

        if (typeof businessParam === "object" && businessParam !== null) {
            name = businessParam.name || "Mi Comercio";
            rif = businessParam.rif || businessParam.identity_card || "";
            phone = businessParam.phone || "";
            email = businessParam.email || "";
            address = businessParam.address || "";
            website = businessParam.website || businessParam.instagram || "";
            customHeader = businessParam.pdf_header_text || "";
            logoUrl = businessParam.logo_url || null;
        } else if (typeof businessParam === "string") {
            name = businessParam;
        }

        // Título del Comercio en grande y resaltado
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(13, 110, 253); // Color azul principal
        doc.text(name, 14, 12);

        let currentY = 16;

        // Fila 1 de datos del comercio: RIF, Teléfono, Correo, Web
        let metaDetails = [];
        if (rif) metaDetails.push(`RIF: ${rif}`);
        if (phone) metaDetails.push(`Tlf: ${phone}`);
        if (email) metaDetails.push(`Email: ${email}`);
        if (website) metaDetails.push(`Web/IG: ${website}`);

        if (metaDetails.length > 0) {
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(60, 60, 60);
            doc.text(metaDetails.join("  |  ").slice(0, 110), 14, currentY);
            currentY += 4;
        }

        // Dirección del comercio
        if (address) {
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(80, 80, 80);
            doc.text(`Dirección: ${address.slice(0, 105)}`, 14, currentY);
            currentY += 4;
        }

        // Texto personalizado si el usuario lo configuró
        if (customHeader) {
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(90, 90, 90);
            doc.text(customHeader.slice(0, 105), 14, currentY);
            currentY += 4;
        }

        // Título del Reporte e Información de emisión
        currentY += 1;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text(title, 14, currentY);

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120, 120, 120);
        doc.text(`Fecha de Emisión: ${new Date().toLocaleString()}`, 196, currentY, { align: "right" });

        currentY += 3;
        doc.setDrawColor(200, 200, 200);
        doc.line(14, currentY, 196, currentY);

        // Si el comercio tiene logo asignado, renderizarlo en la esquina superior derecha
        if (logoUrl) {
            try {
                doc.addImage(logoUrl, 'PNG', 160, 5, 32, 18);
            } catch (e) {
                // Fallback silencioso
            }
        }

        return currentY + 4;
    }

    /**
     * Pie de página estándar y personalizable
     */
    addFooter(doc, pageCount, businessParam = null) {
        let name = "";
        let customFooter = "";
        if (typeof businessParam === "object" && businessParam !== null) {
            name = businessParam.name || "";
            customFooter = businessParam.pdf_footer_text || "";
        }

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(130, 130, 130);
            if (customFooter) {
                doc.text(customFooter.slice(0, 90), 14, 285);
            } else if (name) {
                doc.text(`${name} - Documento Generado Electrónicamente`, 14, 285);
            } else {
                doc.text(`Documento Generado Electrónicamente`, 14, 285);
            }
            doc.text(`Página ${i} de ${pageCount}`, 196, 285, { align: "right" });
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

        const startY = this.addHeader(doc, "REPORTE DE INVENTARIO Y STOCK DE PRODUCTOS", businessParam);

        const tableColumn = ["#", "Producto", "Categoría", "Presentación", "Stock", "P. Compra ($)", "P. Venta ($)", "Valor Total ($)"];
        const tableRows = [];

        let totalStock = 0;
        let totalValuation = 0;

        products.forEach((p, index) => {
            const stock = Number(p.quantity) || 0;
            const purchasePrice = Number(p.purchase_price) || 0;
            const salePrice = Number(p.sale_price) || 0;
            const rowValuation = stock * salePrice;
            const presentation = p.presentation || "Unidad";
            const pkgInfo = (p.units_per_package && p.units_per_package > 1) ? ` (${p.units_per_package} und/b)` : '';

            totalStock += stock;
            totalValuation += rowValuation;

            tableRows.push([
                index + 1,
                p.name,
                p.category || "General",
                `${presentation}${pkgInfo}`,
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
            "",
            totalStock,
            "",
            "",
            `$${totalValuation.toFixed(2)}`
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: startY,
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

        const startY = this.addHeader(doc, "DIRECTORIO GENERAL DE CLIENTES", businessParam);

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
            startY: startY,
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

        const startY = this.addHeader(doc, "DIRECTORIO GENERAL DE PROVEEDORES", businessParam);

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
            startY: startY,
            theme: "striped",
            headStyles: { fillColor: [111, 66, 193], textColor: 255, fontStyle: "bold" },
            styles: { fontSize: 8, cellPadding: 3 }
        });

        const pageCount = doc.internal.getNumberOfPages();
        this.addFooter(doc, pageCount, businessParam);

        doc.save(`Reporte_Proveedores_${new Date().toISOString().slice(0,10)}.pdf`);
    }

    /**
     * Genera Reporte PDF de Ventas
     */
    generateSalesPDF(sales, businessParam = "Mi Comercio") {
        if (!window.jspdf) {
            alert("La librería jsPDF no está cargada.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const clients = DB.getLocalTable("clients");
        const saleItems = DB.getLocalTable("sale_items");
        const products = DB.getLocalTable("products");
        const bcvRate = CONFIG.DEFAULT_BCV_RATE || 1;

        const startY = this.addHeader(doc, "REPORTE DE VENTAS REALIZADAS", businessParam);

        const tableColumn = ["#", "Fecha", "Cliente", "Productos", "Total ($)", "Total (Bs)"];
        const tableRows = [];
        let grandTotalUsd = 0;

        sales.forEach((s, index) => {
            const saleDate = s.sale_date || s.created_at;
            const dateStr = saleDate ? new Date(saleDate).toLocaleDateString() : 'N/A';
            const client = clients.find(c => c.id === s.client_id);
            const clientName = client ? client.name : 'Cliente Ocasional';
            const thisItems = saleItems.filter(si => si.sale_id === s.id);
            const prodNames = thisItems.map(si => {
                const p = products.find(pr => pr.id === si.product_id);
                return (p ? p.name : 'Producto') + ' (x' + si.quantity + ')';
            }).join(', ') || 'Sin detalle';
            const totalAmt = Number(s.total_amount || 0);
            const totalBs = totalAmt * bcvRate;
            grandTotalUsd += totalAmt;

            tableRows.push([
                index + 1,
                dateStr,
                clientName,
                prodNames,
                `$${totalAmt.toFixed(2)}`,
                `Bs. ${totalBs.toFixed(2)}`
            ]);
        });

        tableRows.push([
            "",
            "TOTALES",
            "",
            "",
            `$${grandTotalUsd.toFixed(2)}`,
            `Bs. ${(grandTotalUsd * bcvRate).toFixed(2)}`
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: startY,
            theme: "grid",
            headStyles: { fillColor: [25, 135, 84], textColor: 255, fontStyle: "bold" },
            alternateRowStyles: { fillColor: [248, 249, 250] },
            styles: { fontSize: 7, cellPadding: 2 },
            columnStyles: { 3: { cellWidth: 50 } }
        });

        const pageCount = doc.internal.getNumberOfPages();
        this.addFooter(doc, pageCount, businessParam);
        doc.save(`Reporte_Ventas_${new Date().toISOString().slice(0,10)}.pdf`);
    }

    /**
     * Genera Reporte PDF de Compras
     */
    generatePurchasesPDF(purchases, businessParam = "Mi Comercio") {
        if (!window.jspdf) {
            alert("La librería jsPDF no está cargada.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const suppliers = DB.getLocalTable("suppliers");
        const purchaseItemsAll = DB.getLocalTable("purchase_items");
        const products = DB.getLocalTable("products");

        const startY = this.addHeader(doc, "REPORTE DE COMPRAS REALIZADAS", businessParam);

        const tableColumn = ["#", "Fecha", "Proveedor", "Productos", "Total ($)"];
        const tableRows = [];
        let grandTotalUsd = 0;

        purchases.forEach((p, index) => {
            const purchDate = p.purchase_date || p.created_at;
            const dateStr = purchDate ? new Date(purchDate).toLocaleDateString() : 'N/A';
            const supplier = suppliers.find(sup => sup.id === p.supplier_id);
            const supplierName = supplier ? supplier.name : 'Proveedor General';
            const thisItems = purchaseItemsAll.filter(pi => pi.purchase_id === p.id);
            const prodNames = thisItems.map(pi => {
                const pr = products.find(prod => prod.id === pi.product_id);
                return (pr ? pr.name : 'Producto') + ' (x' + pi.quantity + ')';
            }).join(', ') || 'Mercancía';
            const totalAmt = Number(p.total_amount || 0);
            grandTotalUsd += totalAmt;

            tableRows.push([
                index + 1,
                dateStr,
                supplierName,
                prodNames,
                `$${totalAmt.toFixed(2)}`
            ]);
        });

        tableRows.push([
            "",
            "TOTALES",
            "",
            "",
            `$${grandTotalUsd.toFixed(2)}`
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: startY,
            theme: "grid",
            headStyles: { fillColor: [220, 53, 69], textColor: 255, fontStyle: "bold" },
            alternateRowStyles: { fillColor: [248, 249, 250] },
            styles: { fontSize: 7, cellPadding: 2 },
            columnStyles: { 3: { cellWidth: 55 } }
        });

        const pageCount = doc.internal.getNumberOfPages();
        this.addFooter(doc, pageCount, businessParam);
        doc.save(`Reporte_Compras_${new Date().toISOString().slice(0,10)}.pdf`);
    }
}

const PDFGenerator = new PDFReportGenerator();
