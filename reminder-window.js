document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get current window ID
        const currentWindow = await chrome.windows.getCurrent();
        const windowId = currentWindow.id;
        
        // Get reminder data from storage
        const result = await chrome.storage.local.get(`reminder_${windowId}`);
        const reminderData = result[`reminder_${windowId}`];
        
        if (!reminderData) {
            console.error('No reminder data found');
            window.close();
            return;
        }
        
        // Populate reminder details
        document.getElementById('reminderTitle').textContent = reminderData.title;
        
        const descriptionEl = document.getElementById('reminderDescription');
        if (reminderData.description) {
            descriptionEl.textContent = reminderData.description;
            descriptionEl.style.display = 'block';
        } else {
            descriptionEl.style.display = 'none';
        }
        
        // Format and display time (with guard)
        const timeTextEl = document.getElementById('timeText');
        if (reminderData.date && reminderData.time) {
            try {
                const dateTime = new Date(`${reminderData.date}T${reminderData.time}`);
                timeTextEl.textContent = isNaN(dateTime.getTime())
                    ? 'Invalid reminder time'
                    : dateTime.toLocaleString();
            } catch (e) {
                timeTextEl.textContent = 'Invalid reminder time';
            }
        } else {
            timeTextEl.textContent = 'Reminder time';
        }
        
        // Display contact name in header
        const contactNameEl = document.getElementById('contactName');
        const contactSectionEl = document.getElementById('reminderContact');
        if (reminderData.contactName && reminderData.contactName !== 'Unknown Contact') {
            contactNameEl.textContent = reminderData.contactName;
            contactSectionEl.style.display = 'flex';
        } else {
            contactSectionEl.style.display = 'none';
        }
        
        // Elements
        const snoozeBtn = document.getElementById('snoozeBtn');
        const dismissBtn = document.getElementById('dismissBtn');
        const loadingEl = document.getElementById('loading');

        // Hide Snooze if limit reached (3 snoozes max)
        const snoozedCount = Number(reminderData.snoozedCount || 0);
        if (snoozedCount >= 3 && snoozeBtn) {
            snoozeBtn.style.display = 'none';
        }
        
        const sendReminderAction = (action) => ({
            type: 'REMINDER_ACTION',
            payload: { action, reminder: reminderData }
        });

        const handleAction = async (action, buttonEl) => {
            try {
                loadingEl.style.display = 'block';
                if (buttonEl) buttonEl.disabled = true;

                const response = await chrome.runtime.sendMessage(sendReminderAction(action));
                if (response && response.success === false) {
                    throw new Error(response.error || `Error ${action}ing reminder`);
                }

                window.close();
            } catch (error) {
                console.error(`Error ${action}ing reminder:`, error);
                loadingEl.textContent = `Error ${action}ing reminder`;
                if (buttonEl) buttonEl.disabled = false;
                loadingEl.style.display = 'none';
            }
        };

        if (snoozeBtn) {
            snoozeBtn.addEventListener('click', () => handleAction('snooze', snoozeBtn));
        }
        dismissBtn.addEventListener('click', () => handleAction('dismiss', dismissBtn));
        
        // Auto-focus the window
        window.focus();
        
        // Play notification sound (if allowed)
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2PXNeysFJHfH8N2QQAoUXrTp66hVFAlGn+DyvmwhBjiR2PXOey0GJXfH8N2QQAoUXrTq66hVFAlGnt/yvmwhBjiR2PXOey0GJHfH8N2QQAoUXrTq66hVFAlGnt/yv2wiBDmS2PXOey0GJHfH79yQQAkUXrPq66hVFAlGnt/yv2wiBDmS2PXOey0GJHfH79yQQAkUXrPq66hVFAlGnt/yv2wiBDmS2PXOey0GJHfH79yQQAkUXrPq66hVFAlGnt/yv2wiBDmS2PXOei0GJHfH79yQQAkUXrPq66hVFAlGnt/yv2wiBDmS2PXOei0GJHfH79yQQAkUXrPq66hVFAlGnt/yv2wiBDmS2PXOei0GJHfH79yQQAkUXrPq66hVFAlGnt/yv2wiBDmS2PXOei0GJHfH79yQQAkUXrPq66hVFAlGnt/yv2wiBDmS2PXOei0GJHfH79yQQAkUXrPq66hVFAlGn+DyvmshBDmR2PXOei0GJHfH79yQQAkUXrPq66hVFAlGn+DyvmshA=');
            audio.volume = 0.3;
            audio.play().catch(() => {});
        } catch (e) {}
        
    } catch (error) {
        console.error('Error loading reminder:', error);
        document.getElementById('reminderTitle').textContent = 'Error loading reminder';
    }
});

// Clean up storage when window closes
window.addEventListener('beforeunload', async () => {
    try {
        const currentWindow = await chrome.windows.getCurrent();
        await chrome.storage.local.remove(`reminder_${currentWindow.id}`);
    } catch (e) {
        // Ignore cleanup errors
    }
});
