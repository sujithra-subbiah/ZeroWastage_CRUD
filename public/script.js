document.addEventListener('DOMContentLoaded', function() {
    console.log("ZeroWastage Script Connected & Ready!");

    // --- 1. SEARCH & FILTER ELEMENTS ---
    const searchForm = document.querySelector('.search-section form');
    const searchInput = document.querySelector('input[name="search"]');
    const categorySelect = document.querySelector('select[name="category"]');
    const cards = document.querySelectorAll('.card');
    const resetBtn = document.querySelector('.btn-reset');

    // --- 2. SEARCH LOGIC (Unified) ---
    function performSearch(e) {
        if (e && e.type === 'submit') e.preventDefault(); 

        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedCategory = categorySelect ? categorySelect.value.toLowerCase() : "";

        cards.forEach(card => {
            const titleElement = card.querySelector('h3');
            const itemName = titleElement ? titleElement.innerText.toLowerCase() : "";
            // Category checking attribute
            const itemCategory = card.getAttribute('data-category') ? card.getAttribute('data-category').toLowerCase() : "";

            const matchesSearch = itemName.includes(searchTerm);
            const matchesCategory = selectedCategory === "" || selectedCategory === "all" || itemCategory === selectedCategory;

            if (matchesSearch && matchesCategory) {
                card.style.display = ""; // Shows the card
            } else {
                card.style.display = "none"; // Hides the card
            }
        });
    }

    // Search events
    if (searchForm) searchForm.addEventListener('submit', performSearch);
    if (searchInput) searchInput.addEventListener('keyup', performSearch);
    if (categorySelect) categorySelect.addEventListener('change', performSearch);

    // Reset logic
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            searchInput.value = "";
            if (categorySelect) categorySelect.value = "";
            cards.forEach(card => card.style.display = "");
        });
    }

    // --- 3. DELETE LOGIC (Event Delegation) ---
    // Inga document-la click listen panrom, so idhu eppovumae work aagum
    document.addEventListener('click', function(e) {
        const deleteBtn = e.target.closest('.delete-trigger');
        
        if (deleteBtn) {
            e.preventDefault(); 

            const itemId = deleteBtn.getAttribute('data-id');
            const correctSeller = deleteBtn.getAttribute('data-seller');

            // 1. Verification Prompt
            let inputName = prompt("Security Check: Enter Seller Name to confirm deletion:");

            if (inputName === null) return; // Cancel check

            if (inputName.trim() === correctSeller) {
                if (confirm("Are you sure you want to permanently remove this item?")) {
                    // 2. Redirect to backend
                    window.location.href = "/delete/" + itemId;
                }
            } else {
                alert("❌ Incorrect Seller Name! Authorization failed.");
            }
        }
    });

    // --- 4. BUY ANIMATION LOGIC ---
    document.querySelectorAll('.btn-buy-confirm').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.card');
            
            card.style.transition = "all 0.5s ease";
            card.style.opacity = "0";
            card.style.transform = "scale(0.8)";
            
            setTimeout(() => {
                card.remove();
            }, 500);
        });
    });

});
app.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        const newUser = new User({ username, password });
        await newUser.save(); // Inga dhaan database-la save aagum
        console.log("User saved successfully:", username);
        res.redirect('/'); // Login page-ku poga
    } catch (err) {
        console.log("Signup Error:", err);
        res.send("Error during signup");
    }
});