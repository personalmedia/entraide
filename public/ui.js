// UI Management
class UIManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.currentAccountId = null;
        this.initializeEventListeners();
        this.render();
    }

    initializeEventListeners() {
        // Add lending modal
        document.getElementById('addLendingBtn').addEventListener('click', () => {
            this.showAddLendingModal();
        });

        document.getElementById('cancelLendingBtn').addEventListener('click', () => {
            this.hideAddLendingModal();
        });

        document.getElementById('addLendingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddLending();
        });

        // Payment modal
        document.getElementById('cancelPaymentBtn').addEventListener('click', () => {
            this.hidePaymentModal();
        });

        document.getElementById('paymentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddPayment();
        });

        // Import/Export modal
        document.getElementById('importExportBtn').addEventListener('click', () => {
            this.showImportExportModal();
        });

        document.getElementById('closeImportExportBtn').addEventListener('click', () => {
            this.hideImportExportModal();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.handleExport();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.handleImport(e);
        });

        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('lendingDate').value = today;
        document.getElementById('paymentDate').value = today;

        // Info modal
        document.getElementById('infoBtn').addEventListener('click', () => {
            this.showInfoModal();
        });

        document.getElementById('closeInfoBtn').addEventListener('click', () => {
            this.hideInfoModal();
        });
    }

    showAddLendingModal(prefillParty = '') {
        document.getElementById('addLendingModal').classList.remove('hidden');
        if (prefillParty) {
            document.getElementById('lendingParty').value = prefillParty;
        }
    }

    hideAddLendingModal() {
        document.getElementById('addLendingModal').classList.add('hidden');
        document.getElementById('addLendingForm').reset();
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('lendingDate').value = today;
    }

    showPaymentModal(accountId) {
        this.currentAccountId = accountId;
        document.getElementById('paymentModal').classList.remove('hidden');
    }

    hidePaymentModal() {
        document.getElementById('paymentModal').classList.add('hidden');
        document.getElementById('paymentForm').reset();
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('paymentDate').value = today;
        this.currentAccountId = null;
    }

    showImportExportModal() {
        document.getElementById('importExportModal').classList.remove('hidden');
    }

    hideImportExportModal() {
        document.getElementById('importExportModal').classList.add('hidden');
    }

    showInfoModal() {
        document.getElementById('infoModal').classList.remove('hidden');
    }

    hideInfoModal() {
        document.getElementById('infoModal').classList.add('hidden');
    }

    handleAddLending() {
        const amount = document.getElementById('lendingAmount').value;
        const party = document.getElementById('lendingParty').value;
        const type = document.getElementById('lendingType').value;
        const date = document.getElementById('lendingDate').value;

        const transaction = {
            amount: parseFloat(amount),
            party: party.trim(),
            type,
            date
        };

        this.storage.addTransaction(transaction);
        this.hideAddLendingModal();
        this.render();
    }

    handleAddPayment() {
        if (!this.currentAccountId) return;

        const amount = document.getElementById('paymentAmount').value;
        const date = document.getElementById('paymentDate').value;

        const payment = {
            amount: parseFloat(amount),
            date
        };

        this.storage.addPayment(this.currentAccountId, payment);
        this.hidePaymentModal();
        this.render();
    }

    handleExport() {
        const data = this.storage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `entraide-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const success = this.storage.importData(e.target.result);
            if (success) {
                alert('Données importées avec succès !');
                this.render();
                this.hideImportExportModal();
            } else {
                alert('Erreur lors de l\'importation. Veuillez vérifier le format du fichier.');
            }
        };
        reader.readAsText(file);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('fr-FR');
    }

    toggleLendingDetails(accountId) {
        const detailsEl = document.getElementById(`details-${accountId}`);
        const chevronEl = document.getElementById(`chevron-${accountId}`);
        
        if (detailsEl.classList.contains('hidden')) {
            detailsEl.classList.remove('hidden');
            chevronEl.style.transform = 'rotate(180deg)';
        } else {
            detailsEl.classList.add('hidden');
            chevronEl.style.transform = 'rotate(0deg)';
        }
    }

    render() {
        const accounts = this.storage.getAccounts();
        const lendingsList = document.getElementById('lendingsList');
        const emptyState = document.getElementById('emptyState');

        if (accounts.length === 0) {
            lendingsList.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        
        lendingsList.innerHTML = accounts.map(account => {
            const balance = this.storage.calculateBalance(account);
            const isOwed = balance > 0;
            const statusColor = balance > 0 ? 'text-red-600' : balance < 0 ? 'text-orange-600' : 'text-green-600';
            const statusText = balance > 0 ? 'Vous doit' : balance < 0 ? 'Vous devez' : 'Équilibré';
            const lastTransaction = account.transactions[account.transactions.length - 1];

            return `
                <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div class="p-4 cursor-pointer" onclick="ui.toggleLendingDetails('${account.id}')">
                        <div class="flex items-center justify-between">
                            <div class="flex-1">
                                <div class="flex items-center justify-between mb-1">
                                    <h3 class="font-medium text-gray-900">${account.party}</h3>
                                    <span id="chevron-${account.id}" class="text-gray-400 transition-transform">▼</span>
                                </div>
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-gray-500">${lastTransaction ? this.formatDate(lastTransaction.date) : ''}</span>
                                    <span class="${statusColor} font-medium">
                                        ${balance !== 0 ? this.formatCurrency(Math.abs(balance)) : statusText}
                                    </span>
                                </div>
                                <div class="mt-1">
                                    <span class="text-xs px-2 py-1 rounded-full ${isOwed ? 'bg-red-100 text-red-700' : balance < 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}">
                                        ${statusText}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="details-${account.id}" class="border-t border-gray-100 hidden">
                        <div class="p-4">
                            <div class="flex items-center justify-between mb-3">
                                <h4 class="font-medium text-gray-700">Historique</h4>
                                <div class="flex gap-2">
                                    <button onclick="ui.showAddLendingModal('${account.party}')" class="text-xs px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">+ Nouvelle transaction</button>
                                    ${balance !== 0 ? `<button onclick="ui.showPaymentModal('${account.id}')" class="text-xs px-3 py-1 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors">+ Paiement</button>` : ''}
                                </div>
                            </div>
                            
                            ${account.transactions.length === 0 ? 
                                '<p class="text-gray-500 text-sm italic">Aucune transaction encore</p>' :
                                `<div class="space-y-2">
                                    ${account.transactions.slice().reverse().map(transaction => {
                                        const isPositive = transaction.amount > 0;
                                        const typeLabel = transaction.type === 'payment' ? 'Paiement' : 
                                                        transaction.type === 'lent' ? 'Prêt' : 'Emprunt';
                                        return `
                                        <div class="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                                            <div>
                                                <span class="text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}">${isPositive ? '+' : ''}${this.formatCurrency(transaction.amount)}</span>
                                                <span class="text-xs text-gray-500 ml-2">${typeLabel} • ${this.formatDate(transaction.date)}</span>
                                            </div>
                                            <button onclick="ui.deleteTransaction('${account.id}', '${transaction.id}')" class="text-red-500 hover:text-red-700 text-xs">Supprimer</button>
                                        </div>
                                    `;
                                    }).join('')}
                                </div>`
                            }
                            
                            <div class="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                                <span class="text-sm text-gray-600">Solde : <span class="font-medium ${statusColor}">${balance !== 0 ? this.formatCurrency(balance) : 'Équilibré'}</span></span>
                                <button onclick="ui.deleteAccount('${account.id}')" class="text-red-500 hover:text-red-700 text-xs">Supprimer le compte</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    deleteAccount(accountId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) {
            this.storage.deleteAccount(accountId);
            this.render();
        }
    }

    deleteTransaction(accountId, transactionId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
            this.storage.deleteTransaction(accountId, transactionId);
            this.render();
        }
    }
}