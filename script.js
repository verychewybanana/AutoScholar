// State Management
let studentProfile = {};
let scholarships = [];
let chatStep = 0;

// API Keys
let geminiApiKey = localStorage.getItem('geminiApiKey') || '';

// DOM Elements - Main Chat
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const resumeUpload = document.getElementById('resumeUpload');

// DOM Elements - Dashboard
const scholarshipList = document.getElementById('scholarshipList');
const matchCount = document.getElementById('matchCount');
const exportBtn = document.getElementById('exportBtn');
const autofillBtn = document.getElementById('autofillBtn');

// DOM Elements - Settings
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const geminiApiKeyInput = document.getElementById('geminiApiKey');

// DOM Elements - Help Widget
const helpToggleBtn = document.getElementById('helpToggleBtn');
const helpWidgetPanel = document.getElementById('helpWidgetPanel');
const closeHelpBtn = document.getElementById('closeHelpBtn');
const helpInput = document.getElementById('helpInput');
const sendHelpBtn = document.getElementById('sendHelpBtn');
const helpMessages = document.getElementById('helpMessages');

// DOM Elements - Modal
const actionModal = document.getElementById('actionModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const confirmModalBtn = document.getElementById('confirmModalBtn');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');

// --- Settings Logic ---
settingsBtn.addEventListener('click', () => {
    geminiApiKeyInput.value = geminiApiKey;
    settingsModal.classList.add('show');
});

closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('show');
});

saveSettingsBtn.addEventListener('click', () => {
    geminiApiKey = geminiApiKeyInput.value.trim();
    localStorage.setItem('geminiApiKey', geminiApiKey);
    settingsModal.classList.remove('show');
    if (geminiApiKey) {
        addMessage(chatMessages, "System: API Key saved successfully. You can now chat and search for scholarships.", 'ai');
    }
});

// --- Utility Functions ---
function scrollToBottom(container) {
    container.scrollTop = container.scrollHeight;
}

function addMessage(container, text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}-message`;
    
    let avatarHtml = '';
    if (sender === 'ai') {
        avatarHtml = `<div class="avatar"><i class="fa-solid fa-robot"></i></div>`;
    } else {
        avatarHtml = `<div class="avatar"><i class="fa-solid fa-user"></i></div>`;
    }
    
    msgDiv.innerHTML = `
        ${avatarHtml}
        <div class="bubble">${text}</div>
    `;
    container.appendChild(msgDiv);
    scrollToBottom(container);
}

function showTypingIndicator(container) {
    const indicator = document.createElement('div');
    indicator.className = 'message ai-message typing';
    indicator.id = `typing-${Date.now()}`;
    indicator.innerHTML = `
        <div class="avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="typing-indicator">
            <span></span><span></span><span></span>
        </div>
    `;
    container.appendChild(indicator);
    scrollToBottom(container);
    return indicator.id;
}

function removeTypingIndicator(id) {
    const indicator = document.getElementById(id);
    if (indicator) indicator.remove();
}

// --- Main Chat Logic ---
async function handleSendMainChat() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    if (!geminiApiKey) {
        settingsModal.classList.add('show');
        return;
    }

    addMessage(chatMessages, text, 'user');
    chatInput.value = '';
    
    const typingId = showTypingIndicator(chatMessages);
    
    try {
        const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, api_key: geminiApiKey })
        });
        const data = await response.json();
        removeTypingIndicator(typingId);
        
        if (data.error) {
            addMessage(chatMessages, `Error: ${data.error}`, 'ai');
            return;
        }

        addMessage(chatMessages, data.reply, 'ai');
        
        if (data.is_profile_complete) {
            studentProfile.info = text;
            const typingId2 = showTypingIndicator(chatMessages);
            addMessage(chatMessages, "Searching the web for ~100 real scholarships based on your profile... This might take a minute.", 'ai');
            
            try {
                const searchResponse = await fetch('http://localhost:5000/api/search_scholarships', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profile: studentProfile.info, api_key: geminiApiKey })
                });
                const searchData = await searchResponse.json();
                removeTypingIndicator(typingId2);
                
                if (searchData.error) {
                    addMessage(chatMessages, `Search Error: ${searchData.error}`, 'ai');
                } else {
                    populateDashboard(searchData.scholarships);
                    addMessage(chatMessages, `I found ${searchData.scholarships.length} strong matches on the web! I've added them to your dashboard. You can Export them or try Autofill.`, 'ai');
                }
            } catch (err) {
                removeTypingIndicator(typingId2);
                addMessage(chatMessages, "Failed to connect to the backend server for searching.", 'ai');
            }
        }
    } catch (err) {
        removeTypingIndicator(typingId);
        addMessage(chatMessages, "Failed to connect to the backend server. Make sure it is running.", 'ai');
    }
}

