// State Management
let studentProfile = {};
let scholarships = [];
let chatStep = 0;

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

// --- Mock Data ---
const mockScholarships = [
    { id: 1, name: "Women in Tech STEM Grant", category: "STEM", deadline: "Oct 15, 2026", amount: "$5,000", link: "#", linkText: "Apply Now" },
    { id: 2, name: "First-Gen College Student Fund", category: "Diversity", deadline: "Nov 01, 2026", amount: "$2,500", link: "#", linkText: "Apply Now" },
    { id: 3, name: "National Merit Scholar Bonus", category: "Merit", deadline: "Dec 01, 2026", amount: "$10,000", link: "#", linkText: "Apply Now" },
    { id: 4, name: "Community Leadership Award", category: "General", deadline: "Jan 15, 2027", amount: "$1,000", link: "#", linkText: "Apply Now" },
    { id: 5, name: "Future Engineers Scholarship", category: "STEM", deadline: "Feb 28, 2027", amount: "$3,000", link: "#", linkText: "Apply Now" }
];

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
function handleSendMainChat() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    addMessage(chatMessages, text, 'user');
    chatInput.value = '';
    
    const typingId = showTypingIndicator(chatMessages);
    
    setTimeout(() => {
        removeTypingIndicator(typingId);
        processAIResponse(text);
    }, 1500);
}

function processAIResponse(userText) {
    if (chatStep === 0) {
        studentProfile.info = userText;
        addMessage(chatMessages, "Great! I've analyzed your profile. I see you're looking for opportunities. Give me a moment to search our database for non-essay scholarships matching your criteria...", 'ai');
        
        chatStep++;
        
        setTimeout(() => {
            const typingId2 = showTypingIndicator(chatMessages);
            setTimeout(() => {
                removeTypingIndicator(typingId2);
                populateDashboard(mockScholarships);
                addMessage(chatMessages, `I found ${mockScholarships.length} strong matches! I've added them to your dashboard on the right. You can now Export them to Google Sheets or let me try to Autofill the applications for you.`, 'ai');
            }, 2000);
        }, 1500);
    } else {
        addMessage(chatMessages, "I'm currently focused on helping you with the scholarships on your dashboard. Do you want to try autofilling them?", 'ai');
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
        addMessage(chatMessages, `Uploaded resume: ${fileName}`, 'user');
        
        const typingId = showTypingIndicator(chatMessages);
        setTimeout(() => {
            removeTypingIndicator(typingId);
            processAIResponse("I've uploaded my resume.");
        }, 2000);
    }
});

// --- Dashboard Logic ---
function populateDashboard(data) {
    scholarships = data;
    scholarshipList.innerHTML = '';
    
    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.id = `row-${item.id}`;
        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td><span class="badge ${item.category.toLowerCase()}">${item.category}</span></td>
            <td>${item.deadline}</td>
            <td>${item.amount}</td>
            <td><a href="${item.link}" class="link" style="color:var(--accent-primary); text-decoration:none;">${item.linkText} <i class="fa-solid fa-arrow-up-right-from-square"></i></a></td>
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

function handleSendHelp() {
    const text = helpInput.value.trim();
    if (!text) return;
    
    addMessage(helpMessages, text, 'user');
    helpInput.value = '';
    
    const typingId = showTypingIndicator(helpMessages);
    setTimeout(() => {
        removeTypingIndicator(typingId);
        addMessage(helpMessages, "I'm the ScholarAI support bot! To get started, just tell the main assistant about yourself or upload a resume. It will find scholarships for you.", 'ai');
    }, 1000);
}

sendHelpBtn.addEventListener('click', handleSendHelp);
helpInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendHelp();
});

// --- Modal & Action Logic ---
let currentAction = null;

