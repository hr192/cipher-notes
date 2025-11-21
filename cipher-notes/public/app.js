/**
 * Cipher Notes - Client-side encryption application
 * All encryption/decryption happens in the browser
 * Server never sees plaintext data
 */

class CipherNotes {
    constructor() {
        this.currentPasteId = null;
        this.currentKey = null;
        this.encryptedContent = null;
        this.isOwner = false;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.detectMode();
        await this.checkBrowserSupport();
    }

    /**
     * Check if browser supports required APIs
     */
    async checkBrowserSupport() {
        if (!window.crypto || !window.crypto.subtle) {
            this.showMessage('Your browser does not support Web Crypto API. Please use a modern browser.', 'error');
            document.getElementById('encrypt-btn').disabled = true;
            return false;
        }
        return true;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // New paste view
        document.getElementById('encrypt-btn').addEventListener('click', () => this.encryptAndShare());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearContent());

        // View paste
        document.getElementById('copy-btn').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('download-btn').addEventListener('click', () => this.showDownloadDialog());
        document.getElementById('edit-btn').addEventListener('click', () => this.enableEditing());
        document.getElementById('back-btn').addEventListener('click', () => this.goToNewPaste());

        // About
        document.getElementById('about-back-btn').addEventListener('click', () => this.goToNewPaste());

        // Share dialog
        document.getElementById('copy-link-btn').addEventListener('click', () => this.copyShareLink());
        document.getElementById('close-share-dialog').addEventListener('click', () => this.closeDialog('share-dialog'));

        // Download dialog
        document.getElementById('confirm-download-btn').addEventListener('click', () => this.performDownload());
        document.getElementById('cancel-download-btn').addEventListener('click', () => this.closeDialog('download-dialog'));

