// ================================
// Global State
// ================================
let viewMode = "list";
let lastData = null;


// ================================
// Theme Toggle Logic
// ================================
function toggleTheme() {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    updateThemeButton(isDark);
}

function updateThemeButton(isDark) {
    document.querySelectorAll(".theme-toggle-btn").forEach(btn => {
        btn.innerHTML = isDark ? "☀️" : "🌙";
    });
}

function initTheme() {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    
    if (isDark) {
        document.body.classList.add("dark");
    }
    
    updateThemeButton(isDark);
    
    document.querySelectorAll(".theme-toggle-btn").forEach(btn => {
        btn.addEventListener("click", toggleTheme);
    });
}

// ================================
// UI Utilities
// ================================
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3300);
}

function showSkeleton() {
    const resultsDiv = document.getElementById("results");
    if (!resultsDiv) return;
    
    let html = '';
    for (let i = 0; i < 3; i++) {
        html += `
            <div class="skeleton-card">
                <div class="skeleton-text skeleton-title"></div>
                <div class="skeleton-text skeleton-line1"></div>
                <div class="skeleton-text skeleton-line2"></div>
                <div class="skeleton-text skeleton-line3"></div>
            </div>`;
    }
    resultsDiv.innerHTML = html;
}

// ================================
// Search Function
// ================================
function searchProduct() {
    const query = document.getElementById("searchInput").value.trim();
    const priority = document.getElementById("prioritySelect").value;

    if (!query) {
        showToast("Please enter a product name", "error");
        return;
    }

    localStorage.setItem("lastQuery", query);
    localStorage.setItem("lastPriority", priority);
    localStorage.setItem("lastCategory", "");

    const url = `/api/search?query=${query}&priority=${priority}`;
    showSkeleton();

    fetch(url, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
            lastData = data;
            displayResults(data);
        })
        .catch(err => console.error("Error:", err));
}


// ================================
// Category Browsing
// ================================
function browseCategory(category, button) {
    const priority = document.getElementById("prioritySelect").value;

    document.querySelectorAll("#categories button").forEach(btn => {
        btn.classList.remove("active-category");
    });

    if (button) button.classList.add("active-category");

    localStorage.setItem("lastCategory", category);
    localStorage.setItem("lastPriority", priority);
    localStorage.setItem("lastQuery", "");

    const url = `/api/search?category=${category}&priority=${priority}`;
    showSkeleton();

    fetch(url, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
            lastData = data;
            displayResults(data);
        })
        .catch(err => console.error("Error:", err));
}


// ================================
// View Mode Toggle
// ================================
function setViewMode(mode, button) {
    viewMode = mode;

    document.getElementById("listBtn").classList.remove("active-view");
    document.getElementById("compareBtn").classList.remove("active-view");

    button.classList.add("active-view");

    if (lastData) displayResults(lastData);
}