sendBtn.addEventListener('click', handleSendMainChat);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendMainChat();
});

// Resume Upload Mock
resumeUpload.addEventListener('change', (e) => {
    if(e.target.files.length > 0) {
        const fileName = e.target.files[0].name;
        chatInput.value = `I've uploaded my resume (${fileName}). Please extract my profile and find scholarships.`;
        handleSendMainChat();
    }
});

// --- Dashboard Logic ---
function populateDashboard(data) {
    scholarships = data;
    scholarshipList.innerHTML = '';
    
    data.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.id = `row-${index}`;
        
        // Sanitize categories for classes
        let catClass = "general";
        if (item.category) {
            const catLower = item.category.toLowerCase();
            if (catLower.includes('stem') || catLower.includes('tech')) catClass = "stem";
            else if (catLower.includes('diver') || catLower.includes('women')) catClass = "diversity";
            else if (catLower.includes('merit') || catLower.includes('academic')) catClass = "merit";
        }

        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td><span class="badge ${catClass}">${item.category || 'General'}</span></td>
            <td>${item.deadline || 'Varies'}</td>
            <td>${item.amount || 'Varies'}</td>
            <td><a href="${item.link}" target="_blank" class="link" style="color:var(--accent-primary); text-decoration:none;">Apply Now <i class="fa-solid fa-arrow-up-right-from-square"></i></a></td>
        `;
        scholarshipList.appendChild(tr);
    });
    
    matchCount.innerText = `${data.length} matches found`;
    exportBtn.disabled = false;
    autofillBtn.disabled = false;
}

// --- Help Widget Logic ---
helpToggleBtn.addEventListener('click', () => {
    helpWidgetPanel.classList.toggle('show');
});

closeHelpBtn.addEventListener('click', () => {
    helpWidgetPanel.classList.remove('show');
});

async function handleSendHelp() {
    const text = helpInput.value.trim();
    if (!text) return;
    
    addMessage(helpMessages, text, 'user');
    helpInput.value = '';
    
    if (!geminiApiKey) {
        addMessage(helpMessages, "Please configure your API key in Settings first.", 'ai');
        return;
    }
    
    const typingId = showTypingIndicator(helpMessages);
    
    try {
        const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Help Query: " + text, api_key: geminiApiKey })
        });
        const data = await response.json();
        removeTypingIndicator(typingId);
        
        if (data.error) {
            addMessage(helpMessages, `Error: ${data.error}`, 'ai');
        } else {
            addMessage(helpMessages, data.reply, 'ai');
        }
    } catch (err) {
        removeTypingIndicator(typingId);
        addMessage(helpMessages, "Failed to connect to the server.", 'ai');
    }
}

sendHelpBtn.addEventListener('click', handleSendHelp);
helpInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendHelp();
});

// --- Modal & Action Logic ---
function openModal(title, contentHTML, onConfirm) {
    modalTitle.innerHTML = title;
    modalBody.innerHTML = contentHTML;
    actionModal.classList.add('show');
    
    // Cleanup old event listeners by cloning
    const newConfirmBtn = confirmModalBtn.cloneNode(true);
    confirmModalBtn.parentNode.replaceChild(newConfirmBtn, confirmModalBtn);
    
    if (onConfirm) {
        newConfirmBtn.style.display = 'block';
        newConfirmBtn.addEventListener('click', onConfirm);
    } else {
        newConfirmBtn.style.display = 'none';
    }
}

function closeModal() {
    actionModal.classList.remove('show');
}

closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);

// Export to CSV Function
exportBtn.addEventListener('click', () => {
    if(scholarships.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Name,Category,Deadline,Amount,Link\n";
    
    scholarships.forEach(function(rowArray) {
        let name = rowArray.name ? rowArray.name.replace(/,/g, "") : "";
        let category = rowArray.category ? rowArray.category.replace(/,/g, "") : "";
        let deadline = rowArray.deadline ? rowArray.deadline.replace(/,/g, "") : "";
        let amount = rowArray.amount ? rowArray.amount.replace(/,/g, "") : "";
        let link = rowArray.link ? rowArray.link.replace(/,/g, "") : "";
        
        let row = `${name},${category},${deadline},${amount},${link}`;
        csvContent += row + "\r\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "scholarships.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    openModal(
        '<i class="fa-solid fa-file-excel"></i> Export Successful',
        '<p>Your scholarships have been downloaded as a CSV spreadsheet. You can open this in Google Sheets or Microsoft Excel.</p>',
        null
    );
    document.getElementById('cancelModalBtn').innerText = 'Close';
});

// Autofill
autofillBtn.addEventListener('click', () => {
    openModal(
        '<i class="fa-solid fa-bolt"></i> Autofill Applications',
        `
            <p>How many scholarships would you like me to autofill?</p>
            <div class="form-group" style="margin-top:1rem;">
                <label>Number of apps (Max 50)</label>
                <input type="number" id="autofillCount" min="1" max="50" value="${Math.min(scholarships.length, 50)}">
            </div>
            <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:1rem;">
                <i class="fa-solid fa-triangle-exclamation" style="color:var(--danger)"></i> Note: I will map your profile data to the forms and attempt to save them as drafts. You will need to review them before final submission.
            </p>
        `,
        () => {
            const countInput = document.getElementById('autofillCount');
            let count = parseInt(countInput.value) || 0;
            if(count > 50) count = 50;
            if(count <= 0) return;
            
            closeModal();
            startAutofillSimulation(count);
        }
    );
    document.getElementById('cancelModalBtn').innerText = 'Cancel';
});

function startAutofillSimulation(count) {
    let index = 0;
    const limit = Math.min(count, scholarships.length);
    
    addMessage(chatMessages, `Starting autofill process for ${limit} applications... I'll update the table as I go.`, 'ai');
    
    function processNext() {
        if(index >= limit) {
            addMessage(chatMessages, `✅ Finished autofilling ${limit} applications! Please check the links to review them.`, 'ai');
            return;
        }
        
        const row = document.getElementById(`row-${index}`);
        const actionCell = row.cells[4];
        const originalLink = scholarships[index].link;
        
        actionCell.innerHTML = `<span style="color:var(--text-secondary)"><i class="fa-solid fa-spinner fa-spin"></i> Filling...</span>`;
        row.style.background = 'rgba(139, 92, 246, 0.1)';
        
        setTimeout(() => {
            actionCell.innerHTML = `<span style="color:var(--success)"><i class="fa-solid fa-check"></i> Draft Ready</span> <a href="${originalLink}" target="_blank" style="color:var(--accent-primary); margin-left:10px; font-size:0.8rem;">Review <i class="fa-solid fa-arrow-up-right-from-square"></i></a>`;
            row.style.background = '';
            index++;
            processNext();
        }, 800 + Math.random() * 800);
    }
    
    processNext();
}

// Initialization check
if (!geminiApiKey) {
    setTimeout(() => {
        addMessage(chatMessages, "Hi! To get started, please click the gear icon in the top right to enter your Gemini API Key.", 'ai');
    }, 1000);
}