function openModal(title, contentHTML, onConfirm) {
    modalTitle.innerHTML = title;
    modalBody.innerHTML = contentHTML;
    actionModal.classList.add('show');
    
    // Cleanup old event listeners by cloning
    const newConfirmBtn = confirmModalBtn.cloneNode(true);
    confirmModalBtn.parentNode.replaceChild(newConfirmBtn, confirmModalBtn);
    
    newConfirmBtn.addEventListener('click', onConfirm);
}

function closeModal() {
    actionModal.classList.remove('show');
}

closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);

// Export to Sheets
exportBtn.addEventListener('click', () => {
    openModal(
        '<i class="fa-solid fa-file-excel"></i> Export to Google Sheets',
        '<p>This will create a new Google Spreadsheet in your account containing all matched scholarships.</p><br><p style="color:var(--text-secondary); font-size:0.9rem;"><i class="fa-solid fa-circle-info"></i> Simulation: Imagine OAuth popup happening here.</p>',
        () => {
            modalBody.innerHTML = `
                <div style="text-align:center; padding: 2rem;">
                    <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: var(--accent-primary); margin-bottom: 1rem;"></i>
                    <p>Creating spreadsheet and formatting data...</p>
                </div>
            `;
            setTimeout(() => {
                modalBody.innerHTML = `
                    <div style="text-align:center; padding: 2rem;">
                        <i class="fa-solid fa-circle-check" style="font-size: 2.5rem; color: var(--success); margin-bottom: 1rem;"></i>
                        <p style="font-size:1.1rem; color: white;">Export Successful!</p>
                        <p style="margin-top: 0.5rem;"><a href="#" style="color:var(--accent-primary);">Open Spreadsheet <i class="fa-solid fa-arrow-up-right-from-square"></i></a></p>
                    </div>
                `;
                document.getElementById('confirmModalBtn').style.display = 'none';
                document.getElementById('cancelModalBtn').innerText = 'Close';
            }, 2000);
        }
    );
    document.getElementById('confirmModalBtn').style.display = 'block';
    document.getElementById('cancelModalBtn').innerText = 'Cancel';
});

// Autofill
autofillBtn.addEventListener('click', () => {
    openModal(
        '<i class="fa-solid fa-bolt"></i> Autofill Applications',
        `
            <p>How many scholarships would you like me to autofill?</p>
            <div class="form-group" style="margin-top:1rem;">
                <label>Number of apps (Max 50)</label>
                <input type="number" id="autofillCount" min="1" max="50" value="${scholarships.length}">
            </div>
            <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:1rem;">
                <i class="fa-solid fa-triangle-exclamation" style="color:var(--danger)"></i> Note: I will map your profile data to the forms and attempt to submit or save them as drafts. You will need to review them before final submission.
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
    document.getElementById('confirmModalBtn').style.display = 'block';
    document.getElementById('cancelModalBtn').innerText = 'Cancel';
});

function startAutofillSimulation(count) {
    let index = 0;
    const limit = Math.min(count, scholarships.length);
    
    // Add message to chat
    addMessage(chatMessages, `Starting autofill process for ${limit} applications... I'll update the table as I go.`, 'ai');
    
    function processNext() {
        if(index >= limit) {
            addMessage(chatMessages, `✅ Finished autofilling ${limit} applications! Please check the links to review them.`, 'ai');
            return;
        }
        
        const item = scholarships[index];
        const row = document.getElementById(`row-${item.id}`);
        const actionCell = row.cells[4];
        
        // Show loading state
        actionCell.innerHTML = `<span style="color:var(--text-secondary)"><i class="fa-solid fa-spinner fa-spin"></i> Filling...</span>`;
        row.style.background = 'rgba(139, 92, 246, 0.1)';
        
        setTimeout(() => {
            actionCell.innerHTML = `<span style="color:var(--success)"><i class="fa-solid fa-check"></i> Draft Ready</span> <a href="#" style="color:var(--accent-primary); margin-left:10px; font-size:0.8rem;">Review</a>`;
            row.style.background = '';
            index++;
            processNext();
        }, 1200 + Math.random() * 1000); // Random delay 1.2s - 2.2s per app
    }
    
    processNext();
}
