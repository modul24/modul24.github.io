const SESSION_PREFIX = 'pkce-code-verifier';
var flagDataTypeMap;
(function (flagDataTypeMap) {
    flagDataTypeMap["s"] = "string";
    flagDataTypeMap["i"] = "integer";
    flagDataTypeMap["b"] = "boolean";
})(flagDataTypeMap || (flagDataTypeMap = {}));
var storageMap;
(function (storageMap) {
    storageMap["token_bundle"] = "kinde_token";
    storageMap["access_token"] = "kinde_access_token";
    storageMap["id_token"] = "kinde_id_token";
    storageMap["user"] = "user";
    storageMap["refresh_token"] = "kinde_refresh_token";
})(storageMap || (storageMap = {}));

// Early expiraton in seconds
const EARLY_EXPIRATION = 30;
const isJWTActive = (jwtToken) => {
    const unixTime = Math.floor(Date.now() / 1000);
    return jwtToken.exp - EARLY_EXPIRATION > unixTime;
};

//#region lib/types.ts
var e = /* @__PURE__ */ function(e) {
	return e.email = "email", e.profile = "profile", e.openid = "openid", e.offline_access = "offline", e;
}({}), t = /* @__PURE__ */ function(e) {
	return e.none = "none", e.create = "create", e.login = "login", e;
}({}), n = /* @__PURE__ */ function(e) {
	return e.organizationDetails = "organization_details", e.organizationMembers = "organization_members", e.organizationPlanDetails = "organization_plan_details", e.organizationPaymentDetails = "organization_payment_details", e.organizationPlanSelection = "organization_plan_selection", e.paymentDetails = "payment_details", e.planSelection = "plan_selection", e.planDetails = "plan_details", e.profile = "profile", e;
}({}), r = /* @__PURE__ */ function(e) {
	return e.organizationDetails = "organization_details", e.organizationMembers = "organization_members", e.organizationPlanDetails = "organization_plan_details", e.organizationPaymentDetails = "organization_payment_details", e.organizationPlanSelection = "organization_plan_selection", e.profile = "profile", e;
}({}), i = /* @__PURE__ */ function(e) {
	return e.logout = "logout", e.login = "login", e.register = "registration", e.token = "token", e.profile = "profile", e;
}({}), a = /* @__PURE__ */ function(e) {
	return e[e.refreshToken = 0] = "refreshToken", e[e.cookie = 1] = "cookie", e;
}({}), o = (e) => {
	let t = (e) => btoa(e).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
	if (e instanceof ArrayBuffer || Object.prototype.toString.call(e) === "[object ArrayBuffer]") {
		let n = new Uint8Array(e);
		return t(String.fromCharCode(...n));
	}
	let n = new TextEncoder().encode(e);
	return t(String.fromCharCode(...n));
}, s = (e) => {
	let t = e.replace(/-/g, "+").replace(/_/g, "/"), n = t.length % 4;
	n && (t += "=".repeat(4 - n));
	let r = atob(t), i = new Uint8Array(r.length);
	for (let e = 0; e < r.length; e++) i[e] = r.charCodeAt(e);
	return new TextDecoder().decode(i);
}, c = (e = 28) => {
	if (crypto) {
		let t = new Uint8Array(e / 2);
		return crypto.getRandomValues(t), Array.from(t, l).join("");
	}
	return u(e);
};
function l(e) {
	return e.toString(16).padStart(2, "0");
}
function u(e = 28) {
	let t = "";
	for (let n = 0; n < e; n++) t += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(Math.floor(Math.random() * 62));
	return t;
}
//#endregion
//#region lib/utils/extractAuthResults.ts
var d = (e) => {
	e = e.split("?")[1];
	let t = new URLSearchParams(e);
	return {
		accessToken: t.get("access_token"),
		idToken: t.get("id_token"),
		expiresIn: +(t.get("expires_in") || 0)
	};
}, f = (e) => {
	let t = e.replace(/([^:]\/)\/+/g, "$1");
	return t.match(/^\/\/[^/?]+/) && t.includes(".") ? t = t.replace(/^\/\/\/+/, "//") : t.match(/^\/\/+/) && (t = t.replace(/^\/\/+/, "/")), t !== "/" && (t = t.replace(/\/$/, "")), t;
}, p = (e, t = false) => {
	let n = Array.isArray(e.audience) ? e.audience.join(" ") : e.audience || "", r = {
		login_hint: e.loginHint,
		is_create_org: e.isCreateOrg?.toString(),
		connection_id: e.connectionId,
		redirect_uri: e.redirectURL ? t ? e.redirectURL : f(e.redirectURL) : void 0,
		audience: n,
		scope: e.scope?.join(" ") || "email profile openid offline",
		prompt: e.prompt,
		lang: e.lang,
		org_code: e.orgCode,
		org_name: e.orgName,
		has_success_page: e.hasSuccessPage?.toString(),
		workflow_deployment_id: e.workflowDeploymentId,
		supports_reauth: e.supportsReauth?.toString(),
		plan_interest: e.planInterest,
		pricing_table_key: e.pricingTableKey,
		pages_mode: e.pagesMode,
		invitation_code: e.invitationCode,
		is_invitation: e.invitationCode ? "true" : void 0
	};
	return Object.keys(r).forEach((e) => r[e] === void 0 && delete r[e]), r;
}, m = (e) => typeof e != "object" || !e ? e : Array.isArray(e) ? e.map((e) => m(e)) : Object.fromEntries(Object.entries(e).map(([e, t]) => [e.replace(/_([a-z])/g, (e, t) => t.toUpperCase()), m(t)])), ee = /* @__PURE__ */ "utm_source.utm_medium.utm_campaign.utm_content.utm_term.gclid.click_id.hsa_acc.hsa_cam.hsa_grp.hsa_ad.hsa_src.hsa_tgt.hsa_kw.hsa_mt.hsa_net.hsa_ver.match_type.keyword.device.ad_group_id.campaign_id.creative.network.ad_position.fbclid.li_fat_id.msclkid.twclid.ttclid".split("."), h = async (e, n = i.login, r, a) => {
	let o = `${e}/oauth2/auth`, s = $();
	if (r.reauthState) try {
		let e = m(JSON.parse(atob(r.reauthState)));
		r = {
			...r,
			...e
		}, delete r.reauthState;
	} catch (e) {
		let t = e instanceof Error ? e.message : "Unknown error";
		throw Error(`Error handling reauth state: ${t}`, { cause: e });
	}
	if (!r.clientId) throw Error("Error generating auth URL: Client ID missing");
	let l = {
		client_id: r.clientId,
		response_type: r.responseType || "code",
		...p(r, a?.disableUrlSanitization)
	};
	r.state || (r.state = c(32)), s && s.setSessionItem(T.state, r.state), l.state = r.state, r.nonce || (r.nonce = c(16)), l.nonce = r.nonce, s && s.setSessionItem(T.nonce, r.nonce);
	let u = "";
	if (r.codeChallenge) l.code_challenge = r.codeChallenge;
	else {
		let { codeVerifier: e, codeChallenge: t } = await g();
		u = e, s && s.setSessionItem(T.codeVerifier, e), l.code_challenge = t;
	}
	l.code_challenge_method = "S256", r.codeChallengeMethod && (l.code_challenge_method = r.codeChallengeMethod), !r.prompt && n === i.register && (l.prompt = t.create), r.properties && Object.keys(r.properties).forEach((e) => {
		if (!ee.includes(e)) {
			console.warn("Unsupported Property for url generation: ", e);
			return;
		}
		let t = r.properties?.[e];
		t !== void 0 && (l[e] = t);
	});
	let d = new URLSearchParams(l).toString();
	return {
		url: new URL(`${o}?${d}`),
		state: l.state,
		nonce: l.nonce,
		codeChallenge: l.code_challenge,
		codeVerifier: u
	};
};
async function g() {
	let e = c(52), t = new TextEncoder().encode(e), n;
	return n = crypto ? o(await crypto.subtle.digest("SHA-256", t)) : o(e), {
		codeVerifier: e,
		codeChallenge: n
	};
}
//#endregion
//#region lib/utils/isClient.ts
var _ = () => typeof window < "u", v;
function y(e, t) {
	if (b(), !_()) throw Error("setRefreshTimer requires a browser environment");
	if (e <= 0) throw Error("Timer duration must be positive");
	v = window.setTimeout(t, Math.min(e * 1e3 - 1e4, 864e5));
}
function b() {
	_() && v !== void 0 && (window.clearTimeout(v), v = void 0);
}
//#endregion
//#region lib/utils/exchangeAuthCode.ts
var x = {
	framework: "",
	frameworkVersion: "",
	sdkVersion: ""
}, te = async () => {
	await $()?.removeItems(T.state, T.nonce, T.codeVerifier);
}, S = () => `${x.framework}/${x.sdkVersion}/${x.frameworkVersion}/Javascript`, ne = async ({ urlParams: e, domain: t, clientId: n, clientSecret: r, redirectURL: i, autoRefresh: a = false, onRefresh: o }) => {
	let s = e.get("state"), c = e.get("code");
	if (!s || !c) return console.error("Invalid state or code"), {
		success: false,
		error: "Invalid state or code"
	};
	let l = $();
	if (!l) return console.error("No active storage found"), {
		success: false,
		error: "Authentication storage is not initialized"
	};
	(!x.framework || !x.frameworkVersion) && console.warn("Framework and version not set. Please set the framework and version in the config object");
	let u = await l.getSessionItem(T.state);
	if (s !== u) return console.error("Invalid state"), {
		success: false,
		error: `Invalid state; supplied ${s}, expected ${u}`
	};
	let d = await l.getSessionItem(T.codeVerifier);
	if (d === null) return console.error("Code verifier not found"), {
		success: false,
		error: "Code verifier not found"
	};
	let f = { "Content-type": "application/x-www-form-urlencoded; charset=UTF-8" };
	x.framework && (f["Kinde-SDK"] = S());
	let p = !k.useInsecureForRefreshToken && C(t) ? { credentials: "include" } : {}, m = new URLSearchParams({
		client_id: n,
		code: c,
		code_verifier: d,
		grant_type: "authorization_code",
		redirect_uri: i
	});
	r && m.append("client_secret", r);
	let ee = {
		method: "POST",
		...p,
		headers: new Headers(f),
		body: m
	}, h;
	b();
	try {
		if (h = await fetch(`${t}/oauth2/token`, ee), !h?.ok) {
			let e = await h.text();
			return console.error("Token exchange failed:", h.status, e), {
				success: !1,
				error: `Token exchange failed: ${h.status} - ${e}`
			};
		}
	} catch (e) {
		return te(), console.error("Token exchange failed:", e), {
			success: false,
			error: `Token exchange failed: ${e}`
		};
	}
	let g = await h.json(), v = Q();
	if (v) try {
		await v.setItems({
			[T.accessToken]: g.access_token,
			[T.idToken]: g.id_token,
			[T.refreshToken]: g.refresh_token
		});
	} catch (e) {
		return console.error("Failed to persist tokens to secure storage:", e), {
			success: false,
			error: `Failed to persist tokens: ${e}`
		};
	}
	(k.useInsecureForRefreshToken || !C(t)) && l.setSessionItem(T.refreshToken, g.refresh_token), a && y(g.expires_in, async () => {
		X({
			domain: t,
			clientId: n,
			onRefresh: o
		});
	}), te();
	let ne = (e) => (e.search = "", e);
	if (_()) {
		let e = ne(new URL(window.location.toString()));
		window.history.replaceState(window.history.state, "", e);
	}
	return !g.access_token || !g.id_token || !g.refresh_token ? {
		success: false,
		error: "No access token received"
	} : {
		success: true,
		[T.accessToken]: g.access_token,
		[T.idToken]: g.id_token,
		[T.refreshToken]: g.refresh_token
	};
};
//#endregion
//#region lib/utils/getCookie.ts
function re(e) {
	let t = document.cookie.split("; ").find((t) => t.startsWith(`${e}=`));
	if (!t) return null;
	try {
		let e = t.split("=")[1];
		return e ? decodeURIComponent(e) : null;
	} catch (t) {
		return console.error(`Error parsing cookie ${e}:`, t), null;
	}
}
//#endregion
//#region lib/utils/checkAuth.ts
var ie = "_kbrte", ae = async ({ domain: e, clientId: t }) => {
	if (!e) return {
		success: false,
		error: "Domain is required for authentication check"
	};
	if (!t) return {
		success: false,
		error: "Client ID is required for authentication check"
	};
	let n = Q();
	if (n) {
		let { [T.accessToken]: r, [T.idToken]: i, [T.refreshToken]: o } = await n.getItems(T.accessToken, T.idToken, T.refreshToken);
		if (r && i && o) return await Y({ threshold: 10 }) ? await X({
			domain: e,
			clientId: t,
			refreshType: a.refreshToken
		}) : {
			success: true,
			accessToken: r,
			idToken: i,
			refreshToken: o
		};
	}
	let r = C(e), i = k.useInsecureForRefreshToken, o = null;
	return r && !i && (o = re(ie)), await X({
		domain: e,
		clientId: t,
		refreshType: o ? a.cookie : a.refreshToken
	});
}, C = (e) => !e.match(/^(?:https?:\/\/)?[a-zA-Z0-9][.-a-zA-Z0-9]*\.kinde\.com$/i);
//#endregion
//#region lib/utils/splitString.ts
function w(e, t) {
	return t <= 0 ? [] : e.match(RegExp(`.{1,${t}}`, "g")) || [];
}
//#endregion
//#region lib/sessionManager/types.ts
var T = /* @__PURE__ */ function(e) {
	return e.accessToken = "accessToken", e.idToken = "idToken", e.refreshToken = "refreshToken", e.state = "state", e.nonce = "nonce", e.codeVerifier = "codeVerifier", e;
}({}), E = /* @__PURE__ */ function(e) {
	return e.preWarning = "preWarning", e.timeout = "timeout", e;
}({}), D = class {
	listeners = /* @__PURE__ */ new Set();
	notificationScheduled = false;
	notifyListeners() {
		this.listeners.size !== 0 && this.scheduleNotification();
	}
	async scheduleNotification() {
		this.notificationScheduled || (this.notificationScheduled = true, await new Promise((e) => {
			setTimeout(async () => {
				await Promise.all(Array.from(this.listeners).map((e) => e())), this.notificationScheduled = false, e();
			}, 0);
		}));
	}
	subscribe(e) {
		return this.listeners.add(e), () => {
			this.listeners.delete(e);
		};
	}
	async setItems(e) {
		await Promise.all(Object.entries(e).map(([e, t]) => this.setSessionItem(e, t)));
	}
	async getItems(...e) {
		let t = e.map(async (e) => [e, await this.getSessionItem(e)]), n = await Promise.all(t);
		return Object.fromEntries(n);
	}
	async removeItems(...e) {
		await Promise.all(e.map((e) => this.removeSessionItem(e)));
	}
}, oe = class extends D {
	asyncStore = false;
	memCache = {};
	destroySession() {
		this.memCache = {}, this.notifyListeners();
	}
	setSessionItem(e, t) {
		if (this.removeSessionItem(e), typeof t == "string") {
			w(t, k.maxLength).forEach((t, n) => {
				this.memCache[`${k.keyPrefix}${e}${n}`] = t;
			}), this.notifyListeners();
			return;
		}
		this.memCache[`${k.keyPrefix}${String(e)}0`] = t, this.notifyListeners();
	}
	getSessionItem(e) {
		if (this.memCache[`${k.keyPrefix}${String(e)}0`] === void 0) return null;
		let t = "", n = 0, r = `${k.keyPrefix}${String(e)}${n}`;
		for (; this.memCache[r] !== void 0;) t += this.memCache[r], n++, r = `${k.keyPrefix}${String(e)}${n}`;
		return t;
	}
	removeSessionItem(e) {
		for (let t in this.memCache) t.startsWith(`${k.keyPrefix}${String(e)}`) && delete this.memCache[t];
		this.notifyListeners();
	}
};
//#endregion
//#region lib/sessionManager/stores/chromeStore.ts
function O(e) {
	return new Promise((t, n) => {
		chrome.storage.local.get([e], function(r) {
			chrome.runtime.lastError ? n(void 0) : t(r[e]);
		});
	});
}
var se = class extends D {
	asyncStore = true;
	async destroySession() {
		await chrome.storage.local.clear(), this.notifyListeners();
	}
	async setSessionItem(e, t) {
		if (await this.removeSessionItem(e), typeof t == "string") {
			let n = w(t, k.maxLength);
			await Promise.all(n.map((t, n) => chrome.storage.local.set({ [`${k.keyPrefix}${e}${n}`]: t }))), this.notifyListeners();
			return;
		}
		await chrome.storage.local.set({ [`${k.keyPrefix}${e}0`]: t }), this.notifyListeners();
	}
	async getSessionItem(e) {
		let t = "", n = 0, r = `${k.keyPrefix}${String(e)}${n}`;
		for (; await O(`${k.keyPrefix}${String(e)}${n}`) !== void 0;) t += await O(r), n++, r = `${k.keyPrefix}${String(e)}${n}`;
		return t;
	}
	async removeSessionItem(e) {
		let t = 0;
		for (; await O(`${k.keyPrefix}${String(e)}${t}`) !== void 0;) await chrome.storage.local.remove(`${k.keyPrefix}${String(e)}${t}`), t++;
		this.notifyListeners();
	}
}, ce = class extends D {
	asyncStore = false;
	constructor() {
		super(), k.useInsecureForRefreshToken && console.warn("LocalStorage store should not be used in production");
	}
	internalItems = /* @__PURE__ */ new Set();
	destroySession() {
		Array.from(this.internalItems).forEach((e) => this.removeSessionItem(e)), this.notifyListeners();
	}
	setSessionItem(e, t) {
		if (this.removeSessionItem(e), this.internalItems.add(e), typeof t == "string") {
			w(t, k.maxLength).forEach((t, n) => {
				localStorage.setItem(`${k.keyPrefix}${e}${n}`, t);
			}), this.notifyListeners();
			return;
		}
		localStorage.setItem(`${k.keyPrefix}${e}0`, t), this.notifyListeners();
	}
	getSessionItem(e) {
		if (localStorage.getItem(`${k.keyPrefix}${e}0`) === null) return null;
		let t = "", n = 0, r = `${k.keyPrefix}${String(e)}${n}`;
		for (; localStorage.getItem(r) !== null;) t += localStorage.getItem(r), n++, r = `${k.keyPrefix}${String(e)}${n}`;
		return t;
	}
	removeSessionItem(e) {
		let t = 0;
		for (; localStorage.getItem(`${k.keyPrefix}${String(e)}${t}`) !== null;) localStorage.removeItem(`${k.keyPrefix}${String(e)}${t}`), t++;
		this.internalItems.delete(e), this.notifyListeners();
	}
}, k = {
	keyPrefix: "kinde-",
	maxLength: 2e3,
	useInsecureForRefreshToken: false,
	activityTimeoutMinutes: void 0,
	activityTimeoutPreWarningMinutes: void 0,
	onActivityTimeout: void 0
}, A = null, j = null, M = false, le = () => {
	if (M) return;
	let e = Q() ?? $();
	if (!e) throw Error("Session manager not found");
	if (!k.activityTimeoutMinutes) throw Error("No activity timeout minutes set");
	if (k.activityTimeoutPreWarningMinutes !== void 0 && k.activityTimeoutPreWarningMinutes >= k.activityTimeoutMinutes) throw Error("activityTimeoutPreWarningMinutes must be less than activityTimeoutMinutes");
	A && clearTimeout(A), j && clearTimeout(j), j = setTimeout(async () => {
		M = true;
		let t = {
			accessToken: null,
			idToken: null,
			refreshToken: null
		};
		try {
			let n = await e.getItems(T.accessToken, T.idToken, T.refreshToken);
			t.accessToken = n[T.accessToken] ?? null, t.idToken = n[T.idToken] ?? null, t.refreshToken = n[T.refreshToken] ?? null;
		} catch (e) {
			console.error("Failed to capture tokens:", e);
		}
		let n = $();
		if (n && n !== e) try {
			t.refreshToken = (await n.getItems(T.refreshToken))[T.refreshToken] ?? null;
		} catch (e) {
			console.error("Failed to capture refresh token from insecure storage:", e);
		}
		M = false;
		try {
			await e.destroySession();
		} catch (e) {
			console.error("Failed to destroy secure session:", e);
		}
		if (n && n !== e) try {
			await n.destroySession();
		} catch (e) {
			console.error("Failed to destroy insecure session:", e);
		}
		try {
			k.onActivityTimeout?.(E.timeout, t);
		} catch (e) {
			console.error("[activityTimeout] onActivityTimeout(timeout) threw:", e);
		}
	}, k.activityTimeoutMinutes * 60 * 1e3), k.activityTimeoutPreWarningMinutes !== void 0 && (A = setTimeout(() => {
		try {
			k.onActivityTimeout?.(E.preWarning);
		} catch (e) {
			console.error("[activityTimeout] onActivityTimeout(preWarning) threw:", e);
		}
	}, k.activityTimeoutPreWarningMinutes * 60 * 1e3));
}, N = (e) => {
	if (!e) throw Error("Session manager not found");
	if (!k.activityTimeoutMinutes) return e;
	if (k.activityTimeoutPreWarningMinutes !== void 0 && k.activityTimeoutPreWarningMinutes >= k.activityTimeoutMinutes) throw Error("activityTimeoutPreWarningMinutes must be less than activityTimeoutMinutes");
	return new Proxy(e, { get(e, t) {
		let n = e[t];
		return typeof n == "function" ? (t !== "destroySession" && le(), n.bind(e)) : n;
	} });
};
//#endregion
//#region node_modules/.pnpm/@kinde+jwt-decoder@0.2.5/node_modules/@kinde/jwt-decoder/dist/jwt-decoder.js
function ue(e, t) {
	if (!e) return null;
	let n = e.split(".");
	if (n.length !== 3) return null;
	let r = n[1].replace(/-/g, "+").replace(/_/g, "/"), i = decodeURIComponent(atob(r).split("").map((e) => "%" + ("00" + e.charCodeAt(0).toString(16)).slice(-2)).join(""));
	return JSON.parse(i);
}
//#endregion
//#region lib/utils/token/getDecodedToken.ts
var de = (e) => {
	if (!e) return null;
	let t = ue(e);
	return t || console.warn("No decoded token found"), t;
}, P = async (e = T.accessToken) => {
	let t = Q();
	return t ? de(await t.getSessionItem(e === "accessToken" ? T.accessToken : T.idToken)) : null;
}, F = (e = T.accessToken) => {
	let t = Q();
	if (!t) return null;
	if (t.asyncStore) throw Error("Active storage is async-only. Use the async helpers.");
	return de(t.getSessionItem(e === "accessToken" ? T.accessToken : T.idToken));
}, I = (e, t) => {
	if (Array.isArray(e) && Array.isArray(t)) return Array.from(/* @__PURE__ */ new Set([...e, ...t]));
	if (e && typeof e == "object" && t && typeof t == "object") {
		let n = { ...e };
		for (let e of Object.keys(t)) n[e] = e in n ? I(n[e], t[e]) : t[e];
		return n;
	}
	return t;
};
//#endregion
//#region lib/utils/token/accountApi/callAccountApi.ts
async function L(e) {
	let t = Q();
	if (!t) throw Error("No active storage found.");
	let n = await t.getSessionItem(T.accessToken);
	if (!n) throw Error("Authentication token not found.");
	let r = await J("iss");
	if (!r?.value) throw Error("Domain (iss claim) not found.");
	let i;
	try {
		i = await fetch(`${r.value}/${e}`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${n}`,
				"Content-Type": "application/json"
			}
		});
	} catch (t) {
		throw Error(`Failed to fetch from ${r.value}/${e}`, { cause: t });
	}
	if (!i.ok) throw Error(`API request failed with status ${i.status}`);
	return await i.json();
}
var R = async ({ url: e }) => {
	let t = await L(e), n = t.data;
	if (t.metadata?.has_more) {
		let r = t.metadata.next_page_starting_after;
		for (; t.metadata.has_more;) t = await L(`${e}?starting_after=${r}`), n = I(n, t.data), r = t.metadata.next_page_starting_after;
	}
	return n;
}, z = (e) => {
	if (!e) return {
		orgCode: null,
		permissions: []
	};
	let t = e.permissions || e["x-hasura-permissions"] || [];
	return {
		orgCode: e.org_code || e["x-hasura-org-code"],
		permissions: t
	};
}, B = async (e) => {
	if (e?.forceApi) {
		let e = await R({ url: "account_api/v1/permissions" });
		return {
			orgCode: e.org_code,
			permissions: e.permissions?.map((e) => e.key) || []
		};
	}
	return z(await P());
}, fe = (e) => {
	if (e?.forceApi) throw Error("forceApi cannot be used in sync mode");
	return z(F());
}, pe = (e) => typeof e == "object" && !!e && "permission" in e && "condition" in e, V = async (e) => {
	if (!e || !e.permissions || e?.permissions?.length === 0) return true;
	let { permissions: t } = e, n;
	try {
		n = await B({ forceApi: e.forceApi });
	} catch (e) {
		return console.error("[hasPermissions] Error getting permissions", e), false;
	}
	return (await Promise.all(t.map(async (e) => pe(e) ? n.permissions.find((t) => t === e.permission) ? await e.condition({
		permissionKey: e.permission,
		orgCode: n.orgCode
	}) : false : !!n.permissions.find((t) => t === e)))).every((e) => e === true);
}, H = (e) => e ? !e.roles && !e["x-hasura-roles"] ? (console.warn("No roles found in token, ensure roles have been included in the token customisation within the application settings"), []) : e.roles || e["x-hasura-roles"] : [], U = async (e) => {
	let t = await J("roles");
	return e?.forceApi || !t?.value ? (await R({ url: "account_api/v1/roles" })).roles?.map((e) => ({
		id: e.id,
		name: e.name,
		key: e.key
	})) || [] : H(await P());
}, me = (e) => {
	if (e?.forceApi) throw Error("forceApi cannot be used in sync mode");
	let t = F();
	if (!t) throw Error("Authentication token not found.");
	return H(t);
}, he = (e) => typeof e == "object" && !!e && "role" in e && "condition" in e, W = async (e) => {
	if (!e || !e.roles || e?.roles?.length === 0) return true;
	let { roles: t } = e, n;
	try {
		n = await U({ forceApi: e.forceApi });
	} catch (e) {
		return console.error("[hasRoles] Error getting roles", e), false;
	}
	return (await Promise.all(t.map(async (e) => {
		if (he(e)) {
			let t = n.find((t) => t.key === e.role);
			return t ? await e.condition(t) : false;
		}
		return n.map((e) => e.key).includes(e);
	}))).every((e) => e === true);
}, ge = async (e) => e?.forceApi ? (await R({ url: "account_api/v1/feature_flags" })).feature_flags?.map((e) => ({
	key: e.key,
	value: e.value,
	type: e.type
})) || [] : _e(await P()), _e = (e) => {
	if (!e) return null;
	let t = e.feature_flags || e["x-hasura-feature-flags"];
	return t ? Object.entries(t).map(([e, t]) => ({
		key: e,
		value: t.v,
		type: t.t
	})) : null;
}, ve = (e) => typeof e == "object" && !!e && "flag" in e && "value" in e, ye = async (e) => {
	if (!e || !e.featureFlags || e?.featureFlags?.length === 0) return true;
	let { featureFlags: t } = e, n;
	try {
		n = await ge({ forceApi: e.forceApi });
	} catch (e) {
		return console.error("[hasFeatureFlags] Error getting feature flags", e), false;
	}
	return t.map((e) => {
		if (ve(e)) {
			let t = n?.find((t) => t.key === e.flag);
			return t !== void 0 && t.value === e.value;
		}
		return n?.find((t) => t.key === e) !== void 0;
	}).every((e) => e === true);
}, be = async () => {
	let e = await R({ url: "account_api/v1/entitlements" });
	return {
		orgCode: e.org_code,
		plans: e.plans?.map((e) => ({
			key: e.key,
			subscribedOn: e.subscribed_on
		})) || [],
		entitlements: e.entitlements?.map((e) => ({
			id: e.id,
			fixedCharge: e.fixed_charge,
			priceName: e.price_name,
			unitAmount: e.unit_amount,
			featureKey: e.feature_key,
			featureName: e.feature_name,
			entitlementLimitMax: e.entitlement_limit_max,
			entitlementLimitMin: e.entitlement_limit_min
		})) || []
	};
}, xe = (e) => typeof e == "object" && !!e && "entitlement" in e && "condition" in e, Se = async (e) => {
	if (!e || !e.billingEntitlements || e?.billingEntitlements?.length === 0) return true;
	let { billingEntitlements: t } = e, n;
	try {
		n = await be();
	} catch (e) {
		return console.error("[hasBillingEntitlements] Error getting entitlements", e), false;
	}
	return (await Promise.all(t.map(async (e) => {
		if (xe(e)) {
			let t = n.entitlements.find((t) => t.priceName === e.entitlement);
			return t ? await e.condition(t) : false;
		}
		return n.entitlements.map((e) => e.priceName).includes(e);
	}))).every((e) => e === true);
}, G = (e) => e !== void 0 && typeof e == "object", Ce = async (e) => {
	let t = [];
	return e.roles && t.push(W({
		roles: e.roles,
		forceApi: G(e.forceApi) ? e.forceApi.roles : e.forceApi
	})), e.permissions && t.push(V({
		permissions: e.permissions,
		forceApi: G(e.forceApi) ? e.forceApi.permissions : e.forceApi
	})), e.featureFlags && t.push(ye({
		featureFlags: e.featureFlags,
		forceApi: G(e.forceApi) ? e.forceApi.featureFlags : e.forceApi
	})), e.billingEntitlements && t.push(Se({ billingEntitlements: e.billingEntitlements })), (await Promise.all(t)).every(Boolean);
}, K = async (e = "accessToken") => P(e), q = (e = "accessToken") => F(e), we = (e, t) => e ? {
	name: t,
	value: e[t]
} : null, J = async (e, t = "accessToken") => we(await K(t), e), Te = (e, t = "accessToken") => we(q(t), e), Ee = async () => Oe(await P()), De = () => Oe(F()), Oe = (e) => e ? e.org_code || e["x-hasura-org-code"] : null, ke = async (e = T.accessToken) => {
	let t = Q();
	return t && await t.getSessionItem(e === "accessToken" ? T.accessToken : T.idToken) || null;
}, Ae = (e = T.accessToken) => {
	let t = Q();
	if (!t) return null;
	if (t.asyncStore) throw Error("Active storage is async-only. Use the async helpers.");
	return t.getSessionItem(e === "accessToken" ? T.accessToken : T.idToken) || null;
}, je = async (e, t) => {
	if (t?.forceApi) {
		let t = (await R({ url: "account_api/v1/feature_flags" })).feature_flags.find((t) => t.name === e);
		return t ? t.value : null;
	}
	return Ne(await P(), e);
}, Me = (e, t) => {
	if (t?.forceApi) throw Error("forceApi cannot be used in sync mode");
	return Ne(F(), e);
}, Ne = (e, t) => {
	if (!e) return null;
	let n = e.feature_flags || e["x-hasura-feature-flags"];
	return n ? n[t]?.v ?? null : null;
}, Pe = (e) => {
	if (!e) return null;
	let { sub: t } = e;
	return t ? {
		id: e.sub,
		givenName: e.given_name,
		familyName: e.family_name,
		email: e.email,
		picture: e.picture
	} : (console.error("No sub in idToken"), null);
}, Fe = async () => Pe(await K("idToken")), Ie = () => Pe(q("idToken")), Le = (e, t) => {
	if (!e) return {
		permissionKey: t,
		orgCode: null,
		isGranted: false
	};
	let n = e.permissions || e["x-hasura-permissions"] || [];
	return {
		permissionKey: t,
		orgCode: e.org_code || e["x-hasura-org-code"] || null,
		isGranted: !!n.includes(t)
	};
}, Re = async (e, t) => t?.forceApi ? L(`account_api/v1/permission/${encodeURIComponent(e)}`) : Le(await P(), e), ze = (e, t) => {
	if (t?.forceApi) throw Error("forceApi cannot be used in sync mode");
	return Le(F(), e);
}, Be = async () => He(await P("idToken")), Ve = () => He(F("idToken")), He = (e) => e ? !e.org_codes && !e["x-hasura-org-codes"] ? (console.warn("Org codes not found in token, ensure org codes have been included in the token customisation within the application settings"), null) : e.org_codes || e["x-hasura-org-codes"] : null, Ue = async (e) => {
	try {
		let t = await Y({ threshold: e?.expiredThreshold });
		return t && e?.useRefreshToken ? (await X({
			domain: e.domain,
			clientId: e.clientId
		})).success : !t;
	} catch (e) {
		return console.error("Error checking authentication:", e), false;
	}
}, Y = async (e) => {
	try {
		let t = await P("accessToken");
		return t ? t.exp ? t.exp < Math.floor(Date.now() / 1e3) + (e?.threshold || 0) : (console.error("Token does not have an expiry"), !0) : !0;
	} catch (e) {
		return console.error("Error checking authentication:", e), false;
	}
}, X = async ({ domain: e, clientId: t, clientSecret: n, refreshType: r = a.refreshToken, onRefresh: i }) => {
	let o = (e) => (i && i(e), e);
	if (!e) return o({
		success: false,
		error: "Domain is required for token refresh"
	});
	if (!t) return o({
		success: false,
		error: "Client ID is required for token refresh"
	});
	let s = "", c;
	if (c = k.useInsecureForRefreshToken || !C(e) ? $() : Q(), r === a.refreshToken) {
		if (!c) return o({
			success: false,
			error: "No active storage found"
		});
		if (s = await c.getSessionItem(T.refreshToken), !s) return o({
			success: false,
			error: "No refresh token found"
		});
	}
	b();
	let l, u;
	try {
		if (k.onRefreshHandler) l = await k.onRefreshHandler(r);
		else {
			let i = new URLSearchParams({
				...r === a.refreshToken && { refresh_token: s },
				grant_type: "refresh_token",
				client_id: t
			});
			n && i.append("client_secret", n);
			let c = r === a.cookie || C(e) && !k.useInsecureForRefreshToken, d = await fetch(`${f(e)}/oauth2/token`, {
				method: "POST",
				...c && { credentials: "include" },
				headers: { "Content-type": "application/x-www-form-urlencoded; charset=UTF-8" },
				body: i.toString()
			});
			if (!d.ok) return o({
				success: !1,
				error: "Failed to refresh token"
			});
			u = await d.json(), l = {
				success: !0,
				[T.accessToken]: u.access_token,
				[T.idToken]: u.id_token,
				[T.refreshToken]: u.refresh_token
			};
		}
		if (l.accessToken) {
			let n = Q();
			if (!n) return o({
				success: !1,
				error: "No active storage found"
			});
			if (await n.setSessionItem(T.accessToken, l.accessToken), l.idToken && await n.setSessionItem(T.idToken, l.idToken), c && l.refreshToken && await c.setSessionItem(T.refreshToken, l.refreshToken), _()) {
				let n = Number((await J("exp"))?.value);
				if (Number.isFinite(n) || u?.expires_in) {
					let a = 0;
					if (!u?.expires_in) {
						let e = Math.floor(Date.now() / 1e3);
						a = Math.max(n - e, 1);
					}
					y(u?.expires_in || a, async () => {
						X({
							domain: e,
							clientId: t,
							refreshType: r,
							onRefresh: i
						});
					});
				}
			}
			return o(l);
		}
	} catch (e) {
		return o({
			success: false,
			error: `No access token received: ${e}`
		});
	}
	return o({
		success: false,
		error: "No access token received"
	});
}, We = async (e) => {
	let t = await L(`account_api/v1/entitlement/${encodeURIComponent(e)}`);
	return {
		orgCode: t.data.org_code,
		entitlement: {
			id: t.data.entitlement.id,
			fixedCharge: t.data.entitlement.fixed_charge,
			priceName: t.data.entitlement.price_name,
			unitAmount: t.data.entitlement.unit_amount,
			featureKey: t.data.entitlement.feature_key,
			featureName: t.data.entitlement.feature_name,
			entitlementLimitMax: t.data.entitlement.entitlement_limit_max,
			entitlementLimitMin: t.data.entitlement.entitlement_limit_min
		}
	};
}, Z = {
	secure: null,
	insecure: null
}, Ge = (e) => {
	if (k.activityTimeoutMinutes) {
		Z.secure = N(e);
		return;
	}
	Z.secure = e;
}, Q = () => Z.secure || null, Ke = () => Z.secure !== null, qe = () => {
	Z.secure = null;
}, Je = (e) => {
	if (k.activityTimeoutMinutes) {
		Z.insecure = N(e);
		return;
	}
	Z.insecure = e;
}, $ = () => Z.insecure || Z.secure || null, Ye = () => Z.insecure !== null, Xe = () => {
	Z.insecure = null;
}, Ze = async (e) => (console.warn("Warning: generateProfileUrl is deprecated. Please use generatePortalUrl instead."), $e({
	domain: e.domain,
	returnUrl: e.returnUrl,
	subNav: e.subNav
}));
function Qe(e, t = []) {
	try {
		let n = new URL(e);
		return !t.includes(n.protocol) && !!n.host;
	} catch {
		return false;
	}
}
var $e = async ({ domain: e, returnUrl: t, subNav: r }) => {
	let i = Q();
	if (!i) throw Error("generatePortalUrl: Active storage not found");
	let a = await i.getSessionItem(T.accessToken);
	if (!a) throw Error("generatePortalUrl: Access Token not found");
	if (!e || typeof e != "string") {
		let t = await J("iss");
		if (!t?.value || typeof t.value != "string") throw Error("generatePortalUrl: Unable to determine domain from access token");
		e = t.value;
	}
	if (!Qe(t, ["ftp:", "ws:"])) throw Error("generatePortalUrl: returnUrl must be an absolute URL");
	let o = new URLSearchParams({
		subnav: r || n.profile,
		return_url: t
	}), s = await fetch(`${f(e)}/account_api/v1/portal_link?${o.toString()}`, { headers: { Authorization: `Bearer ${a}` } });
	if (!s.ok) throw Error(`Failed to fetch profile URL: ${s.status} ${s.statusText}`);
	let c = await s.json();
	if (!c.url || typeof c.url != "string") throw Error("Invalid URL received from API");
	try {
		return { url: new URL(c.url) };
	} catch (e) {
		throw console.error(e), Error(`Invalid URL format received from API: ${c.url}`, { cause: e });
	}
}, et = () => window.self !== window.top, tt = async ({ url: e, popupOptions: t = {}, handleResult: n, forcePopup: r = false }) => {
	et() || r ? await nt({
		url: e,
		popupOptions: t,
		handleResult: n
	}) : document.location = e;
}, nt = async ({ url: e, popupOptions: t = {}, handleResult: n }) => {
	let { width: r = 500, height: i = 600, left: a = (window.screen.width - r) / 2, top: o = (window.screen.height - i) / 2 } = t, s = window.open(e, "kinde_auth_popup", `width=${r},height=${i},left=${a},top=${o},scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no`);
	if (!s) throw Error("Popup was blocked by the browser");
	let c = () => new Promise((e) => {
		let t = (r) => {
			if (r.origin === window.location.origin && r.data && r.data.type === "KINDE_AUTH_RESULT") {
				window.removeEventListener("message", t);
				let i = new URLSearchParams();
				Object.entries(r.data.result).forEach(([e, t]) => {
					i.append(e, t);
				}), n?.(i).then(() => e());
			}
		};
		window.addEventListener("message", t);
	});
	try {
		await c();
	} catch (e) {
		throw Error("Popup authentication failed", { cause: e });
	}
	return s;
}, rt = () => !_(), it = ({ domain: e, clientId: n, orgCode: r, redirectURL: a }) => {
	if (!e) throw Error("domain is required for switchOrg");
	if (!n) throw Error("clientId is required for switchOrg");
	if (!r) throw Error("orgCode is required for switchOrg");
	if (!a) throw Error("redirectURL is required for switchOrg");
	let o = {
		clientId: n,
		prompt: t.none,
		orgCode: r,
		redirectURL: a
	};
	return h(e, i.login, o);
};

k.keyPrefix = 'kinde_';
const memoryStorage = new oe();
const createStore = () => {
    const listeners = [];
    let notificationScheduled = false;
    const notifyListeners = () => {
        if (notificationScheduled)
            return;
        notificationScheduled = true;
        queueMicrotask(() => {
            notificationScheduled = false;
            listeners.forEach(async (listener) => {
                try {
                    await listener();
                }
                catch (e) {
                    console.error('Store listener error:', e);
                }
            });
        });
    };
    const subscribe = (listener) => {
        listeners.push(listener);
        return () => {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    };
    // Wrapper functions to handle JSON serialization/deserialization
    // MemoryStorage stores values as strings, so we need to serialize objects
    const serializeValue = (value) => {
        if (value === null || value === undefined) {
            return null;
        }
        // For primitive types, just convert to string
        if (typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean') {
            return JSON.stringify(value);
        }
        // For objects and arrays, use JSON
        return JSON.stringify(value);
    };
    const deserializeValue = (value) => {
        if (value === null || value === undefined) {
            return null;
        }
        // If it's already a string from MemoryStorage, parse it
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            }
            catch {
                // If parsing fails, return the string as-is
                return value;
            }
        }
        return value;
    };
    // SessionManager interface methods
    const getSessionItem = (itemKey) => {
        const value = memoryStorage.getSessionItem(itemKey);
        return deserializeValue(value);
    };
    const setSessionItem = (itemKey, itemValue) => {
        const serialized = serializeValue(itemValue);
        if (serialized === null || serialized === undefined) {
            return;
        }
        memoryStorage.setSessionItem(itemKey, serialized);
        notifyListeners();
    };
    const removeSessionItem = (itemKey) => {
        memoryStorage.removeSessionItem(itemKey);
        notifyListeners();
    };
    const destroySession = () => {
        memoryStorage.destroySession();
        notifyListeners();
    };
    const setItems = async (itemsToSet) => {
        const serializedItems = {};
        Object.entries(itemsToSet).forEach(([key, value]) => {
            serializedItems[key] = serializeValue(value);
        });
        await memoryStorage.setItems(serializedItems);
        notifyListeners();
    };
    const getItems = (...itemKeys) => {
        const result = {};
        itemKeys.forEach((key) => {
            const value = getSessionItem(key);
            if (value !== null) {
                result[key] = value;
            }
        });
        return Promise.resolve(result);
    };
    const removeItems = (...itemKeys) => {
        // Intentionally removes literal keys only (no storageMap -> StorageKeys translation).
        itemKeys.forEach((key) => {
            removeSessionItem(key);
        });
        notifyListeners();
        return Promise.resolve();
    };
    const convertStorageMapToSessionKeys = (key) => {
        switch (key) {
            case storageMap.access_token:
                return T.accessToken;
            case storageMap.id_token:
                return T.idToken;
            case storageMap.refresh_token:
                return T.refreshToken;
            default:
                return key;
        }
    };
    // Legacy methods for backward compatibility - these delegate to SessionManager methods
    const getItem = (key) => {
        const sessionKey = convertStorageMapToSessionKeys(key);
        const isOldKey = key !== sessionKey;
        let value = getSessionItem(key);
        if (value !== null && isOldKey) {
            // Data stored under old (storageMap) key → migrate to StorageKeys key and remove old key
            setSessionItem(sessionKey, value);
            removeSessionItem(key);
            return value;
        }
        if (value === null) {
            value = getSessionItem(sessionKey);
        }
        return value;
    };
    const setItem = (key, value) => {
        const newKey = convertStorageMapToSessionKeys(key);
        setSessionItem(newKey, value);
    };
    const removeItem = (key) => {
        const sessionKey = convertStorageMapToSessionKeys(key);
        removeSessionItem(sessionKey);
        removeSessionItem(key);
    };
    const reset = () => {
        destroySession();
    };
    const storeInstance = {
        asyncStore: false,
        reset,
        getItem,
        removeItem,
        setItem,
        // SessionManager interface methods
        getSessionItem,
        setSessionItem,
        removeSessionItem,
        destroySession,
        setItems,
        getItems,
        removeItems,
        subscribe,
        notifyListeners
    };
    return storeInstance;
};
const store = createStore();

/**
 * Storage adapter that bridges between legacy kinde_* key format and @kinde/js-utils StorageKeys format
 * This allows us to use js-utils functions while maintaining backward compatibility
 */
const KEY_MAP = {
    accessToken: 'accessToken',
    idToken: 'idToken',
    refreshToken: 'kinde_refresh_token',
    state: 'kinde_state',
    nonce: 'kinde_nonce',
    codeVerifier: 'kinde_code_verifier'
};
class KindeStorageAdapter extends D {
    asyncStore = false;
    // Map between js-utils StorageKeys and our storage
    // For accessToken and idToken, we store them directly with those keys (raw JWT strings)
    // For other keys, we map to our kinde_* format
    mapKey(itemKey) {
        return KEY_MAP[itemKey] || itemKey;
    }
    getSessionItem(itemKey) {
        const mappedKey = this.mapKey(itemKey);
        const value = store.getItem(mappedKey);
        return value;
    }
    setSessionItem(itemKey, itemValue) {
        const mappedKey = this.mapKey(itemKey);
        store.setItem(mappedKey, itemValue);
        // Notify listeners from parent class
        super.notifyListeners();
    }
    removeSessionItem(itemKey) {
        const mappedKey = this.mapKey(itemKey);
        store.removeItem(mappedKey);
        // Notify listeners from parent class
        super.notifyListeners();
    }
    destroySession() {
        store.reset();
        // Notify listeners from parent class
        super.notifyListeners();
    }
}

/**
 * Initialize the storage adapter for @kinde/js-utils
 * This must be called before using any js-utils functions
 */
// Create and set the storage adapter only if not already set
let adapter = null;
const initializeStorageAdapter = () => {
    if (!adapter) {
        adapter = new KindeStorageAdapter();
        Ge(adapter);
    }
    return adapter;
};
// Initialize on module load
initializeStorageAdapter();

const getClaim = (claim, tokenKey = 'access_token') => {
    try {
        // Map our token key format to js-utils format
        const tokenType = tokenKey === 'access_token' ? 'accessToken' : 'idToken';
        // Use the sync version from js-utils
        const result = Te(claim, tokenType);
        return result ? { name: result.name, value: result.value } : null;
    }
    catch (error) {
        console.error('Error getting claim:', error);
        return null;
    }
};

const getClaimValue = (claim, tokenKey = 'access_token') => {
    try {
        // Map our token key format to js-utils format
        const tokenType = tokenKey === 'access_token' ? 'accessToken' : 'idToken';
        // Use the sync version from js-utils
        const result = Te(claim, tokenType);
        return result?.value ?? null;
    }
    catch (error) {
        console.error('Error getting claim value:', error);
        return null;
    }
};

const getFlag = (code, defaultValue, flagType) => {
    const flags = getClaimValue('feature_flags');
    const flag = (flags && flags[code] ? flags[code] : {});
    if (flag.v == null && defaultValue == null) {
        throw Error(`Flag ${code} was not found, and no default value has been provided`);
    }
    if (flagType && flag.t && flagType !== flag.t) {
        throw Error(`Flag ${code} is of type ${flagDataTypeMap[flag.t]} - requested type ${flagDataTypeMap[flagType]}`);
    }
    return {
        code,
        type: flagDataTypeMap[flag.t || flagType],
        value: (flag.v == null ? defaultValue : flag.v),
        is_default: flag.v == null
    };
};

const getBooleanFlag = (code, defaultValue) => {
    try {
        const flag = getFlag(code, defaultValue, 'b');
        return flag.value;
    }
    catch (err) {
        console.error(err);
        return err;
    }
};

const getIntegerFlag = (code, defaultValue) => {
    try {
        const flag = getFlag(code, defaultValue, 'i');
        return flag.value;
    }
    catch (err) {
        console.error(err);
        return err;
    }
};

const getStringFlag = (code, defaultValue) => {
    try {
        const flag = getFlag(code, defaultValue, 's');
        return flag.value;
    }
    catch (err) {
        console.error(err);
        return err;
    }
};

const getUserOrganizations = () => {
    try {
        const orgCodes = Ve() ?? [];
        return {
            orgCodes
        };
    }
    catch (error) {
        console.error('Error getting user organizations:', error);
        return { orgCodes: [] };
    }
};

const PAYLOAD_CLAIMS = ['iss', 'azp'];
const isTokenValid = (token, config) => {
    if (!token) {
        throw new Error('ID token is required');
    }
    PAYLOAD_CLAIMS.forEach((claim) => {
        if (!token.payload[claim]) {
            throw new Error(`(${claim}) claim is required.`);
        }
        if (token.payload[claim] !== config[claim]) {
            throw new Error(`${claim} claim mismatch. Expected: "${config[claim]}", Received: "${token.payload[claim]}"`);
        }
    });
    if (token.header.alg !== 'RS256') {
        throw new Error(`Unsupported signature alg. Expected: "RS256", Received: "${token.header.alg}"`);
    }
    if (config.aud) {
        const audienceClaim = token.payload.aud;
        const audience = Array.isArray(audienceClaim)
            ? audienceClaim
            : typeof audienceClaim === 'string'
                ? [audienceClaim]
                : [];
        const configAud = config.aud.split(' ');
        const allConfigAudExistInPayload = configAud.every((element) => audience.includes(element));
        if (!allConfigAudExistInPayload) {
            throw new Error(`(aud) claim mismatch. Expected: "${config.aud}", Received: "${audience.join(', ')}"`);
        }
    }
    const isJWTExpired = !isJWTActive(token.payload);
    if (isJWTExpired) {
        throw new Error(`Token expired`);
    }
    return true;
};

const CHANNEL_NAME = 'kinde-auth-pkce';
const LOCK_NAME = 'kinde-token-refresh';
const LS_LOCK_KEY = 'kinde_refresh_lock';
const LS_SYNC_KEY = 'kinde_token_sync';
const LOCK_TTL_MS = 30_000;
const BROADCAST_WAIT_MS = 10_000;
const isBrowser = () => typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof window.addEventListener === 'function';
const getTabId = () => {
    if (!isBrowser())
        return 'server';
    const key = 'kinde_tab_id';
    let id = null;
    try {
        id = sessionStorage.getItem(key);
    }
    catch {
        // sessionStorage may be unavailable (e.g. private mode)
    }
    if (!id) {
        id =
            typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : `tab_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        try {
            sessionStorage.setItem(key, id);
        }
        catch {
            // ignore persistence failures
        }
    }
    return id;
};
const isSuccessResult = (result) => result.success === true &&
    typeof result[T.accessToken] === 'string';
const createTabSync = (options) => {
    const { store, insecureStorage, useInsecureForRefreshToken = false } = options;
    const tabId = getTabId();
    let channel = null;
    let lsListener = null;
    let unsubscribeListeners = null;
    let unsubscribeVisibility = null;
    let isDisposed = false;
    const pendingBroadcastWaits = new Set();
    const getChannel = () => {
        if (!isBrowser() || typeof BroadcastChannel === 'undefined') {
            return null;
        }
        if (!channel) {
            channel = new BroadcastChannel(CHANNEL_NAME);
        }
        return channel;
    };
    const notifyBroadcastWaiters = (tokens) => {
        pendingBroadcastWaits.forEach(({ resolve, clearTimer }) => {
            clearTimer();
            resolve(tokens);
        });
        pendingBroadcastWaits.clear();
    };
    const postMessage = (message) => {
        const ch = getChannel();
        if (ch) {
            ch.postMessage(message);
            return;
        }
        if (!isBrowser())
            return;
        try {
            localStorage.setItem(LS_SYNC_KEY, JSON.stringify({ ...message, at: Date.now() }));
            localStorage.removeItem(LS_SYNC_KEY);
        }
        catch {
            // localStorage may be unavailable
        }
    };
    const clearMirroredRefreshToken = () => {
        if (useInsecureForRefreshToken && insecureStorage?.removeSessionItem) {
            insecureStorage.removeSessionItem(T.refreshToken);
        }
    };
    const applyTokens = async (tokens) => {
        const items = {
            [T.accessToken]: tokens.accessToken
        };
        if (tokens.idToken) {
            items[T.idToken] = tokens.idToken;
        }
        if (tokens.refreshToken) {
            items[T.refreshToken] = tokens.refreshToken;
        }
        await store.setItems(items);
        if (useInsecureForRefreshToken && insecureStorage && tokens.refreshToken) {
            insecureStorage.setSessionItem(T.refreshToken, tokens.refreshToken);
        }
    };
    const applyTokensFromResult = async (result) => {
        if (!isSuccessResult(result))
            return;
        const accessToken = result[T.accessToken];
        const idToken = result[T.idToken] ??
            (await store.getSessionItem(T.idToken));
        const refreshToken = result[T.refreshToken];
        await applyTokens({
            accessToken,
            ...(typeof idToken === 'string' ? { idToken } : {}),
            ...(refreshToken ? { refreshToken } : {})
        });
    };
    const broadcastTokens = (tokens) => {
        postMessage({ type: 'tokens_updated', tokens, tabId });
    };
    const broadcastSessionCleared = () => {
        postMessage({ type: 'session_cleared', tabId });
    };
    const readLsLock = () => {
        if (!isBrowser())
            return null;
        try {
            const raw = localStorage.getItem(LS_LOCK_KEY);
            if (!raw)
                return null;
            return JSON.parse(raw);
        }
        catch {
            return null;
        }
    };
    const writeLsLock = () => {
        if (!isBrowser())
            return;
        localStorage.setItem(LS_LOCK_KEY, JSON.stringify({ tabId, until: Date.now() + LOCK_TTL_MS }));
    };
    const clearLsLockIfOwner = () => {
        if (!isBrowser())
            return;
        const lock = readLsLock();
        if (lock?.tabId === tabId) {
            localStorage.removeItem(LS_LOCK_KEY);
        }
    };
    let sameTabLockAttempt = null;
    const runCrossTabRefreshLock = async (fn) => {
        if (!isBrowser()) {
            return { ran: true, value: await fn(), usedAmbiguousFallback: false };
        }
        if (typeof navigator !== 'undefined' && navigator.locks?.request) {
            let acquired = false;
            let result;
            await navigator.locks.request(LOCK_NAME, { ifAvailable: true }, async (lock) => {
                if (!lock)
                    return;
                acquired = true;
                result = await fn();
            });
            if (acquired) {
                return { ran: true, value: result, usedAmbiguousFallback: false };
            }
            return { ran: false };
        }
        const existing = readLsLock();
        if (existing && existing.until > Date.now() && existing.tabId !== tabId) {
            return { ran: false };
        }
        writeLsLock();
        const acquired = readLsLock();
        if (!acquired || acquired.tabId !== tabId || acquired.until <= Date.now()) {
            return { ran: false };
        }
        try {
            return {
                ran: true,
                value: await fn(),
                usedAmbiguousFallback: true
            };
        }
        finally {
            clearLsLockIfOwner();
        }
    };
    const tryWithRefreshLock = (fn) => {
        if (sameTabLockAttempt) {
            return sameTabLockAttempt;
        }
        const attempt = runCrossTabRefreshLock(fn).finally(() => {
            if (sameTabLockAttempt === attempt) {
                sameTabLockAttempt = null;
            }
        });
        sameTabLockAttempt = attempt;
        return attempt;
    };
    const waitForTokenBroadcast = (timeoutMs = BROADCAST_WAIT_MS) => new Promise((resolve, reject) => {
        let timer;
        const clearTimer = () => {
            if (timer !== undefined) {
                clearTimeout(timer);
                timer = undefined;
            }
        };
        const entry = {
            resolve,
            reject,
            clearTimer
        };
        pendingBroadcastWaits.add(entry);
        timer = setTimeout(() => {
            pendingBroadcastWaits.delete(entry);
            clearTimer();
            resolve(null);
        }, timeoutMs);
        entry.resolve = (tokens) => {
            clearTimer();
            pendingBroadcastWaits.delete(entry);
            resolve(tokens);
        };
    });
    const dispatchMessage = (message, handlers) => {
        if (isDisposed || message.tabId === tabId)
            return;
        if (message.type === 'tokens_updated') {
            void applyTokens(message.tokens)
                .then(() => {
                handlers.onTokensUpdated?.(message.tokens);
            })
                .catch((error) => {
                console.error('Failed to apply synced tokens:', error);
            })
                .finally(() => {
                notifyBroadcastWaiters(message.tokens);
            });
        }
        else if (message.type === 'session_cleared') {
            store.reset();
            clearMirroredRefreshToken();
            handlers.onSessionCleared?.();
            notifyBroadcastWaiters(null);
        }
    };
    const setupListeners = (handlers) => {
        unsubscribeListeners?.();
        const ch = getChannel();
        const onChannelMessage = (event) => {
            dispatchMessage(event.data, handlers);
        };
        if (ch) {
            ch.addEventListener('message', onChannelMessage);
        }
        lsListener = (event) => {
            if (event.key !== LS_SYNC_KEY || !event.newValue)
                return;
            try {
                const message = JSON.parse(event.newValue);
                dispatchMessage(message, handlers);
            }
            catch {
                // ignore malformed payloads
            }
        };
        if (isBrowser()) {
            window.addEventListener('storage', lsListener);
        }
        const unsubscribe = () => {
            if (unsubscribeListeners !== unsubscribe)
                return;
            ch?.removeEventListener('message', onChannelMessage);
            if (lsListener &&
                typeof window !== 'undefined' &&
                typeof window.removeEventListener === 'function') {
                window.removeEventListener('storage', lsListener);
            }
            lsListener = null;
            unsubscribeListeners = null;
        };
        unsubscribeListeners = unsubscribe;
        return unsubscribe;
    };
    const setupVisibilitySync = (onVisible) => {
        unsubscribeVisibility?.();
        if (!isBrowser()) {
            unsubscribeVisibility = () => undefined;
            return unsubscribeVisibility;
        }
        let pendingCheck;
        const scheduleCheck = () => {
            if (isDisposed || pendingCheck !== undefined)
                return;
            pendingCheck = setTimeout(() => {
                pendingCheck = undefined;
                void onVisible();
            }, 0);
        };
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible')
                scheduleCheck();
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('focus', scheduleCheck);
        const unsubscribe = () => {
            if (unsubscribeVisibility !== unsubscribe)
                return;
            if (pendingCheck !== undefined) {
                clearTimeout(pendingCheck);
                pendingCheck = undefined;
            }
            if (typeof document.removeEventListener === 'function') {
                document.removeEventListener('visibilitychange', onVisibilityChange);
            }
            if (typeof window.removeEventListener === 'function') {
                window.removeEventListener('focus', scheduleCheck);
            }
            unsubscribeVisibility = null;
        };
        unsubscribeVisibility = unsubscribe;
        return unsubscribe;
    };
    const dispose = () => {
        if (isDisposed)
            return;
        isDisposed = true;
        unsubscribeListeners?.();
        unsubscribeVisibility?.();
        channel?.close();
        channel = null;
        pendingBroadcastWaits.forEach(({ reject, clearTimer }) => {
            clearTimer();
            reject(new Error('Tab sync disposed'));
        });
        pendingBroadcastWaits.clear();
    };
    return {
        tabId,
        applyTokens,
        applyTokensFromResult,
        broadcastTokens,
        broadcastSessionCleared,
        tryWithRefreshLock,
        waitForTokenBroadcast,
        setupListeners,
        setupVisibilitySync,
        dispose
    };
};
const tokensFromRefreshResult = (result) => {
    if (!isSuccessResult(result))
        return null;
    const accessToken = result[T.accessToken];
    const idToken = result[T.idToken];
    return {
        accessToken,
        ...(idToken ? { idToken } : {}),
        ...(result[T.refreshToken]
            ? { refreshToken: result[T.refreshToken] }
            : {})
    };
};

const getRedirectUrl = (suppliedUrl) => {
    return suppliedUrl || window.location.origin;
};

const hasCookie = (name) => document.cookie
    .split('; ')
    .find((row) => row.split('=')[0] === name)
    ?.split('=')[1];

// Generated by genversion.
const version = '4.5.2';

class InvalidTokenError extends Error {
}
InvalidTokenError.prototype.name = "InvalidTokenError";
function b64DecodeUnicode(str) {
    return decodeURIComponent(atob(str).replace(/(.)/g, (m, p) => {
        let code = p.charCodeAt(0).toString(16).toUpperCase();
        if (code.length < 2) {
            code = "0" + code;
        }
        return "%" + code;
    }));
}
function base64UrlDecode(str) {
    let output = str.replace(/-/g, "+").replace(/_/g, "/");
    switch (output.length % 4) {
        case 0:
            break;
        case 2:
            output += "==";
            break;
        case 3:
            output += "=";
            break;
        default:
            throw new Error("base64 string is not of the correct length");
    }
    try {
        return b64DecodeUnicode(output);
    }
    catch (err) {
        return atob(output);
    }
}
function jwtDecode(token, options) {
    if (typeof token !== "string") {
        throw new InvalidTokenError("Invalid token specified: must be a string");
    }
    options || (options = {});
    const pos = options.header === true ? 0 : 1;
    const part = token.split(".")[pos];
    if (typeof part !== "string") {
        throw new InvalidTokenError(`Invalid token specified: missing part #${pos + 1}`);
    }
    let decoded;
    try {
        decoded = base64UrlDecode(part);
    }
    catch (e) {
        throw new InvalidTokenError(`Invalid token specified: invalid base64 for part #${pos + 1} (${e.message})`);
    }
    try {
        return JSON.parse(decoded);
    }
    catch (e) {
        throw new InvalidTokenError(`Invalid token specified: invalid json for part #${pos + 1} (${e.message})`);
    }
}

var AuthEvent;
(function (AuthEvent) {
    AuthEvent["login"] = "login";
    AuthEvent["logout"] = "logout";
    AuthEvent["register"] = "register";
    AuthEvent["tokenRefreshed"] = "tokenRefreshed";
})(AuthEvent || (AuthEvent = {}));
const isSameOriginOpener = () => {
    try {
        const opener = window.opener;
        if (!opener || opener.closed)
            return false;
        return opener.location.origin === window.location.origin;
    }
    catch {
        return false;
    }
};
let activeClientTeardown = null;
const createKindeClient = async (options) => {
    if (!options) {
        throw Error('Please provide your Kinde credentials');
    }
    if (options !== Object(options)) {
        throw Error('The Kinde SDK must be initiated with an object');
    }
    const params = new URLSearchParams(window.location.search);
    const hasInvitationCode = params.has('invitation_code');
    const invitationCode = hasInvitationCode
        ? params.get('invitation_code')
        : null;
    const { audience, client_id: clientId, domain, is_dangerously_use_local_storage = false, redirect_uri, logout_uri = redirect_uri, on_redirect_callback, on_session_restore_callback, on_error_callback, scope = 'openid profile email offline', proxy_redirect_uri, _framework, _frameworkVersion } = options;
    if (audience && typeof audience !== 'string') {
        throw Error('Please supply a valid audience for your api');
    }
    if (scope && typeof scope !== 'string') {
        throw Error('Please supply a valid scope');
    }
    if (!redirect_uri || typeof options.redirect_uri !== 'string') {
        throw Error('Please supply a valid redirect_uri for your users to be redirected after successful authentication');
    }
    if (!domain || typeof domain !== 'string') {
        throw Error('Please supply a valid Kinde domain so we can connect to your account');
    }
    if (typeof is_dangerously_use_local_storage !== 'boolean') {
        throw TypeError('Please supply a boolean value for is_dangerously_use_local_storage');
    }
    const client_id = clientId || 'spa@live';
    activeClientTeardown?.();
    activeClientTeardown = null;
    Ge(store);
    // If code is running on localhost, it's a development environment
    const isDevelopment = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    // // Indicates using a custom domain on a production environment
    const isUseCookie = !isDevelopment &&
        !is_dangerously_use_local_storage &&
        C(domain);
    const isUseLocalStorage = isDevelopment || is_dangerously_use_local_storage;
    // Use LocalStorage from @kinde/js-utils for persistent storage
    const localStorageAdapter = new ce();
    Je(localStorageAdapter);
    // Without this, checkAuth falls back to the _kbrte cookie path for custom domains,
    // which is inaccessible from localhost, causing a forced re-login on every page load.
    k.useInsecureForRefreshToken = isUseLocalStorage;
    const tabSync = createTabSync({
        store,
        insecureStorage: localStorageAdapter,
        useInsecureForRefreshToken: isUseLocalStorage
    });
    let inFlightTabCoordination = null;
    // Blocks new refresh/checkAuth work once logout starts. In-flight work is
    // awaited in logout() so any cookie Set-Cookie lands before /logout clears it.
    let logoutInProgress = false;
    let destroyed = false;
    let sessionEpoch = 0;
    const runJsUtilsRefresh = async (refreshType = a.refreshToken) => {
        const savedHandler = k.onRefreshHandler;
        k.onRefreshHandler = undefined;
        try {
            return await X({
                domain,
                clientId: client_id,
                refreshType
            });
        }
        finally {
            if (!destroyed && k.onRefreshHandler === undefined) {
                k.onRefreshHandler = savedHandler;
            }
        }
    };
    const isSessionCurrent = (epochAtStart) => !destroyed && !logoutInProgress && epochAtStart === sessionEpoch;
    const runTabSyncCoordination = async (operation, inProgressErrorMessage, epochAtStart) => {
        if (!isSessionCurrent(epochAtStart)) {
            return {
                success: false,
                error: 'Logout in progress'
            };
        }
        const lock = await tabSync.tryWithRefreshLock(operation);
        // Logout may have started while the refresh/checkAuth fetch was in flight.
        // Do not re-apply tokens into memory; logout awaits this promise then clears
        // storage and navigates to /logout (which clears _kbrte after any Set-Cookie).
        if (!isSessionCurrent(epochAtStart)) {
            return {
                success: false,
                error: 'Logout in progress'
            };
        }
        if (lock.ran && isSuccessResult(lock.value)) {
            await tabSync.applyTokensFromResult(lock.value);
            await hydrateUserFromIdToken();
            const tokens = tokensFromRefreshResult(lock.value);
            if (tokens) {
                tabSync.broadcastTokens(tokens);
            }
            return lock.value;
        }
        const waitForPeerTokens = !lock.ran || (lock.ran && lock.usedAmbiguousFallback);
        if (waitForPeerTokens) {
            // Another tab holds the lock, or LS lock outcome was ambiguous and refresh failed
            const tokens = await tabSync.waitForTokenBroadcast();
            if (!isSessionCurrent(epochAtStart)) {
                return {
                    success: false,
                    error: 'Logout in progress'
                };
            }
            if (tokens) {
                await tabSync.applyTokens(tokens);
                return {
                    success: true,
                    [T.accessToken]: tokens.accessToken,
                    [T.idToken]: tokens.idToken,
                    ...(tokens.refreshToken
                        ? { [T.refreshToken]: tokens.refreshToken }
                        : {})
                };
            }
        }
        if (lock.ran) {
            return lock.value;
        }
        return {
            success: false,
            error: inProgressErrorMessage
        };
    };
    const withTabSyncCoordination = (operation, inProgressErrorMessage) => {
        if (destroyed || logoutInProgress) {
            return Promise.resolve({
                success: false,
                error: 'Logout in progress'
            });
        }
        if (inFlightTabCoordination) {
            return inFlightTabCoordination;
        }
        const epochAtStart = sessionEpoch;
        const coordination = runTabSyncCoordination(operation, inProgressErrorMessage, epochAtStart).finally(() => {
            if (inFlightTabCoordination === coordination) {
                inFlightTabCoordination = null;
            }
        });
        inFlightTabCoordination = coordination;
        return coordination;
    };
    const runRefreshWithTabSync = (refreshType = a.refreshToken) => withTabSyncCoordination(() => runJsUtilsRefresh(refreshType), 'Token refresh in progress in another tab');
    const refreshHandler = (refreshType) => runRefreshWithTabSync(refreshType);
    k.onRefreshHandler = refreshHandler;
    const runCheckAuthWithTabSync = () => withTabSyncCoordination(async () => {
        const savedHandler = k.onRefreshHandler;
        k.onRefreshHandler = undefined;
        try {
            return await ae({ domain, clientId: client_id });
        }
        finally {
            if (!destroyed && k.onRefreshHandler === undefined) {
                k.onRefreshHandler = savedHandler;
            }
        }
    }, 'Authentication check in progress in another tab');
    const config = {
        audience,
        client_id,
        redirect_uri,
        authorization_endpoint: `${domain}/oauth2/auth`,
        token_endpoint: `${domain}/oauth2/token`,
        requested_scopes: scope,
        domain,
        _framework,
        _frameworkVersion
    };
    /** @deprecated use `getAccessToken` instead */
    const getToken = async (options = {}) => {
        console.warn('[Kinde] `getToken()` is deprecated and will be removed in a future release. ' +
            'It may return undefined with the new auth flow. Please use `getAccessToken()` instead.');
        return await getTokenType(storageMap.access_token, options);
    };
    /** @deprecated only used for old getToken method which is now deprecated */
    const getTokenType = async (tokenType, options) => {
        const token = store.getItem(storageMap.token_bundle);
        if (!token || options.isForceRefresh) {
            return await useRefreshToken({ tokenType });
        }
        const tokenToReturn = store.getItem(tokenType);
        const isTokenActive = isJWTActive(tokenToReturn);
        if (isTokenActive) {
            return tokenType === storageMap.access_token
                ? token.access_token
                : token.id_token;
        }
        else {
            return await useRefreshToken({ tokenType });
        }
    };
    /* @deprecated only used for old getToken method which is now deprecated */
    const useRefreshToken = async ({ tokenType } = { tokenType: storageMap.access_token }) => {
        const localStorageRefreshToken = isUseLocalStorage
            ? localStorageAdapter.getSessionItem(T.refreshToken) ||
                localStorage.getItem(storageMap.refresh_token)
            : store.getItem(storageMap.refresh_token);
        const isCallTokenEndpoint = localStorageRefreshToken || (isUseCookie && hasCookie('_kbrte'));
        if (isCallTokenEndpoint) {
            try {
                const response = await fetch(config.token_endpoint, {
                    method: 'POST',
                    ...(isUseCookie && { credentials: 'include' }),
                    headers: new Headers({
                        'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'Kinde-SDK': `
            ${config._framework || 'JavaScript'}/${config._frameworkVersion || version}`
                    }),
                    body: new URLSearchParams({
                        client_id: config.client_id,
                        grant_type: 'refresh_token',
                        ...(!isUseCookie &&
                            localStorageRefreshToken && {
                            refresh_token: localStorageRefreshToken
                        })
                    })
                });
                const data = await response.json();
                const stored = setStore(data);
                const tokens = tokensFromRefreshResult({
                    success: true,
                    [T.accessToken]: data.access_token,
                    [T.idToken]: data.id_token,
                    [T.refreshToken]: data.refresh_token
                });
                if (stored && tokens) {
                    void tabSync.applyTokens(tokens);
                    tabSync.broadcastTokens(tokens);
                }
                if (tokenType === storageMap.id_token) {
                    return data.id_token;
                }
                return data.access_token;
            }
            catch (err) {
                console.error(err);
            }
        }
    };
    /* @deprecated only used for old getToken method which is now deprecated */
    const setStore = (data) => {
        if (!data || data.error)
            return false;
        const idToken = jwtDecode(data.id_token);
        const idTokenHeader = jwtDecode(data.id_token, { header: true });
        const accessToken = jwtDecode(data.access_token);
        const accessTokenHeader = jwtDecode(data.access_token, { header: true });
        const validatorOptions = {
            iss: domain,
            azp: clientId,
            aud: audience
        };
        isTokenValid({
            payload: idToken,
            header: idTokenHeader
        }, { ...validatorOptions, aud: clientId });
        isTokenValid({
            payload: accessToken,
            header: accessTokenHeader
        }, validatorOptions);
        {
            store.setItem(storageMap.token_bundle, data);
            store.setItem(storageMap.access_token, accessToken);
            store.setItem(storageMap.id_token, idToken);
            if (idToken.sub) {
                store.setItem(storageMap.user, {
                    id: idToken.sub,
                    given_name: idToken.given_name,
                    family_name: idToken.family_name,
                    email: idToken.email,
                    picture: idToken.picture
                });
            }
            if (isUseLocalStorage) {
                localStorage.setItem(storageMap.refresh_token, data.refresh_token);
            }
            else {
                store.setItem(storageMap.refresh_token, data.refresh_token);
            }
            return true;
        }
    };
    const isAuthLockContention = (error) => error === 'Authentication check in progress in another tab' ||
        error === 'Token refresh in progress in another tab';
    const getStoredAccessToken = async () => {
        const sessionToken = (await store.getSessionItem(T.accessToken));
        const legacyToken = readLegacyRawToken(storageMap.access_token);
        return sessionToken || legacyToken;
    };
    const isStoredAccessTokenActive = (token) => {
        if (!token)
            return false;
        if (typeof token === 'string') {
            try {
                return isJWTActive(jwtDecode(token));
            }
            catch {
                return false;
            }
        }
        return isJWTActive(token);
    };
    const readLegacyRawToken = (key) => {
        const value = store.getItem(key);
        if (typeof value === 'string')
            return value;
        const bundle = store.getItem(storageMap.token_bundle);
        return key === storageMap.access_token
            ? bundle?.access_token
            : bundle?.id_token;
    };
    const hydrateUserFromIdToken = async () => {
        const idTokenRaw = await getIdToken();
        if (!idTokenRaw)
            return;
        try {
            const claims = jwtDecode(idTokenRaw);
            if (!claims.sub)
                return;
            const mappedUser = {
                id: claims.sub,
                given_name: claims.given_name,
                family_name: claims.family_name,
                email: claims.email,
                picture: claims.picture
            };
            store.setItem(storageMap.user, mappedUser);
            return mappedUser;
        }
        catch {
            return;
        }
    };
    const getAccessToken = async () => {
        const tokenToReturn = await getStoredAccessToken();
        if (isStoredAccessTokenActive(tokenToReturn)) {
            return typeof tokenToReturn === 'string' ? tokenToReturn : undefined;
        }
        // Cookie refresh uses HttpOnly `_kbrte`, which JavaScript cannot inspect,
        // so cookie mode must attempt refresh and let the server validate it.
        // Other modes can skip refresh when no readable credential exists.
        const localStorageRefreshToken = isUseLocalStorage
            ? localStorageAdapter.getSessionItem(T.refreshToken) ||
                localStorage.getItem(storageMap.refresh_token)
            : store.getItem(storageMap.refresh_token);
        const hasRefreshCredential = isUseCookie || Boolean(localStorageRefreshToken);
        if (!hasRefreshCredential) {
            return undefined;
        }
        let result;
        try {
            result = await runRefreshWithTabSync(isUseCookie ? a.cookie : a.refreshToken);
        }
        catch {
            // Refresh failed — return undefined without clearing session storage.
            return undefined;
        }
        if (isSuccessResult(result)) {
            return result[T.accessToken];
        }
        if (isAuthLockContention(result.error)) {
            const token = await getStoredAccessToken();
            if (isStoredAccessTokenActive(token) && typeof token === 'string') {
                return token;
            }
            return undefined;
        }
        // Refresh failed — return undefined without clearing session storage.
        return undefined;
    };
    const getIdToken = async () => {
        // js-utils stores under StorageKeys.idToken
        const sessionToken = await store.getSessionItem(T.idToken);
        const legacyToken = readLegacyRawToken(storageMap.id_token);
        return (sessionToken || legacyToken);
    };
    const isAuthenticated = async () => {
        // Use the same cookie-vs-storage refresh path as getAccessToken.
        // js-utils isAuthenticated always defaults refreshType to refreshToken,
        // which fails on custom domains where the refresh token lives in _kbrte.
        return Boolean(await getAccessToken());
    };
    const getPermissions = () => {
        const orgCode = getClaimValue('org_code');
        const permissions = (getClaimValue('permissions') ?? []);
        return {
            permissions,
            orgCode
        };
    };
    const getPermission = (key) => {
        const orgCode = getClaimValue('org_code');
        const permissions = (getClaimValue('permissions') ?? []);
        return {
            isGranted: permissions.some((p) => p === key),
            orgCode
        };
    };
    const getOrganization = () => {
        const orgCode = getClaimValue('org_code');
        return {
            orgCode
        };
    };
    const getKindeOriginUrl = () => {
        const url = new URL(window.location.toString());
        url.searchParams.delete('invitation_code');
        url.searchParams.delete('is_invitation');
        return url.toString();
    };
    const normalizeAuthUrlParams = (authUrlParams) => {
        return Object.fromEntries(Object.entries(authUrlParams).map(([key, value]) => [key, String(value)]));
    };
    const appStateSessionKey = (oauthState) => `${SESSION_PREFIX}-app-state-${oauthState}`;
    const redirectToKinde = async (options) => {
        const { app_state = {}, prompt, is_create_org, org_name = '', org_code, invitation_code, authUrlParams = {}, ...restRedirectOptions } = options;
        const params = new URLSearchParams(window.location.search);
        if (!app_state.kindeOriginUrl) {
            app_state.kindeOriginUrl = getKindeOriginUrl();
        }
        const routeType = is_create_org || prompt === 'create'
            ? i.register
            : i.login;
        const eventType = options.prompt === t.create
            ? AuthEvent.register
            : AuthEvent.login;
        const optionsState = params.get('state') || '';
        const promptType = t[options.prompt];
        const authProps = {
            audience,
            clientId: client_id,
            scope: config.requested_scopes.split(' '),
            supportsReauth: true,
            ...restRedirectOptions,
            prompt: promptType,
            state: o(JSON.stringify({
                kinde: { event: eventType, state: optionsState }
            })),
            redirectURL: getRedirectUrl(redirect_uri)
        };
        if (invitation_code) {
            authProps.invitationCode = invitation_code;
            authProps.isInvitation = true;
        }
        if (org_code) {
            authProps.orgCode = org_code;
        }
        if (is_create_org) {
            authProps.isCreateOrg = is_create_org;
            authProps.orgName = org_name;
        }
        const authUrl = await h(config.domain, routeType, authProps);
        // mergeAuthUrlParams only — do not replace the query string with authProps keys:
        // generateAuthUrl already maps redirectURL → redirect_uri, clientId → client_id, etc.
        const reservedParams = new Set([
            'state',
            'client_id',
            'redirect_uri',
            'response_type',
            'scope',
            'code_challenge',
            'code_challenge_method'
        ]);
        for (const [k, v] of Object.entries(normalizeAuthUrlParams(authUrlParams))) {
            if (reservedParams.has(k))
                continue;
            authUrl.url.searchParams.set(k, String(v));
        }
        const oauthState = authUrl.url.searchParams.get('state') || authUrl.state || '';
        if (oauthState) {
            try {
                sessionStorage.setItem(appStateSessionKey(oauthState), JSON.stringify(app_state));
            }
            catch {
                // quota / private mode — callback will not receive app_state
            }
        }
        try {
            tt({
                url: authUrl.url.toString(),
                handleResult: processAuthResult
            });
        }
        catch (error) {
            if (on_error_callback) {
                on_error_callback({
                    error: 'Error with navigate to Kinde',
                    errorDescription: error.message,
                    state: authProps.state,
                    appState: {
                        kindeOriginUrl: window.location.href
                    }
                });
            }
        }
    };
    const processAuthResult = async (searchParams) => {
        const oauthStateParam = searchParams.get('state') || '';
        let storedAppState = {};
        if (oauthStateParam) {
            const key = appStateSessionKey(oauthStateParam);
            try {
                const raw = sessionStorage.getItem(key);
                if (raw) {
                    storedAppState = JSON.parse(raw);
                }
            }
            catch {
                storedAppState = {};
            }
            sessionStorage.removeItem(key);
        }
        const decoded = s(oauthStateParam);
        try {
            JSON.parse(decoded);
        }
        catch (error) {
            console.error('Error parsing state:', error);
            on_error_callback?.({
                error: 'ERR_STATE_PARSE',
                errorDescription: String(error),
                state: oauthStateParam,
                appState: storedAppState
            });
            return;
        }
        try {
            const codeResponse = await ne({
                urlParams: searchParams,
                domain,
                clientId: client_id,
                redirectURL: getRedirectUrl(options.redirect_uri || redirect_uri),
                autoRefresh: true
            });
            if (codeResponse.success) {
                await tabSync.applyTokensFromResult(codeResponse);
                const syncedTokens = tokensFromRefreshResult(codeResponse);
                if (syncedTokens) {
                    tabSync.broadcastTokens(syncedTokens);
                }
                const user = (await getUserProfile()) ?? (await hydrateUserFromIdToken());
                if (user) {
                    on_redirect_callback?.(user, storedAppState);
                }
            }
            else {
                on_error_callback?.({
                    error: 'ERR_CODE_EXCHANGE',
                    errorDescription: codeResponse.error,
                    state: oauthStateParam,
                    appState: storedAppState
                });
            }
        }
        catch (error) {
            on_error_callback?.({
                error: 'ERR_POPUP_AUTH',
                errorDescription: String(error),
                state: oauthStateParam,
                appState: storedAppState
            });
        }
    };
    const register = async (options) => {
        await redirectToKinde({
            ...options,
            prompt: t.create
        });
    };
    const login = async (options) => {
        await redirectToKinde({
            ...options
        });
    };
    const createOrg = async (options) => {
        await redirectToKinde({
            ...options,
            prompt: t.create,
            is_create_org: true
        });
    };
    const getUser = () => {
        return store.getItem(storageMap.user);
    };
    const getUserProfile = async () => {
        try {
            const user = await Fe();
            if (!user)
                return;
            const mappedUser = {
                id: user.id,
                given_name: user.givenName,
                family_name: user.familyName,
                email: user.email,
                picture: user.picture
            };
            store.setItem(storageMap.user, mappedUser);
            return mappedUser;
        }
        catch (err) {
            console.error(err);
        }
    };
    const clearLocalAuthState = async () => {
        await Promise.all([
            store.removeSessionItem(T.idToken),
            store.removeSessionItem(T.accessToken),
            store.removeSessionItem(T.refreshToken),
            localStorageAdapter.removeSessionItem(T.refreshToken),
            store.removeItems(storageMap.refresh_token, storageMap.access_token, storageMap.id_token, storageMap.user, storageMap.token_bundle)
        ]);
    };
    const logout = async (options) => {
        try {
            const params = new URLSearchParams();
            if (options) {
                if (options && typeof options === 'string') {
                    params.append('redirect', options);
                }
                else if (typeof options === 'object') {
                    if (options.redirectUrl || logout_uri) {
                        params.append('redirect', options.redirectUrl || logout_uri || '');
                    }
                    if (options.allSessions) {
                        params.append('all_sessions', String(options.allSessions));
                    }
                }
            }
            else {
                params.append('redirect', logout_uri || '');
            }
            // Stop new refreshes/checkAuth. Await any in-flight cookie refresh so its
            // Set-Cookie cannot land after Kinde /logout has already cleared _kbrte.
            logoutInProgress = true;
            sessionEpoch += 1;
            if (inFlightTabCoordination) {
                try {
                    await inFlightTabCoordination;
                }
                catch {
                    // Ignore refresh/checkAuth failures during logout.
                }
            }
            await clearLocalAuthState();
            tabSync.broadcastSessionCleared();
            try {
                await tt({
                    url: `${domain}/logout?${params.toString()}`
                });
                // Keep logoutInProgress true until the document unloads on redirect.
            }
            catch (error) {
                // Navigation failed (e.g. popup blocked); allow refresh/checkAuth again.
                logoutInProgress = false;
                on_error_callback?.({
                    error: 'ERR_POPUP',
                    errorDescription: error.message,
                    state: '',
                    appState: {}
                });
            }
        }
        catch (error) {
            on_error_callback?.({
                error: 'ERR_LOGOUT',
                errorDescription: String(error),
                state: '',
                appState: {}
            });
        }
    };
    const portal = async (options = {}) => {
        try {
            const isAuth = await isAuthenticated();
            if (!isAuth) {
                throw new Error('User must be authenticated to access portal');
            }
            const returnUrl = options.returnUrl || window.location.href;
            const tokens = await getAccessToken();
            if (!tokens) {
                throw new Error('No valid access token found');
            }
            const portalUrl = await $e({
                ...options,
                domain: config.domain,
                returnUrl
            });
            window.location.href = portalUrl.url.toString();
        }
        catch (err) {
            console.error(err);
        }
    };
    const migrateLegacyRefreshTokenKey = () => {
        if (!isUseLocalStorage)
            return;
        const oldToken = localStorage.getItem(storageMap.refresh_token);
        if (!oldToken)
            return;
        const newToken = localStorageAdapter.getSessionItem(T.refreshToken);
        if (!newToken) {
            localStorageAdapter.setSessionItem(T.refreshToken, oldToken);
        }
        localStorage.removeItem(storageMap.refresh_token);
    };
    const init = async () => {
        try {
            let checkAuthResult = { success: false };
            try {
                migrateLegacyRefreshTokenKey();
                // Restores session and refreshes near-expiry tokens via js-utils checkAuth.
                // On custom domains, refresh uses the httpOnly _kbrte cookie (credentials: include);
                // the refresh_token field is intentionally omitted from the POST body.
                // Do not follow this with isAuthenticated()/getAccessToken() — those refresh again.
                checkAuthResult = await runCheckAuthWithTabSync();
            }
            catch (err) {
                console.warn('checkAuth failed:', err);
                on_error_callback?.({
                    error: 'ERR_CHECK_AUTH',
                    errorDescription: String(err),
                    state: '',
                    appState: {}
                });
            }
            const params = new URLSearchParams(window.location.search);
            if (params.has('error')) {
                const errorCode = params.get('error');
                if (errorCode?.toLowerCase() === 'login_link_expired') {
                    const reauthState = params.get('reauth_state');
                    if (reauthState) {
                        login({ reauthState: reauthState });
                    }
                    return;
                }
                on_error_callback?.({
                    error: 'ERR_CHECK_AUTH',
                    errorDescription: String(errorCode),
                    state: '',
                    appState: {}
                });
                return;
            }
            const isKindeRedirectUri = isKindeRedirect(params);
            const kindeShouldHandle = isKindeRedirectUri && params.has('code');
            if (hasInvitationCode && invitationCode) {
                await login({ invitation_code: invitationCode });
                return;
            }
            if (kindeShouldHandle) {
                if (isSameOriginOpener()) {
                    const searchParams = new URLSearchParams(window.location.search);
                    window.opener.postMessage({
                        type: 'KINDE_AUTH_RESULT',
                        result: Object.fromEntries(searchParams.entries())
                    }, window.location.origin);
                    window.close();
                    return;
                }
                await processAuthResult(new URLSearchParams(window.location.search));
                return;
            }
            try {
                const storedAccess = await getStoredAccessToken();
                const hasActiveSession = isSuccessResult(checkAuthResult) ||
                    isStoredAccessTokenActive(storedAccess);
                if (hasActiveSession) {
                    await hydrateUserFromIdToken();
                    const user = (await getUserProfile()) ?? getUser();
                    if (user && on_session_restore_callback) {
                        on_session_restore_callback(user, {
                            kindeOriginUrl: window.location.href,
                            kinde: { event: 'session_restore' }
                        });
                    }
                }
                else {
                    store.removeItem(storageMap.user);
                }
            }
            catch (error) {
                console.warn('Error restoring user session', error);
                on_error_callback?.({
                    error: 'ERR_GET_USER_PROFILE',
                    errorDescription: String(error),
                    state: '',
                    appState: {}
                });
            }
            return;
        }
        catch (error) {
            console.warn('Error in init', error);
            if (on_error_callback) {
                on_error_callback({
                    error: 'ERR_INIT',
                    errorDescription: String(error),
                    state: '',
                    appState: {}
                });
            }
        }
    };
    const isKindeRedirect = (searchParams) => {
        // Check if the search params hve the code parameter
        const hasOauthCode = searchParams.has('code');
        const hasError = searchParams.has('error');
        if (!hasOauthCode && !hasError)
            return false;
        // Also check if redirect_uri matches current url
        const { protocol, host, pathname } = window.location;
        const currentRedirectUri = `${protocol}//${host}${pathname}`;
        const expectedRedirectUri = proxy_redirect_uri || redirect_uri;
        return (currentRedirectUri === expectedRedirectUri ||
            currentRedirectUri === `${expectedRedirectUri}/`);
    };
    const destroy = () => {
        if (destroyed)
            return;
        destroyed = true;
        sessionEpoch += 1;
        tabSync.dispose();
        if (k.onRefreshHandler === refreshHandler) {
            k.onRefreshHandler = undefined;
        }
        if (activeClientTeardown === destroy) {
            activeClientTeardown = null;
        }
    };
    tabSync.setupListeners({
        onTokensUpdated: () => {
            if (destroyed || logoutInProgress) {
                void clearLocalAuthState();
                return;
            }
            void hydrateUserFromIdToken();
        }
    });
    tabSync.setupVisibilitySync(() => {
        if (destroyed || logoutInProgress)
            return;
        if (inFlightTabCoordination)
            return;
        void runCheckAuthWithTabSync()
            .then(async (result) => {
            if (destroyed || logoutInProgress)
                return;
            if (isSuccessResult(result)) {
                await hydrateUserFromIdToken();
            }
            else {
                store.removeItem(storageMap.user);
            }
        })
            .catch((error) => {
            console.warn('checkAuth failed:', error);
            on_error_callback?.({
                error: 'ERR_CHECK_AUTH',
                errorDescription: String(error),
                state: '',
                appState: {}
            });
        });
    });
    activeClientTeardown = destroy;
    await init();
    return {
        createOrg,
        getToken,
        getAccessToken,
        getBooleanFlag,
        getClaim,
        getFlag,
        getIdToken,
        getIntegerFlag,
        getOrganization,
        getPermissions,
        getPermission,
        getStringFlag,
        getUser,
        getUserOrganizations,
        getUserProfile,
        isAuthenticated,
        login,
        logout,
        portal,
        register,
        destroy
    };
};

export { se as ChromeStore, i as IssuerRouteTypes, ce as LocalStorage, oe as MemoryStorage, n as PortalPage, r as ProfilePage, t as PromptTypes, a as RefreshType, e as Scopes, D as SessionBase, T as StorageKeys, E as TimeoutActivityType, s as base64UrlDecode, o as base64UrlEncode, ae as checkAuth, qe as clearActiveStorage, Xe as clearInsecureStorage, b as clearRefreshTimer, createKindeClient as default, ne as exchangeAuthCode, d as extractAuthResults, x as frameworkSettings, h as generateAuthUrl, S as generateKindeSDKHeader, $e as generatePortalUrl, Ze as generateProfileUrl, c as generateRandomString, Q as getActiveStorage, J as getClaim, Te as getClaimSync, K as getClaims, q as getClaimsSync, Ee as getCurrentOrganization, De as getCurrentOrganizationSync, P as getDecodedToken, F as getDecodedTokenSync, We as getEntitlement, be as getEntitlements, je as getFlag, Me as getFlagSync, $ as getInsecureStorage, Re as getPermission, ze as getPermissionSync, B as getPermissions, fe as getPermissionsSync, ke as getRawToken, Ae as getRawTokenSync, U as getRoles, me as getRolesSync, Be as getUserOrganizations, Ve as getUserOrganizationsSync, Fe as getUserProfile, Ie as getUserProfileSync, Ce as has, Ke as hasActiveStorage, Se as hasBillingEntitlements, ye as hasFeatureFlags, Ye as hasInsecureStorage, V as hasPermissions, W as hasRoles, Ue as isAuthenticated, _ as isClient, C as isCustomDomain, rt as isServer, Y as isTokenExpired, p as mapLoginMethodParamsForUrl, tt as navigateToKinde, X as refreshToken, f as sanitizeUrl, N as sessionManagerActivityProxy, Ge as setActiveStorage, Je as setInsecureStorage, y as setRefreshTimer, w as splitString, k as storageSettings, it as switchOrg, le as updateActivityTimestamp };
