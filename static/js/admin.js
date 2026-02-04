// Admin JavaScript for challenge and question management

// ========================================
// CONFIGURATION
// ========================================

// Get admin URL prefix from the current page URL
const adminUrlPrefix = window.location.pathname.split('/').slice(0, 2).join('/');

// Configure marked.js for safe rendering
if (typeof marked !== 'undefined') {
    marked.setOptions({
        breaks: true,
        gfm: true
    });
}

// Sanitizer configuration for DOMPurify
const sanitizeConfig = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 
                   'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                   'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel']
};

// ========================================
// STATE MANAGEMENT
// ========================================

let hasUnsavedChanges = false;
let questionData = {}; // Store question data locally
let sortableInstance = null;

// ========================================
// MARKDOWN RENDERING
// ========================================

function renderMarkdown(text) {
    if (!text) return '';
    
    // Parse markdown with marked.js
    let html = marked.parse(text);
    
    // Sanitize with DOMPurify
    if (typeof DOMPurify !== 'undefined') {
        html = DOMPurify.sanitize(html, sanitizeConfig);
    }
    
    return html;
}

// ========================================
// DESCRIPTION EDITOR
// ========================================

function toggleDescriptionMode(mode) {
    const editor = document.getElementById('description-editor');
    const preview = document.getElementById('description-preview');
    const toolbar = editor.closest('.editor-wrapper').querySelector('.editor-toolbar');
    
    toolbar.querySelectorAll('.toolbar-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    if (mode === 'preview') {
        preview.innerHTML = renderMarkdown(editor.value) || '<span class="preview-empty">Nothing to preview</span>';
        editor.style.display = 'none';
        preview.style.display = 'block';
    } else {
        editor.style.display = 'block';
        preview.style.display = 'none';
    }
}

// ========================================
// QUESTION MANAGEMENT
// ========================================

function toggleQuestionMode(questionId, mode) {
    const item = document.querySelector(`.question-item[data-id="${questionId}"]`);
    if (!item) return;
    
    const textarea = item.querySelector('.q-text');
    const preview = item.querySelector('.q-text-preview');
    const buttons = item.querySelectorAll('.question-actions-header .toolbar-btn');
    
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    if (mode === 'preview') {
        preview.innerHTML = renderMarkdown(textarea.value) || '<span class="preview-empty">Nothing to preview</span>';
        textarea.style.display = 'none';
        preview.style.display = 'block';
    } else {
        textarea.style.display = 'block';
        preview.style.display = 'none';
    }
}

function addQuestion() {
    if (!challengeId) return;
    
    const questionsList = document.getElementById('questions-list');
    const questionCount = questionsList.querySelectorAll('.question-item').length + 1;
    const tempId = 'new-' + Date.now();
    
    const newItem = document.createElement('div');
    newItem.className = 'question-item';
    newItem.dataset.id = tempId;
    newItem.dataset.order = questionCount;
    newItem.dataset.isNew = 'true';
    newItem.innerHTML = `
        <div class="question-header">
            <span class="drag-handle" title="Drag to reorder">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="8" y1="6" x2="16" y2="6"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                    <line x1="8" y1="18" x2="16" y2="18"></line>
                </svg>
            </span>
            <span class="q-num">#${questionCount}</span>
            <div class="question-actions-header">
                <button type="button" class="toolbar-btn small active" data-mode="edit" onclick="toggleQuestionMode('${tempId}', 'edit')" title="Edit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                    </svg>
                </button>
                <button type="button" class="toolbar-btn small" data-mode="preview" onclick="toggleQuestionMode('${tempId}', 'preview')" title="Preview">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
                <button type="button" class="btn-delete" onclick="deleteQuestion('${tempId}')" title="Delete">×</button>
            </div>
        </div>
        <div class="question-body">
            <div class="question-field">
                <label>Question <span class="label-hint">Markdown & HTML supported</span></label>
                <textarea class="q-text" placeholder="Enter your question..." rows="3"></textarea>
                <div class="q-text-preview markdown-preview" style="display: none;"></div>
            </div>
            <div class="answer-row">
                <div class="answer-field">
                    <label>Answer</label>
                    <input type="text" class="q-answer" value="" placeholder="Correct answer...">
                </div>
                <div class="match-field">
                    <label>Match Type</label>
                    <select class="q-match">
                        <option value="exact" selected>Exact Match</option>
                        <option value="case_insensitive">Case Insensitive</option>
                        <option value="contains">Contains</option>
                    </select>
                </div>
            </div>
        </div>
    `;
    
    questionsList.appendChild(newItem);
    attachQuestionListeners(newItem);
    newItem.querySelector('.q-text').focus();
    
    markUnsavedChanges();
    updateQuestionNumbers();
}

function deleteQuestion(questionId) {
    if (!confirm('Delete this question?')) return;
    
    const item = document.querySelector(`.question-item[data-id="${questionId}"]`);
    if (item) {
        item.remove();
        markUnsavedChanges();
        updateQuestionNumbers();
    }
}

function updateQuestionNumbers() {
    const items = document.querySelectorAll('.question-item');
    items.forEach((item, index) => {
        const numSpan = item.querySelector('.q-num');
        if (numSpan) {
            numSpan.textContent = `#${index + 1}`;
        }
        item.dataset.order = index + 1;
    });
}

