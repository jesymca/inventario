/**
 * SISTEMA DE CONTROL DE INVENTARIOS MULTI-USUARIO (Emprendimiento JOSE HERRERA)
 * Gestor de Almacenamiento e Imágenes (Cloudflare R2 Storage + Compresión Canónica + CRUD)
 */

class StorageManager {
    constructor() {
        this.endpoint = CONFIG.CLOUDFLARE_R2.endpoint;
        this.bucket = CONFIG.CLOUDFLARE_R2.bucketName;
        this.accessKeyId = CONFIG.CLOUDFLARE_R2.accessKeyId;
        this.secretAccessKey = CONFIG.CLOUDFLARE_R2.secretAccessKey;
        this.publicUrl = CONFIG.CLOUDFLARE_R2.publicUrl || `${this.endpoint}/${this.bucket}`;
    }

    /**
     * Valida que el archivo sea una imagen aceptada (PNG, JPG, JPEG, WEBP)
     */
    validateImageFile(file) {
        if (!file) return false;
        const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
        return validTypes.includes(file.type);
    }

    /**
     * Genera firmas AWS SigV4 para solicitudes REST S3 a Cloudflare R2 usando la API Web Crypto nativa
     */
    async getR2AuthHeaders(method, path, bodyArrayBuffer, contentType) {
        const host = new URL(this.endpoint).host;
        const region = "auto";
        const service = "s3";

        const now = new Date();
        const amzDate = now.toISOString().replace(/[:-]/g, "").split(".")[0] + "Z";
        const dateStamp = amzDate.substring(0, 8);

        const enc = new TextEncoder();

        // SHA-256 Digest
        const sha256Hex = async (data) => {
            const buffer = typeof data === "string" ? enc.encode(data) : data;
            const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
            return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        };

        // HMAC-SHA256 Signer
        const hmacSha256 = async (key, message) => {
            const cryptoKey = await crypto.subtle.importKey(
                "raw",
                typeof key === "string" ? enc.encode(key) : key,
                { name: "HMAC", hash: "SHA-256" },
                false,
                ["sign"]
            );
            return await crypto.subtle.sign("HMAC", cryptoKey, typeof message === "string" ? enc.encode(message) : message);
        };

        const payloadHash = bodyArrayBuffer ? await sha256Hex(bodyArrayBuffer) : "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

        let canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
        let signedHeaders = "host;x-amz-content-sha256;x-amz-date";

        if (contentType) {
            canonicalHeaders = `content-type:${contentType}\n` + canonicalHeaders;
            signedHeaders = "content-type;" + signedHeaders;
        }

        const canonicalRequest = 
            `${method.toUpperCase()}\n` +
            `${path}\n` +
            `\n` +
            `${canonicalHeaders}\n` +
            `${signedHeaders}\n` +
            `${payloadHash}`;

        const canonicalRequestHash = await sha256Hex(canonicalRequest);
        const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

        const stringToSign = 
            `AWS4-HMAC-SHA256\n` +
            `${amzDate}\n` +
            `${credentialScope}\n` +
            `${canonicalRequestHash}`;

        const kDate = await hmacSha256("AWS4" + this.secretAccessKey, dateStamp);
        const kRegion = await hmacSha256(kDate, region);
        const kService = await hmacSha256(kRegion, service);
        const kSigning = await hmacSha256(kService, "aws4_request");

        const signatureBuffer = await hmacSha256(kSigning, stringToSign);
        const signatureHex = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

        const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;

        const headers = {
            "Host": host,
            "x-amz-date": amzDate,
            "x-amz-content-sha256": payloadHash,
            "Authorization": authorizationHeader
        };
        if (contentType) headers["Content-Type"] = contentType;

        return headers;
    }

    /**
     * Redimensiona y comprime la imagen a un máximo de 800px para ahorrar espacio y ancho de banda
     */
    async compressImage(file, maxDimension = 800, quality = 0.85) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    let width = img.width;
                    let height = img.height;

