// Initialize the application
const storage = new StorageManager();
const ui = new UIManager(storage);

// Make UI accessible globally for onclick handlers
window.ui = ui;

// PWA Installation
let deferredPrompt;
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installBtn');
const dismissInstallBtn = document.getElementById('dismissInstallBtn');

// Check if already installed or dismissed
const isInstallDismissed = localStorage.getItem('installDismissed');
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// PWA Install Prompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    if (!isInstallDismissed && !isStandalone) {
        showInstallBanner();
    }
});

function showInstallBanner() {
    installBanner.style.transform = 'translateY(0)';
    document.body.style.paddingTop = '48px';
}

function hideInstallBanner() {
    installBanner.style.transform = 'translateY(-100%)';
    document.body.style.paddingTop = '0';
}

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        
        deferredPrompt = null;
        hideInstallBanner();
    }
});

dismissInstallBtn.addEventListener('click', () => {
    localStorage.setItem('installDismissed', 'true');
    hideInstallBanner();
});

// Hide banner if already installed
window.addEventListener('appinstalled', () => {
    hideInstallBanner();
    console.log('PWA was installed');
});

// Show banner on page load if conditions are met
window.addEventListener('load', () => {
    if (deferredPrompt && !isInstallDismissed && !isStandalone) {
        setTimeout(showInstallBanner, 2000); // Show after 2 seconds
    }
});