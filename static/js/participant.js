let userAnswers = {};
let finalFlag = "";

// --- MARKDOWN RENDERING ---

// Sanitizer configuration for DOMPurify
const sanitizeConfig = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 
                   'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                   'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel']
};

function renderMarkdown(text) {
    if (!text) return '';
    
    // Configure marked.js
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            breaks: true,
            gfm: true
        });
        
        // Parse markdown
        let html = marked.parse(text);
        
        // Sanitize with DOMPurify
        if (typeof DOMPurify !== 'undefined') {
            html = DOMPurify.sanitize(html, sanitizeConfig);
        }
        
        return html;
    }
    
    // Fallback: just escape and return
    return text;
}

function initMarkdownContent() {
    document.querySelectorAll('.markdown-content').forEach(el => {
        const rawText = el.dataset.raw || el.textContent;
        el.innerHTML = renderMarkdown(rawText);
    });
}

// --- MAIN APP LOGIC ---

function selectQuestion(id) {
    if (!id) return;

    document.querySelectorAll('.content-box').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.q-item').forEach(el => el.classList.remove('active'));

    document.getElementById('panel-' + id).classList.add('active');
    document.getElementById('nav-' + id).classList.add('active');

    const input = document.getElementById('input-' + id);
    if (input && !input.disabled) {
        setTimeout(() => input.focus(), 100);
    }
}

function handleEnter(id, event) {
    if (event.key === "Enter") markAsPending(id);
}

function markAsPending(id) {
    const input = document.getElementById('input-' + id);
    const val = input.value;
    if (!val) return;

    userAnswers[id] = val;

    const navItem = document.getElementById('nav-' + id);
    navItem.classList.remove('correct', 'wrong');
    navItem.classList.add('pending');

    input.disabled = true;
    input.classList.add('pending');

    document.getElementById('btn-submit-' + id).classList.add('hidden');
    document.getElementById('btn-edit-' + id).classList.add('visible');
}

function enableEdit(id) {
    const input = document.getElementById('input-' + id);
    input.disabled = false;
    input.classList.remove('pending', 'correct', 'wrong');

    document.getElementById('nav-' + id).classList.remove('pending');
    document.getElementById('btn-submit-' + id).classList.remove('hidden');
    document.getElementById('btn-edit-' + id).classList.remove('visible');
    input.focus();
}

