// Local Storage Management
class StorageManager {
    constructor() {
        this.storageKey = 'entraide_accounts';
    }

    // Get all accounts from localStorage
    getAccounts() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    // Save accounts to localStorage
    saveAccounts(accounts) {
        localStorage.setItem(this.storageKey, JSON.stringify(accounts));
    }

    // Add a new transaction to a person's account
    addTransaction(transaction) {
        const accounts = this.getAccounts();
        let account = accounts.find(a => a.party.toLowerCase() === transaction.party.toLowerCase());
        
        if (!account) {
            account = {
                id: Date.now().toString(),
                party: transaction.party,
                transactions: [],
                createdAt: new Date().toISOString()
            };
            accounts.push(account);
        }

        const newTransaction = {
            id: Date.now().toString(),
            amount: transaction.type === 'lent' ? parseFloat(transaction.amount) : -parseFloat(transaction.amount),
            date: transaction.date,
            type: transaction.type,
            createdAt: new Date().toISOString()
        };

        account.transactions.push(newTransaction);
        this.saveAccounts(accounts);
        return newTransaction;
    }

    // Add payment to a person's account
    addPayment(accountId, payment) {
        const accounts = this.getAccounts();
        const account = accounts.find(a => a.id === accountId);
        if (account) {
            const currentBalance = this.calculateBalance(account);
            const paymentAmount = parseFloat(payment.amount);
            
            // Payment reduces the debt, so if they owe me money (positive balance), 
            // payment is negative. If I owe them money (negative balance), payment is positive.
            const adjustedAmount = currentBalance > 0 ? -paymentAmount : paymentAmount;
            
            const newTransaction = {
                id: Date.now().toString(),
                amount: adjustedAmount,
                date: payment.date,
                type: 'payment',
                createdAt: new Date().toISOString()
            };
            
            account.transactions.push(newTransaction);
            this.saveAccounts(accounts);
            return newTransaction;
        }
        return null;
    }

    // Delete an account
    deleteAccount(accountId) {
        const accounts = this.getAccounts();
        const filtered = accounts.filter(a => a.id !== accountId);
        this.saveAccounts(filtered);
    }

    // Delete a transaction
    deleteTransaction(accountId, transactionId) {
        const accounts = this.getAccounts();
        const account = accounts.find(a => a.id === accountId);
        if (account) {
            account.transactions = account.transactions.filter(t => t.id !== transactionId);
            this.saveAccounts(accounts);
        }
    }

    // Export data
    exportData() {
        const data = {
            accounts: this.getAccounts(),
            exportDate: new Date().toISOString(),
            version: '2.0'
        };
        return JSON.stringify(data, null, 2);
    }

    // Import data
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.accounts && Array.isArray(data.accounts)) {
                this.saveAccounts(data.accounts);
                return true;
            }
            // Handle old format
            if (data.lendings && Array.isArray(data.lendings)) {
                this.migrateFromOldFormat(data.lendings);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }

    // Migrate from old lending format to new account format
    migrateFromOldFormat(lendings) {
        const accounts = [];
        const partyMap = new Map();

        lendings.forEach(lending => {
            if (!partyMap.has(lending.party.toLowerCase())) {
                partyMap.set(lending.party.toLowerCase(), {
                    id: Date.now().toString() + Math.random(),
                    party: lending.party,
                    transactions: [],
                    createdAt: lending.createdAt || new Date().toISOString()
                });
            }

            const account = partyMap.get(lending.party.toLowerCase());
            
            // Add main lending transaction
            const amount = lending.type === 'lent' ? parseFloat(lending.amount) : -parseFloat(lending.amount);
            account.transactions.push({
                id: lending.id + '_main',
                amount: amount,
                date: lending.date,
                type: lending.type,
                createdAt: lending.createdAt || new Date().toISOString()
            });

            // Add payment transactions
            lending.payments.forEach(payment => {
                account.transactions.push({
                    id: payment.id,
                    amount: amount > 0 ? -parseFloat(payment.amount) : parseFloat(payment.amount),
                    date: payment.date,
                    type: 'payment',
                    createdAt: payment.createdAt || new Date().toISOString()
                });
            });
        });

        this.saveAccounts(Array.from(partyMap.values()));
    }

    // Calculate net balance for an account
    calculateBalance(account) {
        return account.transactions.reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0);
    }
}