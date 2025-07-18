const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const typingIndicator = document.getElementById('typing-indicator');
const sendButton = document.getElementById('send-button');

// File upload elements
const imageUpload = document.getElementById('image-upload');
const documentUpload = document.getElementById('document-upload');
const audioUpload = document.getElementById('audio-upload');
const filePreview = document.getElementById('file-preview');
const fileName = document.getElementById('file-name');
const fileContent = document.getElementById('file-content');
const removeFileBtn = document.getElementById('remove-file-btn');

// Global variables for file handling
let currentFile = null;
let fileType = null;

// Your existing sendMessage function for text messages
async function sendMessage(message) {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ reply: `Server error: ${response.statusText}` }));
            throw new Error(errorData.reply || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.reply;
    } catch (error) {
        console.error('Error sending message:', error);
        return `Error: ${error.message}`;
    }
}

// New function to handle file uploads
async function sendFileMessage(file, prompt, endpoint) {
    try {
        const formData = new FormData();
        
        if (endpoint === '/generate-from-image') {
            formData.append('image', file);
        } else if (endpoint === '/generate-from-document') {
            formData.append('document', file);
        } else if (endpoint === '/generate-from-audio') {
            formData.append('audio', file);
        }
        
        if (prompt) {
            formData.append('prompt', prompt);
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ output: `Server error: ${response.statusText}` }));
            throw new Error(errorData.output || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.output;
    } catch (error) {
        console.error('Error sending file:', error);
        return `Error: ${error.message}`;
    }
}

// Enhanced message creation function
function addMessage(content, isUser = false, fileInfo = null) {
    // Remove welcome message if it exists
    const welcomeMessage = chatBox.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = isUser ? 'You' : 'AI';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Add file preview if file info is provided
    if (fileInfo) {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'message-file';
        
        if (fileInfo.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = fileInfo.url;
            img.alt = fileInfo.name;
            fileDiv.appendChild(img);
        } else {
            const fileIcon = document.createElement('div');
            fileIcon.className = 'file-icon';
            if (fileInfo.type.includes('audio')) {
                fileIcon.textContent = '🎵';
            } else if (fileInfo.type.includes('pdf')) {
                fileIcon.textContent = '📄';
            } else {
                fileIcon.textContent = '📁';
            }
            fileDiv.appendChild(fileIcon);
            
            const fileNameSpan = document.createElement('span');
            fileNameSpan.textContent = fileInfo.name;
            fileDiv.appendChild(fileNameSpan);
        }
        
        messageContent.appendChild(fileDiv);
    }
    
    if (content) {
        const textDiv = document.createElement('div');
        textDiv.textContent = content;
        messageContent.appendChild(textDiv);
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    chatBox.appendChild(messageDiv);
    
    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

// File handling functions
function handleFileSelect(file, type) {
    currentFile = file;
    fileType = type;
    
    fileName.textContent = file.name;
    fileContent.innerHTML = '';
    
    if (type === 'image' && file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        fileContent.appendChild(img);
    } else if (type === 'document') {
        const fileIcon = document.createElement('div');
        fileIcon.className = 'file-icon';
        fileIcon.textContent = '📄';
        fileContent.appendChild(fileIcon);
        
        const fileInfo = document.createElement('div');
        fileInfo.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        fileContent.appendChild(fileInfo);
    } else if (type === 'audio') {
        const audioIcon = document.createElement('div');
        audioIcon.className = 'file-icon';
        audioIcon.textContent = '🎵';
        fileContent.appendChild(audioIcon);
        
        const audioInfo = document.createElement('div');
        audioInfo.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        fileContent.appendChild(audioInfo);
    }
    
    filePreview.style.display = 'block';
    userInput.placeholder = `Ask about your ${type}...`;
}

function clearFileSelection() {
    currentFile = null;
    fileType = null;
    filePreview.style.display = 'none';
    userInput.placeholder = 'Type your message or upload a file...';
    
    // Clear file inputs
    imageUpload.value = '';
    documentUpload.value = '';
    audioUpload.value = '';
}

// File upload event listeners
imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFileSelect(file, 'image');
    }
});

documentUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFileSelect(file, 'document');
    }
});

audioUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFileSelect(file, 'audio');
    }
});

removeFileBtn.addEventListener('click', clearFileSelection);

// Typing indicator functions
function showTypingIndicator() {
    typingIndicator.classList.add('show');
    chatBox.scrollTop = chatBox.scrollHeight;
}

function hideTypingIndicator() {
    typingIndicator.classList.remove('show');
}

// Enhanced form submission with file support
chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const message = userInput.value.trim();
    
    // Check if we have a file or a message
    if (!currentFile && !message) return;
    
    // Disable send button during processing
    sendButton.disabled = true;
    
    try {
        if (currentFile) {
            // Handle file upload
            const fileInfo = {
                name: currentFile.name,
                type: currentFile.type,
                url: fileType === 'image' ? URL.createObjectURL(currentFile) : null
            };
            
            // Add user message with file
            addMessage(message || `Uploaded ${fileType}`, true, fileInfo);
            
            // Clear input and file selection
            userInput.value = '';
            const tempFile = currentFile;
            const tempFileType = fileType;
            clearFileSelection();
            
            // Show typing indicator
            showTypingIndicator();
            
            // Determine endpoint based on file type
            let endpoint;
            if (tempFileType === 'image') {
                endpoint = '/generate-from-image';
            } else if (tempFileType === 'document') {
                endpoint = '/generate-from-document';
            } else if (tempFileType === 'audio') {
                endpoint = '/generate-from-audio';
            }
            
            // Send file to appropriate endpoint
            const reply = await sendFileMessage(tempFile, message, endpoint);
            
            // Hide typing indicator
            hideTypingIndicator();
            
            // Add bot response
            addMessage(reply, false);
            
        } else {
            // Handle regular text message
            addMessage(message, true);
            userInput.value = '';
            
            showTypingIndicator();
            
            const reply = await sendMessage(message);
            
            hideTypingIndicator();
            addMessage(reply, false);
        }
        
    } catch (error) {
        hideTypingIndicator();
        addMessage('Sorry, I encountered an error. Please try again.', false);
        console.error('Chat error:', error);
    } finally {
        // Re-enable send button
        sendButton.disabled = false;
    }
});

// Auto-focus input
userInput.focus();

// Initial welcome message
setTimeout(() => {
    addMessage("Hello! I'm Gemini AI. How can I help you today? You can send me text messages or upload images, documents, or audio files for analysis!", false);
}, 500);

// Enter key support
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
    }
});

// Drag and drop support
chatBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    chatBox.style.background = '#f0f4ff';
});

chatBox.addEventListener('dragleave', (e) => {
    e.preventDefault();
    chatBox.style.background = '#f8fafc';
});

chatBox.addEventListener('drop', (e) => {
    e.preventDefault();
    chatBox.style.background = '#f8fafc';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        
        // Determine file type and handle accordingly
        if (file.type.startsWith('image/')) {
            handleFileSelect(file, 'image');
        } else if (file.type.startsWith('audio/')) {
            handleFileSelect(file, 'audio');
        } else if (file.type === 'application/pdf' || 
                   file.type.includes('document') || 
                   file.type === 'text/plain') {
            handleFileSelect(file, 'document');
        } else {
            addMessage('Unsupported file type. Please upload images, documents, or audio files.', false);
        }
    }
});

// Connection status handling
window.addEventListener('offline', () => {
    addMessage('You appear to be offline. Please check your internet connection.', false);
});

window.addEventListener('online', () => {
    addMessage('Connection restored! You can continue chatting.', false);
});