async function submitAnalysis() {
    const btn = document.getElementById('submitBtn');

    btn.disabled = true;
    btn.innerText = "Verifying...";

    try {
        const response = await fetch(`/api/c/${challengeSlug}/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: userAnswers })
        });
        const data = await response.json();

        const sortedIds = questionIds.filter(id => data.results.hasOwnProperty(id));

        for (const id of sortedIds) {
            const isCorrect = data.results[id];

            const navItem = document.getElementById('nav-' + id);
            const originalBg = navItem.style.backgroundColor;
            navItem.style.backgroundColor = '#252d40';

            await new Promise(r => setTimeout(r, 400));

            updateQuestionUI(id, isCorrect);
            navItem.style.backgroundColor = originalBg;
        }

        await new Promise(r => setTimeout(r, 500));

        if (data.passed) {
            finalFlag = data.flag;
            btn.style.display = 'none';
            document.getElementById('flagBtn').style.display = 'block';
            showFlagPanel();
            alert(`Analysis Complete. Score: ${data.score}/${data.total}. Access Granted.`);
        } else {
            btn.innerText = "Submit Analysis";
            alert(`Analysis Insufficient. You have ${data.score} correct. You need ${data.required} to access the flag.`);
        }

    } catch (err) {
        console.error(err);
        alert("Connection Error");
        btn.innerText = "Submit Analysis";
    } finally {
        btn.disabled = false;
    }
}

function updateQuestionUI(id, isCorrect) {
    const navItem = document.getElementById('nav-' + id);
    const input = document.getElementById('input-' + id);
    const msg = document.getElementById('msg-' + id);
    const editBtn = document.getElementById('btn-edit-' + id);
    const submitBtn = document.getElementById('btn-submit-' + id);

    navItem.classList.remove('pending', 'correct', 'wrong');
    input.classList.remove('pending', 'correct', 'wrong');

    if (isCorrect) {
        navItem.classList.add('correct');
        input.classList.add('correct');
        msg.innerText = "✓ Verified";
        msg.style.color = "var(--success)";
        input.disabled = true;
        editBtn.classList.remove('visible');
        submitBtn.classList.add('hidden');
    } else {
        navItem.classList.add('wrong');
        input.classList.add('wrong');
        msg.innerText = "✗ Incorrect";
        msg.style.color = "var(--error)";
        editBtn.classList.add('visible');
        input.disabled = true;
        submitBtn.classList.add('hidden');
    }
}

function showFlagPanel() {
    document.querySelectorAll('.content-box').forEach(el => el.classList.remove('active'));
    document.getElementById('panel-flag').classList.add('active');
    if (finalFlag) document.getElementById('flag-text').innerText = finalFlag;
}

function copyFlag() {
    navigator.clipboard.writeText(finalFlag);
    alert("Flag copied!");
}

// --- TUTORIAL SYSTEM ---

const tutorialSteps = [
    {
        element: 'sidebarArea',
        title: 'Navigation Panel',
        desc: 'This sidebar tracks your progress through all questions. Click any item to navigate directly to that question.',
        position: 'right'
    },
    {
        element: 'input-row-' + (questionIds[0] || ''),
        title: 'Answer Input',
        desc: 'Type your answer here and press Enter or click the send button to save it as a draft (shown in yellow).',
        position: 'top'
    },
    {
        element: 'submitArea',
        title: 'Submit Analysis',
        desc: 'Once you\'ve answered all questions, click this button to verify your answers and get your score.',
        position: 'right'
    }
];

let currentStepIndex = 0;

function startTutorial() {
    if (questionIds.length > 0) selectQuestion(questionIds[0]);
    document.getElementById('tutorialBackdrop').style.display = 'block';
    document.getElementById('tutorialTooltip').style.display = 'block';
    currentStepIndex = 0;
    showTutorialStep();
}

function positionTooltip(targetEl, position) {
    const tooltip = document.getElementById('tutorialTooltip');
    const rect = targetEl.getBoundingClientRect();
    const tooltipWidth = Math.min(340, window.innerWidth - 40);
    const tooltipHeight = tooltip.offsetHeight || 200;
    const padding = 20;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Reset all positioning
    tooltip.style.top = 'auto';
    tooltip.style.left = 'auto';
    tooltip.style.right = 'auto';
    tooltip.style.bottom = 'auto';
    tooltip.style.transform = 'none';

    let top, left;

    switch (position) {
        case 'right':
            top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
            left = rect.right + padding;
            
            // If tooltip goes off right edge, try left side
            if (left + tooltipWidth > viewportWidth - padding) {
                left = rect.left - tooltipWidth - padding;
            }
            // If still off screen, center it
            if (left < padding) {
                left = (viewportWidth - tooltipWidth) / 2;
                top = rect.bottom + padding;
            }
            break;
            
        case 'left':
            top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
            left = rect.left - tooltipWidth - padding;
            
            if (left < padding) {
                left = rect.right + padding;
            }
            break;
            
        case 'top':
            top = rect.top - tooltipHeight - padding;
            left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
            
            // If goes above viewport, show below
            if (top < padding) {
                top = rect.bottom + padding;
            }
            break;
            
        case 'bottom':
            top = rect.bottom + padding;
            left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
            break;
            
        default:
            top = (viewportHeight - tooltipHeight) / 2;
            left = (viewportWidth - tooltipWidth) / 2;
    }

    // Clamp values to keep tooltip in viewport
    top = Math.max(padding, Math.min(top, viewportHeight - tooltipHeight - padding));
    left = Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding));

    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
}

function showTutorialStep() {
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));

    if (currentStepIndex >= tutorialSteps.length) {
        endTutorial();
        return;
    }

    const step = tutorialSteps[currentStepIndex];
    const el = document.getElementById(step.element);
    
    if (el) {
        el.classList.add('tutorial-highlight');
        positionTooltip(el, step.position);
    } else {
        // Fallback: center the tooltip if element not found
        const tooltip = document.getElementById('tutorialTooltip');
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
    }

    document.getElementById('t-title').innerText = step.title;
    document.getElementById('t-desc').innerText = step.desc;
    
    // Update button text for last step
    const nextBtn = document.querySelector('.tutorial-btn-next');
    if (nextBtn) {
        nextBtn.innerText = currentStepIndex >= tutorialSteps.length - 1 ? 'Finish' : 'Next →';
    }
}

function nextTutorialStep() {
    currentStepIndex++;
    showTutorialStep();
}

function endTutorial() {
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    document.getElementById('tutorialBackdrop').style.display = 'none';
    document.getElementById('tutorialTooltip').style.display = 'none';

    document.querySelectorAll('.content-box').forEach(el => el.classList.remove('active'));
    document.getElementById('panel-welcome').classList.add('active');
    document.querySelectorAll('.q-item').forEach(el => el.classList.remove('active'));
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function() {
    // Render markdown content
    initMarkdownContent();
});