// ========================================
// AUTO-SAVE & CHANGE TRACKING
// ========================================

let saveDebounceTimer = null;

function markUnsavedChanges() {
    hasUnsavedChanges = true;
    updateSaveStatus('unsaved');
}

function updateSaveStatus(status, message) {
    const statusEl = document.getElementById('save-status');
    if (!statusEl) return;
    
    switch (status) {
        case 'unsaved':
            statusEl.innerHTML = '<span class="status-unsaved">● Unsaved changes</span>';
            break;
        case 'saving':
            statusEl.innerHTML = '<span class="status-saving">⟳ Saving...</span>';
            break;
        case 'saved':
            statusEl.innerHTML = '<span class="status-saved">✓ Saved</span>';
            setTimeout(() => {
                if (statusEl.querySelector('.status-saved')) {
                    statusEl.innerHTML = '';
                }
            }, 3000);
            break;
        case 'error':
            statusEl.innerHTML = `<span class="status-error">✗ ${message || 'Error saving'}</span>`;
            break;
    }
}

function attachQuestionListeners(item) {
    const inputs = item.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        // On input (debounced)
        input.addEventListener('input', () => {
            markUnsavedChanges();
        });
        
        // On blur
        input.addEventListener('blur', () => {
            markUnsavedChanges();
        });
    });
}

// ========================================
// FORM SUBMISSION - SAVE ALL
// ========================================

async function saveAllQuestions() {
    const items = document.querySelectorAll('.question-item');
    const questions = [];
    
    items.forEach((item, index) => {
        const id = item.dataset.id;
        const isNew = item.dataset.isNew === 'true';
        
        questions.push({
            id: isNew ? null : parseInt(id),
            question: item.querySelector('.q-text').value,
            answer: item.querySelector('.q-answer').value,
            match_type: item.querySelector('.q-match').value,
            order_num: index + 1
        });
    });
    
    try {
        const response = await fetch(`${adminUrlPrefix}/api/challenge/${challengeId}/questions/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questions })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Update IDs for new questions
            if (data.ids) {
                const newItems = document.querySelectorAll('.question-item[data-is-new="true"]');
                newItems.forEach((item, idx) => {
                    if (data.ids[idx]) {
                        item.dataset.id = data.ids[idx];
                        delete item.dataset.isNew;
                        
                        // Update onclick handlers
                        const deleteBtn = item.querySelector('.btn-delete');
                        if (deleteBtn) {
                            deleteBtn.setAttribute('onclick', `deleteQuestion(${data.ids[idx]})`);
                        }
                        
                        const editBtn = item.querySelector('.toolbar-btn[data-mode="edit"]');
                        if (editBtn) {
                            editBtn.setAttribute('onclick', `toggleQuestionMode(${data.ids[idx]}, 'edit')`);
                        }
                        
                        const previewBtn = item.querySelector('.toolbar-btn[data-mode="preview"]');
                        if (previewBtn) {
                            previewBtn.setAttribute('onclick', `toggleQuestionMode(${data.ids[idx]}, 'preview')`);
                        }
                    }
                });
            }
            
            hasUnsavedChanges = false;
            updateSaveStatus('saved');
            return true;
        } else {
            updateSaveStatus('error', 'Failed to save questions');
            return false;
        }
    } catch (err) {
        console.error('Error saving questions:', err);
        updateSaveStatus('error', 'Connection error');
        return false;
    }
}

// ========================================
// DRAG AND DROP (SortableJS)
// ========================================

function initSortable() {
    const questionsList = document.getElementById('questions-list');
    if (!questionsList || typeof Sortable === 'undefined') return;
    
    sortableInstance = Sortable.create(questionsList, {
        handle: '.drag-handle',
        animation: 200,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        onEnd: function(evt) {
            updateQuestionNumbers();
            markUnsavedChanges();
        }
    });
}

// ========================================
// FORM INTERCEPTOR
// ========================================

function interceptFormSubmit() {
    const form = document.getElementById('challenge-form');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        // If there are question changes, save them first
        if (hasUnsavedChanges && challengeId) {
            e.preventDefault();
            
            updateSaveStatus('saving');
            const saved = await saveAllQuestions();
            
            if (saved) {
                // Now submit the form normally
                hasUnsavedChanges = false;
                form.submit();
            }
        }
    });
}

// Warn before leaving with unsaved changes
window.addEventListener('beforeunload', function(e) {
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
});

// ========================================
// SLUG AUTO-GENERATION
// ========================================

function initSlugGeneration() {
    const slugInput = document.querySelector('input[name="slug"]');
    const nameInput = document.querySelector('input[name="name"]');

    if (nameInput && slugInput && !slugInput.value) {
        nameInput.addEventListener('input', function() {
            slugInput.value = this.value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        });
    }
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize slug auto-generation
    initSlugGeneration();
    
    // Initialize sortable drag-and-drop
    initSortable();
    
    // Attach listeners to existing questions
    document.querySelectorAll('.question-item').forEach(item => {
        attachQuestionListeners(item);
    });
    
    // Intercept form submission
    interceptFormSubmit();
    
    // Track changes on description
    const descEditor = document.getElementById('description-editor');
    if (descEditor) {
        descEditor.addEventListener('input', () => {
            // This is for the challenge form, not questions
        });
    }
});
