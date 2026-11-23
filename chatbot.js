/* CCT Hotel Chatbot — logic only.
   The chat markup lives in your HTML page (see chatbot.html). This file wires it up.

   Sections:
     1. CONFIG            – hotel data & settings (edit here)
     2. DOM references
     3. Helpers
     4. Rendering         – messages, quick replies, typing indicator
     5. Concerns flow     – multi-step ticket form (category → details → contact)
     6. Intent handling   – keyword matching for free-typed messages
     7. Open / close + events
*/
(function () {
    'use strict';

    // =====================================================================
    // 1. CONFIG
    // =====================================================================
    var CONFIG = {
        avatarText: 'CCT',
        bookingUrl: 'booking.html',
        phone: '+63 (02) 8123-4567 / +63 917 123 4567',
        email: 'reservations@ccthotel.com',
        address: 'CCT Campus Complex, Metro Manila, Philippines',

        // Where submitted concerns are POSTed as JSON. Leave '' to only store them
        // in the browser (localStorage) — fine for a demo/school project.
        // Example for a PHP backend: 'api/concerns.php'
        concernsEndpoint: '',
        concernsStorageKey: 'cctConcerns',

        rooms: [
            { name: 'Standard Room', param: 'Standard+Room', price: '₱2,500', info: '1 Queen Bed · up to 2 guests' },
            { name: 'Deluxe Room',   param: 'Deluxe+Room',   price: '₱4,200', info: '1 King Bed · up to 2 guests · city view' },
            { name: 'Suite',         param: 'Suite',         price: '₱7,800', info: '1 Super King Bed · up to 3 guests · private balcony' },
            { name: 'Family Room',   param: 'Family+Room',   price: '₱5,500', info: '2 Queen Beds · up to 4 guests' }
        ],

        concernCategories: [
            'Booking Issue',
            'Payment Issue',
            'Room / Service Complaint',
            'Cancellation / Refund',
            'Other Concern'
        ],

        restaurants: 'Our on-site restaurant serves local and international cuisine:\n• Breakfast: 6:00 AM – 10:30 AM (complimentary for room guests)\n• Lunch: 11:30 AM – 2:30 PM\n• Dinner: 6:00 PM – 10:00 PM\nIn-room dining is available 24/7.'
    };

    var MAIN_MENU = ['Book a Room', 'Restaurants', 'Concerns', 'Inquiries'];

    // =====================================================================
    // 2. DOM REFERENCES
    // =====================================================================
    var $launcher = document.getElementById('cbLauncher');
    var $win = document.getElementById('cbWindow');
    var $close = document.getElementById('cbClose');
    var $msgs = document.getElementById('cbMessages');
    var $quick = document.getElementById('cbQuick');
    var $form = document.getElementById('cbForm');
    var $input = document.getElementById('cbInput');
    var $attach = document.getElementById('cbAttach');
    var $file = document.getElementById('cbFile');

    if (!$launcher || !$win || !$msgs) {
        console.warn('CCT Chatbot: markup not found. Paste the chatbot HTML block from chatbot.html into this page.');
        return;
    }

    // =====================================================================
    // 3. HELPERS
    // =====================================================================
    var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    function pad(n) { return String(n).padStart(2, '0'); }

    function stamp() {
        var d = new Date();
        return pad(d.getDate()) + '-' + MONTHS[d.getMonth()] + " '" + String(d.getFullYear()).slice(2) +
            ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function scrollDown() { $msgs.scrollTop = $msgs.scrollHeight; }

    function makeTicketId() {
        var d = new Date();
        var rand = Math.floor(1000 + Math.random() * 9000);
        return 'CON-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + rand;
    }

    function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s); }
    function isPhone(s) { return /^[+()\d\s-]{7,20}$/.test(s) && (s.match(/\d/g) || []).length >= 7; }

    // =====================================================================
    // 4. RENDERING
    // =====================================================================
    function addMessage(html, who, showAvatar, withTime) {
        var row = document.createElement('div');
        row.className = 'cb-row ' + who;
        if (who === 'bot') {
            row.innerHTML = (showAvatar ? '<div class="cb-avatar">' + CONFIG.avatarText + '</div>' : '<div class="cb-spacer"></div>') +
                '<div class="cb-bubble">' + html + '</div>';
        } else {
            row.innerHTML = '<div class="cb-bubble">' + html + '</div>';
        }
        $msgs.appendChild(row);
        if (withTime) {
            var t = document.createElement('div');
            t.className = 'cb-time';
            t.textContent = stamp();
            $msgs.appendChild(t);
        }
        scrollDown();
    }

    function setQuick(options) {
        $quick.innerHTML = '';
        options.forEach(function (label) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'cb-chip';
            b.textContent = label;
            b.addEventListener('click', function () { handleUser(label); });
            $quick.appendChild(b);
        });
    }

    // Bot sends one or more messages with a typing delay, then shows quick replies
    function botSay(messages, quick) {
        if (!Array.isArray(messages)) messages = [messages];
        $quick.innerHTML = '';
        var i = 0;
        (function next() {
            if (i >= messages.length) {
                setQuick(quick || MAIN_MENU);
                return;
            }
            var typing = document.createElement('div');
            typing.className = 'cb-row bot';
            typing.innerHTML = '<div class="cb-spacer"></div><div class="cb-bubble cb-typing"><span></span><span></span><span></span></div>';
            $msgs.appendChild(typing);
            scrollDown();
            setTimeout(function () {
                typing.remove();
                var last = i === messages.length - 1;
                addMessage(messages[i], 'bot', last, last);
                i++;
                next();
            }, 600);
        })();
    }

    // =====================================================================
    // 5. CONCERNS FLOW
    //    State machine:  null → 'category' → 'details' → 'contact' → null
    // =====================================================================
    var concern = null; // { step, category, details }

    function startConcern() {
        concern = { step: 'category', category: '', details: '' };
        botSay(
            "We're sorry you're having trouble. What kind of concern would you like to report?",
            CONFIG.concernCategories.concat(['Cancel'])
        );
    }

    function cancelConcern() {
        concern = null;
        botSay('No problem — your concern was not submitted. How else can we help?');
    }

    function persistConcern(ticket) {
        // 1) Local copy (always)
        try {
            var list = JSON.parse(localStorage.getItem(CONFIG.concernsStorageKey) || '[]');
            list.push(ticket);
            localStorage.setItem(CONFIG.concernsStorageKey, JSON.stringify(list));
        } catch (err) {
            console.warn('CCT Chatbot: could not save concern locally', err);
        }

        // 2) Let other scripts on the page react (e.g. an admin dashboard)
        document.dispatchEvent(new CustomEvent('cct:concern-submitted', { detail: ticket }));

        // 3) Send to the backend if configured
        if (CONFIG.concernsEndpoint) {
            return fetch(CONFIG.concernsEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ticket)
            }).then(function (res) {
                if (!res.ok) throw new Error('Server responded ' + res.status);
            });
        }
        return Promise.resolve();
    }

    function submitConcern(contact) {
        var ticket = {
            id: makeTicketId(),
            category: concern.category,
            details: concern.details,
            contact: contact,
            status: 'open',
            createdAt: new Date().toISOString()
        };
        concern = null;

        persistConcern(ticket).then(function () {
            botSay(
                ['Thank you! Your concern has been recorded.\n\n' +
                 'Reference No.: <strong>' + ticket.id + '</strong>\n' +
                 'Category: ' + esc(ticket.category) + '\n' +
                 'Contact: ' + esc(ticket.contact),
                 'Our guest relations team will get back to you as soon as possible. For urgent matters, call ' + CONFIG.phone + '.']
            );
        }).catch(function (err) {
            console.error('CCT Chatbot: failed to send concern', err);
            botSay('Sorry, we could not send your concern right now. Please call us at ' + CONFIG.phone +
                   ' or email <a href="mailto:' + CONFIG.email + '">' + CONFIG.email + '</a>.');
        });
    }

    // Returns true if the message was consumed by the concern flow
    function handleConcernStep(text) {
        if (!concern) return false;

        if (/^cancel$/i.test(text)) { cancelConcern(); return true; }

        if (concern.step === 'category') {
            var match = CONFIG.concernCategories.filter(function (c) {
                return c.toLowerCase() === text.toLowerCase();
            })[0];
            if (!match) {
                botSay('Please choose one of the concern types below.',
                       CONFIG.concernCategories.concat(['Cancel']));
                return true;
            }
            concern.category = match;
            concern.step = 'details';
            botSay('Got it — ' + match + '. Please describe what happened in a message (include your booking date or room if you can).',
                   ['Cancel']);
            return true;
        }

        if (concern.step === 'details') {
            if (text.length < 10) {
                botSay('Could you add a bit more detail? A few words about what happened will help us resolve it faster.', ['Cancel']);
                return true;
            }
            concern.details = text;
            concern.step = 'contact';
            botSay('Thanks. Lastly, what is the best email address or phone number to reach you?', ['Cancel']);
            return true;
        }

        if (concern.step === 'contact') {
            if (!isEmail(text) && !isPhone(text)) {
                botSay('That doesn\'t look like a valid email or phone number. Please try again (e.g. maria@email.com or 0917 123 4567).', ['Cancel']);
                return true;
            }
            submitConcern(text);
            return true;
        }
        return false;
    }

    // =====================================================================
    // 6. INTENT HANDLING (free-typed messages)
    // =====================================================================
    function roomList() {
        return CONFIG.rooms.map(function (r) {
            return '• ' + r.name + ' — ' + r.price + '/night\n   ' + r.info;
        }).join('\n');
    }

    function findRoom(text) {
        text = text.toLowerCase();
        return CONFIG.rooms.filter(function (r) {
            return text.indexOf(r.name.toLowerCase()) !== -1 ||
                   text.indexOf(r.name.toLowerCase().replace(' room', '')) !== -1;
        })[0];
    }

    function respond(text) {
        var t = text.toLowerCase().trim();

        // Concerns first, so "my room has a problem" isn't treated as a booking request
        if (/concern|complain|complaint|problem|issue|refund|cancel|report|not working|broken|dirty|overcharg/.test(t)) {
            startConcern();
            return;
        }

        var room = findRoom(t);
        if (room && /book|reserve|room|stay|suite|standard|deluxe|family/.test(t)) {
            var url = CONFIG.bookingUrl + '?room=' + room.param;
            botSay(
                'Great choice! The ' + room.name + ' is ' + room.price + ' per night (' + room.info + ').\n\n' +
                '<a href="' + url + '">Continue to booking →</a>',
                CONFIG.rooms.map(function (r) { return r.name; }).concat(['Main Menu'])
            );
            return;
        }
        if (/main menu|menu|start over|hello|hi\b|hey/.test(t)) {
            botSay('How can we help you today? Tap an option below or send us a message.');
            return;
        }
        if (/book|reserve|reservation|available|availability|stay|room/.test(t)) {
            botSay(
                ['Here are our rooms (all stays include breakfast and high-speed Wi-Fi):\n\n' + roomList(),
                 'Which room would you like to book?'],
                CONFIG.rooms.map(function (r) { return r.name; }).concat(['Main Menu'])
            );
            return;
        }
        if (/restaurant|dining|food|eat|breakfast|lunch|dinner/.test(t)) { botSay(CONFIG.restaurants); return; }
        if (/inquir|contact|phone|call|email|address|location|where|help/.test(t)) {
            botSay(
                'You can reach us here:\n\n📍 ' + CONFIG.address + '\n📞 ' + CONFIG.phone +
                '\n✉️ <a href="mailto:' + CONFIG.email + '">' + CONFIG.email + '</a>\n\n' +
                'Our front desk is available 24/7.'
            );
            return;
        }
        if (/price|rate|cost|how much|cheap/.test(t)) {
            botSay('Our nightly rates (taxes included):\n\n' + roomList());
            return;
        }
        if (/wifi|wi-fi|internet|pool|amenit|gym|parking/.test(t)) {
            botSay('Every stay includes ultra-fast Wi-Fi, access to our rooftop infinity pool, gourmet dining, and 24/7 security & concierge support.');
            return;
        }
        if (/thank/.test(t)) { botSay("You're welcome! Is there anything else we can help with?"); return; }

        botSay(["Sorry, I didn't quite catch that. I can help with bookings, dining, concerns, and general inquiries.",
                'Please pick an option below, or call us at ' + CONFIG.phone + '.']);
    }

    function handleUser(text) {
        text = text.trim();
        if (!text) return;
        addMessage(esc(text), 'user', false, true);
        $input.value = '';
        $quick.innerHTML = '';

        if (handleConcernStep(text)) return; // active concern flow takes priority
        respond(text);
    }

    // =====================================================================
    // 7. OPEN / CLOSE + EVENTS
    // =====================================================================
    var started = false;

    function openChat() {
        $win.classList.add('is-open');
        $launcher.style.display = 'none';
        if (!started) {
            started = true;
            addMessage('Hi! I am a virtual assistant and I can help you book your upcoming stay.', 'bot', false, false);
            setTimeout(function () {
                addMessage('Please let us know how we can help you today by tapping on the options or by sending us a message.', 'bot', true, true);
                setQuick(MAIN_MENU);
            }, 500);
        }
        setTimeout(function () { $input.focus(); }, 100);
    }

    function closeChat() {
        $win.classList.remove('is-open');
        $launcher.style.display = 'flex';
    }

    $launcher.addEventListener('click', openChat);
    $close.addEventListener('click', closeChat);
    $form.addEventListener('submit', function (e) { e.preventDefault(); handleUser($input.value); });
    $attach.addEventListener('click', function () { $file.click(); });
    $file.addEventListener('change', function () {
        if (!$file.files.length) return;
        addMessage('📎 ' + esc($file.files[0].name), 'user', false, true);
        $file.value = '';
        $quick.innerHTML = '';
        botSay('Thanks! We received your attachment. For file-related concerns, please also email it to ' +
               '<a href="mailto:' + CONFIG.email + '">' + CONFIG.email + '</a> so our team can review it.',
               concern ? ['Cancel'] : MAIN_MENU);
    });

    // Optional: any element with data-open-chatbot opens the chat
    document.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest('[data-open-chatbot]')) { e.preventDefault(); openChat(); }
    });

    // Public API
    window.CCTChatbot = {
        open: openChat,
        close: closeChat,
        getConcerns: function () {
            try { return JSON.parse(localStorage.getItem(CONFIG.concernsStorageKey) || '[]'); }
            catch (e) { return []; }
        }
    };
})();
