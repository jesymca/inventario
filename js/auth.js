/**
 * SISTEMA DE CONTROL DE INVENTARIOS MULTI-USUARIO (Emprendimiento JOSE HERRERA)
 * Gestor de Autenticación, Google OAuth, Sesiones y Conteo de Prueba 15 Días
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.currentBusiness = null;
        this.userBusinesses = [];
        this.loadSession();
    }

    /**
     * Carga la sesión guardada desde sessionStorage
     */
    loadSession() {
        const storedUser = sessionStorage.getItem("inv_current_user");
        const storedBiz = sessionStorage.getItem("inv_current_biz");
        if (storedUser) {
            this.currentUser = JSON.parse(storedUser);
        }
        if (storedBiz) {
            this.currentBusiness = JSON.parse(storedBiz);
        }
    }

    /**
     * Guarda la sesión actual
     */
    saveSession(user, business) {
        this.currentUser = user;
        this.currentBusiness = business;
        sessionStorage.setItem("inv_current_user", JSON.stringify(user));
        sessionStorage.setItem("inv_current_biz", JSON.stringify(business));
    }

    /**
     * Cierra la sesión activa
     */
    logout() {
        this.currentUser = null;
        this.currentBusiness = null;
        this.userBusinesses = [];
        sessionStorage.removeItem("inv_current_user");
        sessionStorage.removeItem("inv_current_biz");
        window.location.reload();
    }

    /**
     * Verifica si el usuario es Super Admin
     */
    isSuperAdmin() {
        return this.currentUser && this.currentUser.email.toLowerCase() === CONFIG.SUPER_ADMIN.email.toLowerCase();
    }

    /**
     * Registro Estándar de Usuario (Nombre, Correo, Clave, Confirmación)
     */
    async registerStandard(name, email, password, confirmPassword) {
        if (!name || !email || !password) {
            throw new Error("Por favor completa todos los campos requeridos.");
        }
        if (password !== confirmPassword) {
            throw new Error("La clave y la confirmación de clave no coinciden.");
        }
        if (password.length < 6) {
            throw new Error("La clave debe tener al menos 6 caracteres.");
        }

        // Verificar si el usuario ya existe
        const existingRes = await DB.query("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
        const existingUsers = existingRes.rows || [];
        if (existingUsers.length > 0) {
            throw new Error("El correo electrónico ya se encuentra registrado.");
        }

        const now = new Date();
        const userId = "usr_" + Date.now();
        const newUser = {
            id: userId,
            google_id: null,
            name: name,
            email: email.toLowerCase(),
            password_hash: password, // Para producción se recomienda hash bcrypt
            role: email.toLowerCase() === CONFIG.SUPER_ADMIN.email.toLowerCase() ? "superadmin" : "user",
            trial_starts_at: now.toISOString(),
            membership_expires_at: null,
            is_active: 1,
            created_at: now.toISOString()
        };

        // Guardar en DB y LocalStorage
        await DB.query(
            `INSERT INTO users (id, google_id, name, email, password_hash, role, trial_starts_at, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [newUser.id, newUser.google_id, newUser.name, newUser.email, newUser.password_hash, newUser.role, newUser.trial_starts_at]
        );
        DB.setLocalRecord("users", newUser);

        // Crear negocio predeterminado para el nuevo usuario
        const bizId = "biz_" + Date.now();
        const defaultBiz = {
            id: bizId,
            owner_user_id: newUser.id,
            name: `Comercio de ${newUser.name}`,
            address: "Dirección Principal",
            phone: "0414-0000000",
            email: newUser.email,
            website: "",
            logo_url: null,
            branding_color: "#0d6efd",
            category_preset: "generico",
            created_at: now.toISOString()
        };

        await DB.query(
            `INSERT INTO businesses (id, owner_user_id, name, address, phone, email, branding_color) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [defaultBiz.id, defaultBiz.owner_user_id, defaultBiz.name, defaultBiz.address, defaultBiz.phone, defaultBiz.email, defaultBiz.branding_color]
        );
        DB.setLocalRecord("businesses", defaultBiz);

        // Crear registro de rol propietario
        const roleId = "ubr_" + Date.now();
        const userRole = {
            id: roleId,
            user_email: newUser.email,
            business_id: defaultBiz.id,
            role: "owner",
            created_at: now.toISOString()
        };
        await DB.query(`INSERT INTO user_business_roles (id, user_email, business_id, role) VALUES (?, ?, ?, ?)`, [roleId, newUser.email, defaultBiz.id, "owner"]);
        DB.setLocalRecord("user_business_roles", userRole);

        this.saveSession(newUser, defaultBiz);
        return { user: newUser, business: defaultBiz };
    }

    /**
     * Inicio de Sesión Estándar (Email y Clave)
     */
    async loginStandard(email, password) {
        if (!email || !password) {
            throw new Error("Ingresa correo y clave.");
        }

        const res = await DB.query("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
        let user = (res.rows || [])[0];

        // Validar SuperAdmin predeterminado si no está en DB
        if (!user && email.toLowerCase() === CONFIG.SUPER_ADMIN.email.toLowerCase() && password === CONFIG.SUPER_ADMIN.password) {
            user = {
                id: "usr_superadmin",
                name: CONFIG.SUPER_ADMIN.name,
                email: CONFIG.SUPER_ADMIN.email,
                password_hash: CONFIG.SUPER_ADMIN.password,
                role: "superadmin",
                trial_starts_at: new Date().toISOString(),
                membership_expires_at: new Date(Date.now() + 3650 * 86400000).toISOString(),
                is_active: 1
            };
        } else if (!user || user.password_hash !== password) {
            throw new Error("Credenciales inválidas. Revisa tu correo y clave.");
        }

        return await this.handlePostLogin(user);
    }

    /**
     * Login / Registro con Google Identity Services API
     */
    async handleGoogleCredentialResponse(response) {
        try {
            // Decodificar JWT Token de Google
            const payload = this.parseJwt(response.credential);
            const googleId = payload.sub;
            const email = payload.email.toLowerCase();
            const name = payload.name || "Usuario Google";

            // Buscar si ya existe el usuario
            const res = await DB.query("SELECT * FROM users WHERE email = ? OR google_id = ?", [email, googleId]);
            let user = (res.rows || [])[0];

            if (!user) {
                // Registrar nuevo usuario desde Google
                const now = new Date();
                user = {
                    id: "usr_g_" + Date.now(),
                    google_id: googleId,
                    name: name,
                    email: email,
                    password_hash: null,
                    role: email === CONFIG.SUPER_ADMIN.email.toLowerCase() ? "superadmin" : "user",
                    trial_starts_at: now.toISOString(),
                    membership_expires_at: null,
                    is_active: 1,
                    created_at: now.toISOString()
                };

                try {
                    await DB.query(
                        `INSERT INTO users (id, google_id, name, email, role, trial_starts_at, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
                        [user.id, user.google_id, user.name, user.email, user.role, user.trial_starts_at, user.created_at]
                    );
                } catch (e) {
                    console.warn("Could not insert google user to Turso DB:", e);
                }
                DB.setLocalRecord("users", user);

                // Crear Comercio Predeterminado
                const defaultBiz = {
                    id: "biz_g_" + Date.now(),
                    owner_user_id: user.id,
                    name: `Comercio de ${user.name}`,
                    address: "Dirección Principal",
                    phone: "0414-0000000",
                    email: user.email,
                    logo_url: null,
                    branding_color: "#0d6efd",
                    category_preset: "generico",
                    created_at: now.toISOString()
                };
                try {
                    await DB.query(
                        `INSERT INTO businesses (id, owner_user_id, name, address, phone, email, branding_color) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [defaultBiz.id, defaultBiz.owner_user_id, defaultBiz.name, defaultBiz.address, defaultBiz.phone, defaultBiz.email, defaultBiz.branding_color]
                    );
                } catch (e) {}
                DB.setLocalRecord("businesses", defaultBiz);

                const userRole = {
                    id: "ubr_g_" + Date.now(),
                    user_email: user.email,
                    business_id: defaultBiz.id,
                    role: "owner",
                    created_at: now.toISOString()
                };
                try {
                    await DB.query(`INSERT INTO user_business_roles (id, user_email, business_id, role) VALUES (?, ?, ?, ?)`, [userRole.id, user.email, defaultBiz.id, "owner"]);
                } catch (e) {}
                DB.setLocalRecord("user_business_roles", userRole);
            } else {
                // Si el usuario existía pero no tenía el google_id guardado
                if (!user.google_id) {
                    user.google_id = googleId;
                    try {
                        await DB.query("UPDATE users SET google_id = ? WHERE id = ?", [googleId, user.id]);
                    } catch (e) {}
                }
                DB.setLocalRecord("users", user);
            }

            const loginResult = await this.handlePostLogin(user);
            if (window.AppUI && typeof window.AppUI.renderApp === "function") {
                window.AppUI.renderApp();
            } else if (typeof AppUI !== "undefined" && AppUI && typeof AppUI.renderApp === "function") {
                AppUI.renderApp();
            }
            return loginResult;
        } catch (err) {
            console.error("Error en login Google:", err);
            alert("Error al iniciar sesión con Google: " + (err.message || err));
        }
    }

    parseJwt(token) {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(window.atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
        return JSON.parse(jsonPayload);
    }

    /**
     * Procesa la asociación de cuentas/negocios post-login
     */
    async handlePostLogin(user) {
        // Buscar todos los comercios donde el usuario es dueño o admin delegado
        const ownedRes = await DB.query("SELECT * FROM businesses WHERE owner_user_id = ?", [user.id]);
        const ownedBizs = ownedRes.rows || [];

        const rolesRes = await DB.query("SELECT * FROM user_business_roles WHERE user_email = ?", [user.email.toLowerCase()]);
        const roles = rolesRes.rows || [];

        const extraBizIds = roles.map(r => r.business_id);
        let extraBizs = [];
        if (extraBizIds.length > 0) {
            const allBiz = DB.getLocalTable("businesses");
            extraBizs = allBiz.filter(b => extraBizIds.includes(b.id));
        }

        // Combinar negocios únicos
        const bizMap = new Map();
        ownedBizs.forEach(b => bizMap.set(b.id, { ...b, roleName: "Propietario" }));
        extraBizs.forEach(b => {
            if (!bizMap.has(b.id)) {
                bizMap.set(b.id, { ...b, roleName: "Administrador Delegado" });
            }
        });

        this.userBusinesses = Array.from(bizMap.values());

        if (this.userBusinesses.length === 0) {
            // Si no tiene negocio asociado, crear uno de respaldo
            const fallbackBiz = {
                id: "biz_fb_" + Date.now(),
                owner_user_id: user.id,
                name: `Comercio de ${user.name}`,
                address: "Dirección Principal",
                phone: "0414-0000000",
                email: user.email,
                branding_color: "#0d6efd"
            };
            DB.setLocalRecord("businesses", fallbackBiz);
            this.userBusinesses.push({ ...fallbackBiz, roleName: "Propietario" });
        }

        if (this.userBusinesses.length === 1) {
            // 1 solo negocio: Iniciar directamente
            this.saveSession(user, this.userBusinesses[0]);
            return { user, business: this.userBusinesses[0], multiple: false };
        } else {
            // 2 o más negocios: Requerir selección de cuenta
            this.saveSession(user, this.userBusinesses[0]); // guardar temporal
            return { user, businesses: this.userBusinesses, multiple: true };
        }
    }

    /**
     * Calcula los días restantes de la prueba gratuita de 15 días
     */
    getRemainingTrialDays() {
        if (!this.currentUser) return 0;
        const start = new Date(this.currentUser.trial_starts_at || Date.now());
        const expire = new Date(start.getTime() + CONFIG.FREE_TRIAL_DAYS * 86400000);
        const diffMs = expire - new Date();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    }

    /**
     * Calcula los días restantes de membresía activa
     */
    getRemainingMembershipDays() {
        if (!this.currentUser || !this.currentUser.membership_expires_at) return 0;
        const expire = new Date(this.currentUser.membership_expires_at);
        const diffMs = expire - new Date();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    }
}

const Auth = new AuthManager();
