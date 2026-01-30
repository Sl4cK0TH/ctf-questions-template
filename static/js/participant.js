let userAnswers = {};
let finalFlag = "";

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
        title: 'Navigation',
        desc: 'This sidebar tracks your progress. Navigate between questions here.',
        position: { top: '50px', left: '320px' }
    },
    {
        element: 'input-row-' + (questionIds[0] || ''),
        title: 'Drafting Answers',
        desc: 'Type your answer and press Enter or click the arrow to save as draft (marked yellow).',
        position: { top: '300px', left: 'auto', right: '10%' }
    },
    {
        element: 'submitArea',
        title: 'Submit Analysis',
        desc: 'Once ready, click here to verify all your answers.',
        position: { bottom: '100px', left: '320px', top: 'auto' }
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

function showTutorialStep() {
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));

    if (currentStepIndex >= tutorialSteps.length) {
        endTutorial();
        return;
    }

    const step = tutorialSteps[currentStepIndex];
    const el = document.getElementById(step.element);
    if (el) el.classList.add('tutorial-highlight');

    const tooltip = document.getElementById('tutorialTooltip');
    tooltip.style.top = step.position.top;
    tooltip.style.left = step.position.left || 'auto';
    tooltip.style.right = step.position.right || 'auto';
    tooltip.style.bottom = step.position.bottom || 'auto';

    document.getElementById('t-title').innerText = step.title;
    document.getElementById('t-desc').innerText = step.desc;
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
