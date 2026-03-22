const API_BASE = "/api";
const AUTH_API_BASE = "";

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    checkAuthAndLoad();
});

function initTheme() {
    const isDark = localStorage.getItem("theme") === "dark" || (!localStorage.getItem("theme") && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.body.classList.add("dark");
    
    document.querySelectorAll(".theme-toggle-btn").forEach(btn => {
        btn.innerHTML = isDark ? "☀️" : "🌙";
        btn.addEventListener("click", () => {
            const dark = document.body.classList.toggle("dark");
            localStorage.setItem("theme", dark ? "dark" : "light");
            document.querySelectorAll(".theme-toggle-btn").forEach(b => b.innerHTML = dark ? "☀️" : "🌙");
        });
    });
}

function checkAuthAndLoad() {
    fetch("/auth/me", { credentials: "include" })
        .then(res => res.json())
        .then(user => {
            if (user && user.id) {
                // Set Header
                const name = user.name || user.username || "User";
                const authArea = document.getElementById("authArea");
                let profileImg = user.profile_picture_url 
                    ? `<img src="${escapeHtml(user.profile_picture_url)}" alt="Profile" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">`
                    : "";
                authArea.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        ${profileImg}
                        <span class="auth-greeting" style="font-weight: bold;">Hello, ${escapeHtml(name)}</span>
                    </div>
                    <button id="logoutButton" class="auth-button" type="button">Logout</button>
                `;
                document.getElementById("logoutButton").addEventListener("click", () => {
                    fetch("/auth/logout", { method: "POST", credentials: "include" })
                        .then(() => window.location.href = "/");
                });

                loadDashboardData();
            } else {
                window.location.href = "/";
            }
        })
        .catch((e) => {
            console.error(e);
            window.location.href = "/";
        });
}

function loadDashboardData() {
    loadSavedProducts();
    loadTrackedProducts();
    loadPriceAlerts();
}

function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// =====================================
// Loaders
// =====================================
function loadSavedProducts() {
    fetch("/user/saved-products", { credentials: "include" })
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById("savedList");
            if (!data.saved_products || data.saved_products.length === 0) {
                container.innerHTML = '<p class="empty-state">No saved products found.</p>';
                return;
            }
            
            container.innerHTML = data.saved_products.map(sp => `
                <div class="item-card">
                    <h3 style="margin-top:0;">
                        <a href="product.html?id=${escapeHtml(sp.product_id)}" class="product-link glow-text" style="color:var(--text-color);text-decoration:none;">
                            ${escapeHtml(sp.product_name)}
                        </a>
                    </h3>
                    <p><strong>Brand:</strong> ${escapeHtml(sp.brand)}</p>
                    <p><strong>Saved:</strong> ${new Date(sp.created_at).toLocaleDateString()}</p>
                    <div class="action-btngrp">
                        <button class="btn-danger" onclick="removeSaved('${escapeHtml(sp.product_id)}')">Remove</button>
                    </div>
                </div>
            `).join("");
        });
}

function loadTrackedProducts() {
    fetch("/user/tracked-products", { credentials: "include" })
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById("trackedList");
            if (!data.tracked_products || data.tracked_products.length === 0) {
                container.innerHTML = '<p class="empty-state">No active trackers.</p>';
                return;
            }
            
            container.innerHTML = data.tracked_products.map(tp => `
                <div class="item-card">
                    <h3 style="margin-top:0;">
                        <a href="product.html?id=${escapeHtml(tp.product_id)}" class="product-link glow-text" style="color:var(--text-color);text-decoration:none;">
                            ${escapeHtml(tp.product_name)}
                        </a>
                    </h3>
                    <p><strong>Target Price:</strong> ${tp.target_price ? '₹'+tp.target_price : 'Any Drop'}</p>
                    <p><strong>Tracked:</strong> ${new Date(tp.created_at).toLocaleDateString()}</p>
                    <div class="action-btngrp">
                        <button class="btn-danger" onclick="untrackProduct('${escapeHtml(tp.product_id)}')">Untrack</button>
                    </div>
                </div>
            `).join("");
        });
}

function loadPriceAlerts() {
    fetch("/user/alerts", { credentials: "include" })
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById("alertsList");
            if (!data.alerts || data.alerts.length === 0) {
                container.innerHTML = '<p class="empty-state">No alerts yet.</p>';
                return;
            }
            
            container.innerHTML = data.alerts.map(al => `
                <div class="item-card alert-card ${al.is_high_priority ? 'high-priority' : ''} ${!al.is_read ? 'unread' : ''}">
                    <h3>${al.is_high_priority ? '🚨' : '📉'} Price Drop Alert!</h3>
                    <p><strong>Product:</strong> <a href="product.html?id=${escapeHtml(al.product_id)}" class="product-link glow-text" style="color:var(--text-color);text-decoration:none;">${escapeHtml(al.product_name)}</a></p>
                    <p>Dropped from <span style="text-decoration:line-through; color:#999;">₹${al.old_price}</span> to <strong style="color: green;">₹${al.new_price}</strong></p>
                    <p style="font-size: 0.8em; color: #888;">${new Date(al.created_at).toLocaleString()}</p>
                    ${!al.is_read ? `
                    <div class="action-btngrp">
                        <button class="btn-primary" onclick="markAlertRead(${al.id})">Mark as Read</button>
                    </div>` : '<p style="font-size: 0.8em; color: green; margin-top: 5px;">✓ Read</p>'}
                </div>
            `).join("");
        });
}

// =====================================
// Actions
// =====================================
function removeSaved(productId) {
    if(!confirm("Remove this product from saved list?")) return;
    fetch("/user/remove-product", {
        method: "DELETE",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({product_id: productId}),
        credentials: "include"
    }).then(() => loadSavedProducts());
}

function untrackProduct(productId) {
    if(!confirm("Stop tracking this product?")) return;
    fetch("/user/untrack-product", {
        method: "DELETE",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({product_id: productId}),
        credentials: "include"
    }).then(() => loadTrackedProducts());
}

function markAlertRead(alertId) {
    fetch("/user/mark-alert-read", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({alert_id: alertId}),
        credentials: "include"
    }).then(() => loadPriceAlerts());
}