        // Navigation
        document.querySelectorAll('a[href="#about"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showView('about-view');
            });
        });

        document.getElementById('raw-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.downloadRaw();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'Enter' && document.getElementById('new-paste-view').classList.contains('active')) {
                    this.encryptAndShare();
                }
            }
        });
    }

    /**
     * Detect if we're viewing an encrypted paste or creating new one
     */
    detectMode() {
        const hash = window.location.hash;
        if (hash.startsWith('#')) {
            this.currentPasteId = hash.substring(1).split('_')[0];
            this.currentKey = hash.substring(this.currentPasteId.length + 2);
            if (this.currentPasteId && this.currentKey) {
                this.loadAndDecryptPaste();
            }
        }
    }

    /**
     * Load paste from server and decrypt it
     */
    async loadAndDecryptPaste() {
        try {
            const response = await fetch(`/api/paste/${this.currentPasteId}`);
            if (!response.ok) {
                this.showMessage('Paste not found or has expired.', 'error');
                this.goToNewPaste();
                return;
            }

            const data = await response.json();
            this.encryptedContent = data.content;
            
            const decrypted = await this.decryptContent(this.encryptedContent);
            this.displayDecryptedPaste(decrypted);
            
            // Check if user is owner (via session cookie)
            if (data.isOwner) {
                this.isOwner = true;
                document.getElementById('edit-btn').style.display = 'inline-block';
            }
        } catch (error) {
            this.showMessage('Error loading paste: ' + error.message, 'error');
            console.error(error);
        }
    }

    /**
     * Display decrypted paste
     */
    displayDecryptedPaste(content) {
        document.getElementById('content-display').textContent = content;
        this.showView('view-paste-view');
        
        // Show raw link
        document.getElementById('raw-link').style.display = 'inline-block';
        document.getElementById('sep-raw').style.display = 'inline-block';
        document.getElementById('raw-link').href = '#';
    }

    /**
     * Encrypt content and upload to server
     */
    async encryptAndShare() {
        const content = document.getElementById('content').value.trim();
        if (!content) {
            this.showMessage('Please enter some content to encrypt.', 'error');
            return;
        }

        try {
            document.getElementById('encrypt-btn').disabled = true;
            this.updateStatus('Encrypting...');

            // Generate random key
            const key = await this.generateKey();
            const keyString = this.arrayBufferToHex(key);

            // Encrypt content
            const encrypted = await this.encryptContent(content, key);

            // Upload to server
            const response = await fetch('/api/paste', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: encrypted,
                    autoDelete: document.getElementById('auto-delete').checked,
                    expiryHours: parseInt(document.getElementById('expiry-hours').value)
                })
            });

            if (!response.ok) {
                throw new Error('Failed to upload paste');
            }

            const data = await response.json();
            const pasteId = data.id;

            // Create share link with key in fragment
            const shareLink = `${window.location.origin}/#${pasteId}_${keyString}`;
            
            this.showShareDialog(shareLink);
            this.updateStatus('Encrypted and shared!');
            
            // Store in session history
            this.addToHistory(pasteId, keyString, content.substring(0, 50));
            
        } catch (error) {
            this.showMessage('Error encrypting or uploading: ' + error.message, 'error');
            this.updateStatus('Error');
            console.error(error);
        } finally {
            document.getElementById('encrypt-btn').disabled = false;
        }
    }

    /**
     * Generate encryption key
     */
    async generateKey() {
        const key = await window.crypto.getRandomValues(new Uint8Array(32));
        return key;
    }

    /**
     * Encrypt content using AES-GCM
     */
    async encryptContent(content, keyBuffer) {
        try {
            // Import the key
            const key = await window.crypto.subtle.importKey(
                'raw',
                keyBuffer,
                { name: 'AES-GCM' },
                false,
                ['encrypt']
            );

            // Generate IV
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            // Encode content
            const encoder = new TextEncoder();
            const data = encoder.encode(content);

            // Encrypt
            const encrypted = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                data
            );

            // Combine IV and encrypted data
            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encrypted), iv.length);

            return this.arrayBufferToBase64(combined);
        } catch (error) {
            throw new Error('Encryption failed: ' + error.message);
        }
    }

    /**
     * Decrypt content using AES-GCM
     */
    async decryptContent(encryptedBase64) {
        try {
            // Convert key string from hex
            const keyBuffer = this.hexToArrayBuffer(this.currentKey);

            // Decode encrypted content
            const combined = this.base64ToArrayBuffer(encryptedBase64);

            // Extract IV and encrypted data
            const iv = combined.slice(0, 12);
            const encrypted = combined.slice(12);

            // Import key
            const key = await window.crypto.subtle.importKey(
                'raw',
                keyBuffer,
                { name: 'AES-GCM' },
                false,
                ['decrypt']
            );

            // Decrypt
            const decrypted = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encrypted
            );

            // Decode to string
            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            throw new Error('Decryption failed: ' + error.message);
        }
    }

    /**
     * Show share dialog
     */
    showShareDialog(link) {
        document.getElementById('share-link').value = link;
        document.getElementById('share-dialog').showModal();
    }

    /**
     * Copy share link to clipboard
     */
    copyShareLink() {
        const link = document.getElementById('share-link');
        link.select();
        document.execCommand('copy');
        this.showMessage('Link copied to clipboard!', 'success');
    }

    /**
     * Copy decrypted content to clipboard
     */
    copyToClipboard() {
        const content = document.getElementById('content-display').textContent;
        navigator.clipboard.writeText(content).then(() => {
            this.showMessage('Content copied to clipboard!', 'success');
        });
    }

    /**
     * Show download dialog
     */
    showDownloadDialog() {
        document.getElementById('download-dialog').showModal();
    }

    /**
     * Perform download with selected format
     */
    performDownload() {
        const format = document.querySelector('input[name="download-format"]:checked').value;
        this.downloadContent(format);
        this.closeDialog('download-dialog');
    }

    /**
     * Download content in specified format
     */
    downloadContent(format) {
        const content = document.getElementById('content-display').textContent;
        let fileContent = content;
        let mimeType = 'text/plain';
        let filename = `note-${Date.now()}`;

        switch(format) {
            case 'html':
                fileContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cipher Notes</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            max-width: 800px;
            margin: 2rem auto;
            padding: 1rem;
            line-height: 1.6;
        }
        pre {
            background: #f5f5f5;
            padding: 1rem;
            border-radius: 6px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <h1>Cipher Notes</h1>
    <pre>${this.escapeHtml(content)}</pre>
    <p><small>Downloaded from Cipher Notes</small></p>
</body>
</html>`;
                mimeType = 'text/html';
                filename += '.html';
                break;

            case 'md':
                fileContent = `# Cipher Notes\n\n\`\`\`\n${content}\n\`\`\`\n`;
                mimeType = 'text/markdown';
                filename += '.md';
                break;

            case 'txt':
            default:
                filename += '.txt';
        }

        // Create blob and download
        const blob = new Blob([fileContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);

        this.showMessage(`Downloaded as ${format.toUpperCase()}`, 'success');
    }

    /**
     * Download raw content as plain text
     */
    downloadRaw() {
        const content = document.getElementById('content-display').textContent;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `note-${Date.now()}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Enable editing mode
     */
    enableEditing() {
        if (!this.isOwner) {
            this.showMessage('You are not the owner of this paste.', 'error');
            return;
        }

        const content = document.getElementById('content-display').textContent;
        document.getElementById('content').value = content;
        this.goToNewPaste();
        this.showMessage('Edit your note and re-encrypt to update it.', 'success');
    }

    /**
     * Clear content
     */
    clearContent() {
        if (document.getElementById('content').value && !confirm('Clear content?')) {
            return;
        }
        document.getElementById('content').value = '';
        document.getElementById('content').focus();
    }

    /**
     * Go back to new paste view
     */
    goToNewPaste() {
        this.showView('new-paste-view');
        document.getElementById('raw-link').style.display = 'none';
        document.getElementById('sep-raw').style.display = 'none';
    }

    /**
     * Show specific view
     */
    showView(viewId) {
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
    }

    /**
     * Show dialog
     */
    closeDialog(dialogId) {
        document.getElementById(dialogId).close();
    }

    /**
     * Show message
     */
    showMessage(text, type = 'info') {
        // Create message element
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;

        // Insert after header
        const header = document.querySelector('header');
        header.parentNode.insertBefore(message, header.nextSibling);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            message.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => message.remove(), 300);
        }, 5000);
    }

    /**
     * Update status
     */
    updateStatus(text) {
        document.getElementById('status').textContent = text;
    }

    /**
     * Add to session history
     */
    addToHistory(pasteId, key, preview) {
        const history = JSON.parse(sessionStorage.getItem('cipherNotesHistory') || '[]');
        history.unshift({ pasteId, key, preview, timestamp: new Date().toISOString() });
        sessionStorage.setItem('cipherNotesHistory', JSON.stringify(history.slice(0, 10)));
    }

    /**
     * Utility: Convert ArrayBuffer to Hex
     */
    arrayBufferToHex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Utility: Convert Hex to ArrayBuffer
     */
    hexToArrayBuffer(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
    }

    /**
     * Utility: Convert ArrayBuffer to Base64
     */
    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Utility: Convert Base64 to ArrayBuffer
     */
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Utility: Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cipherNotes = new CipherNotes();
});
