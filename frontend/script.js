// ================================
// Global State
// ================================
let viewMode = "list";   // "list" or "compare"
let lastData = null;     // Store last fetched data for re-rendering


// ================================
// Search Function
// ================================
function searchProduct() {
    const query = document.getElementById("searchInput").value.trim();
    const priority = document.getElementById("prioritySelect").value;

    if (!query) {
        alert("Please enter a product name");
        return;
    }

    // Save state
    localStorage.setItem("lastQuery", query);
    localStorage.setItem("lastPriority", priority);
    localStorage.setItem("lastCategory", "");

    const url = `http://127.0.0.1:5000/api/search?query=${query}&priority=${priority}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            lastData = data;
            displayResults(data);
        })
        .catch(error => console.error("Error:", error));
}


// ================================
// Category Browsing
// ================================
function browseCategory(category, button) {
    const priority = document.getElementById("prioritySelect").value;

    // Highlight active category
    document.querySelectorAll("#categories button").forEach(btn => {
        btn.classList.remove("active-category");
    });

    if (button) {
        button.classList.add("active-category");
    }

    // Save state
    localStorage.setItem("lastCategory", category);
    localStorage.setItem("lastPriority", priority);
    localStorage.setItem("lastQuery", "");

    const url = `http://127.0.0.1:5000/api/search?category=${category}&priority=${priority}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            lastData = data;
            displayResults(data);
        })
        .catch(error => console.error("Error:", error));
}


// ================================
// View Mode Toggle
// ================================
function setViewMode(mode) {
    viewMode = mode;

    // Re-render existing data instead of refetching
    if (lastData) {
        displayResults(lastData);
    }
}


// ================================
// Render Results
// ================================
function displayResults(data) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    if (!data || data.count === 0) {
        resultsDiv.innerHTML = "<p>No products found.</p>";
        return;
    }

    data.results.forEach(item => {

        const product = item.product_name;
        const brand = item.brand;
        const offers = item.offers;
        const deal = item.upcoming_deal;

        let html = `
            <div class="product-section">
                <h3>${product} (${brand})</h3>
        `;

        // Upcoming Deal
        if (deal) {
            html += `
                <p style="color: green;">
                    🔔 <strong>Upcoming Deal:</strong> ${deal.deal_name} on ${deal.platform}<br>
                    Expected Price: ₹${deal.expected_price} |
                    Starts on: ${deal.starts_on}
                </p>
            `;
        }

        // ===============================
        // Buy Now or Wait Logic
        // ===============================
        if (deal && offers.length > 0) {

           const bestCurrentPrice = offers[0].price;
           const expectedPrice = deal.expected_price;

        if (expectedPrice < bestCurrentPrice) {
        const savings = bestCurrentPrice - expectedPrice;

        html += `
            <p style="color: #007bff; font-weight: bold;">
                🕒 Recommendation: Wait for the deal and save ₹${savings}.
            </p>
        `;
        } else {
          html += `
            <p style="color: #28a745; font-weight: bold;">
                🛒 Recommendation: Buy now — current offer is already the best available price.
            </p>
         `;
        }
      }


        // =========================
        // LIST VIEW
        // =========================
        if (viewMode === "list") {

            html += "<ul>";

            offers.forEach((offer, index) => {
                const lastUpdated = new Date(offer.last_updated).toLocaleDateString();
                const isBest = index === 0;
                const reason = isBest && item.best_reason ? item.best_reason : "";

                html += `
                    <li style="${isBest ? 'background-color:#e6ffe6; padding:8px; border-radius:5px;' : ''}">
                        ${isBest ? '⭐ <strong>Best Option</strong><br>' : ''}
                        ${isBest && reason ? `<p style="font-size:14px; color:#2c7a2c;">🧠 ${reason}</p>` : ''}
                        <strong>${offer.platform}</strong> – ₹${offer.price} |
                        Delivery: ${offer.delivery_days} days
                        <br>
                        <small style="color:#666;">
                            Last updated: ${lastUpdated}
                        </small>
                        <br>
                        <a href="${offer.product_url}" target="_blank">Buy</a>
                    </li>
                `;
            });

            html += "</ul>";
        }

        // =========================
        // COMPARE TABLE VIEW
        // =========================
        else if (viewMode === "compare") {

            html += `
                <table border="1" cellpadding="8" cellspacing="0"
                       style="border-collapse: collapse; width:100%; margin-top:10px;">
                    <tr>
                        <th>Platform</th>
                        <th>Price</th>
                        <th>Delivery</th>
                        <th>Last Updated</th>
                        <th>Action</th>
                    </tr>
            `;

            offers.forEach((offer, index) => {
                const lastUpdated = new Date(offer.last_updated).toLocaleDateString();
                const isBest = index === 0;

                html += `
                    <tr style="${isBest ? 'background-color:#e6ffe6;' : ''}">
                        <td>${isBest ? '⭐ ' : ''}${offer.platform}</td>
                        <td>₹${offer.price}</td>
                        <td>${offer.delivery_days} days</td>
                        <td>${lastUpdated}</td>
                        <td><a href="${offer.product_url}" target="_blank">Buy</a></td>
                    </tr>
                `;
            });

            html += "</table>";
        }

        html += "</div>";
        resultsDiv.innerHTML += html;
    });
}


// ================================
// Restore State On Load
// ================================
window.onload = function () {

    const savedQuery = localStorage.getItem("lastQuery");
    const savedPriority = localStorage.getItem("lastPriority");
    const savedCategory = localStorage.getItem("lastCategory");

    if (savedPriority) {
        document.getElementById("prioritySelect").value = savedPriority;
    }

    if (savedCategory) {
        const categoryButtons = document.querySelectorAll("#categories button");
        categoryButtons.forEach(btn => {
            if (btn.textContent.toLowerCase().includes(savedCategory)) {
                browseCategory(savedCategory, btn);
            }
        });
    }
    else if (savedQuery) {
        document.getElementById("searchInput").value = savedQuery;
        searchProduct();
    }
};
