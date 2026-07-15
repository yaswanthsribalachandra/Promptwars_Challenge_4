// ArenaPulse AI - Application Logic

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // State Variables
    let currentLanguage = 'en';
    let geminiApiKey = localStorage.getItem('arena_pulse_gemini_key') || '';
    let isHighContrast = localStorage.getItem('arena_pulse_high_contrast') === 'true';
    let textSize = localStorage.getItem('arena_pulse_text_size') || 'normal';
    let readAloudEnabled = localStorage.getItem('arena_pulse_read_aloud') === 'true';
    let userEcoScore = parseInt(localStorage.getItem('arena_pulse_eco_score') || '0', 10);

    // DOM Elements
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    // Modals
    const apiConfigBtn = document.getElementById('api-config-btn');
    const apiModal = document.getElementById('api-modal');
    const apiModalClose = document.getElementById('api-modal-close');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const clearApiKeyBtn = document.getElementById('clear-api-key-btn');
    const apiKeyInput = document.getElementById('api-key-input');
    const connectionStatusLabel = document.querySelector('.connection-status .status-label');
    const connectionStatusDot = document.querySelector('.connection-status .status-indicator');

    const accessibilityToggleBtn = document.getElementById('accessibility-toggle-btn');
    const accessibilityModal = document.getElementById('accessibility-modal');
    const accessibilityModalClose = document.getElementById('accessibility-modal-close');
    const highContrastToggle = document.getElementById('high-contrast-toggle');
    const textSpeechToggle = document.getElementById('text-speech-toggle');
    const fontSizeSelect = document.getElementById('font-size-select');

    // Fan Hub / Wayfinding
    const locateSeatBtn = document.getElementById('locate-seat-btn');
    const seatCodeInput = document.getElementById('seat-code');
    const accessibilityRouteToggle = document.getElementById('accessibility-route-toggle');
    const directionsText = document.getElementById('directions-text');
    const stadiumSvg = document.getElementById('stadium-svg');
    const wayfindingRoute = document.getElementById('wayfinding-route');
    const mapTargetPin = document.getElementById('map-target-pin');

    // Chatbot
    const chatLanguageSelect = document.getElementById('chat-language');
    const chatMessages = document.getElementById('chat-messages');
    const chatInputForm = document.getElementById('chat-input-form');
    const chatMessageInput = document.getElementById('chat-message-input');
    const chipBtns = document.querySelectorAll('.chip-btn');

    // Operations Control
    const refreshHeatmapBtn = document.getElementById('refresh-heatmap-btn');
    const stadiumHeatmap = document.getElementById('stadium-heatmap');
    const incidentReportForm = document.getElementById('incident-report-form');
    const triageResultCard = document.getElementById('triage-result-card');
    const triagePriorityBadge = document.getElementById('triage-priority-badge');
    const triageAssignment = document.getElementById('triage-assignment');
    const triageTime = document.getElementById('triage-time');
    const triageProtocol = document.getElementById('triage-protocol');
    
    // Announcer Control
    const draftPresetBtns = document.querySelectorAll('.draft-preset-btn');
    const announcementTextBox = document.getElementById('announcement-text-box');
    const draftLangTabs = document.querySelectorAll('.draft-lang-tab');
    const speakAnnouncementBtn = document.getElementById('speak-announcement-btn');

    // Eco Hub
    const ecoActionsForm = document.getElementById('eco-actions-form');
    const userEcoPointsSpan = document.getElementById('user-eco-points');
    const greenTipText = document.getElementById('green-tip-text');

    // Toast
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toast-text');
    const toastIcon = document.getElementById('toast-icon');

    // Dictionary of translations for Simulated AI
    const simulatedQA = {
        en: {
            bag: "🎒 <strong>FIFA Stadium Bag Policy:</strong> Only clear bags smaller than 12x6x12 inches (30x15x30 cm) or small clutch bags (4.5x6.5 inches) are allowed. Backpacks and larger purses are prohibited.",
            transit: "🚇 <strong>Transit Status:</strong> Metro Line A is experiencing severe post-game congestion (wait times ~35 mins). We recommend taking the Park & Ride Shuttles (East/West gate lanes, wait ~15 mins) or walking to the Rideshare Hub in Zone F.",
            accessible: "♿ <strong>Accessibility Info:</strong> Elevators are located at Gates A, B, and C. A quiet sensory room is available behind Section 104 next to the medical station. Accessible ramps lead directly to Section 102 and 104.",
            food: "🌭 <strong>Concessions & Dietary Options:</strong> Vegetarian hot dogs, vegan burgers, and Halal-certified snacks are available at the concessions stand near Gate C (behind Section 104) and Section 102.",
            schedule: "🏆 <strong>Match Schedule:</strong> Today's World Cup Match features USA vs Mexico. Kickoff is at 8:00 PM. Stadium gates open 3 hours prior at 5:00 PM.",
            welcome: "⚽ Welcome to the stadium! How can I assist you with navigation, policies, accessibility, or transit?",
            default: "I've processed your query about the stadium. If you need navigation help, enter your seat code in the seat locator. Can I help you with transport, bags, or accessibility details?"
        },
        es: {
            bag: "🎒 <strong>Política de bolsos de la FIFA:</strong> Solo se permiten bolsos transparentes de menos de 12x6x12 pulgadas (30x15x30 cm) o bolsos de mano pequeños (4.5x6.5 pulgadas). Las mochilas están prohibidas.",
            transit: "🚇 <strong>Estado del tránsito:</strong> La Línea A del Metro experimenta una congestión severa después del partido (espera de ~35 min). Se recomienda tomar los autobuses de traslado (carriles A/C, espera de ~15 min) o caminar al Rideshare Hub en la Zona F.",
            accessible: "♿ <strong>Accesibilidad:</strong> Los ascensores se ubican en las Puertas A, B y C. Una sala sensorial tranquila está disponible detrás de la Sección 104. Las rampas accesibles conducen directamente a las secciones 102 y 104.",
            food: "🌭 <strong>Alimentos y opciones dietéticas:</strong> Hot dogs vegetarianos, hamburguesas veganas y alimentos Halal están disponibles cerca de la Puerta C (detrás de la Sección 104) y la Sección 102.",
            schedule: "🏆 <strong>Horario del partido:</strong> El partido de hoy es EE. UU. vs México. El inicio es a las 8:00 PM. Las puertas del estadio abren a las 5:00 PM.",
            welcome: "⚽ ¡Bienvenido al estadio! ¿Cómo puedo ayudarle con la navegación, las políticas, la accesibilidad o el tránsito?",
            default: "He procesado su consulta sobre el estadio. Si necesita ayuda de navegación, ingrese su código de asiento en el localizador. ¿Puedo ayudarle con transporte, bolsos o detalles de accesibilidad?"
        },
        fr: {
            bag: "🎒 <strong>Politique des sacs FIFA:</strong> Seuls les sacs transparents de moins de 12x6x12 pouces (30x15x30 cm) ou les petites pochettes (4.5x6.5 pouces) sont autorisés. Les sacs à dos sont interdits.",
            transit: "🚇 <strong>Info Transport:</strong> La ligne de métro A est très encombrée (attente ~35 min). Nous vous conseillons les navettes gratuites (portes Est/Ouest, attente ~15 min) ou le hub de covoiturage en Zone F.",
            accessible: "♿ <strong>Accessibilité:</strong> Des ascenseurs sont situés aux portes A, B et C. Une salle sensorielle calme est disponible derrière la section 104. Des rampes d'accès mènent directement aux sections 102 et 104.",
            food: "🌭 <strong>Restauration:</strong> Des options végétariennes, végétaliennes et Halal sont disponibles près de la porte C (derrière la section 104) et de la section 102.",
            schedule: "🏆 <strong>Match:</strong> Aujourd'hui: États-Unis contre Mexique. Coup d'envoi à 20h00. Les portes du stade ouvrent à 17h00.",
            welcome: "⚽ Bienvenue au stade ! Comment puis-je vous aider pour l'orientation, le règlement ou les transports ?",
            default: "J'ai traité votre demande. Pour obtenir de l'aide sur l'orientation, veuillez saisir votre numéro de siège. Puis-je vous aider pour les transports, les sacs ou l'accessibilité ?"
        },
        pt: {
            bag: "🎒 <strong>Política de Bolsas FIFA:</strong> Apenas bolsas transparentes menores que 12x6x12 polegadas (30x15x30 cm) ou bolsas de mão pequenas são permitidas. Mochilas são proibidas.",
            transit: "🚇 <strong>Trânsito:</strong> A linha A do metrô está com alta lentidão pós-jogo (espera ~35 min). Recomendamos os ônibus circulares de traslado (espera ~15 min) ou o ponto de Rideshare na Zona F.",
            accessible: "♿ <strong>Acessibilidade:</strong> Elevadores localizados nos Portões A, B e C. Sala sensorial disponível atrás do Setor 104. Rampas acessíveis levam aos Setores 102 e 104.",
            food: "🌭 <strong>Alimentação:</strong> Cachorros-quentes vegetarianos, hambúrgueres veganos e opções Halal perto do Portão C (atrás do Setor 104) e Setor 102.",
            schedule: "🏆 <strong>Horário do Jogo:</strong> O jogo de hoje é EUA contra México. Início às 20h. Portões abrem às 17h.",
            welcome: "⚽ Bem-vindo ao estádio! Como posso ajudar com a navegação, regras, acessibilidade ou transporte?",
            default: "Processei sua dúvida. Se precisar de direções, insira seu código de assento. Posso ajudar com transporte, bolsas ou acessibilidade?"
        },
        ar: {
            bag: "🎒 <strong>سياسة الحقائب للفيفا:</strong> يُسمح فقط بالحقائب الشفافة التي يقل حجمها عن 12×6×12 بوصة (30×15×30 سم) أو الحقائب الصغيرة جداً. يُمنع دخول حقائب الظهر.",
            transit: "🚇 <strong>حالة النقل:</strong> يشهد خط المترو A ازدحاماً شديداً بعد المباراة (الانتظار حوالي 35 دقيقة). نوصي باستخدام حافلات النقل الترددي (انتظار 15 دقيقة) أو التوجه إلى منطقة سيارات الأجرة في المنطقة F.",
            accessible: "♿ <strong>معلومات ذوي الاحتياجات الخاصة:</strong> تتوفر المصاعد في البوابات A و B و C. توجد غرفة حسية هادئة خلف القسم 104 بجوار النقطة الطبية.",
            food: "🌭 <strong>خيارات الأطعمة:</strong> تتوفر مأكولات نباتية وخيارات حلال في المطاعم القريبة من البوابة C (خلف القسم 104) والقسم 102.",
            schedule: "🏆 <strong>جدول المباراة:</strong> مباراة اليوم تجمع بين الولايات المتحدة والمكسيك. تنطلق المباراة الساعة 8:00 مساءً. تفتح البوابات الساعة 5:00 مساءً.",
            welcome: "⚽ مرحباً بكم في الاستاد! كيف يمكنني مساعدتك في التنقل، السياسات، أو النقل؟",
            default: "لقد عالجت استفسارك. إذا كنت بحاجة للمساعدة في تحديد موقع مقعدك، أدخل رمز المقعد في محدد المواقع. هل تحتاج لمساعدة إضافية؟"
        },
        ja: {
            bag: "🎒 <strong>FIFA手荷物持ち込み規制:</strong> 12x6x12インチ（30x15x30 cm）以下の透明なバッグ、または小型クラッチバッグのみ持ち込み可能です。リュックサック等は禁止されています。",
            transit: "🚇 <strong>交通状況:</strong> 地下鉄A線は試合後の大混雑が発生しています（待ち時間約35分）。パーク＆ライドシャトル（待ち時間約15分）またはゾーンFの配車アプリハブの利用をお勧めします。",
            accessible: "♿ <strong>アクセシビリティ情報:</strong> エレベーターはゲートA、B、Cにあります。静かなセンサリールームはセクション104の医療ステーション横に設置されています。",
            food: "🌭 <strong>飲食フードオプション:</strong> ベジタリアンホットドッグ、ヴィーガンバーガー、ハラール対応フードは、セクション102とゲートC付近（セクション104裏）で提供しています。",
            schedule: "🏆 <strong>試合日程:</strong> 本日の対戦カードはアメリカ対メキシコです。キックオフは午後8時。開場は午後5時（3時間前）です。",
            welcome: "⚽ スタジアムへようこそ！ご案内、規則、交通案内、バリアフリー情報など、何かお手伝いできることはありますか？",
            default: "スタジアムについてのお問い合わせを処理しました。シートの案内が必要な場合は、シートコードを入力してください。その他、バッグ、交通、バリアフリーについてお困りですか？"
        }
    };

    // --- SETUP ACCESSIBILITY, API CONFIG AND CACHING ---
    function initSettings() {
        // High contrast
        if (isHighContrast) {
            document.body.classList.add('high-contrast');
            highContrastToggle.checked = true;
        }
        
        // Font sizing
        if (textSize !== 'normal') {
            document.body.classList.remove('font-large', 'font-extra-large');
            if (textSize === 'large') document.body.classList.add('font-large');
            if (textSize === 'extra-large') document.body.classList.add('font-extra-large');
            fontSizeSelect.value = textSize;
        }

        // Voice read aloud
        textSpeechToggle.checked = readAloudEnabled;

        // Gemini API Status indicator
        updateApiStatusIndicator();

        // Eco Points
        userEcoPointsSpan.textContent = userEcoScore;
    }

    function updateApiStatusIndicator() {
        if (geminiApiKey) {
            connectionStatusLabel.textContent = "Gemini 2.5 Active";
            connectionStatusDot.className = "status-indicator online";
            apiKeyInput.value = geminiApiKey;
        } else {
            connectionStatusLabel.textContent = "Simulated AI Active";
            connectionStatusDot.className = "status-indicator offline";
            apiKeyInput.value = "";
        }
    }

    // --- NOTIFICATION TOAST FUNCTION ---
    function showToast(text, type = 'info') {
        toastText.textContent = text;
        toast.classList.remove('hidden');
        
        // Dynamic icons based on type
        if (type === 'success') {
            toastIcon.setAttribute('data-lucide', 'check-circle');
            toast.style.borderColor = 'var(--color-success)';
        } else if (type === 'warning') {
            toastIcon.setAttribute('data-lucide', 'alert-triangle');
            toast.style.borderColor = 'var(--color-warning)';
        } else {
            toastIcon.setAttribute('data-lucide', 'bell');
            toast.style.borderColor = 'var(--border-color)';
        }
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Automatically hide toast
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    }

    // --- VOICE SPEECH SYNTHESIS (ACCESSIBILITY) ---
    function speakText(text) {
        if (!readAloudEnabled || !('speechSynthesis' in window)) return;
        
        // Stop current speech
        window.speechSynthesis.cancel();
        
        // Clean markdown html tags from speech text
        const cleanText = text.replace(/<\/?[^>]+(>|$)/g, "")
                              .replace(/[🎒🚇♿🌭🏆⚽⭐]/g, "");

        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Detect language code
        if (currentLanguage === 'es') utterance.lang = 'es-ES';
        else if (currentLanguage === 'fr') utterance.lang = 'fr-FR';
        else if (currentLanguage === 'pt') utterance.lang = 'pt-BR';
        else if (currentLanguage === 'ar') utterance.lang = 'ar-SA';
        else if (currentLanguage === 'ja') utterance.lang = 'ja-JP';
        else utterance.lang = 'en-US';

        window.speechSynthesis.speak(utterance);
    }

    // --- TAB SWITCHING SYSTEM ---
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // Toggle buttons
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Toggle panels
            tabPanels.forEach(panel => {
                if (panel.id === targetTab) {
                    panel.classList.add('active');
                } else {
                    panel.classList.remove('active');
                }
            });

            // Lazy load heatmap if switching to Operations
            if (targetTab === 'ops-control') {
                renderHeatmap();
            }
        });
    });

    // --- MODALS TOGGLING ---
    // API Modal
    apiConfigBtn.addEventListener('click', () => {
        apiModal.classList.add('active');
        apiModal.setAttribute('aria-hidden', 'false');
    });
    apiModalClose.addEventListener('click', () => {
        apiModal.classList.remove('active');
        apiModal.setAttribute('aria-hidden', 'true');
    });
    
    // Accessibility Modal
    accessibilityToggleBtn.addEventListener('click', () => {
        accessibilityModal.classList.add('active');
        accessibilityModal.setAttribute('aria-hidden', 'false');
    });
    accessibilityModalClose.addEventListener('click', () => {
        accessibilityModal.classList.remove('active');
        accessibilityModal.setAttribute('aria-hidden', 'true');
    });

    // Close modals clicking backdrop
    window.addEventListener('click', (e) => {
        if (e.target === apiModal) {
            apiModal.classList.remove('active');
        }
        if (e.target === accessibilityModal) {
            accessibilityModal.classList.remove('active');
        }
    });

    // --- SETTINGS ACTIONS (SAVE / CLEAR) ---
    saveApiKeyBtn.addEventListener('click', () => {
        const keyVal = apiKeyInput.value.trim();
        if (keyVal) {
            geminiApiKey = keyVal;
            localStorage.setItem('arena_pulse_gemini_key', keyVal);
            showToast("Gemini API key configured successfully!", "success");
        } else {
            showToast("Please enter a valid key", "warning");
        }
        updateApiStatusIndicator();
        apiModal.classList.remove('active');
    });

    clearApiKeyBtn.addEventListener('click', () => {
        geminiApiKey = '';
        localStorage.removeItem('arena_pulse_gemini_key');
        apiKeyInput.value = '';
        updateApiStatusIndicator();
        showToast("Gemini API key cleared. Running in local simulation mode.", "info");
        apiModal.classList.remove('active');
    });

    // Accessibility Changes
    highContrastToggle.addEventListener('change', (e) => {
        isHighContrast = e.target.checked;
        localStorage.setItem('arena_pulse_high_contrast', isHighContrast);
        if (isHighContrast) {
            document.body.classList.add('high-contrast');
            showToast("High Contrast Mode Enabled", "success");
        } else {
            document.body.classList.remove('high-contrast');
            showToast("High Contrast Mode Disabled", "info");
        }
    });

    textSpeechToggle.addEventListener('change', (e) => {
        readAloudEnabled = e.target.checked;
        localStorage.setItem('arena_pulse_read_aloud', readAloudEnabled);
        showToast(readAloudEnabled ? "Read Aloud Enabled" : "Read Aloud Disabled", "info");
    });

    fontSizeSelect.addEventListener('change', (e) => {
        textSize = e.target.value;
        localStorage.setItem('arena_pulse_text_size', textSize);
        
        document.body.classList.remove('font-large', 'font-extra-large');
        if (textSize === 'large') {
            document.body.classList.add('font-large');
        } else if (textSize === 'extra-large') {
            document.body.classList.add('font-extra-large');
        }
        showToast(`Text sizing updated to ${textSize}`, "info");
    });


    // --- SMART WAYFINDING & SEAT LOCATOR ---
    // SVG Coordinate Mapping for Stands and Gates
    const routeCoordinates = {
        'Gate A': { cx: 200, cy: 25 },
        'Gate B': { cx: 380, cy: 200 },
        'Gate C': { cx: 200, cy: 375 },
        'Gate D': { cx: 20, cy: 200 },
        '101': { cx: 200, cy: 60, path: 'M 200,60 L 200,105' },
        '102': { cx: 55, cy: 200, path: 'M 55,200 L 115,200' },
        '103': { cx: 200, cy: 60, path: 'M 200,60 L 200,105' }, // fallback
        '104': { cx: 200, cy: 340, path: 'M 200,340 L 200,295' },
        '105': { cx: 345, cy: 200, path: 'M 345,200 L 285,200' },
        '106': { cx: 200, cy: 340, path: 'M 200,340 L 200,295' }
    };

    locateSeatBtn.addEventListener('click', locateUserSeat);
    
    // Allow enter key in seat code input
    seatCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            locateUserSeat();
        }
    });

    function locateUserSeat() {
        const inputVal = seatCodeInput.value.trim().toLowerCase();
        if (!inputVal) {
            showToast("Please enter a valid seat code", "warning");
            return;
        }

        // Triage Section Number
        let section = '101'; // Default fallback
        if (inputVal.includes('102') || inputVal.includes('west')) section = '102';
        else if (inputVal.includes('104') || inputVal.includes('south') || inputVal.includes('106')) section = '104';
        else if (inputVal.includes('105') || inputVal.includes('east')) section = '105';
        else section = '101'; // north
        
        // Determine closest gate based on section
        let closestGate = 'Gate A';
        if (section === '102') closestGate = 'Gate D';
        if (section === '104') closestGate = 'Gate C';
        if (section === '105') closestGate = 'Gate B';

        // Draw Wayfinding Route Line
        const startPoint = routeCoordinates[closestGate];
        const endPoint = routeCoordinates[section];
        
        // Accessibility alternative route adjustments
        const useAccessibleRoute = accessibilityRouteToggle.checked;
        
        // Draw path string in SVG
        let pathDString = '';
        if (useAccessibleRoute) {
            // accessible route goes through elevators and longer wider ramp curves
            pathDString = `M ${startPoint.cx},${startPoint.cy} Q 200,200 ${endPoint.cx},${endPoint.cy}`;
        } else {
            // Direct straight stairs line
            pathDString = `M ${startPoint.cx},${startPoint.cy} L ${endPoint.cx},${endPoint.cy}`;
        }

        wayfindingRoute.setAttribute('d', pathDString);
        
        // Show Pin on SVG Stand Center
        mapTargetPin.setAttribute('transform', `translate(${endPoint.cx}, ${endPoint.cy})`);
        mapTargetPin.classList.remove('hidden');

        // Highlight SVG Path section styling
        document.querySelectorAll('.map-section').forEach(s => s.classList.remove('active-target'));
        const svgTargetStand = document.querySelector(`.sec-${section}`);
        if (svgTargetStand) {
            svgTargetStand.classList.add('active-target');
        }

        // Generate Text Routing Directions (GenAI dynamic mockup)
        let directionInstructions = "";
        if (useAccessibleRoute) {
            directionInstructions = `♿ <strong>Accessible Directions to Section ${section}:</strong> Enter the stadium via <strong>${closestGate}</strong>. Bypass the staircases, turn left, and follow the blue accessible signs for 80 meters to the <strong>West Elevator lobby</strong>. Take Elevator 3 to Level 2. Section ${section} is immediately to your right. Accessible unisex restrooms and sensory support lockers are 15 meters down the concourse.`;
        } else {
            directionInstructions = `🚶 <strong>Fast-Track Directions to Section ${section}:</strong> Enter the stadium via <strong>${closestGate}</strong>. Scan your digital ticket, proceed past the concessions hub, and climb the Stand staircase directly ahead to Row B. Section ${section} is located on the lower concourse, seats are numbered left-to-right.`;
        }

        directionsText.innerHTML = directionInstructions;
        showToast(`Located seat in Section ${section}! Routing generated.`, "success");
        speakText(directionInstructions);
    }

    // SVG Stadium Map Interactive Gate Clicks
    document.querySelectorAll('.gate-marker').forEach(marker => {
        marker.addEventListener('click', () => {
            const gateName = marker.getAttribute('data-gate');
            seatCodeInput.value = gateName;
            locateUserSeat();
        });
    });

    // --- MULTILINGUAL CHATBOT ENGINE ---
    chatLanguageSelect.addEventListener('change', (e) => {
        currentLanguage = e.target.value;
        showToast(`Language switched to ${chatLanguageSelect.options[chatLanguageSelect.selectedIndex].text}`, "success");
        
        // Send a system greeting in new language
        const greetText = simulatedQA[currentLanguage].welcome;
        addMessage(greetText, 'assistant');
        speakText(greetText);
    });

    // Setup chip buttons click
    chipBtns.forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.getAttribute('data-question');
            chatMessageInput.value = query;
            handleChatSubmit();
        });
    });

    chatInputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleChatSubmit();
    });

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}-message`;
        msgDiv.innerHTML = `
            <div class="message-content">
                <p>${text}</p>
            </div>
        `;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function handleChatSubmit() {
        const rawQuery = chatMessageInput.value.trim();
        if (!rawQuery) return;

        // Display user message
        addMessage(rawQuery, 'user');
        chatMessageInput.value = '';

        // Add typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant-message typing-indicator-msg';
        typingDiv.innerHTML = `
            <div class="message-content">
                <p>AI is thinking...</p>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Perform AI query
        try {
            let reply = "";
            if (geminiApiKey) {
                // Fetch from Gemini API
                reply = await fetchGeminiApiResponse(rawQuery);
            } else {
                // Local simulation response (high fidelity translation dictionary mapping)
                await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network latency
                reply = getSimulatedApiResponse(rawQuery);
            }
            
            // Remove typing indicator & display response
            const typing = chatMessages.querySelector('.typing-indicator-msg');
            if (typing) chatMessages.removeChild(typing);

            addMessage(reply, 'assistant');
            speakText(reply);
        } catch (error) {
            console.error(error);
            const typing = chatMessages.querySelector('.typing-indicator-msg');
            if (typing) chatMessages.removeChild(typing);
            
            addMessage("Apologies, I encountered an error querying the generative model. Please check your API key configuration or network.", "assistant");
        }
    }

    // Real Gemini API Fetch
    async function fetchGeminiApiResponse(userPrompt) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
        
        // System context instructions
        const systemPrompt = `You are ArenaPulse AI, a stadium tournament assistant for FIFA World Cup 2026. Keep answers concise (max 3-4 sentences), formatting highlights in bold or using emojis. Answer the user's prompt in the language matching code "${currentLanguage}".
        Context:
        - Match: USA vs Mexico today at 8:00 PM. Gates open at 5:00 PM.
        - Bag Policy: Clear bags only < 12x6x12 inches.
        - Transit: Metro line is congested. Suggest Shuttles or Rideshare Hub in Zone F.
        - Diet: Veg, Vegan, Halal stands at Sec 102/Gate C.
        - Accessibility: Elevators at A/B/C. Sensory room next to medical section 104. High contrast settings are available.`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: `${systemPrompt}\n\nUser Question: ${userPrompt}`
                }]
            }]
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error("Failed to contact Gemini API");
        }

        const data = await response.json();
        // Extract text
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            return data.candidates[0].content.parts[0].text;
        } else {
            return "Unable to parse response from Gemini.";
        }
    }

    // High fidelity local response engine
    function getSimulatedApiResponse(promptText) {
        const query = promptText.toLowerCase();
        const dict = simulatedQA[currentLanguage];

        if (query.includes('bag') || query.includes('pack') || query.includes('purse') || query.includes('bols') || query.includes('sac') || query.includes('持ち込み') || query.includes('バッグ')) {
            return dict.bag;
        }
        if (query.includes('transit') || query.includes('metro') || query.includes('bus') || query.includes('shuttle') || query.includes('train') || query.includes('transport') || query.includes('metro') || query.includes('مترو') || query.includes('交通') || query.includes('電車')) {
            return dict.transit;
        }
        if (query.includes('access') || query.includes('wheelchair') || query.includes('elevator') || query.includes('sensory') || query.includes('ramp') || query.includes('disab') || query.includes('كرسي') || query.includes('車椅子') || query.includes('バリアフリー') || query.includes('エレベーター')) {
            return dict.accessible;
        }
        if (query.includes('food') || query.includes('eat') || query.includes('drink') || query.includes('vegetarian') || query.includes('vegan') || query.includes('halal') || query.includes('comid') || query.includes('nourriture') || query.includes('طعام') || query.includes('ベジタリアン') || query.includes('フード')) {
            return dict.food;
        }
        if (query.includes('schedule') || query.includes('match') || query.includes('time') || query.includes('kickoff') || query.includes('game') || query.includes('partido') || query.includes('heure') || query.includes('مباراة') || query.includes('スケジュール') || query.includes('時間')) {
            return dict.schedule;
        }
        
        return dict.default;
    }


    // --- OPERATIONS LIVE HEATMAP GENERATOR ---
    const heatmapSections = ['N-101', 'N-102', 'N-103', 'E-104', 'E-105', 'E-106', 'S-107', 'S-108', 'S-109', 'W-110', 'W-111', 'W-112', 'V-201', 'V-202', 'V-203', 'V-204', 'M-301', 'M-302', 'M-303', 'M-304', 'G-A', 'G-B', 'G-C', 'G-D'];
    
    refreshHeatmapBtn.addEventListener('click', () => {
        renderHeatmap();
        showToast("Stadium density metrics updated live.", "success");
    });

    function renderHeatmap() {
        if (!stadiumHeatmap) return;
        stadiumHeatmap.innerHTML = '';
        
        let totalPctSum = 0;
        let criticalCount = 0;

        heatmapSections.forEach(sectionName => {
            const cell = document.createElement('div');
            const pct = Math.floor(Math.random() * (98 - 25) + 25);
            totalPctSum += pct;
            
            // Assign Density Class
            let densityClass = 'low';
            if (pct >= 40 && pct < 70) densityClass = 'medium';
            else if (pct >= 70 && pct < 90) densityClass = 'high';
            else if (pct >= 90) {
                densityClass = 'critical';
                criticalCount++;
            }

            cell.className = `heatmap-cell ${densityClass}`;
            cell.innerHTML = `
                <span class="heatmap-cell-lbl">${sectionName}</span>
                <span class="heatmap-cell-pct">${pct}%</span>
            `;

            // Make cells interactive: click sets incident location!
            cell.addEventListener('click', () => {
                document.getElementById('incident-location').value = `Section ${sectionName}`;
                showToast(`Selected Section ${sectionName} for incident reporting.`, "info");
            });

            stadiumHeatmap.appendChild(cell);
        });

        // Calculate and update stats labels
        const avgOccupancy = (totalPctSum / heatmapSections.length).toFixed(1);
        document.getElementById('stat-occupancy').textContent = `${avgOccupancy}%`;
        document.getElementById('stat-active-incidents').textContent = criticalCount;
        
        // Random gate flow
        const flow = Math.floor(Math.random() * (1600 - 800) + 800);
        document.getElementById('stat-gate-flow').textContent = `${flow}/min`;
    }


    // --- OPERATIONS INCIDENT MANAGEMENT PORTAL ---
    incidentReportForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const type = document.getElementById('incident-type').value;
        const location = document.getElementById('incident-location').value.trim();
        const details = document.getElementById('incident-details').value.trim();

        if (!location || !details) return;

        // Perform Simulated GenAI Dispatch Triage
        let priority = 'Medium';
        let assignment = 'Zone Stewards & Volunteers';
        let responseTime = '8-10 minutes';
        let protocol = 'Monitor crowd conditions and report updates.';

        if (type === 'medical') {
            priority = 'Urgent';
            assignment = 'Medical Response Unit B & St John Ambulance';
            responseTime = '2-3 minutes';
            protocol = 'Dispatch nearest paramedic cart. Clear central aisle. Announce local medical standby alert.';
        } else if (type === 'security') {
            priority = 'Urgent';
            assignment = 'Stadium Security Team 4 & Venue Police Liaison';
            responseTime = '3-5 minutes';
            protocol = 'Dispatch rapid response team. Restrict entry scanners at nearest gate. Direct cameras to sector.';
        } else if (type === 'spill') {
            priority = 'Low';
            assignment = 'Cleanliness Crew Team A';
            responseTime = '12-15 minutes';
            protocol = 'Mark off area with warning signs. Send steward to direct fans away from slippery surface.';
        } else if (type === 'crowd') {
            priority = 'High';
            assignment = 'Gate Operations & Crowd Directors';
            responseTime = '4-6 minutes';
            protocol = 'Open auxiliary gates. Direct volunteers to guide ticket holders to adjacent scanners.';
        } else if (type === 'transit') {
            priority = 'High';
            assignment = 'Transport Coordinator & Local Shuttle Dispatch';
            responseTime = '5-7 minutes';
            protocol = 'Redirect shuttle buses to Gate C area. Announce metro delays over public address.';
        }

        // Display results with dynamic style class
        triagePriorityBadge.className = `triage-badge ${priority.toLowerCase()}`;
        triagePriorityBadge.textContent = `${priority} Priority`;
        triageAssignment.textContent = assignment;
        triageTime.textContent = responseTime;
        triageProtocol.textContent = protocol;
        
        triageResultCard.classList.remove('hidden');
        showToast("GenAI Dispatch Triage completed successfully!", "success");
        
        // Auto draft a PA announcement for crowd or transit issues
        autoDraftAnnouncement(type, location);
    });

    function autoDraftAnnouncement(type, location) {
        let announcementText = "";
        let announcementTextEs = "";

        if (type === 'crowd' || type === 'security') {
            announcementText = `📢 Attention all fans: Due to heavy crowd flow near ${location}, we kindly request that you proceed slowly. Follow the directions of stadium volunteers. Thank you for your patience.`;
            announcementTextEs = `📢 Atención aficionados: Debido al alto flujo de personas cerca de ${location}, les solicitamos avanzar lentamente. Sigan las indicaciones de los voluntarios. Gracias por su paciencia.`;
        } else if (type === 'transit') {
            announcementText = `📢 Attention fans: Due to delays on Transit Line A near ${location}, shuttle buses have been dispatched to Gate C for direct transport. Please consider using the shuttles.`;
            announcementTextEs = `📢 Atención: Debido a retrasos en la línea de tránsito A cerca de ${location}, autobuses de enlace han sido desplegados en la Puerta C. Consideren usar las lanzaderas.`;
        } else if (type === 'medical') {
            announcementText = `📢 Operational notification: Paramedic team responding near ${location}. Please keep walkways clear for emergency personnel.`;
            announcementTextEs = `📢 Notificación de operaciones: Equipo de paramédicos respondiendo cerca de ${location}. Por favor mantengan los pasillos despejados.`;
        } else {
            announcementText = `📢 Operations announcement: General maintenance underway near ${location}. Please use caution.`;
            announcementTextEs = `📢 Anuncio: Mantenimiento general en curso cerca de ${location}. Por favor procedan con precaución.`;
        }

        // Cache drafted announcments inside elements for tab toggling
        announcementTextBox.setAttribute('data-en', announcementText);
        announcementTextBox.setAttribute('data-es', announcementTextEs);
        
        // Default to active tab (EN)
        const activeTab = document.querySelector('.draft-lang-tab.active');
        const activeLang = activeTab ? activeTab.getAttribute('data-draft-lang') : 'en';
        announcementTextBox.innerHTML = activeLang === 'es' ? announcementTextEs : announcementText;
    }


    // --- PA STADIUM ANNOUNCEMENT PRESET DRAFTER ---
    draftPresetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const incidentKey = btn.getAttribute('data-incident');
            let en = "";
            let es = "";

            if (incidentKey === 'heavy-rain') {
                en = "⛈️ Attention Fans: Severe weather is expected during stadium egress. For your safety, exit channels at Gate D will be paused. We recommend staying inside the covered concourses until conditions clear.";
                es = "⛈️ Atención Aficionados: Se esperan lluvias intensas durante la salida del estadio. Por su seguridad, el canal de salida en la Puerta D se pausará. Recomendamos permanecer en los pasillos cubiertos.";
            } else if (incidentKey === 'gate-c-closed') {
                en = "🚫 Operations Alert: Exit Gate C is currently closed due to transit bottlenecking. Please exit via Gate B (East wing) or Gate A (North wing). Follow arrows on screen and staff directions.";
                es = "🚫 Alerta de Operaciones: La Puerta C está temporalmente cerrada. Por favor salgan por la Puerta B (Ala Este) o Puerta A (Ala Norte). Sigan las flechas e indicaciones.";
            } else if (incidentKey === 'metro-delay') {
                en = "🚇 Transit Bulletin: Metro Station Line 1 is operating with a 40-minute delay. Shuttles are available at Outer Zone F for free transfer to downtown hotels.";
                es = "🚇 Boletín de Tránsito: La línea 1 del Metro opera con retraso de 40 minutos. Autobuses de enlace gratuitos están disponibles en la Zona F exterior hacia hoteles del centro.";
            }

            announcementTextBox.setAttribute('data-en', en);
            announcementTextBox.setAttribute('data-es', es);
            
            // Render active language draft
            const activeTab = document.querySelector('.draft-lang-tab.active');
            const activeLang = activeTab ? activeTab.getAttribute('data-draft-lang') : 'en';
            announcementTextBox.innerHTML = activeLang === 'es' ? es : en;
            
            showToast("Bilingual announcement drafted!", "success");
        });
    });

    draftLangTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            draftLangTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const selectedLang = tab.getAttribute('data-draft-lang');
            const cachedTxt = announcementTextBox.getAttribute(`data-${selectedLang}`);
            if (cachedTxt) {
                announcementTextBox.innerHTML = cachedTxt;
            }
        });
    });

    speakAnnouncementBtn.addEventListener('click', () => {
        const text = announcementTextBox.textContent;
        if (text && !text.includes('Click one of the presets')) {
            // Force temporary speech synthesis read aloud bypass
            const speechState = readAloudEnabled;
            readAloudEnabled = true;
            speakText(text);
            readAloudEnabled = speechState; // restore setting
            showToast("Speaking announcement over PA...", "success");
        } else {
            showToast("No active announcement to speak", "warning");
        }
    });


    // --- ECO HUB: GREEN FAN SUSTAINABILITY REWARDS ---
    ecoActionsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let sessionScore = 0;
        const checkedBoxes = ecoActionsForm.querySelectorAll('input[name="eco-action"]:checked');
        
        checkedBoxes.forEach(box => {
            sessionScore += parseInt(box.getAttribute('data-points'), 10);
        });

        if (sessionScore === 0) {
            showToast("Please check at least one green activity", "warning");
            return;
        }

        userEcoScore += sessionScore;
        localStorage.setItem('arena_pulse_eco_score', userEcoScore);
        userEcoPointsSpan.textContent = userEcoScore;

        // Generate customized GenAI Sustainability Tip based on accomplishments
        let customTip = "";
        let levelName = "Eco Fan";
        if (userEcoScore > 80 && userEcoScore <= 150) levelName = "Green Champion";
        if (userEcoScore > 150) levelName = "Arena Guardian 🏆";

        if (sessionScore >= 80) {
            customTip = `⭐ Awesome! You unlocked the **${levelName}** badge! By taking public transport and recycling today, you saved approximately 1,200g of CO2 emissions. Show this screen at concessions near Section 102 for a 15% discount on reusable souvenir cups!`;
        } else {
            customTip = `🌱 Good job! You added ${sessionScore} points to your EcoScore. Continue recycling and clean your section to earn the Green Champion badge. Remember, recycling just one plastic bottle powers stadium lighting for 10 minutes!`;
        }

        greenTipText.innerHTML = customTip;
        showToast(`Eco actions logged! +${sessionScore} EcoScore points!`, "success");
        
        // Reset check boxes
        checkedBoxes.forEach(box => box.checked = false);
    });

    // Boot initialize
    initSettings();
    renderHeatmap(); // populate heatmap
});
