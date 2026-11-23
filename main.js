// ===================================================================
// CCT HOTEL & RESORT - ADMIN DASHBOARD & BILLING MANAGEMENT (main.js)
// ===================================================================

document.addEventListener("DOMContentLoaded", () => {
    // ---------------------------------------------------------------
    // 1. Navigation & Routing (Dashboard vs Billing & Invoice)
    // ---------------------------------------------------------------
    const navItems = document.querySelectorAll(".navigation li[data-nav]");
    const navDashboard = document.getElementById("navDashboard");
    const navBilling = document.getElementById("navBilling");
    const dashboardView = document.getElementById("dashboardView");
    const billingView = document.getElementById("billingView");
    const topbarPageTitle = document.getElementById("topbarPageTitle");
    const topbarSwitchBtn = document.getElementById("topbarSwitchBtn");
    const topbarSwitchText = document.getElementById("topbarSwitchText");

    let activePage = "dashboard"; // "dashboard" | "billing"

    function switchPage(targetPage, updateHash = true) {
        if (targetPage !== "dashboard" && targetPage !== "billing") {
            targetPage = "dashboard";
        }
        activePage = targetPage;

        // Update active class on views
        if (dashboardView && billingView) {
            dashboardView.classList.toggle("active", targetPage === "dashboard");
            billingView.classList.toggle("active", targetPage === "billing");
        }

        // Update sidebar highlighted item
        navItems.forEach(item => {
            const pageName = item.dataset.nav;
            item.classList.toggle("hovered", pageName === targetPage);
        });

        // Update Topbar Title & Quick Nav Button
        if (topbarPageTitle) {
            topbarPageTitle.textContent = targetPage === "dashboard" ? "Dashboard" : "Billing & Invoice";
        }

        if (topbarSwitchText && topbarSwitchBtn) {
            if (targetPage === "dashboard") {
                topbarSwitchText.textContent = "Go to Billing & Invoice";
                topbarSwitchBtn.querySelector("ion-icon")?.setAttribute("name", "receipt-outline");
            } else {
                topbarSwitchText.textContent = "Go to Dashboard";
                topbarSwitchBtn.querySelector("ion-icon")?.setAttribute("name", "grid-outline");
            }
        }

        if (updateHash) {
            window.location.hash = targetPage;
        }

        // When switching to billing, make sure calculations and directory are fresh
        if (targetPage === "billing") {
            renderBillingPage();
        } else {
            updateDashboardMetrics();
            updateOccupancy();
        }
    }

    // Sidebar Click Listeners
    if (navDashboard) {
        navDashboard.addEventListener("click", (e) => {
            e.preventDefault();
            switchPage("dashboard");
        });
    }

    if (navBilling) {
        navBilling.addEventListener("click", (e) => {
            e.preventDefault();
            switchPage("billing");
        });
    }

    if (topbarSwitchBtn) {
        topbarSwitchBtn.addEventListener("click", () => {
            switchPage(activePage === "dashboard" ? "billing" : "dashboard");
        });
    }

    // Hashchange & Initial routing
    window.addEventListener("hashchange", () => {
        const hash = window.location.hash.replace("#", "").toLowerCase();
        if (hash === "billing") {
            switchPage("billing", false);
        } else if (hash === "dashboard") {
            switchPage("dashboard", false);
        }
    });

    // Check initial hash
    const initialHash = window.location.hash.replace("#", "").toLowerCase();
    if (initialHash === "billing") {
        switchPage("billing", false);
    } else {
        switchPage("dashboard", false);
    }

    // Dashboard jump links
    const cardBookings = document.getElementById("cardBookings");
    const cardRevenue = document.getElementById("cardRevenue");
    if (cardBookings) {
        cardBookings.addEventListener("click", () => switchPage("billing"));
    }
    if (cardRevenue) {
        cardRevenue.addEventListener("click", () => switchPage("billing"));
    }

    // Sidebar hover logic (keep active selection preserved)
    const list = document.querySelectorAll(".navigation li");
    list.forEach(item => {
        item.addEventListener("mouseover", function () {
            if (this.dataset.brand === "true") return;
            list.forEach(i => i.classList.remove("hovered"));
            this.classList.add("hovered");
        });

        item.addEventListener("mouseleave", function () {
            if (this.dataset.brand === "true") return;
            list.forEach(i => i.classList.remove("hovered"));
            // Restore current active page
            document.querySelector(`.navigation li[data-nav="${activePage}"]`)?.classList.add("hovered");
        });
    });

    // Sidebar menu toggle (collapse / expand)
    const toggle = document.querySelector(".toggle");
    const navigation = document.querySelector(".navigation");
    const main = document.querySelector(".main");

    if (toggle && navigation && main) {
        toggle.onclick = function () {
            navigation.classList.toggle("active");
            main.classList.toggle("active");
        };
    }

    // ---------------------------------------------------------------
    // 2. Occupancy Rate Calculation
    // ---------------------------------------------------------------
    function updateOccupancy() {
        const occupiedEl = document.getElementById("occOccupied");
        const totalEl = document.getElementById("occTotal");
        const percentEl = document.getElementById("occPercent");
        const fillBar = document.querySelector(".occupancy-fill");

        if (occupiedEl && totalEl && percentEl && fillBar) {
            const occupied = parseFloat(occupiedEl.textContent.trim()) || 0;
            const total = parseFloat(totalEl.textContent.trim()) || 1;
            const percent = total > 0 ? ((occupied / total) * 100).toFixed(1) : "0.0";
            percentEl.textContent = `${percent}%`;
            fillBar.style.width = `${percent}%`;
        }
    }

    // ---------------------------------------------------------------
    // 3. Billing & Invoices Data Store
    // ---------------------------------------------------------------
    const ROOM_RATES = {
        "Executive Suite": 7800,
        "Suite": 7800,
        "Deluxe Room": 4200,
        "Family Room": 5500,
        "Standard Room": 2500
    };

    const defaultGuestFolios = [
        {
            folioNo: "FOL-2026-894215",
            invoiceNo: "INV-2026-0842",
            issueDate: "Nov 21, 2026 · 11:38 AM",
            cashier: "Front Desk (Admin A-101)",
            guestName: "Maria Santos",
            email: "maria.santos@email.com",
            phone: "+63 917 123 4567",
            roomNumber: "Room 304",
            roomType: "Executive Suite",
            roomRate: 7800,
            stayDates: "Oct 15, 2026 – Oct 18, 2026",
            nights: 3,
            rooms: 1,
            occupancy: "2 Adults (2 Guests)",
            extraBeds: 0,
            incidentals: [
                { category: "Room Dining", desc: "Premium Breakfast Buffet (2 Guests x 3 Days)", rate: 450, qty: 6, total: 2700 },
                { category: "Wellness", desc: "CCT Signature Aromatherapy Spa Session", rate: 1800, qty: 1, total: 1800 },
                { category: "Transport", desc: "Airport Executive Van Private Transfer", rate: 1500, qty: 1, total: 1500 },
                { category: "Mini Bar", desc: "Mini Bar Snacks & Imported Beverages", rate: 650, qty: 1, total: 650 }
            ],
            discountPercent: 0.05, // 5% Gold Member Discount
            discountLabel: "Gold Member Tier Discount (5%)",
            payMethod: "Credit Card (Mastercard •••• 4821)",
            payRef: "AUTH-993821-CCT",
            status: "Paid"
        },
        {
            folioNo: "FOL-2026-773419",
            invoiceNo: "INV-2026-0843",
            issueDate: "Nov 20, 2026 · 02:15 PM",
            cashier: "Front Desk (Admin A-102)",
            guestName: "Juan Dela Cruz",
            email: "juan.delacruz@gmail.com",
            phone: "+63 918 555 7890",
            roomNumber: "Room 205",
            roomType: "Deluxe Room",
            roomRate: 4200,
            stayDates: "Nov 02, 2026 – Nov 04, 2026",
            nights: 2,
            rooms: 1,
            occupancy: "2 Adults, 1 Child (3 Guests)",
            extraBeds: 1,
            incidentals: [
                { category: "Dining", desc: "In-Room Gourmet Family Dinner Special", rate: 1450, qty: 1, total: 1450 },
                { category: "Beverage", desc: "Poolside Tropical Cocktails & Shakes", rate: 450, qty: 1, total: 450 }
            ],
            discountPercent: 0,
            discountLabel: "None",
            payMethod: "GCash Wallet",
            payRef: "GCASH-2026-991204",
            status: "Paid"
        },
        {
            folioNo: "FOL-2026-621840",
            invoiceNo: "INV-2026-0844",
            issueDate: "Nov 21, 2026 · 09:30 AM",
            cashier: "Front Desk (Admin A-101)",
            guestName: "Sarah Jenkins",
            email: "sarah.jenkins@outlook.com",
            phone: "+1 (415) 890-2134",
            roomNumber: "Room 102",
            roomType: "Standard Room",
            roomRate: 2500,
            stayDates: "Nov 19, 2026 – Nov 22, 2026",
            nights: 3,
            rooms: 1,
            occupancy: "1 Adult (1 Guest)",
            extraBeds: 0,
            incidentals: [
                { category: "Laundry", desc: "Express Business Pressing & Dry Clean", rate: 550, qty: 1, total: 550 },
                { category: "Business", desc: "High-Speed Conference Room Wi-Fi Pass", rate: 350, qty: 1, total: 350 }
            ],
            discountPercent: 0,
            discountLabel: "None",
            payMethod: "Cash (Pending Front Desk Settlement)",
            payRef: "PENDING-CHECKOUT",
            status: "Pending"
        },
        {
            folioNo: "FOL-2026-554190",
            invoiceNo: "INV-2026-0845",
            issueDate: "Nov 14, 2026 · 12:00 PM",
            cashier: "Front Desk (Admin A-103)",
            guestName: "Roberto Garcia",
            email: "r.garcia@corporation.ph",
            phone: "+63 920 334 1122",
            roomNumber: "Room 401",
            roomType: "Family Room",
            roomRate: 5500,
            stayDates: "Nov 10, 2026 – Nov 14, 2026",
            nights: 4,
            rooms: 1,
            occupancy: "4 Adults, 2 Children (6 Guests)",
            extraBeds: 2,
            incidentals: [
                { category: "Dining", desc: "Weekend Grand Family Buffet (6 Guests)", rate: 3200, qty: 1, total: 3200 },
                { category: "Transport", desc: "Airport Round-trip Shuttle Service", rate: 1800, qty: 1, total: 1800 },
                { category: "Recreation", desc: "Resort Arcade & Game Room Passes", rate: 800, qty: 1, total: 800 }
            ],
            discountPercent: 0,
            discountLabel: "None",
            payMethod: "Bank Transfer (BDO Unibank)",
            payRef: "BDO-FT-8830192",
            status: "Paid"
        },
        {
            folioNo: "FOL-2026-441209",
            invoiceNo: "INV-2026-0846",
            issueDate: "Nov 16, 2026 · 11:00 AM",
            cashier: "Front Desk (Admin A-102)",
            guestName: "Anna Patricia Reyes",
            email: "anna.reyes@techgroup.com",
            phone: "+63 908 776 2233",
            roomNumber: "Room 208",
            roomType: "Deluxe Room",
            roomRate: 4200,
            stayDates: "Nov 15, 2026 – Nov 16, 2026",
            nights: 1,
            rooms: 1,
            occupancy: "1 Adult (1 Guest)",
            extraBeds: 0,
            incidentals: [
                { category: "Dining", desc: "Continental Breakfast Room Service", rate: 650, qty: 1, total: 650 }
            ],
            discountPercent: 0,
            discountLabel: "None",
            payMethod: "Credit Card (Visa •••• 1920)",
            payRef: "AUTH-481920-VISA",
            status: "Paid"
        }
    ];

    // Read stored folios or load defaults + localStorage bookings
    function loadGuestFolios() {
        const saved = localStorage.getItem("cct_hotel_admin_folios");
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (err) {
                console.error("Error parsing saved folios:", err);
            }
        }

        // Merge any bookings from the Guest Portal (cct_guest_reservations)
        const guestBookings = JSON.parse(localStorage.getItem("cct_guest_reservations") || "[]");
        const folios = [...defaultGuestFolios];

        guestBookings.forEach((b, idx) => {
            if (!folios.some(f => f.folioNo === b.ref || f.guestName.toLowerCase() === b.fullName.toLowerCase())) {
                const roomType = b.roomType || "Standard Room";
                const rate = ROOM_RATES[roomType] || 3500;
                const nights = b.nights || 1;
                const isPaid = b.status?.toLowerCase() !== "pending" && b.status?.toLowerCase() !== "cancelled";

                folios.unshift({
                    folioNo: b.ref || `FOL-2026-${Math.floor(100000 + Math.random() * 900000)}`,
                    invoiceNo: `INV-2026-0${850 + idx}`,
                    issueDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) + " · 10:00 AM",
                    cashier: "Front Desk (Admin A-101)",
                    guestName: b.fullName || "Valued Guest",
                    email: "guest.portal@ccthotel.com",
                    phone: "+63 917 000 0000",
                    roomNumber: `Room ${100 + idx}`,
                    roomType: roomType,
                    roomRate: rate,
                    stayDates: b.stayDates || "Current Stay",
                    nights: nights,
                    rooms: 1,
                    occupancy: b.guestCount || "1 Adult",
                    extraBeds: 0,
                    incidentals: [
                        { category: "Dining", desc: "Welcome Complimentary Drink & Breakfast", rate: 0, qty: 1, total: 0 }
                    ],
                    discountPercent: 0,
                    discountLabel: "None",
                    payMethod: isPaid ? "Online Settlement (Guest Portal)" : "Cash / Pending Settlement",
                    payRef: isPaid ? `TXN-${b.ref}` : "PENDING-FRONTDESK",
                    status: isPaid ? "Paid" : "Pending"
                });
            }
        });

        saveFolios(folios);
        return folios;
    }

    function saveFolios(folios) {
        localStorage.setItem("cct_hotel_admin_folios", JSON.stringify(folios));
    }

    let allFolios = loadGuestFolios();
    let selectedFolioId = allFolios[0]?.folioNo || "";
    let currentFilter = "all"; // "all" | "paid" | "pending"
    let searchQuery = "";

    // ---------------------------------------------------------------
    // 4. Calculations Engine
    // ---------------------------------------------------------------
    function peso(num) {
        return "₱" + Number(num || 0).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function calculateFolioCosts(folio) {
        const roomTotal = (folio.roomRate || 0) * (folio.nights || 1) * (folio.rooms || 1);
        const extraBedTotal = (folio.extraBeds || 0) * 500 * (folio.nights || 1);
        const baseAccommodation = roomTotal + extraBedTotal;

        const incidentalsTotal = (folio.incidentals || []).reduce((acc, item) => {
            const line = (item.rate || 0) * (item.qty || 1);
            return acc + line;
        }, 0);

        const netSubtotal = baseAccommodation + incidentalsTotal;
        const vatAmount = Math.round(netSubtotal * 0.12 * 100) / 100; // 12% VAT
        const serviceCharge = Math.round(netSubtotal * 0.10 * 100) / 100; // 10% Hotel Service Charge
        const discountAmount = Math.round(netSubtotal * (folio.discountPercent || 0) * 100) / 100;

        const grandTotal = Math.round((netSubtotal + vatAmount + serviceCharge - discountAmount) * 100) / 100;
        const balanceDue = folio.status.toLowerCase() === "paid" ? 0 : grandTotal;

        return {
            roomTotal,
            extraBedTotal,
            baseAccommodation,
            incidentalsTotal,
            netSubtotal,
            vatAmount,
            serviceCharge,
            discountAmount,
            grandTotal,
            balanceDue
        };
    }

    // ---------------------------------------------------------------
    // 5. Render Billing Page (Directory + Receipt + Metrics)
    // ---------------------------------------------------------------
    function renderBillingPage() {
        updateBillingMetrics();
        renderInvoicesDirectory();
        renderActiveReceipt();
    }

    // Metrics Bar
    function updateBillingMetrics() {
        let totalBilled = 0;
        let totalSettled = 0;
        let totalPending = 0;
        let paidCount = 0;
        let pendingCount = 0;

        allFolios.forEach(folio => {
            const cost = calculateFolioCosts(folio);
            totalBilled += cost.grandTotal;
            if (folio.status.toLowerCase() === "paid") {
                totalSettled += cost.grandTotal;
                paidCount++;
            } else {
                totalPending += cost.grandTotal;
                pendingCount++;
            }
        });

        // Billing View Metric Cards
        const metricTotalBilled = document.getElementById("metricTotalBilled");
        const metricTotalCollected = document.getElementById("metricTotalCollected");
        const metricPendingAmount = document.getElementById("metricPendingAmount");
        const metricTotalFolios = document.getElementById("metricTotalFolios");
        const metricSettledCount = document.getElementById("metricSettledCount");
        const metricPendingCount = document.getElementById("metricPendingCount");
        const badgeTotalFolios = document.getElementById("badgeTotalFolios");

        if (metricTotalBilled) metricTotalBilled.textContent = peso(totalBilled);
        if (metricTotalCollected) metricTotalCollected.textContent = peso(totalSettled);
        if (metricPendingAmount) metricPendingAmount.textContent = peso(totalPending);
        if (metricTotalFolios) metricTotalFolios.textContent = allFolios.length;
        if (metricSettledCount) metricSettledCount.textContent = `${paidCount} folios paid`;
        if (metricPendingCount) metricPendingCount.textContent = `${pendingCount} folios pending`;
        if (badgeTotalFolios) badgeTotalFolios.textContent = allFolios.length;

        // Directory filter counts
        const countAll = document.getElementById("countAll");
        const countPaid = document.getElementById("countPaid");
        const countPending = document.getElementById("countPending");
        if (countAll) countAll.textContent = allFolios.length;
        if (countPaid) countPaid.textContent = paidCount;
        if (countPending) countPending.textContent = pendingCount;
    }

    function updateDashboardMetrics() {
        const dashRevenue = document.getElementById("dashRevenue");
        const dashBookings = document.getElementById("dashBookings");
        const dashCurrentGuests = document.getElementById("dashCurrentGuests");
        const occOccupied = document.getElementById("occOccupied");

        let totalSettled = 0;
        allFolios.forEach(f => {
            if (f.status.toLowerCase() === "paid") {
                totalSettled += calculateFolioCosts(f).grandTotal;
            }
        });

        if (dashRevenue) dashRevenue.textContent = "₱" + Math.round(totalSettled).toLocaleString("en-PH");
        if (dashBookings) dashBookings.textContent = allFolios.length;
        if (dashCurrentGuests) dashCurrentGuests.textContent = Math.min(allFolios.length, 5);
        if (occOccupied) occOccupied.textContent = Math.min(allFolios.length, 5);
    }

    // Invoices Directory (Left Column)
    function renderInvoicesDirectory() {
        const invoicesList = document.getElementById("invoicesList");
        if (!invoicesList) return;

        const filtered = allFolios.filter(folio => {
            const matchesFilter =
                currentFilter === "all" || folio.status.toLowerCase() === currentFilter.toLowerCase();
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                folio.guestName.toLowerCase().includes(q) ||
                folio.roomNumber.toLowerCase().includes(q) ||
                folio.roomType.toLowerCase().includes(q) ||
                folio.folioNo.toLowerCase().includes(q) ||
                folio.invoiceNo.toLowerCase().includes(q);
            return matchesFilter && matchesSearch;
        });

        if (filtered.length === 0) {
            invoicesList.innerHTML = `
                <div style="text-align: center; padding: 35px 20px; color: #94a3b8;">
                    <ion-icon name="document-text-outline" style="font-size: 2.2rem; margin-bottom: 6px;"></ion-icon>
                    <p style="font-size: 0.88rem; font-weight: 500;">No guest folios match your criteria</p>
                </div>
            `;
            return;
        }

        // If selectedFolioId is not in the filtered list, pick the first one
        if (!filtered.some(f => f.folioNo === selectedFolioId)) {
            selectedFolioId = filtered[0].folioNo;
        }

        invoicesList.innerHTML = filtered.map(folio => {
            const costs = calculateFolioCosts(folio);
            const isSelected = folio.folioNo === selectedFolioId;
            const isPaid = folio.status.toLowerCase() === "paid";

            return `
                <div class="invoice-card ${isSelected ? 'is-selected' : ''}" data-folio="${folio.folioNo}">
                    <div class="card-top-row">
                        <span class="card-room-badge">${folio.roomNumber} · ${folio.roomType}</span>
                        <span class="card-status-badge ${isPaid ? 'paid' : 'pending'}">${folio.status}</span>
                    </div>
                    <div class="card-guest-name">${folio.guestName}</div>
                    <div class="card-meta-line font-mono">
                        <span>${folio.folioNo}</span>
                        <span>${folio.stayDates.split("–")[0]?.trim() || ""}</span>
                    </div>
                    <div class="card-bottom-row">
                        <span class="card-nights">${folio.nights} Night${folio.nights > 1 ? 's' : ''} stay</span>
                        <strong class="card-amount">${peso(costs.grandTotal)}</strong>
                    </div>
                </div>
            `;
        }).join("");

        // Attach click listeners to cards
        invoicesList.querySelectorAll(".invoice-card").forEach(card => {
            card.addEventListener("click", () => {
                selectedFolioId = card.dataset.folio;
                renderInvoicesDirectory();
                renderActiveReceipt();
            });
        });
    }

    // Receipt-like UI (Right Column)
    function renderActiveReceipt() {
        const folio = allFolios.find(f => f.folioNo === selectedFolioId) || allFolios[0];
        if (!folio) return;

        const costs = calculateFolioCosts(folio);
        const isPaid = folio.status.toLowerCase() === "paid";

        // Active Folio Pill & Toggle Button Text
        const activeFolioPillText = document.getElementById("activeFolioPillText");
        const togglePaidBtnText = document.getElementById("togglePaidBtnText");
        if (activeFolioPillText) activeFolioPillText.textContent = `Folio #${folio.folioNo}`;
        if (togglePaidBtnText) togglePaidBtnText.textContent = isPaid ? "Mark as Pending" : "Mark as Settled (Paid)";

        // Stamp
        const receiptStamp = document.getElementById("receiptStamp");
        if (receiptStamp) {
            receiptStamp.textContent = isPaid ? "PAID & SETTLED" : "PAYMENT PENDING";
            receiptStamp.className = `receipt-stamp ${isPaid ? 'is-paid' : 'is-pending'}`;
        }

        // Meta
        const recFolioNo = document.getElementById("recFolioNo");
        const recInvoiceNo = document.getElementById("recInvoiceNo");
        const recIssueDate = document.getElementById("recIssueDate");
        const recCashier = document.getElementById("recCashier");
        if (recFolioNo) recFolioNo.textContent = folio.folioNo;
        if (recInvoiceNo) recInvoiceNo.textContent = folio.invoiceNo;
        if (recIssueDate) recIssueDate.textContent = folio.issueDate || new Date().toLocaleString();
        if (recCashier) recCashier.textContent = folio.cashier || "Front Desk (Admin A-101)";

        // Guest details
        const recGuestName = document.getElementById("recGuestName");
        const recGuestEmail = document.getElementById("recGuestEmail");
        const recGuestPhone = document.getElementById("recGuestPhone");
        const recRoomAllocated = document.getElementById("recRoomAllocated");
        const recStayDates = document.getElementById("recStayDates");
        const recStayNights = document.getElementById("recStayNights");

        if (recGuestName) recGuestName.textContent = folio.guestName;
        if (recGuestEmail) recGuestEmail.textContent = folio.email;
        if (recGuestPhone) recGuestPhone.textContent = folio.phone;
        if (recRoomAllocated) recRoomAllocated.textContent = `${folio.roomNumber} (${folio.roomType})`;
        if (recStayDates) recStayDates.textContent = folio.stayDates;
        if (recStayNights) recStayNights.textContent = `${folio.nights} Night${folio.nights > 1 ? 's' : ''} · ${folio.occupancy}`;

        // Table Rows Generation
        const tbody = document.getElementById("receiptTableBody");
        if (tbody) {
            let rowCounter = 1;
            let rowsHtml = "";

            // 1. Room Accommodation Row
            rowsHtml += `
                <tr>
                    <td class="col-num">${rowCounter++}</td>
                    <td class="col-item">
                        <strong>Room Stay: ${folio.roomType}</strong>
                        <div style="font-size: 0.74rem; color: #64748b;">${folio.roomNumber} · Base accommodation rate</div>
                    </td>
                    <td class="col-rate">${peso(folio.roomRate)}</td>
                    <td class="col-qty">${folio.nights} Night${folio.nights > 1 ? 's' : ''}</td>
                    <td class="col-total">${peso(costs.roomTotal)}</td>
                </tr>
            `;

            // 2. Extra Bed Row (if any)
            if (folio.extraBeds > 0) {
                rowsHtml += `
                    <tr>
                        <td class="col-num">${rowCounter++}</td>
                        <td class="col-item">
                            <strong>Extra Rollaway Bed</strong>
                            <div style="font-size: 0.74rem; color: #64748b;">₱500 per bed / night</div>
                        </td>
                        <td class="col-rate">${peso(500)}</td>
                        <td class="col-qty">${folio.extraBeds} Bed(s) × ${folio.nights} N</td>
                        <td class="col-total">${peso(costs.extraBedTotal)}</td>
                    </tr>
                `;
            }

            // 3. Incidentals Rows
            (folio.incidentals || []).forEach(inc => {
                const lineTotal = (inc.rate || 0) * (inc.qty || 1);
                rowsHtml += `
                    <tr>
                        <td class="col-num">${rowCounter++}</td>
                        <td class="col-item">
                            <strong>${inc.category}: ${inc.desc}</strong>
                        </td>
                        <td class="col-rate">${peso(inc.rate)}</td>
                        <td class="col-qty">${inc.qty}</td>
                        <td class="col-total">${peso(lineTotal)}</td>
                    </tr>
                `;
            });

            tbody.innerHTML = rowsHtml;
        }

        // Totals Breakdown Summary
        const recRoomCharges = document.getElementById("recRoomCharges");
        const recExtraBedCharges = document.getElementById("recExtraBedCharges");
        const recIncidentalCharges = document.getElementById("recIncidentalCharges");
        const recSubtotal = document.getElementById("recSubtotal");
        const recVat = document.getElementById("recVat");
        const recServiceCharge = document.getElementById("recServiceCharge");
        const recDiscountRow = document.getElementById("recDiscountRow");
        const recDiscount = document.getElementById("recDiscount");
        const recGrandTotal = document.getElementById("recGrandTotal");

        if (recRoomCharges) recRoomCharges.textContent = peso(costs.roomTotal);
        if (recExtraBedCharges) recExtraBedCharges.textContent = peso(costs.extraBedTotal);
        if (recIncidentalCharges) recIncidentalCharges.textContent = peso(costs.incidentalsTotal);
        if (recSubtotal) recSubtotal.textContent = peso(costs.netSubtotal);
        if (recVat) recVat.textContent = peso(costs.vatAmount);
        if (recServiceCharge) recServiceCharge.textContent = peso(costs.serviceCharge);

        if (recDiscountRow && recDiscount) {
            if (costs.discountAmount > 0) {
                recDiscountRow.style.display = "flex";
                recDiscount.textContent = `-${peso(costs.discountAmount)}`;
            } else {
                recDiscountRow.style.display = "none";
            }
        }

        if (recGrandTotal) recGrandTotal.textContent = peso(costs.grandTotal);

        // Payment Settlement Details
        const recPayMethod = document.getElementById("recPayMethod");
        const recPayRef = document.getElementById("recPayRef");
        const recPayStatus = document.getElementById("recPayStatus");
        const recBalanceDue = document.getElementById("recBalanceDue");

        if (recPayMethod) recPayMethod.textContent = folio.payMethod;
        if (recPayRef) recPayRef.textContent = folio.payRef;
        if (recPayStatus) {
            recPayStatus.textContent = isPaid ? "PAID IN FULL" : "PAYMENT PENDING";
            recPayStatus.className = `pay-v ${isPaid ? 'status-tag-settled' : 'status-tag-pending'}`;
        }
        if (recBalanceDue) {
            recBalanceDue.textContent = peso(costs.balanceDue);
            recBalanceDue.className = `pay-v ${isPaid ? 'balance-zero font-mono' : 'balance-due font-mono'}`;
        }

        // Barcode text
        const recBarcodeText = document.getElementById("recBarcodeText");
        if (recBarcodeText) recBarcodeText.textContent = `*CCT-${folio.folioNo.replace(/\D/g, "") || "894215"}*`;
    }

    // ---------------------------------------------------------------
    // 6. Search & Tab Filter Listeners
    // ---------------------------------------------------------------
    const searchInput = document.getElementById("invoiceSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            renderInvoicesDirectory();
            renderActiveReceipt();
        });
    }

    const dirTabs = document.querySelectorAll(".dir-tab");
    dirTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            dirTabs.forEach(t => t.classList.remove("is-active"));
            tab.classList.add("is-active");
            currentFilter = tab.dataset.filter || "all";
            renderInvoicesDirectory();
            renderActiveReceipt();
        });
    });

    // ---------------------------------------------------------------
    // 7. Incidental Charges Modal & Creation
    // ---------------------------------------------------------------
    const addChargeModal = document.getElementById("addChargeModal");
    const closeAddChargeModal = document.getElementById("closeAddChargeModal");
    const cancelAddChargeBtn = document.getElementById("cancelAddChargeBtn");
    const addChargeForm = document.getElementById("addChargeForm");
    const addChargeReceiptBtn = document.getElementById("addChargeReceiptBtn");
    const headAddChargeBtn = document.getElementById("headAddChargeBtn");

    function openChargeModal() {
        if (addChargeModal) {
            addChargeModal.classList.add("is-active");
            document.getElementById("chargeDescription")?.focus();
        }
    }

    function closeChargeModalFunc() {
        if (addChargeModal) {
            addChargeModal.classList.remove("is-active");
            addChargeForm?.reset();
        }
    }

    if (addChargeReceiptBtn) addChargeReceiptBtn.addEventListener("click", openChargeModal);
    if (headAddChargeBtn) headAddChargeBtn.addEventListener("click", openChargeModal);
    if (closeAddChargeModal) closeAddChargeModal.addEventListener("click", closeChargeModalFunc);
    if (cancelAddChargeBtn) cancelAddChargeBtn.addEventListener("click", closeChargeModalFunc);

    if (addChargeModal) {
        addChargeModal.addEventListener("click", (e) => {
            if (e.target === addChargeModal) closeChargeModalFunc();
        });
    }

    if (addChargeForm) {
        addChargeForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const category = document.getElementById("chargeCategory")?.value || "Incidental Service";
            const desc = document.getElementById("chargeDescription")?.value.trim() || "Incidental Item";
            const rate = parseFloat(document.getElementById("chargeRate")?.value) || 0;
            const qty = parseInt(document.getElementById("chargeQty")?.value, 10) || 1;

            const target = allFolios.find(f => f.folioNo === selectedFolioId);
            if (!target) return;

            if (!target.incidentals) target.incidentals = [];
            target.incidentals.push({
                category: category.split("/")[0].trim(),
                desc: desc,
                rate: rate,
                qty: qty,
                total: rate * qty
            });

            saveFolios(allFolios);
            closeChargeModalFunc();
            renderBillingPage();
            showToast(`Added "${desc}" (₱${(rate * qty).toLocaleString()}) to ${target.guestName}'s folio`);
        });
    }

    // ---------------------------------------------------------------
    // 8. Toggle Paid Status Action
    // ---------------------------------------------------------------
    const togglePaidStatusBtn = document.getElementById("togglePaidStatusBtn");
    if (togglePaidStatusBtn) {
        togglePaidStatusBtn.addEventListener("click", () => {
            const target = allFolios.find(f => f.folioNo === selectedFolioId);
            if (!target) return;

            const newStatus = target.status.toLowerCase() === "paid" ? "Pending" : "Paid";
            target.status = newStatus;
            saveFolios(allFolios);
            renderBillingPage();
            showToast(`Folio #${target.folioNo} marked as ${newStatus.toUpperCase()}`);
        });
    }

    // ---------------------------------------------------------------
    // 9. Print Receipt Action
    // ---------------------------------------------------------------
    const printReceiptBtn = document.getElementById("printReceiptBtn");
    if (printReceiptBtn) {
        printReceiptBtn.addEventListener("click", () => {
            window.print();
        });
    }

    // ---------------------------------------------------------------
    // 10. Download Text Folio Action
    // ---------------------------------------------------------------
    const downloadReceiptBtn = document.getElementById("downloadReceiptBtn");
    if (downloadReceiptBtn) {
        downloadReceiptBtn.addEventListener("click", () => {
            const folio = allFolios.find(f => f.folioNo === selectedFolioId);
            if (!folio) return;

            const costs = calculateFolioCosts(folio);
            const lines = [
                "==================================================================",
                "                  CCT HOTEL & RESORT                            ",
                "         OFFICIAL GUEST FOLIO & STATEMENT OF ACCOUNT             ",
                "==================================================================",
                `Folio Reference : ${folio.folioNo}`,
                `Tax Invoice No  : ${folio.invoiceNo}`,
                `Date & Time     : ${folio.issueDate}`,
                `Cashier Desk    : ${folio.cashier}`,
                "------------------------------------------------------------------",
                "GUEST & STAY PARTICULARS:",
                `Primary Guest   : ${folio.guestName}`,
                `Email Address   : ${folio.email}`,
                `Contact Number  : ${folio.phone}`,
                `Room Allocated  : ${folio.roomNumber} (${folio.roomType})`,
                `Period of Stay  : ${folio.stayDates} (${folio.nights} Night${folio.nights > 1 ? 's' : ''})`,
                `Guest Occupancy : ${folio.occupancy}`,
                "------------------------------------------------------------------",
                "ITEMIZED COST BREAKDOWN:",
                `1. Room Stay (${folio.roomType}) : ${peso(costs.roomTotal)} [${peso(folio.roomRate)} x ${folio.nights}N]`,
                folio.extraBeds > 0 ? `2. Extra Rollaway Bed(s)    : ${peso(costs.extraBedTotal)} [${folio.extraBeds} Bed(s)]` : null,
                ...(folio.incidentals || []).map((inc, i) =>
                    `   - ${inc.category}: ${inc.desc} (${inc.qty}x @ ${peso(inc.rate)}) : ${peso(inc.rate * inc.qty)}`
                ),
                "------------------------------------------------------------------",
                "FINANCIAL TOTALS & CHARGES:",
                `Net Subtotal (Before Tax)   : ${peso(costs.netSubtotal)}`,
                `12% Value Added Tax (VAT)   : ${peso(costs.vatAmount)}`,
                `10% Hotel Service Charge    : ${peso(costs.serviceCharge)}`,
                costs.discountAmount > 0 ? `Loyalty / Member Discount   : -${peso(costs.discountAmount)}` : null,
                "==================================================================",
                `TOTAL GUEST CHARGES         : ${peso(costs.grandTotal)}`,
                `Settlement Status           : ${folio.status.toUpperCase()}`,
                `Payment Method              : ${folio.payMethod}`,
                `Transaction Reference       : ${folio.payRef}`,
                `Remaining Balance Due       : ${peso(costs.balanceDue)}`,
                "==================================================================",
                "Thank you for staying at CCT Hotel & Resort!",
                "For billing questions, please contact front desk within 30 days.",
                "=================================================================="
            ].filter(Boolean).join("\r\n");

            const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${folio.folioNo}-Official-Receipt.txt`;
            a.click();
            URL.revokeObjectURL(url);
            showToast(`Downloaded folio ${folio.folioNo}`);
        });
    }

    // ---------------------------------------------------------------
    // 11. Toast Notification Helper
    // ---------------------------------------------------------------
    const toast = document.getElementById("adminToast");
    const toastMsg = document.getElementById("toastMsg");
    let toastTimeout = null;

    function showToast(message) {
        if (!toast || !toastMsg) return;
        toastMsg.textContent = message;
        toast.classList.add("is-show");

        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove("is-show");
        }, 3200);
    }

    // Initialize Dashboard occupancy & metrics on load
    updateOccupancy();
    updateDashboardMetrics();
});
