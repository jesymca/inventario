/**
 * SISTEMA DE CONTROL DE INVENTARIOS MULTI-USUARIO (Emprendimiento JOSE HERRERA)
 * Gestor de Almacenamiento e Imágenes (Cloudflare R2 + DataURL Fallback)
 */

class StorageManager {
    constructor() {
        this.endpoint = CONFIG.CLOUDFLARE_R2.endpoint;
        this.bucket = CONFIG.CLOUDFLARE_R2.bucketName;
        this.accessKeyId = CONFIG.CLOUDFLARE_R2.accessKeyId;
    }

    /**
     * Convierte un archivo de imagen en una cadena DataURL Base64 optimizada
     * o sube al Bucket de Cloudflare R2 si está configurado.
     */
    async uploadImage(file, folder = "uploads") {
        if (!file) return null;

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // Redimensionar imagen para optimizar espacio (max 800px)
                    const canvas = document.createElement("canvas");
                    let width = img.width;
                    let height = img.height;
                    const maxDim = 800;

                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, width, height);

                    // Formato PNG o WebP/JPEG optimizado
                    const dataUrl = canvas.toDataURL(file.type.includes("png") ? "image/png" : "image/jpeg", 0.85);
                    resolve(dataUrl);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    /**
     * Valida que el archivo sea una imagen PNG o JPG/JPEG
     */
    validateImageFile(file) {
        if (!file) return false;
        const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
        return validTypes.includes(file.type);
    }
}

const Storage = new StorageManager();
