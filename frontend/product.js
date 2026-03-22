document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        showError();
        return;
    }

    fetchProductDetails(productId);
});

let detailedChartInstance = null;

async function fetchProductDetails(id) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/product?id=${id}`);
        if (!response.ok) throw new Error("Product not found");
        
        const data = await response.json();
        renderProduct(data);
    } catch (error) {
        console.error("Error fetching product:", error);
        showError();
    }
}

function renderProduct(data) {
    document.getElementById("loadingIndicator").style.display = "none";
    document.getElementById("productContent").style.display = "block";

    // Header Info
    document.getElementById("pName").textContent = data.name;
    document.getElementById("pBrand").textContent = data.brand;
    document.getElementById("pCategory").textContent = data.category;

    // Image Loader
    const imgEl = document.getElementById("pImage");
    if (data.image_url) {
        imgEl.src = data.image_url;
        imgEl.style.display = "block";
    } else {
        imgEl.style.display = "none";
    }

    // Best Price Logic
    if (data.offers && data.offers.length > 0) {
        const best = data.offers[0];
        document.getElementById("pBestPrice").textContent = `₹${best.price}`;
        document.getElementById("pBestPlatform").textContent = `on ${best.platform}`;
    } else {
        document.getElementById("pBestPrice").textContent = "N/A";
    }

    // Insight
    if (data.best_reason) {
        document.getElementById("pInsight").textContent = `💡 Smart Insight: ${data.best_reason}`;
        document.getElementById("pInsight").style.display = "block";
    } else {
        document.getElementById("pInsight").style.display = "none";
    }

    // Action Buttons (Reuse classes from global styles)
    const isSaved = window.savedProductIds && window.savedProductIds.has(data.id);
    const isTracked = window.trackedProductIds && window.trackedProductIds.has(data.id);

    const actionHtml = `
        <button class="save-product-btn ${isSaved ? 'saved' : ''}" 
                data-product-id="${data.id}" 
                data-product-name="${data.name}" 
                data-brand="${data.brand}"
                onclick="saveProductFromUI(this)" style="padding: 15px; font-size: 1.1em; width: 100%;">
            ${isSaved ? '✔ Saved' : '⭐ Save Product'}
        </button>
        <button class="track-product-btn ${isTracked ? 'tracked' : ''}" 
                data-product-id="${data.id}" 
                data-product-name="${data.name}" 
                data-brand="${data.brand}"
                onclick="trackProductFromUI(this)" style="padding: 15px; font-size: 1.1em; width: 100%;">
            ${isTracked ? '✔ Tracked' : '📌 Track Price Drops'}
        </button>
    `;
    document.getElementById("actionContainer").innerHTML = actionHtml;

    // Offers Table
    renderOffersTable(data.offers);

    // Chart
    if (data.history && data.history.length > 0) {
        renderChart(data.history);
    }
}

function renderOffersTable(offers) {
    if (!offers || offers.length === 0) {
        document.getElementById("pOffersTable").innerHTML = "<p>No recorded offers.</p>";
        return;
    }

    let html = `
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

    html += "</tbody></table>";
    document.getElementById("pOffersTable").innerHTML = html;
}

function renderChart(history) {
    const ctx = document.getElementById("detailedPriceChart").getContext("2d");

    // Group by platform
    const platformsData = {};
    history.forEach((h) => {
        if (!platformsData[h.platform]) {
            platformsData[h.platform] = [];
        }
        platformsData[h.platform].push(h);
    });

    const datasets = [];
    const colors = ["#4c6ef5", "#40c057", "#fa5252", "#fcc419", "#be4bdb"];
    let colorIndex = 0;

    for (const [platform, dataPoints] of Object.entries(platformsData)) {
        datasets.push({
            label: platform,
            data: dataPoints.map((dp) => dp.price),
            borderColor: colors[colorIndex % colors.length],
            backgroundColor: colors[colorIndex % colors.length] + '22',
            tension: 0.3,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6
        });
        colorIndex++;
    }

    const labels = history.map(h => h.recorded_at).filter((value, index, self) => self.indexOf(value) === index).sort();

    if (detailedChartInstance) {
        detailedChartInstance.destroy();
    }

    detailedChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: false,
                    grid: { color: document.body.classList.contains('dark') ? '#333' : '#ddd' }
                },
                x: {
                    grid: { display: false }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: document.body.classList.contains('dark') ? '#f8f9fa' : '#212529' }
                }
            }
        }
    });

    const isDarkMode = document.body.classList.contains("dark");
    updateDetailedChartTheme(isDarkMode);
}

function updateDetailedChartTheme(isDark) {
    if (!detailedChartInstance) return;
    const color = isDark ? "#c1c2c5" : "#495057";
    const gridColor = isDark ? "#373A40" : "#e9ecef";

    detailedChartInstance.options.scales.y.grid.color = gridColor;
    detailedChartInstance.options.scales.x.ticks.color = color;
    detailedChartInstance.options.scales.y.ticks.color = color;
    detailedChartInstance.options.plugins.legend.labels.color = color;
    detailedChartInstance.update();
}

// Hook into global theme toggle if possible
const themeToggleBtn = document.getElementById("themeToggle");
if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
        setTimeout(() => {
            const isDark = document.body.classList.contains("dark");
            updateDetailedChartTheme(isDark);
        }, 50);
    });
}

function showError() {
    document.getElementById("loadingIndicator").style.display = "none";
    document.getElementById("errorIndicator").style.display = "block";
}