// ================================
// Render Results
// ================================
function displayResults(data) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    if (!data || data.count === 0) {
        resultsDiv.innerHTML = `
            <p>No products found.</p>
            <p>Try searching for:</p>
            <ul>
                <li>tshirt</li>
                <li>jeans</li>
                <li>shampoo</li>
            </ul>
        `;
        return;
    }

    resultsDiv.innerHTML += `<p><strong>${data.count} result(s) found</strong></p>`;

    data.results.forEach(item => {

        const product = item.product_name;
        const brand = item.brand;
        const offers = item.offers;
        const deal = item.upcoming_deal;

        let html = `
            <div class="product-section">
                <div class="product-header">
                    <h3 style="margin-top:0;">
                        <a href="product.html?id=${escapeHtml(item.product_id)}" class="product-link glow-text" style="color:var(--text-color);text-decoration:none;">
                            ${product} (${brand})
                        </a>
                    </h3>
                    <div>
                        <button
                            class="save-product-btn"
                            type="button"
                            data-product-id="${escapeHtml(item.product_id)}"
                            data-product-name="${escapeHtml(product)}"
                            data-brand="${escapeHtml(brand)}"
                            onclick="saveProductFromUI(this)"
                        >⭐ Save</button>
                        <button
                            class="track-product-btn"
                            type="button"
                            data-product-id="${escapeHtml(item.product_id)}"
                            data-product-name="${escapeHtml(product)}"
                            data-brand="${escapeHtml(brand)}"
                            onclick="trackProductFromUI(this)"
                        >📌 Track</button>
                    </div>
                </div>
                <div id="insights-${item.product_id}" style="margin-top: 10px;"></div>
        `;

        // Deal
        if (deal) {
            html += `
                <p style="color: green;">
                    🔔 <strong>Upcoming Deal:</strong> ${deal.deal_name} on ${deal.platform}<br>
                    Expected Price: ₹${deal.expected_price} |
                    Starts on: ${deal.starts_on}
                </p>
            `;
        }

        // Buy / Wait
        if (deal && offers.length > 0) {
            const bestCurrent = offers[0].price;
            const expected = deal.expected_price;

            if (expected < bestCurrent) {
                html += `<p style="color:#007bff;font-weight:bold;">🕒 Wait — save ₹${bestCurrent - expected}</p>`;
            } else {
                html += `<p style="color:#28a745;font-weight:bold;">🛒 Buy now — best price already</p>`;
            }
        }

        // Graph button
        html += `
            <button class="history-btn" onclick="loadPriceHistory('${item.product_id}', this)" style="margin-top: 10px; margin-bottom: 15px;">
                📊 View Price History
            </button>
            <div class="chart-container"></div>
        `;

        // ====================
        // LIST VIEW
        // ====================
        if (viewMode === "list") {
            html += '<ul style="list-style: none; padding: 0;">';

            offers.forEach((offer, index) => {
                const lastUpdated = new Date(offer.last_updated).toLocaleDateString();
                const isBest = index === 0;
                const reason = isBest && item.best_reason ? item.best_reason : "";

                html += `
                    <li style="margin-bottom: 10px; padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); ${isBest ? 'background: rgba(251, 192, 45, 0.1); border-left: 5px solid #fbc02d;' : ''}">
                        ${isBest ? '<strong style="color: var(--text-color); margin-bottom: 8px; display: block;">⭐ Best Option</strong>' : ''}
                        ${isBest && reason ? `<p style="color: #d84315; font-weight: 500; margin: 5px 0 10px 0;">🧠 ${reason}</p>` : ''}
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="font-size: 1.1em; color: var(--text-color);">${offer.platform}</strong>
                                <span style="font-size: 1.2em; font-weight: bold; margin-left: 10px; color: #2e7d32;">₹${offer.price}</span>
                                <div style="color: var(--text-muted); font-size: 0.9em; margin-top: 5px;">Delivery: ${offer.delivery_days} days | Updated: ${lastUpdated}</div>
                            </div>
                            <a href="${offer.product_url}" target="_blank" class="view-button" style="text-decoration: none; font-weight: bold;">Buy Now</a>
                        </div>
                    </li>
                `;
            });

            html += "</ul>";
        }

        // ====================
        // TABLE VIEW
        // ====================
        else {
            html += `
                <div style="overflow-x: auto;">
                <table class="compare-table">
                    <thead>
                        <tr>
                            <th>Platform</th>
                            <th>Price</th>
                            <th>Delivery</th>
                            <th>Last Updated</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            offers.forEach((offer, index) => {
                const lastUpdated = new Date(offer.last_updated).toLocaleDateString();
                const isBest = index === 0;

                html += `
                    <tr class="${isBest ? 'best-offer' : ''}">
                        <td>${isBest ? '<strong style="color: #fbc02d; font-size: 1.1em;">⭐</strong> ' : ''}<strong>${offer.platform}</strong></td>
                        <td class="price-text">₹${offer.price}</td>
                        <td>${offer.delivery_days} days</td>
                        <td class="muted-text" style="font-size: 0.9em;">${lastUpdated}</td>
                        <td><a href="${offer.product_url}" target="_blank" class="buy-link">Buy Now</a></td>
                    </tr>
                `;
            });

            html += "</tbody></table></div>";
        }

        html += "</div>";
        resultsDiv.innerHTML += html;
    });

    // After rendering results, mark already-saved items (if logged in).
    syncSavedButtons();
    syncTrackedButtons();

    // Fetch insights for all products
    data.results.forEach(item => {
        loadInsights(item.product_id);
    });
}


// ================================
// Graph Toggle
// ================================
function loadPriceHistory(productId, button) {

    const container = button.nextElementSibling;

    if (container.innerHTML !== "") {
        container.innerHTML = "";
        button.innerText = "📊 View Price History";
        return;
    }

    button.innerText = "❌ Hide Price History";

    fetch(`/api/price-history?product_id=${productId}`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
            // Convert the flat array into a dataset organized by platform
            const platformMap = {};
            const dateSet = new Set();
            
            data.forEach(d => {
                const dateStr = d.recorded_at.split(' ')[0]; // Extract just the date
                dateSet.add(dateStr);
                
                if (!platformMap[d.platform]) platformMap[d.platform] = {};
                platformMap[d.platform][dateStr] = d.price;
            });

            // Sort dates chronologically to ensure the X-axis flows left-to-right
            const sortedDates = Array.from(dateSet).sort();

            // Official/Approximate branding colors for Indian e-commerce
            const brandColors = {
                "Amazon": "#ff9900",
                "Flipkart": "#047BD5",
                "Myntra": "#ff3f6c",
                "Nykaa": "#fc2779",
                "BigBasket": "#84c225",
                "Default": "#4c6ef5"
            };

            const isDark = document.body.classList.contains("dark");
            const textColor = isDark ? "#e0e0e0" : "#666";
            const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";

            const datasets = Object.keys(platformMap).map(platform => {
                const color = brandColors[platform] || brandColors["Default"];
                
                // Map the dates into null or specific price for the given platform
                const platformPrices = sortedDates.map(date => platformMap[platform][date] || null);

                return {
                    label: platform,
                    data: platformPrices,
                    borderColor: color,
                    backgroundColor: color + "1a", // 10% opacity for under-line glow
                    borderWidth: 3,
                    pointBackgroundColor: color,
                    pointBorderColor: isDark ? "#121212" : "#ffffff",
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: false, 
                    tension: 0.4,
                    spanGaps: true // Connects the line if a date is missing for this platform
                };
            });

            const canvas = document.createElement("canvas");
            canvas.style.maxHeight = "280px";
            canvas.style.width = "100%";
            container.appendChild(canvas);

            new Chart(canvas, {
                type: "line",
                data: {
                    labels: sortedDates,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index',
                    },
                    plugins: {
                        legend: { 
                            display: true, 
                            position: 'top',
                            labels: {
                                color: textColor,
                                font: { family: "'Inter', sans-serif" },
                                usePointStyle: true,
                                padding: 20
                            }
                        },
                        tooltip: {
                            backgroundColor: isDark ? "#2d2d2d" : "#fff",
                            titleColor: isDark ? "#fff" : "#222",
                            bodyColor: isDark ? "#ccc" : "#666",
                            borderColor: gridColor,
                            borderWidth: 1,
                            padding: 12,
                            displayColors: true,
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ₹' + context.parsed.y;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: textColor, font: { family: "'Inter', sans-serif" } }
                        },
                        y: {
                            border: { display: false },
                            grid: { color: gridColor },
                            ticks: { 
                                color: textColor, 
                                font: { family: "'Inter', sans-serif" },
                                callback: function(value) { return '₹' + value; }
                            }
                        }
                    }
                }
            });
        });
}


// ================================
// Session-based Authentication UI
// ================================

const AUTH_API_BASE = "";
let loginInProgress = false;
let logoutInProgress = false;

// Tracks session state for UI decisions (ex: showing Save buttons).
let currentUser = null;
let savedProductIds = new Set();
let trackedProductIds = new Set();

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function setModalError(message) {
    const errorEl = document.getElementById("authError");
    if (!errorEl) return;

    if (!message) {
        errorEl.textContent = "";
        errorEl.style.display = "none";
        return;
    }

    errorEl.textContent = message;
    errorEl.style.display = "block";
}

function showLoginModal() {
    const overlay = document.getElementById("authModalOverlay");
    if (!overlay) return;

    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
    setModalError("");

    const emailInput = document.getElementById("loginEmail");
    const nameInput = document.getElementById("loginName");
    if (emailInput) emailInput.value = emailInput.value || "";
    if (nameInput) nameInput.value = nameInput.value || "";

    // Improve UX: focus email first.
    if (emailInput) emailInput.focus();
}

function hideLoginModal() {
    const overlay = document.getElementById("authModalOverlay");
    if (!overlay) return;

    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
    setModalError("");
}

function setLoggedOutUI() {
    const authArea = document.getElementById("authArea");
    if (!authArea) return;

    authArea.innerHTML = `<button id="authButton" class="auth-button" type="button">Login</button>`;
    document.getElementById("authButton").addEventListener("click", showLoginModal);

    currentUser = null;
    savedProductIds = new Set();

    const section = document.getElementById("savedProductsSection");
    if (section) section.style.display = "none";
    const listEl = document.getElementById("savedProductsList");
    if (listEl) listEl.innerHTML = "";
    const emptyEl = document.getElementById("savedProductsEmpty");
    if (emptyEl) emptyEl.style.display = "block";

    const trackedSection = document.getElementById("trackedProductsSection");
    if (trackedSection) trackedSection.style.display = "none";
    const trackedListEl = document.getElementById("trackedProductsList");
    if (trackedListEl) trackedListEl.innerHTML = "";
    const trackedEmptyEl = document.getElementById("trackedProductsEmpty");
    if (trackedEmptyEl) trackedEmptyEl.style.display = "block";
}

function setLoggedInUI(user) {
    const authArea = document.getElementById("authArea");
    if (!authArea) return;

    const name = user?.name || user?.email || "User";
    const profileImg = user?.profile_image ? `<img src="${escapeHtml(user.profile_image)}" alt="Profile" style="width: 30px; height: 30px; border-radius: 50%; margin-right: 10px; vertical-align: middle;">` : '';

    authArea.innerHTML = `
        ${profileImg}
        <span class="auth-greeting" style="vertical-align: middle;">Hello, ${escapeHtml(name)}</span>
        <button onclick="window.location.href='/dashboard'" class="auth-button" type="button" style="vertical-align: middle; margin-left: 10px;">My Dashboard</button>
        <button id="logoutButton" class="auth-button" type="button" style="vertical-align: middle; margin-left: 10px;">Logout</button>
    `;

    document.getElementById("logoutButton").addEventListener("click", logout);

    currentUser = user;

    const section = document.getElementById("savedProductsSection");
    if (section) section.style.display = "block";

    const trackedSection = document.getElementById("trackedProductsSection");
    if (trackedSection) trackedSection.style.display = "block";

    // Load saved products for the signed-in user.
    loadSavedProductsUI();
    loadTrackedProductsUI();
}

async function login() {
    if (loginInProgress) return;

    const emailInput = document.getElementById("loginEmail");
    const nameInput = document.getElementById("loginName");
    const email = (emailInput?.value || "").trim().toLowerCase();
    const name = (nameInput?.value || "").trim();

    if (!email) {
        setModalError("Please enter your email.");
        return;
    }
    if (!name) {
        setModalError("Please enter your name.");
        return;
    }

    setModalError("");

    const submitBtn = document.getElementById("loginSubmit");
    loginInProgress = true;
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Logging in...";
    }

    try {
        const res = await fetch(`${AUTH_API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, name }),
            credentials: "include"
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
            setModalError(
                data?.error ||
                `Login failed (status ${res.status}). Please try again.`
            );
            return;
        }

        if (!data?.user) {
            setModalError("Login succeeded but user data was missing.");
            return;
        }

        hideLoginModal();
        setLoggedInUI(data.user);
    } catch (e) {
        setModalError("Network error. Please try again.");
    } finally {
        loginInProgress = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Login";
        }
    }
}

