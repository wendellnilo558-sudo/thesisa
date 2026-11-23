// CCT Hotel - Member & Renter Dashboard Logic (member-dashboard.js)
document.addEventListener("DOMContentLoaded", () => {
    // ----------------------------------------------------
    // Member Session Data
    // ----------------------------------------------------
    const session = JSON.parse(localStorage.getItem("cct_member_session") || "null") || {
        name: "Maria Santos",
        email: "maria.santos@email.com",
        tier: "CCT Gold Member"
    };

    // Update header & welcome texts
    const headerMemberName = document.getElementById("headerMemberName");
    const welcomeHeading = document.getElementById("welcomeHeading");
    if (headerMemberName) headerMemberName.textContent = session.name;
    if (welcomeHeading) {
        const firstName = session.name.split(" ")[0] || "Member";
        welcomeHeading.textContent = `Welcome back, ${firstName}!`;
    }

    // Sign out handler
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("cct_member_session");
            window.location.href = "home.html";
        });
    }

    // ----------------------------------------------------
    // Member Reservations Storage & Default Data
    // ----------------------------------------------------
    const defaultReservations = [
        {
            ref: "CCT-2026-894215",
            fullName: session.name,
            stayDates: "Oct 15, 2026 – Oct 18, 2026",
            nights: 3,
            roomType: "Executive Suite",
            guestCount: "2 Adults (2 Guests)",
            status: "Pending"
        },
        {
            ref: "CCT-2026-773419",
            fullName: session.name,
            stayDates: "Nov 02, 2026 – Nov 04, 2026",
            nights: 2,
            roomType: "Deluxe Room",
            guestCount: "2 Adults, 1 Child (3 Guests)",
            status: "Pending"
        },
        {
            ref: "CCT-2026-441209",
            fullName: session.name,
            stayDates: "Aug 20, 2026 – Aug 23, 2026",
            nights: 3,
            roomType: "Standard Room",
            guestCount: "1 Adult (1 Guest)",
            status: "Completed"
        },
        {
            ref: "CCT-2026-319854",
            fullName: session.name,
            stayDates: "Jul 10, 2026 – Jul 14, 2026",
            nights: 4,
            roomType: "Family Room",
            guestCount: "4 Adults, 2 Children (6 Guests)",
            status: "Completed"
        }
    ];

    // Read any newly created bookings from localStorage
    function getAllReservations() {
        const local = JSON.parse(localStorage.getItem("cct_guest_reservations") || "[]");
        // Combine newly booked reservations with defaults (avoiding ref duplicates)
        const combined = [...local, ...defaultReservations];
        const unique = [];
        const seen = new Set();
        for (const item of combined) {
            if (!seen.has(item.ref)) {
                seen.add(item.ref);
                unique.push(item);
            }
        }
        return unique;
    }

    let allReservations = getAllReservations();
    let currentFilter = "all";
    let searchQuery = "";

    // ----------------------------------------------------
    // Render Counters & Stats
    // ----------------------------------------------------
    function updateCounters() {
        const total = allReservations.length;
        const pending = allReservations.filter((r) => r.status.toLowerCase() === "pending").length;
        const completed = allReservations.filter((r) => r.status.toLowerCase() === "completed").length;
        const cancelled = allReservations.filter((r) => r.status.toLowerCase() === "cancelled").length;

        // Banner pills
        const statTotal = document.getElementById("statTotal");
        const statPending = document.getElementById("statPending");
        const statCompleted = document.getElementById("statCompleted");
        const statCancelled = document.getElementById("statCancelled");
        if (statTotal) statTotal.textContent = total;
        if (statPending) statPending.textContent = pending;
        if (statCompleted) statCompleted.textContent = completed;
        if (statCancelled) statCancelled.textContent = cancelled;

        // Tab badges
        const badgeAll = document.getElementById("badgeAll");
        const badgePending = document.getElementById("badgePending");
        const badgeCompleted = document.getElementById("badgeCompleted");
        const badgeCancelled = document.getElementById("badgeCancelled");
        if (badgeAll) badgeAll.textContent = total;
        if (badgePending) badgePending.textContent = pending;
        if (badgeCompleted) badgeCompleted.textContent = completed;
        if (badgeCancelled) badgeCancelled.textContent = cancelled;
    }

    // ----------------------------------------------------
    // Render Reservations Grid
    // ----------------------------------------------------
    const grid = document.getElementById("reservationsGrid");
    const emptyState = document.getElementById("emptyState");
    const resultCount = document.getElementById("resultCount");

    function renderList() {
        const filtered = allReservations.filter((res) => {
            const matchesFilter =
                currentFilter === "all" || res.status.toLowerCase() === currentFilter.toLowerCase();
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                res.ref.toLowerCase().includes(q) ||
                res.roomType.toLowerCase().includes(q) ||
                res.fullName.toLowerCase().includes(q);
            return matchesFilter && matchesSearch;
        });

        if (resultCount) {
            const label = currentFilter === "all" ? "all" : currentFilter;
            resultCount.textContent = `Showing ${filtered.length} ${label} reservation${filtered.length === 1 ? "" : "s"}`;
        }

        if (filtered.length === 0) {
            if (grid) grid.innerHTML = "";
            if (emptyState) emptyState.style.display = "block";
            return;
        }

        if (emptyState) emptyState.style.display = "none";

        if (grid) {
            grid.innerHTML = filtered
                .map((res) => {
                    const st = res.status.toLowerCase();
                    let statusClass = "status-completed";
                    let statusIcon = "checkmark-circle-outline";
                    let statusLabel = "Completed Stay";

                    if (st === "pending") {
                        statusClass = "status-pending";
                        statusIcon = "hourglass-outline";
                        statusLabel = "Pending Confirmation";
                    } else if (st === "cancelled") {
                        statusClass = "status-cancelled";
                        statusIcon = "close-circle-outline";
                        statusLabel = "Cancelled Stay";
                    }

                    const canCancel = st === "pending";

                    return `
                    <article class="res-card">
                        <!-- Top Header: Unique Booking Reference & Status -->
                        <div class="res-card-top">
                            <div class="ref-group">
                                <span class="ref-label">Booking Reference</span>
                                <span class="ref-code">${res.ref}</span>
                            </div>
                            <span class="status-pill ${statusClass}">
                                <ion-icon name="${statusIcon}"></ion-icon>
                                <span>${statusLabel}</span>
                            </span>
                        </div>

                        <!-- 5 Required Details List -->
                        <div class="res-details-list">
                            <!-- 1. Full Name -->
                            <div class="detail-item">
                                <div class="detail-icon"><ion-icon name="person-outline"></ion-icon></div>
                                <div class="detail-meta">
                                    <span class="detail-label">Guest Full Name</span>
                                    <span class="detail-value">${res.fullName}</span>
                                </div>
                            </div>

                            <!-- 2. Date of Stay and How Many Nights -->
                            <div class="detail-item">
                                <div class="detail-icon"><ion-icon name="calendar-outline"></ion-icon></div>
                                <div class="detail-meta">
                                    <span class="detail-label">Date of Stay & Duration</span>
                                    <span class="detail-value">${res.stayDates} · <strong>${res.nights} Night${res.nights > 1 ? "s" : ""}</strong></span>
                                </div>
                            </div>

                            <!-- 3. Room Type -->
                            <div class="detail-item">
                                <div class="detail-icon"><ion-icon name="bed-outline"></ion-icon></div>
                                <div class="detail-meta">
                                    <span class="detail-label">Room Category</span>
                                    <span class="detail-value">${res.roomType}</span>
                                </div>
                            </div>

                            <!-- 4. Count of the Guests -->
                            <div class="detail-item">
                                <div class="detail-icon"><ion-icon name="people-outline"></ion-icon></div>
                                <div class="detail-meta">
                                    <span class="detail-label">Guest Occupancy</span>
                                    <span class="detail-value">${res.guestCount}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Card Footer -->
                        <div class="res-card-footer">
                            <button type="button" class="action-copy-ref" data-copy="${res.ref}">
                                <ion-icon name="copy-outline"></ion-icon>
                                <span>Copy Code</span>
                            </button>
                            ${canCancel ? `
                            <button type="button" class="action-cancel-stay" data-cancel-ref="${res.ref}">
                                <ion-icon name="close-circle-outline"></ion-icon>
                                <span>Cancel Stay</span>
                            </button>
                            ` : `<span class="view-receipt-link">${st === 'cancelled' ? 'No charges' : 'Verified Stay'}</span>`}
                        </div>
                    </article>
                    `;
                })
                .join("");
        }

        // Attach copy listeners
        grid.querySelectorAll("[data-copy]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const code = btn.dataset.copy;
                navigator.clipboard?.writeText(code);
                const span = btn.querySelector("span");
                if (span) {
                    const original = span.textContent;
                    span.textContent = "Copied!";
                    setTimeout(() => (span.textContent = original), 1500);
                }
            });
        });

        // Attach direct cancel listeners
        grid.querySelectorAll("[data-cancel-ref]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const targetRef = btn.dataset.cancelRef;
                const confirmCancel = confirm(`Are you sure you want to cancel reservation ${targetRef}?`);
                if (confirmCancel) {
                    let stored = JSON.parse(localStorage.getItem("cct_guest_reservations") || "[]");
                    let found = false;

                    stored = stored.map((item) => {
                        if (item.ref === targetRef) {
                            found = true;
                            return { ...item, status: "Cancelled", cancelledAt: new Date().toISOString() };
                        }
                        return item;
                    });

                    if (!found) {
                        const target = allReservations.find((r) => r.ref === targetRef);
                        if (target) {
                            stored.unshift({ ...target, status: "Cancelled", cancelledAt: new Date().toISOString() });
                        }
                    }

                    localStorage.setItem("cct_guest_reservations", JSON.stringify(stored));
                    allReservations = getAllReservations();
                    updateCounters();
                    renderList();
                    alert(`Reservation ${targetRef} has been cancelled.`);
                }
            });
        });
    }

    // ----------------------------------------------------
    // Tab Switching
    // ----------------------------------------------------
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            tabBtns.forEach((b) => b.classList.remove("is-active"));
            btn.classList.add("is-active");
            currentFilter = btn.dataset.filter || "all";
            renderList();
        });
    });

    // Also support clicking stat pills in welcome card
    document.querySelectorAll(".stat-pill[data-filter]").forEach((pill) => {
        pill.addEventListener("click", () => {
            const filter = pill.dataset.filter;
            tabBtns.forEach((b) => {
                b.classList.toggle("is-active", b.dataset.filter === filter);
            });
            currentFilter = filter;
            renderList();
        });
    });

    // ----------------------------------------------------
    // Search Filter
    // ----------------------------------------------------
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            renderList();
        });
    }

    // Initial load
    updateCounters();
    renderList();
});