                    if (width > maxDimension || height > maxDimension) {
                        if (width > height) {
                            height = Math.round((height * maxDimension) / width);
                            width = maxDimension;
                        } else {
                            width = Math.round((width * maxDimension) / height);
                            height = maxDimension;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, width, height);

                    const isPng = file.type.includes("png");
                    const mimeType = isPng ? "image/png" : "image/jpeg";
                    const dataUrl = canvas.toDataURL(mimeType, quality);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve({ blob, mimeType, dataUrl });
                        } else {
                            reject(new Error("No se pudo procesar el blob de imagen."));
                        }
                    }, mimeType, quality);
                };
                img.onerror = () => reject(new Error("Error al cargar la imagen seleccionada."));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error("Error al leer el archivo de imagen."));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Sube una imagen optimizada al Bucket Cloudflare R2 organizada por carpetas de cliente.
     * Retorna la URL pública directa del objeto en Cloudflare R2.
     */
    async uploadImage(file, folder = "uploads", businessId = "global") {
        if (!file) return null;
        if (!this.validateImageFile(file)) {
            alert("Formato de imagen no válido. Por favor selecciona una imagen PNG, JPG, JPEG o WEBP.");
            return null;
        }

        try {
            // 1. Redimensionar y comprimir imagen en canvas cliente
            const { blob, mimeType, dataUrl } = await this.compressImage(file);
            const arrayBuffer = await blob.arrayBuffer();

            // 2. Construir ruta estructurada: /inventario-media/clients/{businessId}/{folder}/{filename}
            const ext = mimeType === "image/png" ? ".png" : ".jpg";
            const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`;
            const cleanBizId = String(businessId || "global").replace(/[^a-zA-Z0-9_-]/g, "");
            const cleanFolder = String(folder || "uploads").replace(/[^a-zA-Z0-9_-]/g, "");
            const objectPath = `/${this.bucket}/clients/${cleanBizId}/${cleanFolder}/${fileName}`;

            // 3. Generar firmas de autorización AWS SigV4
            const headers = await this.getR2AuthHeaders("PUT", objectPath, arrayBuffer, mimeType);

            // 4. Solicitud PUT a la API REST de Cloudflare R2
            const response = await fetch(`${this.endpoint}${objectPath}`, {
                method: "PUT",
                headers: headers,
                body: arrayBuffer
            });

            if (response.ok || response.status === 200 || response.status === 201) {
                const publicObjectUrl = `${this.publicUrl}/clients/${cleanBizId}/${cleanFolder}/${fileName}`;
                console.log("✅ Imagen subida exitosamente a Cloudflare R2:", publicObjectUrl);
                return publicObjectUrl;
            } else {
                console.warn(`Cloudflare R2 respondió con status ${response.status}. Usando fallback comprimido.`);
                return dataUrl;
            }
        } catch (err) {
            console.warn("No se pudo conectar a Cloudflare R2 (posible origen CORS o red). Usando fallback optimizado:", err.message);
            try {
                const compressed = await this.compressImage(file);
                return compressed.dataUrl;
            } catch (e) {
                return null;
            }
        }
    }

    /**
     * Elimina un objeto alojado en Cloudflare R2 por su URL (CRUD Delete)
     */
    async deleteImage(fileUrl) {
        if (!fileUrl || typeof fileUrl !== "string") return false;

        try {
            if (!fileUrl.includes("r2.cloudflarestorage.com") && !fileUrl.includes("r2.dev") && !fileUrl.includes(this.bucket)) {
                return false;
            }

            const urlObj = new URL(fileUrl);
            let objectPath = urlObj.pathname;
            if (!objectPath.startsWith(`/${this.bucket}`)) {
                objectPath = `/${this.bucket}${objectPath}`;
            }

            const headers = await this.getR2AuthHeaders("DELETE", objectPath, null, null);
            const response = await fetch(`${this.endpoint}${objectPath}`, {
                method: "DELETE",
                headers: headers
            });

            return response.ok || response.status === 204;
        } catch (err) {
            console.warn("Error al eliminar objeto de Cloudflare R2:", err);
            return false;
        }
    }

    /**
     * Verifica la conectividad real con Cloudflare R2
     */
    async testR2Connection() {
        try {
            const objectPath = `/${this.bucket}`;
            const headers = await this.getR2AuthHeaders("HEAD", objectPath, null, null);
            const response = await fetch(`${this.endpoint}${objectPath}`, {
                method: "HEAD",
                headers: headers
            });

            return response.ok || response.status === 200 || response.status === 404;
        } catch (err) {
            return false;
        }
    }
}

const Storage = new StorageManager();