async function logout() {
    if (logoutInProgress) return;

    const logoutBtn = document.getElementById("logoutButton");
    logoutInProgress = true;
    if (logoutBtn) {
        logoutBtn.disabled = true;
        logoutBtn.textContent = "Logging out...";
    }

    try {
        await fetch(`${AUTH_API_BASE}/auth/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
            credentials: "include"
        });
    } catch (e) {
        // Ignore network errors; UI will reset anyway.
    } finally {
        logoutInProgress = false;
        if (logoutBtn) {
            logoutBtn.disabled = false;
            logoutBtn.textContent = "Logout";
        }
    }

    hideLoginModal();
    setLoggedOutUI();
}

async function loadMeAndUpdateUI() {
    try {
        const res = await fetch(`${AUTH_API_BASE}/auth/me`, {
            method: "GET",
            credentials: "include"
        });

        const user = await res.json().catch(() => null);
        if (user) setLoggedInUI(user);
        else setLoggedOutUI();
    } catch (e) {
        setLoggedOutUI();
    }
}

// ================================
// Saved Products
// ================================

async function loadSavedProductsUI() {
    const section = document.getElementById("savedProductsSection");
    const listEl = document.getElementById("savedProductsList");
    const emptyEl = document.getElementById("savedProductsEmpty");

    if (!section || !listEl || !emptyEl) return;

    if (!currentUser) {
        section.style.display = "none";
        listEl.innerHTML = "";
        emptyEl.style.display = "block";
        return;
    }

    try {
        const res = await fetch(`${AUTH_API_BASE}/user/saved-products`, {
            method: "GET",
            credentials: "include"
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "Failed to load saved products");

        const savedProducts = data?.saved_products || [];
        savedProductIds = new Set(savedProducts.map(p => String(p.product_id)));

        listEl.innerHTML = "";
        if (savedProducts.length === 0) {
            emptyEl.style.display = "block";
        } else {
            emptyEl.style.display = "none";
        }

        savedProducts.forEach(sp => {
            const html = `
                <div class="saved-product-item">
                    <div class="saved-product-meta">
                        <div class="saved-product-name">${escapeHtml(sp.product_name)}</div>
                        <div class="saved-product-brand">${escapeHtml(sp.brand)}</div>
                    </div>
                    <button
                        class="remove-saved-btn"
                        type="button"
                        data-product-id="${escapeHtml(sp.product_id)}"
                        onclick="removeSavedProductFromUI(this)"
                    >Remove</button>
                </div>
            `;
            listEl.innerHTML += html;
        });

        // Keep save buttons in search results in sync.
        syncSavedButtons();
    } catch (e) {
        // If we can't load saved products, don't force-logout.
        // This prevents a "login failed" feeling caused by saved-products fetch issues.
        section.style.display = "block";
        listEl.innerHTML = "";
        emptyEl.textContent = "Could not load saved products.";
        emptyEl.style.display = "block";
    }
}

function syncSavedButtons() {
    document.querySelectorAll(".save-product-btn").forEach(btn => {
        const pid = String(btn.dataset.productId || "");
        const isSaved = savedProductIds.has(pid);

        if (isSaved) {
            btn.classList.add("saved");
            btn.textContent = "Saved";
            btn.disabled = true;
        } else {
            btn.classList.remove("saved");
            btn.textContent = "⭐ Save";
            btn.disabled = false;
        }
    });
}

async function saveProductFromUI(btn) {
    console.log("Current User:", currentUser);
    if (!currentUser) {
        showToast("Please login first", "error");
        return;
    }

    const productId = String(btn.dataset.productId || "").trim();
    const productName = String(btn.dataset.productName || "").trim();
    const brand = String(btn.dataset.brand || "").trim();

    if (!productId) return;

    btn.disabled = true;
    const oldText = btn.textContent;
    btn.textContent = "Saving...";

    try {
        const res = await fetch(`${AUTH_API_BASE}/user/save-product`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                product_id: productId,
                product_name: productName,
                brand
            }),
            credentials: "include"
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "Failed to save product");

        await loadSavedProductsUI();
        showToast("Product saved successfully!", "success");
        // SyncSavedButtons will update this button based on savedProductIds.
    } catch (e) {
        showToast(e?.message || "Failed to save product", "error");
        btn.textContent = oldText;
        btn.disabled = false;
    }
}

async function removeSavedProductFromUI(btn) {
    const productId = String(btn.dataset.productId || "").trim();
    if (!productId) return;

    btn.disabled = true;
    const oldText = btn.textContent;
    btn.textContent = "Removing...";

    try {
        const res = await fetch(`${AUTH_API_BASE}/user/remove-product`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_id: productId }),
            credentials: "include"
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "Failed to remove product");

        await loadSavedProductsUI();
        showToast("Product removed", "info");
    } catch (e) {
        showToast(e?.message || "Failed to remove product", "error");
        btn.textContent = oldText;
        btn.disabled = false;
    }
}

// ================================
// Tracked Products & Insights
// ================================

async function loadTrackedProductsUI() {
    const listEl = document.getElementById("trackedProductsList");
    const emptyEl = document.getElementById("trackedProductsEmpty");
    if (!listEl || !emptyEl || !currentUser) return;

    try {
        const res = await fetch(`${AUTH_API_BASE}/user/tracked-products`, { credentials: "include" });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error("Failed to load tracked products");

        const trackedProducts = data?.tracked_products || [];
        trackedProductIds = new Set(trackedProducts.map(p => String(p.product_id)));

        listEl.innerHTML = "";
        emptyEl.style.display = trackedProducts.length === 0 ? "block" : "none";

        trackedProducts.forEach(tp => {
            listEl.innerHTML += `
                <div class="saved-product-item">
                    <div class="saved-product-meta">
                        <div class="saved-product-name">📌 ${escapeHtml(tp.product_name)}</div>
                        <div class="saved-product-brand">${escapeHtml(tp.brand)}</div>
                        <small>Target: ${tp.target_price ? '₹'+tp.target_price : 'Any price drop'}</small>
                    </div>
                </div>
            `;
        });
        syncTrackedButtons();
    } catch (e) {
        emptyEl.textContent = "Could not load tracked products.";
        emptyEl.style.display = "block";
    }
}

function syncTrackedButtons() {
    document.querySelectorAll(".track-product-btn").forEach(btn => {
        const pid = String(btn.dataset.productId || "");
        if (trackedProductIds.has(pid)) {
            btn.classList.add("saved"); // Uses same styling as saved
            btn.textContent = "Tracked";
            btn.disabled = true;
        } else {
            btn.classList.remove("saved");
            btn.textContent = "📌 Track";
            btn.disabled = false;
        }
    });
}

async function trackProductFromUI(btn) {
    if (!currentUser) {
        showToast("Please login first to track products", "error");
        return;
    }
    const productId = btn.dataset.productId;
    const productName = btn.dataset.productName;
    const brand = btn.dataset.brand;
    if (!productId) return;

    btn.disabled = true;
    btn.textContent = "Tracking...";

    try {
        const res = await fetch(`${AUTH_API_BASE}/user/track-product`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_id: productId, product_name: productName, brand }),
            credentials: "include"
        });
        if (!res.ok) throw new Error("Failed");
        await loadTrackedProductsUI();
        showToast("Tracking active", "success");
    } catch {
        showToast("Failed to track product", "error");
        btn.disabled = false;
        btn.textContent = "📌 Track";
    }
}

function loadInsights(productId) {
    const container = document.getElementById(`insights-${productId}`);
    if (!container) return;
    
    fetch(`/api/product/insights?product_id=${productId}`)
        .then(res => res.json())
        .then(data => {
            if (data.error || data.average_price === 0) return;
            const isBuy = data.recommendation === "buy";
            const color = isBuy ? "background:#f1f8e9; color:#2e7d32; border:1px solid #c5e1a5;" : "background:#ffebee; color:#c62828; border:1px solid #ffca28;";
            const trendArrow = data.trend === "increasing" ? "↗️" : data.trend === "decreasing" ? "↘️" : "➡️";
            
            container.innerHTML = `
                <div style="padding:15px; border-radius:8px; margin-bottom:15px; ${color}">
                    <div style="font-size: 1.1em; margin-bottom: 8px;">
                        <strong>💡 Smart Insight:</strong> ${escapeHtml(data.reason || '')}
                    </div>
                    <div style="display: flex; gap: 15px; align-items: center; font-size: 0.9em; flex-wrap: wrap;">
                        <span><strong>Recommendation:</strong> ${isBuy ? '🟢 BUY' : '🔴 WAIT'}</span>
                        <span><strong>Trend:</strong> ${trendArrow} ${data.trend || 'stable'}</span>
                        <span>📉 Lowest: ₹${data.lowest_price}</span>
                        <span>📈 Highest: ₹${data.highest_price}</span>
                        <span>📊 Avg: ₹${data.average_price}</span>
                    </div>
                </div>
            `;
        });
}

// Modal event wiring
const authModalOverlay = document.getElementById("authModalOverlay");
if (authModalOverlay) {
    authModalOverlay.addEventListener("click", (e) => {
        if (e.target === authModalOverlay) hideLoginModal();
    });
}

const authModalCloseX = document.getElementById("authModalCloseX");
if (authModalCloseX) authModalCloseX.addEventListener("click", hideLoginModal);

const loginCloseBtn = document.getElementById("loginCloseBtn");
if (loginCloseBtn) loginCloseBtn.addEventListener("click", hideLoginModal);

const loginSubmitBtn = document.getElementById("loginSubmit");
if (loginSubmitBtn) loginSubmitBtn.addEventListener("click", login);

// Keyboard accessibility: ESC closes modal.
document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;

    const overlay = document.getElementById("authModalOverlay");
    if (!overlay || overlay.classList.contains("hidden")) return;

    hideLoginModal();
});

// ================================
// ================================
// Restore State
// ================================
window.onload = function () {
    initTheme();

    const savedQuery = localStorage.getItem("lastQuery");
    const savedPriority = localStorage.getItem("lastPriority");
    const savedCategory = localStorage.getItem("lastCategory");

    if (savedPriority) {
        document.getElementById("prioritySelect").value = savedPriority;
    }

    if (savedCategory) {
        document.querySelectorAll("#categories button").forEach(btn => {
            if (btn.textContent.toLowerCase().includes(savedCategory)) {
                browseCategory(savedCategory, btn);
            }
        });
    }
    else if (savedQuery) {
        document.getElementById("searchInput").value = savedQuery;
        searchProduct();
    }

    // Auto-show login/logout UI based on session cookie.
    loadMeAndUpdateUI();
};