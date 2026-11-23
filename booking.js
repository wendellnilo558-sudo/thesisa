// CCT Hotel - Guest Reservation Wizard Logic (booking.js)
(function () {
    const form = document.getElementById("reservationForm");
    if (!form) return;

    const panels = Array.from(form.querySelectorAll(".panel"));
    const stepperItems = Array.from(document.querySelectorAll("#stepper .step"));
    let currentStep = 1;
    const totalSteps = panels.length;

    const state = {
        counts: { numRooms: 1, numAdults: 2, numChildren: 0, extraBeds: 0 },
        paymentMethod: "Bank Transfer"
    };

    const peso = (n) => "₱" + Number(n || 0).toLocaleString("en-PH", { maximumFractionDigits: 0 });

    // ----------------------------------------------------
    // Read URL Parameters (Pre-selection from Landing Page)
    // ----------------------------------------------------
    function initUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const roomParam = params.get("room");
        const arrivalParam = params.get("arrival");
        const departureParam = params.get("departure");
        const adultsParam = params.get("adults");

        const roomSelect = document.getElementById("roomType");
        if (roomParam && roomSelect) {
            for (let i = 0; i < roomSelect.options.length; i++) {
                if (roomSelect.options[i].value.toLowerCase() === roomParam.toLowerCase()) {
                    roomSelect.selectedIndex = i;
                    break;
                }
            }
        }

        const arrivalEl = document.getElementById("arrivalDate");
        const departureEl = document.getElementById("departureDate");

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const toIso = (d) => d.toISOString().split("T")[0];

        if (arrivalEl) {
            arrivalEl.min = toIso(today);
            arrivalEl.value = arrivalParam && arrivalParam >= toIso(today) ? arrivalParam : toIso(today);
        }

        if (departureEl) {
            departureEl.min = toIso(tomorrow);
            departureEl.value = departureParam && departureParam > (arrivalEl?.value || "") ? departureParam : toIso(tomorrow);
        }

        if (adultsParam && state.counts) {
            const count = Math.max(1, parseInt(adultsParam, 10) || 1);
            state.counts.numAdults = count;
            const input = document.getElementById("numAdults");
            if (input) input.value = count;
        }

        updateNightsHint();
    }

    // ----------------------------------------------------
    // Stepper Navigation
    // ----------------------------------------------------
    function showStep(n) {
        panels.forEach((p) => p.classList.toggle("is-active", Number(p.dataset.panel) === n));
        stepperItems.forEach((item) => {
            const s = Number(item.dataset.step);
            item.classList.toggle("is-complete", s < n);
            item.classList.toggle("is-active", s === n);
        });
        currentStep = n;

        window.scrollTo({
            top: document.querySelector(".reservation-head").offsetTop - 20,
            behavior: "smooth"
        });

        if (n === 4) buildSummary();
        if (n === 5) buildPayment();
        if (n === 6) buildConfirmation();
    }

    function validatePanel(n) {
        const panel = panels.find((p) => Number(p.dataset.panel) === n);
        if (!panel) return true;

        const requiredFields = Array.from(panel.querySelectorAll("[required]"));
        for (const f of requiredFields) {
            if (f.type === "checkbox" && !f.checked) {
                f.reportValidity();
                return false;
            }
            if (f.type !== "checkbox" && !f.value.trim()) {
                f.reportValidity();
                return false;
            }
        }

        if (n === 2) {
            const arr = document.getElementById("arrivalDate").value;
            const dep = document.getElementById("departureDate").value;
            if (dep <= arr) {
                alert("Departure date must be after arrival date.");
                return false;
            }
        }

        if (n === 5 && !state.paymentMethod) {
            alert("Please choose a payment method to complete the booking.");
            return false;
        }

        return true;
    }

    form.addEventListener("click", (e) => {
        const nextBtn = e.target.closest("[data-next]");
        const backBtn = e.target.closest("[data-back]");

        if (nextBtn) {
            e.preventDefault();
            if (!validatePanel(currentStep)) return;
            if (currentStep < totalSteps) showStep(currentStep + 1);
        }

        if (backBtn) {
            e.preventDefault();
            if (currentStep > 1) showStep(currentStep - 1);
        }
    });

    // ----------------------------------------------------
    // Counter Stepper Controls (Step 3)
    // ----------------------------------------------------
    form.querySelectorAll("[data-count]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const key = btn.dataset.count;
            const dir = Number(btn.dataset.dir);
            const input = document.getElementById(key);
            const min = Number(input.min || 0);
            const nextVal = Math.max(min, (state.counts[key] || 0) + dir);
            state.counts[key] = nextVal;
            input.value = nextVal;
        });
    });

    // ----------------------------------------------------
    // Nights Calculation & Hint
    // ----------------------------------------------------
    const arrivalEl = document.getElementById("arrivalDate");
    const departureEl = document.getElementById("departureDate");
    const nightsHintText = document.getElementById("nightsHintText");

    function nightsBetween() {
        if (!arrivalEl.value || !departureEl.value) return 0;
        const a = new Date(arrivalEl.value);
        const d = new Date(departureEl.value);
        const diff = Math.round((d - a) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 0;
    }

    function updateNightsHint() {
        const n = nightsBetween();
        if (nightsHintText) {
            nightsHintText.textContent = n > 0
                ? `${n} night${n > 1 ? "s" : ""} selected for your stay`
                : "Please select valid check-in and check-out dates";
        }
    }

    if (arrivalEl && departureEl) {
        arrivalEl.addEventListener("change", () => {
            if (arrivalEl.value) {
                const arr = new Date(arrivalEl.value);
                const nextDay = new Date(arr);
                nextDay.setDate(arr.getDate() + 1);
                const minDep = nextDay.toISOString().split("T")[0];
                departureEl.min = minDep;
                if (!departureEl.value || departureEl.value <= arrivalEl.value) {
                    departureEl.value = minDep;
                }
            }
            updateNightsHint();
        });
        departureEl.addEventListener("change", updateNightsHint);
    }

    // ----------------------------------------------------
    // Rates & Estimated Total
    // ----------------------------------------------------
    function getRoomRate() {
        const select = document.getElementById("roomType");
        const opt = select.options[select.selectedIndex];
        return opt ? Number(opt.dataset.rate || 0) : 0;
    }

    function estimatedTotal() {
        const nights = Math.max(nightsBetween(), 1);
        const rate = getRoomRate();
        const rooms = state.counts.numRooms || 1;
        const extraBedFee = (state.counts.extraBeds || 0) * 500 * nights;
        const subtotal = rate * rooms * nights + extraBedFee;
        return Math.round(subtotal);
    }

    function fmtDate(value) {
        if (!value) return "—";
        const d = new Date(value + "T00:00:00");
        return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    }

    // ----------------------------------------------------
    // Build Summary (Step 4)
    // ----------------------------------------------------
    function buildSummary() {
        const guestName = document.getElementById("guestName").value || "—";
        const guestEmail = document.getElementById("guestEmail").value || "—";
        const guestPhone = document.getElementById("guestPhone").value || "—";
        const guestCountry = document.getElementById("guestCountry").value || "—";
        const roomTypeSelect = document.getElementById("roomType");
        const nights = nightsBetween();

        document.getElementById("sumGuest").textContent = guestName;
        document.getElementById("sumEmail").textContent = guestEmail;
        document.getElementById("sumPhone").textContent = guestPhone;
        document.getElementById("sumCountry").textContent = guestCountry;
        document.getElementById("sumArrival").textContent = fmtDate(arrivalEl.value);
        document.getElementById("sumDeparture").textContent = fmtDate(departureEl.value);
        document.getElementById("sumDuration").textContent = nights ? `${nights} night${nights > 1 ? "s" : ""}` : "1 night";
        document.getElementById("sumRoomType").textContent = roomTypeSelect.value || "Standard Room";
        document.getElementById("sumRooms").textContent = `${state.counts.numRooms} Room${state.counts.numRooms > 1 ? "s" : ""}`;
        document.getElementById("sumOccupancy").textContent = `${state.counts.numAdults} Adult(s), ${state.counts.numChildren} Child(ren)`;
        document.getElementById("sumExtraBeds").textContent = state.counts.extraBeds > 0 ? `${state.counts.extraBeds} bed(s)` : "None";
        document.getElementById("sumTotal").textContent = peso(estimatedTotal());
    }

    // ----------------------------------------------------
    // Build Payment (Step 5)
    // ----------------------------------------------------
    function buildPayment() {
        const nights = Math.max(nightsBetween(), 1);
        const rooms = state.counts.numRooms || 1;
        document.getElementById("amountDue").textContent = peso(estimatedTotal());
        document.getElementById("amountMeta").textContent =
            `${nights} night${nights === 1 ? "" : "s"} · ${rooms} room${rooms > 1 ? "s" : ""} · incl. 12% VAT`;
    }

    // Payment method selector
    const payMethodBtns = form.querySelectorAll(".pay-method");
    const creditCardExtra = document.getElementById("creditCardExtraFields");
    const lblPayerName = document.getElementById("lblPayerName");
    const lblPayRef = document.getElementById("lblPayRef");
    const cardholderNameInput = document.getElementById("cardholderName");
    const cardNumberInput = document.getElementById("cardNumber");
    const cardExpiryInput = document.getElementById("cardExpiry");
    const cardCvvInput = document.getElementById("cardCvv");

    function updatePaymentMethod(method) {
        state.paymentMethod = method;
        payMethodBtns.forEach((b) => b.classList.toggle("is-selected", b.dataset.method === method));

        if (method === "GCash") {
            lblPayerName.textContent = "GCash Registered Name *";
            lblPayRef.textContent = "GCash Mobile Number / Ref ID *";
            cardholderNameInput.placeholder = "e.g. Maria Santos";
            cardNumberInput.placeholder = "09XX XXX XXXX";
            if (creditCardExtra) creditCardExtra.style.display = "none";
            if (cardExpiryInput) cardExpiryInput.required = false;
            if (cardCvvInput) cardCvvInput.required = false;
        } else if (method === "Bank Transfer") {
            lblPayerName.textContent = "Depositor / Account Name *";
            lblPayRef.textContent = "Bank Reference / Transaction No. *";
            cardholderNameInput.placeholder = "Account Holder Name";
            cardNumberInput.placeholder = "e.g. BDO/BPI Ref 12345678";
            if (creditCardExtra) creditCardExtra.style.display = "none";
            if (cardExpiryInput) cardExpiryInput.required = false;
            if (cardCvvInput) cardCvvInput.required = false;
        } else {
            lblPayerName.textContent = "Cardholder Name *";
            lblPayRef.textContent = "Card Number *";
            cardholderNameInput.placeholder = "Full Name on Card";
            cardNumberInput.placeholder = "•••• •••• •••• ••••";
            if (creditCardExtra) creditCardExtra.style.display = "grid";
            if (cardExpiryInput) cardExpiryInput.required = true;
            if (cardCvvInput) cardCvvInput.required = true;
        }
    }

    payMethodBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            updatePaymentMethod(btn.dataset.method);
        });
    });

    // ----------------------------------------------------
    // Build Confirmation (Step 6)
    // ----------------------------------------------------
    function last4(val) {
        const digits = (val || "").replace(/\D/g, "");
        return digits.slice(-4).padStart(4, "•");
    }

    function buildConfirmation() {
        const ref = "CCT-" + new Date().getFullYear() + "-" + Math.floor(100000 + Math.random() * 900000);
        document.getElementById("bookingRef").textContent = ref;
        document.getElementById("bookingDate").textContent =
            new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

        const method = state.paymentMethod || "Bank Transfer";
        const accountVal = cardNumberInput?.value || "";
        const suffix = method === "Credit Card" ? ` (Ending in ${last4(accountVal)})` : "";

        document.getElementById("confirmPaymentLine").textContent =
            `Payment of ${peso(estimatedTotal())} was recorded via ${method}${suffix}. Thank you for booking with CCT Hotel & Resort!`;

        // Automatically record into Member Portal storage
        try {
            const guestName = document.getElementById("guestName").value || "Valued Guest";
            const nights = Math.max(nightsBetween(), 1);
            const adults = state.counts.numAdults || 1;
            const children = state.counts.numChildren || 0;
            const totalGuests = adults + children;
            const guestString = `${adults} Adult(s)${children > 0 ? `, ${children} Child(ren)` : ""} (${totalGuests} Guest${totalGuests > 1 ? "s" : ""})`;

            const newReservation = {
                ref: ref,
                fullName: guestName,
                stayDates: `${fmtDate(arrivalEl.value)} – ${fmtDate(departureEl.value)}`,
                nights: nights,
                roomType: document.getElementById("roomType").value || "Deluxe Room",
                guestCount: guestString,
                status: "Pending"
            };

            const stored = JSON.parse(localStorage.getItem("cct_guest_reservations") || "[]");
            stored.unshift(newReservation);
            localStorage.setItem("cct_guest_reservations", JSON.stringify(stored));
        } catch (err) {
            console.warn("Storage sync error:", err);
        }
    }

    // Copy reference code button
    const copyRefBtn = document.getElementById("copyRefBtn");
    if (copyRefBtn) {
        copyRefBtn.addEventListener("click", () => {
            const ref = document.getElementById("bookingRef").textContent;
            navigator.clipboard?.writeText(ref);
            const original = copyRefBtn.innerHTML;
            copyRefBtn.innerHTML = "<ion-icon name='checkmark-outline'></ion-icon> <span>Copied!</span>";
            setTimeout(() => (copyRefBtn.innerHTML = original), 1800);
        });
    }

    // Download summary text file
    const downloadBtn = document.getElementById("downloadBtn");
    if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
            const ref = document.getElementById("bookingRef").textContent;
            const lines = [
                "==================================================",
                "       CCT HOTEL & RESORT - BOOKING CONFIRMATION",
                "==================================================",
                "Booking Reference : " + ref,
                "Issued Date       : " + new Date().toLocaleDateString("en-US"),
                "--------------------------------------------------",
                "Guest Name        : " + (document.getElementById("guestName").value || "—"),
                "Guest Email       : " + (document.getElementById("guestEmail").value || "—"),
                "Guest Phone       : " + (document.getElementById("guestPhone").value || "—"),
                "Country           : " + (document.getElementById("guestCountry").value || "—"),
                "--------------------------------------------------",
                "Check-in Date     : " + fmtDate(arrivalEl.value),
                "Check-out Date    : " + fmtDate(departureEl.value),
                "Room Category     : " + (document.getElementById("roomType").value || "—"),
                "Total Rooms       : " + state.counts.numRooms,
                "Occupancy         : " + state.counts.numAdults + " Adults, " + state.counts.numChildren + " Children",
                "Extra Beds        : " + state.counts.extraBeds,
                "--------------------------------------------------",
                "Total Paid/Due    : " + peso(estimatedTotal()) + " (incl. 12% VAT)",
                "Payment Method    : " + state.paymentMethod,
                "==================================================",
                "Property Contact  : +63 (02) 8123-4567 | reservations@ccthotel.com",
                "Location          : CCT Campus Complex, Metro Manila, Philippines",
                "=================================================="
            ].join("\r\n");

            const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = ref + "-Confirmation.txt";
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // ----------------------------------------------------
    // CANCEL RESERVATION FEATURE IMPLEMENTATION
    // ----------------------------------------------------
    const cancelModalOverlay = document.getElementById("cancelModalOverlay");
    const cancelModal = document.getElementById("cancelModal");
    const closeCancelModal = document.getElementById("closeCancelModal");
    const openCancelModalNavBtn = document.getElementById("openCancelModalNavBtn");
    const openCancelModalHeaderBtn = document.getElementById("openCancelModalHeaderBtn");

    const cancelSearchSection = document.getElementById("cancelSearchSection");
    const cancelConfirmSection = document.getElementById("cancelConfirmSection");
    const cancelSuccessSection = document.getElementById("cancelSuccessSection");
    const cancelLookupForm = document.getElementById("cancelLookupForm");
    const cancelLookupError = document.getElementById("cancelLookupError");
    const cancelProceedForm = document.getElementById("cancelProceedForm");
    const backToSearchBtn = document.getElementById("backToSearchBtn");
    const closeSuccessBtn = document.getElementById("closeSuccessBtn");

    let currentFoundBooking = null;

    function openCancelModal(initialRef = "") {
        if (cancelModal && cancelModalOverlay) {
            cancelModalOverlay.classList.add("active");
            cancelModal.classList.add("active");
            resetCancelModal();
            if (initialRef) {
                const refInput = document.getElementById("lookupRef");
                if (refInput) refInput.value = initialRef;
            }
        }
    }

    function closeCancelModalFunc() {
        if (cancelModal && cancelModalOverlay) {
            cancelModalOverlay.classList.remove("active");
            cancelModal.classList.remove("active");
        }
    }

    function resetCancelModal() {
        if (cancelSearchSection) cancelSearchSection.style.display = "block";
        if (cancelConfirmSection) cancelConfirmSection.style.display = "none";
        if (cancelSuccessSection) cancelSuccessSection.style.display = "none";
        if (cancelLookupError) {
            cancelLookupError.style.display = "none";
            cancelLookupError.textContent = "";
        }
        currentFoundBooking = null;
    }

    if (openCancelModalNavBtn) openCancelModalNavBtn.addEventListener("click", () => openCancelModal());
    if (openCancelModalHeaderBtn) openCancelModalHeaderBtn.addEventListener("click", () => openCancelModal());
    if (closeCancelModal) closeCancelModal.addEventListener("click", closeCancelModalFunc);
    if (cancelModalOverlay) cancelModalOverlay.addEventListener("click", closeCancelModalFunc);
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener("click", () => {
            closeCancelModalFunc();
            window.location.href = "member-dashboard.html";
        });
    }

    if (backToSearchBtn) {
        backToSearchBtn.addEventListener("click", () => {
            if (cancelConfirmSection) cancelConfirmSection.style.display = "none";
            if (cancelSearchSection) cancelSearchSection.style.display = "block";
        });
    }

    // Sample references quick fill
    document.querySelectorAll(".ref-pill-btn[data-sample]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const ref = btn.dataset.sample;
            const refInput = document.getElementById("lookupRef");
            const nameInput = document.getElementById("lookupName");
            if (refInput) refInput.value = ref;
            if (nameInput) nameInput.value = "Maria Santos";
        });
    });

    // Default sample pool to search from
    const fallbackPool = [
        {
            ref: "CCT-2026-894215",
            fullName: "Maria Santos",
            stayDates: "Oct 15, 2026 – Oct 18, 2026",
            nights: 3,
            roomType: "Executive Suite",
            guestCount: "2 Adults (2 Guests)",
            status: "Pending"
        },
        {
            ref: "CCT-2026-773419",
            fullName: "Maria Santos",
            stayDates: "Nov 02, 2026 – Nov 04, 2026",
            nights: 2,
            roomType: "Deluxe Room",
            guestCount: "2 Adults, 1 Child (3 Guests)",
            status: "Pending"
        }
    ];

    // Lookup Booking Form Submit
    if (cancelLookupForm) {
        cancelLookupForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const refVal = document.getElementById("lookupRef")?.value.trim().toUpperCase() || "";
            const nameVal = document.getElementById("lookupName")?.value.trim().toLowerCase() || "";

            const stored = JSON.parse(localStorage.getItem("cct_guest_reservations") || "[]");
            const combined = [...stored, ...fallbackPool];

            const found = combined.find((b) => b.ref.toUpperCase() === refVal);

            if (!found) {
                if (cancelLookupError) {
                    cancelLookupError.textContent = `No reservation found with reference code "${refVal}". Please double check your booking reference.`;
                    cancelLookupError.style.display = "block";
                }
                return;
            }

            if (found.status && found.status.toLowerCase() === "cancelled") {
                if (cancelLookupError) {
                    cancelLookupError.textContent = `Reservation "${refVal}" is already cancelled.`;
                    cancelLookupError.style.display = "block";
                }
                return;
            }

            // Display found reservation for confirmation
            currentFoundBooking = found;
            if (cancelLookupError) cancelLookupError.style.display = "none";
            if (cancelSearchSection) cancelSearchSection.style.display = "none";
            if (cancelConfirmSection) cancelConfirmSection.style.display = "block";

            document.getElementById("foundResRef").textContent = found.ref;
            document.getElementById("foundResGuest").textContent = found.fullName;
            document.getElementById("foundResRoom").textContent = found.roomType;
            document.getElementById("foundResDates").textContent = `${found.stayDates} (${found.nights} Night${found.nights > 1 ? "s" : ""})`;
            document.getElementById("foundResGuests").textContent = found.guestCount;

            const statusBadge = document.getElementById("foundResStatus");
            if (statusBadge) {
                statusBadge.textContent = found.status || "Pending";
            }
        });
    }

    // Confirm Cancellation Form Submit
    if (cancelProceedForm) {
        cancelProceedForm.addEventListener("submit", (e) => {
            e.preventDefault();
            if (!currentFoundBooking) return;

            const reason = document.getElementById("cancelReason")?.value || "Change of travel plans";
            const targetRef = currentFoundBooking.ref;

            // Update in localStorage
            let stored = JSON.parse(localStorage.getItem("cct_guest_reservations") || "[]");
            let existsInStored = false;

            stored = stored.map((item) => {
                if (item.ref === targetRef) {
                    existsInStored = true;
                    return { ...item, status: "Cancelled", cancelReason: reason, cancelledAt: new Date().toISOString() };
                }
                return item;
            });

            if (!existsInStored) {
                // If it was one of the default sample pool items, add it as cancelled
                stored.unshift({
                    ...currentFoundBooking,
                    status: "Cancelled",
                    cancelReason: reason,
                    cancelledAt: new Date().toISOString()
                });
            }

            localStorage.setItem("cct_guest_reservations", JSON.stringify(stored));

            // Display success
            if (cancelConfirmSection) cancelConfirmSection.style.display = "none";
            if (cancelSuccessSection) cancelSuccessSection.style.display = "block";
            document.getElementById("cancelledRefCode").textContent = targetRef;
            document.getElementById("cancelSuccessMsg").innerHTML =
                `Reservation <strong>${targetRef}</strong> has been cancelled. Confirmation of cancellation has been updated in your records.`;
        });
    }

    // Direct Cancellation of Just Created Booking on Step 6
    const cancelJustCreatedBtn = document.getElementById("cancelJustCreatedBtn");
    if (cancelJustCreatedBtn) {
        cancelJustCreatedBtn.addEventListener("click", () => {
            const currentRef = document.getElementById("bookingRef")?.textContent;
            if (!currentRef || currentRef.includes("000000")) return;

            const confirmCancel = confirm(`Are you sure you want to cancel your newly created reservation ${currentRef}?`);
            if (confirmCancel) {
                let stored = JSON.parse(localStorage.getItem("cct_guest_reservations") || "[]");
                stored = stored.map((b) => (b.ref === currentRef ? { ...b, status: "Cancelled", cancelledAt: new Date().toISOString() } : b));
                localStorage.setItem("cct_guest_reservations", JSON.stringify(stored));

                // Visual feedback on confirmation screen
                const confirmHeading = document.querySelector(".confirmation-body h3");
                const confirmLine = document.getElementById("confirmPaymentLine");
                const confirmIcon = document.querySelector(".confirm-icon ion-icon");

                if (confirmHeading) confirmHeading.textContent = "Reservation Cancelled";
                if (confirmLine) confirmLine.textContent = `Your reservation ${currentRef} has been cancelled upon request. Holds and charges have been nullified.`;
                if (confirmIcon) {
                    confirmIcon.setAttribute("name", "close-circle");
                    document.querySelector(".confirm-icon").style.background = "#fee2e2";
                    confirmIcon.style.color = "#ef4444";
                }
                cancelJustCreatedBtn.style.display = "none";
                alert(`Booking ${currentRef} was successfully cancelled. Redirecting to your membership dashboard...`);
                window.location.href = "member-dashboard.html";
            }
        });
    }

    // Discard wizard action buttons on steps 1-5 -> Redirect to Membership Dashboard
    form.querySelectorAll("[data-cancel-wizard]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const confirmDiscard = confirm("Are you sure you want to discard this reservation? Your input will be cleared and you will be returned to your membership dashboard.");
            if (confirmDiscard) {
                window.location.href = "member-dashboard.html";
            }
        });
    });

    // Initialize
    initUrlParams();
    updatePaymentMethod("Bank Transfer");
    showStep(1);
})();
