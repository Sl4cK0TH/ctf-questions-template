// Admin JavaScript for question management

async function addQuestion() {
    if (!challengeId) return;

    const response = await fetch(`/admin-7x9k2m/api/challenge/${challengeId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            question: 'New question...',
            answer: '',
            match_type: 'exact'
        })
    });

    if (response.ok) {
        location.reload();
    }
}

async function saveQuestion(questionId) {
    const item = document.querySelector(`.question-item[data-id="${questionId}"]`);
    const question = item.querySelector('.q-text').value;
    const answer = item.querySelector('.q-answer').value;
    const matchType = item.querySelector('.q-match').value;

    const response = await fetch(`/admin-7x9k2m/api/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            question: question,
            answer: answer,
            match_type: matchType,
            order_num: Array.from(document.querySelectorAll('.question-item')).indexOf(item) + 1
        })
    });

    if (response.ok) {
        const btn = item.querySelector('.btn-save-q');
        const originalText = btn.textContent;
        btn.textContent = '✓ Saved';
        btn.style.backgroundColor = 'var(--success)';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '';
        }, 1500);
    }
}

async function deleteQuestion(questionId) {
    if (!confirm('Delete this question?')) return;

    const response = await fetch(`/admin-7x9k2m/api/questions/${questionId}`, {
        method: 'DELETE'
    });

    if (response.ok) {
        document.querySelector(`.question-item[data-id="${questionId}"]`).remove();
    }
}

// Make slug URL-safe as user types
document.addEventListener('DOMContentLoaded', function () {
    const slugInput = document.querySelector('input[name="slug"]');
    const nameInput = document.querySelector('input[name="name"]');

    if (nameInput && slugInput && !slugInput.value) {
        nameInput.addEventListener('input', function () {
            slugInput.value = this.value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        });
    }
});
