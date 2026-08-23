/**
 * SISTEMA DE CONTROL DE INVENTARIOS MULTI-USUARIO (Emprendimiento JOSE HERRERA)
 * Archivo de Configuración Global y Credenciales del Sistema
 */

const CONFIG = {
    // Información de Producción
    APP_NAME: "Sistema de Control de Inventarios Multi-Usuario",
    AUTHOR: "Emprendimiento JOSE HERRERA",
    LOGO_PATH: "./img/logo.png",
    
    // Super Administrador del Sistema
    SUPER_ADMIN: {
        email: "herrejose@gmail.com",
        password: "MyJ01012023*",
        name: "José Herrera (SuperAdmin)"
    },

    // Tarifas del sistema (con valores dinámicos y respaldo)
    _membership_price_usd: null,
    _default_bcv_rate: null,

    get MEMBERSHIP_PRICE_USD() {
        if (this._membership_price_usd !== null && !isNaN(this._membership_price_usd) && this._membership_price_usd > 0) {
            return this._membership_price_usd;
        }
        try {
            const raw = localStorage.getItem("inv_db_settings");
            if (raw) {
                const settings = JSON.parse(raw);
                const found = settings.find(s => s.key_name === "membership_price_usd");
                if (found && found.value !== undefined && found.value !== null) {
                    const parsed = parseFloat(String(found.value).replace(/[^0-9.]/g, ''));
                    if (!isNaN(parsed) && parsed > 0) {
                        this._membership_price_usd = parsed;
                        return parsed;
                    }
                }
            }
        } catch (e) {}
        return 10.00;
    },
    set MEMBERSHIP_PRICE_USD(val) {
        const parsed = parseFloat(String(val).replace(/[^0-9.]/g, ''));
        if (!isNaN(parsed) && parsed > 0) {
            this._membership_price_usd = parsed;
        }
    },

    get DEFAULT_BCV_RATE() {
        if (this._default_bcv_rate !== null && !isNaN(this._default_bcv_rate) && this._default_bcv_rate > 0) {
            return this._default_bcv_rate;
        }
        try {
            const raw = localStorage.getItem("inv_db_settings");
            if (raw) {
                const settings = JSON.parse(raw);
                const found = settings.find(s => s.key_name === "bcv_rate");
                if (found && found.value !== undefined && found.value !== null) {
                    const parsed = parseFloat(String(found.value).replace(/[^0-9.]/g, ''));
                    if (!isNaN(parsed) && parsed > 0) {
                        this._default_bcv_rate = parsed;
                        return parsed;
                    }
                }
            }
        } catch (e) {}
        return 36.50;
    },
    set DEFAULT_BCV_RATE(val) {
        const parsed = parseFloat(String(val).replace(/[^0-9.]/g, ''));
        if (!isNaN(parsed) && parsed > 0) {
            this._default_bcv_rate = parsed;
        }
    },

    // Credenciales Turso (libSQL)
    TURSO: {
        url: "libsql://inventarios-herrejose.aws-ap-northeast-1.turso.io",
        httpUrl: "https://inventarios-herrejose.aws-ap-northeast-1.turso.io",
        authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODc0MzUyMTUsImlkIjoiMDFhMDJiNDctOGIwMS03OTE0LThjNjUtMWJmOGMxMWU4MGFiIiwia2lkIjoidnM2Yl9rSmo5eXJSQkdqMXQ0WWhBUnlWcVg0Tmx6LXp2elhYeHVLQnV6RSIsInJpZCI6IjYxM2VlODM0LThlZTItNDg4NS05MGUzLTY3ZThiMjk2ZTViMyJ9.SLKLEsu8HIvGlo6aLJQBWvLGfEVgyvlo9MoYGreHaCjka62rIVYlr5DOldEostMmjH1eIDFF-OO9sQqazu7MDQ"
    },

    // Credenciales Cloudflare R2 Storage
    CLOUDFLARE_R2: {
        endpoint: "https://da7c23add0ce839e4989c068fbfa4394.r2.cloudflarestorage.com",
        token: window.ENV_R2_TOKEN || "CLOUDFLARE_R2_TOKEN_CONFIGURED",
        accessKeyId: "f2d61617f208f755254f715a3648b177",
        secretAccessKey: "3f3f105d0a2b13a7593fe84ab07c306a8060b37cb03217741f90565b7b8cac8d",
        bucketName: "inventario-media"
    },

    // Client ID de Google OAuth 2.0 (Configurado oficialmente)
    GOOGLE_CLIENT_ID: "956917958355-nl2l7kood9jh63dol8gjkei6l065vscc.apps.googleusercontent.com",

    // Datos de Pago Predeterminados del Sistema
    DEFAULT_PAYMENT_METHODS: [
        {
            id: "pm_bdv_transf",
            currency: "VES",
            type: "Transferencia",
            title: "Transferencia Bancaria Banco de Venezuela",
            bank_name: "BANCO DE VENEZUELA",
            account_number: "01020215930000285359",
            holder_name: "JOSE M HERRERA V",
            holder_id: "V-15949430",
            phone: "04141448515",
            email: "jose@jesuministrosymas.com.ve",
            is_active: 1
        },
        {
            id: "pm_bdv_pagomovil",
            currency: "VES",
            type: "PagoMovil",
            title: "PagoMóvil Banco de Venezuela",
            bank_name: "BANCO DE VENEZUELA (0102)",
            account_number: "04141448515",
            holder_name: "JOSE M HERRERA V",
            holder_id: "15949430",
            phone: "04141448515",
            email: "jose@jesuministrosymas.com.ve",
            is_active: 1
        },
        {
            id: "pm_binance",
            currency: "USD",
            type: "Binance",
            title: "Binance Pay",
            bank_name: "BINANCE PAY",
            account_number: "PayID: 313993255",
            wallet_address: "PayID: 313993255 | email: jose@jesuministrosymas.com.ve",
            holder_name: "José Herrera",
            email: "jose@jesuministrosymas.com.ve",
            phone: "+584141448515",
            is_active: 1
        },
        {
            id: "pm_usdt",
            currency: "USD",
            type: "USDT",
            title: "USDT Cripto (TRC20)",
            bank_name: "RED TRON (TRC20)",
            account_number: "TR3PTVe5gnWuEo2topM594fkUb6ueMZPwn",
            wallet_address: "TR3PTVe5gnWuEo2topM594fkUb6ueMZPwn",
            holder_name: "José Herrera",
            is_active: 1
        },
        {
            id: "pm_zinli",
            currency: "USD",
            type: "Zinli",
            title: "ZINLI",
            bank_name: "ZINLI WALLET",
            account_number: "herrejose@gmail.com",
            wallet_address: "herrejose@gmail.com",
            email: "herrejose@gmail.com",
            holder_name: "José Herrera",
            is_active: 1
        }
    ]
};
