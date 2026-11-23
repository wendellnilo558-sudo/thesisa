// CCT Hotel Guest Landing Page Script (home.js)
document.addEventListener("DOMContentLoaded", () => {
    // ----------------------------------------------------
    // Login Modal Handlers (Member/Renter & Staff Portals)
    // ----------------------------------------------------
    const openMemberLoginBtn = document.getElementById("openMemberLoginBtn");
    const openStaffLoginBtn = document.getElementById("openStaffLoginBtn");
    const footerMemberLogin = document.getElementById("footerMemberLogin");
    const footerStaffLogin = document.getElementById("footerStaffLogin");
    const closeLoginBtn = document.getElementById("closeLogin");
    const loginPopup = document.getElementById("loginPopup");
    const popupOverlay = document.getElementById("popupOverlay");

    // Tabs
    const tabMemberBtn = document.getElementById("tabMemberBtn");
    const tabStaffBtn = document.getElementById("tabStaffBtn");
    const memberAuthPanel = document.getElementById("memberAuthPanel");
    const staffAuthPanel = document.getElementById("staffAuthPanel");

    function setAuthRole(role) {
        if (role === "staff") {
            if (tabStaffBtn) tabStaffBtn.classList.add("is-active");
            if (tabMemberBtn) tabMemberBtn.classList.remove("is-active");
            if (staffAuthPanel) staffAuthPanel.style.display = "block";
            if (memberAuthPanel) memberAuthPanel.style.display = "none";
        } else {
            if (tabMemberBtn) tabMemberBtn.classList.add("is-active");
            if (tabStaffBtn) tabStaffBtn.classList.remove("is-active");
            if (memberAuthPanel) memberAuthPanel.style.display = "block";
            if (staffAuthPanel) staffAuthPanel.style.display = "none";
        }
    }

    function openPopup(role = "member") {
        setAuthRole(role);
        if (loginPopup && popupOverlay) {
            loginPopup.classList.add("active");
            popupOverlay.classList.add("active");
        }
    }

    function closePopup() {
        if (loginPopup) loginPopup.classList.remove("active");
        if (popupOverlay) popupOverlay.classList.remove("active");
    }

    if (openMemberLoginBtn) {
        openMemberLoginBtn.addEventListener("click", (e) => {
            e.preventDefault();
            openPopup("member");
        });
    }

    if (openStaffLoginBtn) {
        openStaffLoginBtn.addEventListener("click", (e) => {
            e.preventDefault();
            openPopup("staff");
        });
    }

    if (footerMemberLogin) {
        footerMemberLogin.addEventListener("click", (e) => {
            e.preventDefault();
            openPopup("member");
        });
    }

    if (footerStaffLogin) {
        footerStaffLogin.addEventListener("click", (e) => {
            e.preventDefault();
            openPopup("staff");
        });
    }

    if (closeLoginBtn) closeLoginBtn.addEventListener("click", closePopup);
    if (popupOverlay) popupOverlay.addEventListener("click", closePopup);

    if (tabMemberBtn) {
        tabMemberBtn.addEventListener("click", () => setAuthRole("member"));
    }
    if (tabStaffBtn) {
        tabStaffBtn.addEventListener("click", () => setAuthRole("staff"));
    }

    // Auto-fill helpers
    const fillMemberDemo = document.getElementById("fillMemberDemo");
    if (fillMemberDemo) {
        fillMemberDemo.addEventListener("click", () => {
            document.getElementById("memberEmail").value = "maria.santos@email.com";
            document.getElementById("memberPassword").value = "password123";
        });
    }

    const fillStaffDemo = document.getElementById("fillStaffDemo");
    if (fillStaffDemo) {
        fillStaffDemo.addEventListener("click", () => {
            document.getElementById("staffEmail").value = "admin@ccthotel.com";
            document.getElementById("staffPassword").value = "password123";
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closePopup();
    });

    // Member Form Submission -> Redirect to Member Dashboard
    const memberLoginForm = document.getElementById("memberLoginForm");
    const memberSubmitBtn = document.getElementById("memberSubmitBtn");

    if (memberLoginForm) {
        memberLoginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("memberEmail")?.value || "maria.santos@email.com";
            const name = email.includes("@") ? email.split("@")[0].replace(".", " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "Maria Santos";

            if (memberSubmitBtn) {
                memberSubmitBtn.textContent = "Signing In to Portal...";
                memberSubmitBtn.disabled = true;
            }

            // Save active session
            localStorage.setItem(
                "cct_member_session",
                JSON.stringify({
                    name: name === "Maria Santos" ? "Maria Santos" : name,
                    email: email,
                    tier: "CCT Gold Member"
                })
            );

            setTimeout(() => {
                window.location.href = "member-dashboard.html";
            }, 500);
        });
    }

    // Staff Form Submission -> Redirect to Admin Dashboard
    const staffLoginForm = document.getElementById("staffLoginForm");
    const staffSubmitBtn = document.getElementById("staffSubmitBtn");

    if (staffLoginForm) {
        staffLoginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            if (staffSubmitBtn) {
                staffSubmitBtn.textContent = "Authenticating Staff...";
                staffSubmitBtn.disabled = true;
            }
            setTimeout(() => {
                window.location.href = "../CCT HOTEL/js/index.html";
            }, 500);
        });
    }

    // ----------------------------------------------------
    // Quick Booking Form Date Pre-filling & Redirect
    // ----------------------------------------------------
    const arrivalInput = document.getElementById("qsArrival");
    const departureInput = document.getElementById("qsDeparture");
    const quickSearchForm = document.getElementById("quickSearchForm");

    if (arrivalInput && departureInput) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const toIsoDate = (d) => d.toISOString().split("T")[0];

        arrivalInput.value = toIsoDate(today);
        arrivalInput.min = toIsoDate(today);

        departureInput.value = toIsoDate(tomorrow);
        departureInput.min = toIsoDate(tomorrow);

        arrivalInput.addEventListener("change", () => {
            if (arrivalInput.value) {
                const arrDate = new Date(arrivalInput.value);
                const nextDay = new Date(arrDate);
                nextDay.setDate(arrDate.getDate() + 1);
                const minDept = toIsoDate(nextDay);
                departureInput.min = minDept;
                if (!departureInput.value || departureInput.value <= arrivalInput.value) {
                    departureInput.value = minDept;
                }
            }
        });
    }

    if (quickSearchForm) {
        quickSearchForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const room = document.getElementById("qsRoomType")?.value || "Deluxe Room";
            const arrival = arrivalInput?.value || "";
            const departure = departureInput?.value || "";
            const guests = document.getElementById("qsGuests")?.value || "2";

            const params = new URLSearchParams({
                room: room,
                arrival: arrival,
                departure: departure,
                adults: guests
            });

            window.location.href = `booking.html?${params.toString()}`;
        });
    }

    // ----------------------------------------------------
    // Active navigation highlight on scroll
    // ----------------------------------------------------
    const sections = document.querySelectorAll("header[id], section[id], footer[id]");
    const navLinks = document.querySelectorAll("nav ul li a");

    window.addEventListener("scroll", () => {
        let current = "";
        const scrollPosition = window.pageYOffset + 200;

        sections.forEach((sec) => {
            const top = sec.offsetTop;
            const height = sec.offsetHeight;
            if (scrollPosition >= top && scrollPosition < top + height) {
                current = sec.getAttribute("id");
            }
        });

        navLinks.forEach((link) => {
            link.classList.remove("active");
            const href = link.getAttribute("href");
            if (href === `#${current}` || (current === "home" && href === "home.html")) {
                link.classList.add("active");
            }
        });
    });
});
