function searchProduct() {
    const query = document.getElementById("searchInput").value;
    const priority = document.getElementById("prioritySelect").value;

    if (!query) {
        alert("Please enter a product name");
        return;
    }

    const url = `http://127.0.0.1:5000/api/search?query=${query}&priority=${priority}`;

    fetch(url)
        .then(response => response.json())
        .then(data => displayResults(data))
        .catch(error => console.error("Error:", error));
}

function displayResults(data) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    if (data.count === 0) {
        resultsDiv.innerHTML = "<p>No products found.</p>";
        return;
    }

   data.results.forEach(item => {
    const product = item.product_name;
    const brand = item.brand;
    const offers = item.offers;
    const deal = item.upcoming_deal;

    let html = `<h3>${product} (${brand})</h3>`;

    // 🔔 Show upcoming deal if exists
    if (deal) {
        html += `
            <p style="color: green;">
                🔔 <strong>Upcoming Deal:</strong> ${deal.deal_name} on ${deal.platform}<br>
                Expected Price: ₹${deal.expected_price} |
                Starts on: ${deal.starts_on}
            </p>
        `;
    }

    html += `<ul>`;


offers.forEach((offer, index) => {
    const isBest = index === 0;

    html += `
        <li style="${isBest ? 'background-color:#e6ffe6; padding:8px; border-radius:5px;' : ''}">
            ${isBest ? '⭐ <strong>Best Option</strong><br>' : ''}
            <strong>${offer.platform}</strong> –
            ₹${offer.price} |
            Delivery: ${offer.delivery_days} days
            <a href="${offer.product_url}" target="_blank">Buy</a>
        </li>
    `;
});

        html += "</ul>";
        resultsDiv.innerHTML += html;
    });
}
