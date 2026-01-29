class InvoiceSystem {
    constructor() {
        this.invoiceNumber = 1;
        this.clients = [];
        this.invoices = [];
        this.currentInvoice = null;
        this.vatRate = 5; // Default VAT rate for UAE
        
        this.initializeEventListeners();
        this.loadFromLocalStorage();
        this.loadCompanyDetails(); // Load company details on app startup
        this.generateInvoiceNumber();
        this.setTodayDate();
    }

    initializeEventListeners() {
        // Control buttons
        document.getElementById('newInvoiceBtn').addEventListener('click', () => this.newInvoice());
        document.getElementById('saveDraftBtn').addEventListener('click', () => this.saveDraft());
        document.getElementById('loadInvoiceBtn').addEventListener('click', () => this.showLoadInvoiceDialog());
        document.getElementById('exportPdfBtn').addEventListener('click', () => this.exportToPDF());
        document.getElementById('printBtn').addEventListener('click', () => this.printInvoice());

        // Company details
        ['companyName', 'officeAddress', 'cityCountry', 'contactNumber', 'trn'].forEach(field => {
            document.getElementById(field).addEventListener('input', () => this.updateInvoiceData());
        });

        // Save company details
        document.getElementById('saveCompanyBtn').addEventListener('click', () => this.saveCompanyDetails());

        // Export folder selection
        document.getElementById('setExportFolderBtn').addEventListener('click', () => this.selectExportFolder());
        document.getElementById('folderInput').addEventListener('change', (e) => this.handleFolderSelection(e));

        // Invoice details
        ['invoiceDate', 'paymentMode', 'dueDate'].forEach(field => {
            document.getElementById(field).addEventListener('change', () => this.updateInvoiceData());
        });

        // Invoice number manual change handling
        document.getElementById('invoiceNo').addEventListener('input', (e) => {
            this.handleInvoiceNumberChange(e.target.value);
        });

        document.getElementById('invoiceNo').addEventListener('blur', (e) => {
            this.updateInvoiceNumberCounter(e.target.value);
        });

        // Client management
        document.getElementById('clientSelect').addEventListener('change', (e) => this.handleClientChange(e));
        document.getElementById('addClientBtn').addEventListener('click', () => this.importClientsFromExcel());
        document.getElementById('excelFileInput').addEventListener('change', (e) => this.handleExcelFileImport(e));

        // Client context menu
        document.getElementById('clientSelect').addEventListener('contextmenu', (e) => this.showClientContextMenu(e));
        document.getElementById('manageClientsBtn').addEventListener('click', () => this.showClientManagementModal());
        document.getElementById('editCurrentClientBtn').addEventListener('click', () => this.editCurrentClient());
        document.getElementById('deleteCurrentClientBtn').addEventListener('click', () => this.deleteCurrentClient());

        // Client management modal
        document.getElementById('closeClientModalBtn').addEventListener('click', () => this.hideClientManagementModal());
        document.getElementById('closeClientModalBtn2').addEventListener('click', () => this.hideClientManagementModal());
        document.getElementById('selectAllClientsBtn').addEventListener('click', () => this.selectAllClients());
        document.getElementById('deselectAllClientsBtn').addEventListener('click', () => this.deselectAllClients());
        document.getElementById('deleteSelectedClientsBtn').addEventListener('click', () => this.deleteSelectedClients());

        document.addEventListener('click', () => this.hideClientContextMenu());

        // Items table
        document.getElementById('addRowBtn').addEventListener('click', () => this.addNewItemRow());
        document.getElementById('itemsBody').addEventListener('input', (e) => this.handleItemInput(e));
        document.getElementById('itemsBody').addEventListener('click', (e) => this.handleItemAction(e));

        // Auto-save draft
        setInterval(() => this.autoSaveDraft(), 30000); // Auto-save every 30 seconds
        
        // Initialize folder button display
        this.updateExportFolderButton();
    }

    saveCompanyDetails() {
        const companyDetails = {
            name: document.getElementById('companyName').value.trim(),
            address: document.getElementById('officeAddress').value.trim(),
            cityCountry: document.getElementById('cityCountry').value.trim(),
            contact: document.getElementById('contactNumber').value.trim(),
            trn: document.getElementById('trn').value.trim()
        };
        
        if (!companyDetails.name) {
            alert('Please enter company name.');
            return;
        }
        
        // Save to localStorage
        localStorage.setItem('companyDetails', JSON.stringify(companyDetails));
        alert('Company details saved successfully!');
    }

    loadCompanyDetails() {
        const savedDetails = localStorage.getItem('companyDetails');
        if (savedDetails) {
            const companyDetails = JSON.parse(savedDetails);
            document.getElementById('companyName').value = companyDetails.name || '';
            document.getElementById('officeAddress').value = companyDetails.address || '';
            document.getElementById('cityCountry').value = companyDetails.cityCountry || '';
            document.getElementById('contactNumber').value = companyDetails.contact || '';
            document.getElementById('trn').value = companyDetails.trn || '';
        }
        
        // Load saved export folder
        const savedFolder = localStorage.getItem('exportFolder');
        if (savedFolder) {
            this.exportFolder = savedFolder;
            this.updateExportFolderButton();
        }
    }

    selectExportFolder() {
        // Check if File System Access API is available
        if ('showDirectoryPicker' in window) {
            // Modern browser - use File System Access API
            this.selectFolderWithFileSystemAPI();
        } else {
            // Fallback for older browsers
            this.selectFolderWithFileInput();
        }
    }

    async selectFolderWithFileSystemAPI() {
        try {
            const directoryHandle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });
            
            // Store the folder name and handle for direct saving
            this.exportFolder = directoryHandle.name;
            this.directoryHandle = directoryHandle;
            localStorage.setItem('exportFolder', directoryHandle.name);
            
            // Store the directory handle for later use (Note: handles can't be stored in localStorage)
            this.updateExportFolderButton();
            alert(`Export folder set to: ${directoryHandle.name}\n\nAll invoices will be saved directly to this folder automatically.\n\nThis works in Chrome and Edge browsers.\n\nNote: The folder selection may need to be reconfirmed when you refresh the page due to browser security.`);
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Directory picker error:', error);
                alert('Unable to select folder. Please try again or use the fallback method.');
                this.selectFolderWithFileInput();
            }
        }
    }

    selectFolderWithFileInput() {
        // Fallback method for older browsers
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.multiple = true;
        
        input.onchange = (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                // Extract folder name from the first file's path
                const firstFile = files[0];
                const relativePath = firstFile.webkitRelativePath;
                const folderName = relativePath.split('/')[0];
                
                // Store the selected folder
                this.exportFolder = folderName;
                localStorage.setItem('exportFolder', folderName);
                
                this.updateExportFolderButton();
                alert(`Export folder set to: ${folderName}\n\nAll invoices will have this folder name in the filename for easy organization.\n\nNote: Your browser doesn't support direct folder saving, so you'll need to manually save files to this folder.`);
            }
        };
        
        input.click();
    }

    updateExportFolderButton() {
        const button = document.getElementById('setExportFolderBtn');
        if (this.exportFolder) {
            button.textContent = `📁 ${this.exportFolder}`;
            button.title = `Current export folder: ${this.exportFolder}`;
        } else {
            button.textContent = '📁 Set Export Folder';
            button.title = 'No export folder set';
        }
    }

    handleFolderSelection(e) {
        // This method is kept for compatibility but the main logic is in selectExportFolder
        const files = e.target.files;
        if (files && files.length > 0) {
            const firstFile = files[0];
            const folderPath = firstFile.webkitRelativePath.split('/')[0];
            
            this.exportFolder = folderPath;
            localStorage.setItem('exportFolder', folderPath);
            
            this.updateExportFolderButton();
            alert(`Export folder set to: ${folderPath}\n\nAll invoices will be saved to this location.`);
        }
    }

    showClientContextMenu(e) {
        e.preventDefault();
        
        const contextMenu = document.getElementById('clientContextMenu');
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${e.pageX}px`;
        contextMenu.style.top = `${e.pageY}px`;
        
        // Store the selected client ID for later use
        this.selectedClientId = document.getElementById('clientSelect').value;
    }

    hideClientContextMenu() {
        const contextMenu = document.getElementById('clientContextMenu');
        contextMenu.style.display = 'none';
    }

    showClientManagementModal() {
        this.hideClientContextMenu();
        this.populateClientList();
        document.getElementById('clientManagementModal').style.display = 'flex';
    }

    hideClientManagementModal() {
        document.getElementById('clientManagementModal').style.display = 'none';
    }

    populateClientList() {
        const container = document.getElementById('clientListContainer');
        container.innerHTML = '';
        
        if (this.clients.length === 0) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No clients found. Import clients from Excel to get started.</div>';
            return;
        }
        
        // Remove existing event listener to prevent duplicates
        container.removeEventListener('click', this.handleClientAction);
        
        this.clients.forEach(client => {
            const clientItem = document.createElement('div');
            clientItem.className = 'client-item';
            clientItem.dataset.clientId = client.id;
            
            const hasInvoices = this.invoices.some(inv => 
                inv.status === 'final' && 
                inv.client.toLowerCase() === client.name.toLowerCase()
            );
            
            clientItem.innerHTML = `
                <input type="checkbox" class="client-checkbox" data-client-id="${client.id}">
                <div class="client-info">
                    <span class="client-name">${client.name}</span>
                    ${client.phone ? `<div class="client-detail">📞 ${client.phone}</div>` : ''}
                    ${client.address ? `<div class="client-detail">📍 ${client.address}</div>` : ''}
                </div>
                <div class="client-actions">
                    <button class="client-action-btn client-edit-btn" data-client-id="${client.id}" data-action="edit">✏️</button>
                    <button class="client-action-btn client-delete-btn" data-client-id="${client.id}" data-action="delete" title="${hasInvoices ? 'Warning: Client has exported invoices' : 'Delete client'}">🗑️</button>
                </div>
            `;
            
            // Add warning styling if client has invoices
            if (hasInvoices) {
                clientItem.classList.add('client-with-invoices');
            }
            
            container.appendChild(clientItem);
        });
        
        // Add event listener for the action buttons (bind once)
        this.handleClientAction = (e) => {
            if (e.target.classList.contains('client-edit-btn') || e.target.classList.contains('client-delete-btn')) {
                const clientId = e.target.dataset.clientId;
                const action = e.target.dataset.action;
                
                if (action === 'edit') {
                    this.editClientById(clientId);
                } else if (action === 'delete') {
                    this.deleteClientById(clientId);
                }
            }
        };
        
        container.addEventListener('click', this.handleClientAction);
    }

    selectAllClients() {
        const checkboxes = document.querySelectorAll('.client-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            checkbox.closest('.client-item').classList.add('selected');
        });
    }

    deselectAllClients() {
        const checkboxes = document.querySelectorAll('.client-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            checkbox.closest('.client-item').classList.remove('selected');
        });
    }

    deleteSelectedClients() {
        const selectedCheckboxes = document.querySelectorAll('.client-checkbox:checked');
        
        if (selectedCheckboxes.length === 0) {
            alert('Please select clients to delete.');
            return;
        }
        
        const selectedClientIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.clientId);
        const selectedClients = this.clients.filter(client => 
            selectedClientIds.includes(client.id)
        );
        
        // Check which clients have invoices for warning
        const clientsWithInvoices = selectedClients.filter(client => {
            return this.invoices.some(inv => 
                inv.status === 'final' && 
                inv.client.toLowerCase() === client.name.toLowerCase()
            );
        });
        
        let confirmMessage = `Are you sure you want to delete ${selectedClients.length} client(s)?\n\n`;
        
        if (clientsWithInvoices.length > 0) {
            confirmMessage += `⚠️ WARNING: The following clients have exported invoices:\n`;
            confirmMessage += clientsWithInvoices.map(c => `• ${c.name}`).join('\n');
            confirmMessage += `\n\nDeleting will not remove existing invoices, but these client names will no longer be available for new invoices.\n\n`;
        }
        
        confirmMessage += `Clients to be deleted:\n`;
        confirmMessage += selectedClients.map(c => `• ${c.name}`).join('\n');
        
        if (confirm(confirmMessage)) {
            this.clients = this.clients.filter(client => 
                !selectedClientIds.includes(client.id)
            );
            
            this.saveToLocalStorage();
            this.updateClientSelect();
            this.populateClientList();
            
            alert(`Successfully deleted ${selectedClients.length} client(s).`);
        }
    }

    editCurrentClient() {
        if (!this.selectedClientId || this.selectedClientId === 'import') {
            alert('Please select a client first.');
            return;
        }
        
        this.editClientById(this.selectedClientId);
        this.hideClientContextMenu();
    }

    deleteCurrentClient() {
        if (!this.selectedClientId || this.selectedClientId === 'import') {
            alert('Please select a client first.');
            return;
        }
        
        this.deleteClientById(this.selectedClientId);
        this.hideClientContextMenu();
    }

    editClientById(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) return;
        
        const newName = prompt('Edit client name:', client.name);
        if (newName && newName.trim() && newName.trim() !== client.name) {
            // Check if new name already exists
            const existingClient = this.clients.find(c => 
                c.id !== clientId && 
                c.name.toLowerCase() === newName.trim().toLowerCase()
            );
            
            if (existingClient) {
                alert('A client with this name already exists.');
                return;
            }
            
            client.name = newName.trim();
            this.saveToLocalStorage();
            this.updateClientSelect();
            this.populateClientList();
            alert('Client name updated successfully!');
        }
    }

    deleteClientById(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) return;
        
        // Check if client has any exported invoices for warning
        const hasInvoices = this.invoices.some(inv => 
            inv.status === 'final' && 
            inv.client.toLowerCase() === client.name.toLowerCase()
        );
        
        let confirmMessage = `Are you sure you want to delete client "${client.name}"?`;
        if (hasInvoices) {
            confirmMessage += `\n\n⚠️ WARNING: This client has exported invoices. Deleting will not remove the invoices, but the client name will no longer be available for new invoices.`;
        }
        
        if (confirm(confirmMessage)) {
            this.clients = this.clients.filter(c => c.id !== clientId);
            this.saveToLocalStorage();
            this.updateClientSelect();
            this.populateClientList();
            
            // Clear selection if deleted client was selected
            if (document.getElementById('clientSelect').value === clientId) {
                document.getElementById('clientSelect').value = '';
            }
            
            alert('Client deleted successfully!');
        }
    }

    handleInvoiceNumberChange(value) {
        // Just update the invoice data when user types
        this.updateInvoiceData();
    }

    updateInvoiceNumberCounter(value) {
        // Extract the numeric part from invoice number to update counter
        if (value && value.trim()) {
            const match = value.match(/INV-(\d{4})(\d+)-(\d+)/);
            if (match) {
                const year = match[1];
                const month = match[2];
                const number = parseInt(match[3]);
                
                // Update the counter to be one higher than the current number
                // This ensures next auto-generated number continues from here
                this.invoiceNumber = number + 1;
                
                console.log(`Invoice number counter updated to: ${this.invoiceNumber} based on manual input: ${value}`);
            }
        }
    }

    generateInvoiceNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const invoiceNo = `INV-${year}${month}-${String(this.invoiceNumber).padStart(4, '0')}`;
        document.getElementById('invoiceNo').value = invoiceNo;
        // Don't increment counter here - only increment when invoice is actually saved/exported
    }

    incrementInvoiceCounter() {
        this.invoiceNumber++;
        this.saveToLocalStorage(); // Save the updated counter
    }

    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('invoiceDate').value = today;
        
        // Set due date to 30 days from today
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        document.getElementById('dueDate').value = dueDate.toISOString().split('T')[0];
    }

    newInvoice() {
        if (this.hasUnsavedChanges()) {
            if (!confirm('You have unsaved changes. Do you want to continue?')) {
                return;
            }
        }
        
        // Reset editing mode
        this.isEditingInvoice = false;
        this.originalInvoiceId = null;
        this.updateExportButtonForEdit();
        
        // Load saved company details first
        this.loadCompanyDetails();
        
        // Clear form (except company details which are loaded)
        document.getElementById('clientSelect').value = '';
        
        // Clear items table except first row
        const itemsBody = document.getElementById('itemsBody');
        itemsBody.innerHTML = `
            <tr class="item-row">
                <td>1</td>
                <td>
                    <select class="input-field service-input">
                        <option value="">Select Service</option>
                        <option value="Recreational Facility">Recreational Facility</option>
                        <option value="Learner Assistance">Learner Assistance</option>
                    </select>
                </td>
                <td>
                    <select class="input-field description-input">
                        <option value="">Select Month</option>
                        <option value="Payment for Month of January">Payment for Month of January</option>
                        <option value="Payment for Month of February">Payment for Month of February</option>
                        <option value="Payment for Month of March">Payment for Month of March</option>
                        <option value="Payment for Month of April">Payment for Month of April</option>
                        <option value="Payment for Month of May">Payment for Month of May</option>
                        <option value="Payment for Month of June">Payment for Month of June</option>
                        <option value="Payment for Month of July">Payment for Month of July</option>
                        <option value="Payment for Month of August">Payment for Month of August</option>
                        <option value="Payment for Month of September">Payment for Month of September</option>
                        <option value="Payment for Month of October">Payment for Month of October</option>
                        <option value="Payment for Month of November">Payment for Month of November</option>
                        <option value="Payment for Month of December">Payment for Month of December</option>
                    </select>
                </td>
                <td><input type="number" class="input-field amount-input" placeholder="0.00" step="0.01"></td>
                <td class="vat-cell">0.00</td>
                <td class="total-cell">0.00</td>
                <td><button class="btn btn-small btn-danger remove-row">✕</button></td>
            </tr>
        `;
        
        // Reset current invoice to null to avoid false duplicate detection
        this.currentInvoice = null;
        
        // Auto-generate new invoice number for new invoice
        this.generateInvoiceNumber();
        this.setTodayDate();
        this.updateTotals();
    }

    handleClientChange(e) {
        const select = e.target;
        
        if (select.value === 'import') {
            this.importClientsFromExcel();
            select.value = ''; // Reset to default option
        }
        
        this.updateInvoiceData();
    }

    importClientsFromExcel() {
        document.getElementById('excelFileInput').click();
    }

    handleExcelFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                this.processExcelData(jsonData);
            } catch (error) {
                console.error('Error reading Excel file:', error);
                alert('Error reading Excel file. Please ensure it\'s a valid Excel file with client names.');
            }
        };
        reader.readAsArrayBuffer(file);

        // Reset file input
        e.target.value = '';
    }

    processExcelData(jsonData) {
        if (!jsonData || jsonData.length === 0) {
            alert('No data found in the Excel file.');
            return;
        }

        const newClients = [];
        let addedCount = 0;

        jsonData.forEach((row, index) => {
            // Skip header row if it exists and empty rows
            if (index === 0 && this.isHeaderRow(row)) return;
            if (!row || row.length === 0) return;

            // Get client details from columns
            const clientName = row[0] ? row[0].toString().trim() : '';
            const clientPhone = row[1] ? row[1].toString().trim() : '';
            const clientAddress = row[2] ? row[2].toString().trim() : '';
            
            if (clientName && !this.clients.some(c => c.name.toLowerCase() === clientName.toLowerCase())) {
                newClients.push({
                    id: Date.now().toString() + index,
                    name: clientName,
                    phone: clientPhone,
                    address: clientAddress,
                    createdAt: new Date().toISOString()
                });
                addedCount++;
            }
        });

        if (addedCount > 0) {
            this.clients.push(...newClients);
            this.updateClientSelect();
            this.saveToLocalStorage();
            alert(`Successfully imported ${addedCount} clients from Excel file.\n\nFormat used: Name | Phone | Address`);
        } else {
            alert('No new clients found in the Excel file.\n\nExpected format: Column A: Name, Column B: Phone, Column C: Address');
        }
    }

    isHeaderRow(row) {
        if (!row || row.length === 0) return false;
        const firstCell = row[0] ? row[0].toString().toLowerCase() : '';
        return firstCell.includes('client') || firstCell.includes('name') || firstCell.includes('customer');
    }

    updateClientSelect() {
        const select = document.getElementById('clientSelect');
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">Select Client</option><option value="import">+ Import Clients from Excel</option>';
        
        this.clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            select.appendChild(option);
        });
        
        select.value = currentValue;
    }

    addNewItemRow() {
        const itemsBody = document.getElementById('itemsBody');
        const rowCount = itemsBody.children.length;
        const newRow = document.createElement('tr');
        newRow.className = 'item-row';
        newRow.innerHTML = `
            <td>${rowCount + 1}</td>
            <td>
                <select class="input-field service-input">
                    <option value="">Select Service</option>
                    <option value="Recreational Facility">Recreational Facility</option>
                    <option value="Learner Assistance">Learner Assistance</option>
                </select>
            </td>
            <td>
                <select class="input-field description-input">
                    <option value="">Select Month</option>
                    <option value="Payment for Month of January">Payment for Month of January</option>
                    <option value="Payment for Month of February">Payment for Month of February</option>
                    <option value="Payment for Month of March">Payment for Month of March</option>
                    <option value="Payment for Month of April">Payment for Month of April</option>
                    <option value="Payment for Month of May">Payment for Month of May</option>
                    <option value="Payment for Month of June">Payment for Month of June</option>
                    <option value="Payment for Month of July">Payment for Month of July</option>
                    <option value="Payment for Month of August">Payment for Month of August</option>
                    <option value="Payment for Month of September">Payment for Month of September</option>
                    <option value="Payment for Month of October">Payment for Month of October</option>
                    <option value="Payment for Month of November">Payment for Month of November</option>
                    <option value="Payment for Month of December">Payment for Month of December</option>
                </select>
            </td>
            <td><input type="number" class="input-field amount-input" placeholder="0.00" step="0.01"></td>
            <td class="vat-cell">0.00</td>
            <td class="total-cell">0.00</td>
            <td><button class="btn btn-small btn-danger remove-row">✕</button></td>
        `;
        itemsBody.appendChild(newRow);
    }

    handleItemInput(e) {
        const input = e.target;
        const row = input.closest('tr');
        
        if (input.classList.contains('amount-input')) {
            this.calculateRowTotals(row);
        }
        
        this.updateTotals();
        this.updateInvoiceData();
    }

    handleItemAction(e) {
        if (e.target.classList.contains('remove-row')) {
            const row = e.target.closest('tr');
            const itemsBody = document.getElementById('itemsBody');
            
            if (itemsBody.children.length > 1) {
                row.remove();
                this.updateRowNumbers();
                this.updateTotals();
                this.updateInvoiceData();
            } else {
                alert('At least one item row is required.');
            }
        }
    }

    calculateRowTotals(row) {
        const amountInput = row.querySelector('.amount-input');
        const vatCell = row.querySelector('.vat-cell');
        const totalCell = row.querySelector('.total-cell');
        
        const amount = parseFloat(amountInput.value) || 0;
        const vat = amount * (this.vatRate / 100);
        const total = amount + vat;
        
        vatCell.textContent = vat.toFixed(2);
        totalCell.textContent = total.toFixed(2);
    }

    updateRowNumbers() {
        const rows = document.querySelectorAll('#itemsBody .item-row');
        rows.forEach((row, index) => {
            row.querySelector('td:first-child').textContent = index + 1;
        });
    }

    updateTotals() {
        const rows = document.querySelectorAll('#itemsBody .item-row');
        let subtotal = 0;
        let vatTotal = 0;
        let grandTotal = 0;
        
        rows.forEach(row => {
            const amount = parseFloat(row.querySelector('.amount-input').value) || 0;
            const vat = parseFloat(row.querySelector('.vat-cell').textContent) || 0;
            const total = parseFloat(row.querySelector('.total-cell').textContent) || 0;
            
            subtotal += amount;
            vatTotal += vat;
            grandTotal += total;
        });
        
        document.getElementById('subtotal').textContent = subtotal.toFixed(2);
        document.getElementById('vatTotal').textContent = vatTotal.toFixed(2);
        document.getElementById('grandTotal').textContent = grandTotal.toFixed(2);
        
        // Update amount in words
        document.getElementById('amountInWords').textContent = this.numberToWords(grandTotal);
    }

    numberToWords(num) {
        if (num === 0) return 'Zero Dirhams Only';
        
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        
        const convertLessThanThousand = (n) => {
            if (n === 0) return '';
            if (n < 10) return ones[n];
            if (n < 20) return teens[n - 10];
            if (n < 100) return tens[Math.floor(n / 10)] + ' ' + ones[n % 10];
            return ones[Math.floor(n / 100)] + ' Hundred ' + convertLessThanThousand(n % 100);
        };
        
        if (num < 1000) {
            return convertLessThanThousand(Math.floor(num)) + ' Dirhams Only';
        }
        
        let words = '';
        let remaining = Math.floor(num);
        
        if (remaining >= 1000000) {
            words += convertLessThanThousand(Math.floor(remaining / 1000000)) + ' Million ';
            remaining %= 1000000;
        }
        
        if (remaining >= 1000) {
            words += convertLessThanThousand(Math.floor(remaining / 1000)) + ' Thousand ';
            remaining %= 1000;
        }
        
        if (remaining > 0) {
            words += convertLessThanThousand(remaining);
        }
        
        // Handle fils (cents)
        const fils = Math.round((num - Math.floor(num)) * 100);
        if (fils > 0) {
            words += ' and ' + convertLessThanThousand(fils) + ' Fils';
        }
        
        return words.trim() + ' Dirhams Only';
    }

    getSelectedClientName() {
        const select = document.getElementById('clientSelect');
        if (select.value) {
            const client = this.clients.find(c => c.id === select.value);
            return client ? client.name : '';
        }
        return '';
    }

    updateInvoiceData() {
        // This method updates the current invoice object
        const items = [];
        document.querySelectorAll('#itemsBody .item-row').forEach((row, index) => {
            const serviceSelect = row.querySelector('.service-input');
            const descriptionSelect = row.querySelector('.description-input');
            
            items.push({
                sl: index + 1,
                service: serviceSelect ? serviceSelect.value : '',
                description: descriptionSelect ? descriptionSelect.value : '',
                amount: parseFloat(row.querySelector('.amount-input').value) || 0,
                vat: parseFloat(row.querySelector('.vat-cell').textContent) || 0,
                total: parseFloat(row.querySelector('.total-cell').textContent) || 0
            });
        });
        
        // Always generate a fresh ID for new invoices, keep existing ID only for editing
        const isNewInvoice = !this.isEditingInvoice || !this.currentInvoice;
        
        this.currentInvoice = {
            id: isNewInvoice ? Date.now().toString() : (this.currentInvoice?.id || Date.now().toString()),
            invoiceNo: document.getElementById('invoiceNo').value,
            date: document.getElementById('invoiceDate').value,
            paymentMode: document.getElementById('paymentMode').value,
            currency: document.getElementById('currency').value,
            dueDate: document.getElementById('dueDate').value,
            company: {
                name: document.getElementById('companyName').value,
                address: document.getElementById('officeAddress').value,
                cityCountry: document.getElementById('cityCountry').value,
                contact: document.getElementById('contactNumber').value,
                trn: document.getElementById('trn').value
            },
            client: this.getSelectedClientName(),
            items: items,
            subtotal: parseFloat(document.getElementById('subtotal').textContent) || 0,
            vatTotal: parseFloat(document.getElementById('vatTotal').textContent) || 0,
            grandTotal: parseFloat(document.getElementById('grandTotal').textContent) || 0,
            amountInWords: document.getElementById('amountInWords').textContent,
            status: 'draft',
            createdAt: this.currentInvoice?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    saveDraft() {
        if (!this.validateInvoice()) {
            return;
        }
        
        this.updateInvoiceData();
        
        // Skip duplicate check if editing existing invoice
        if (!this.isEditingInvoice) {
            // Check for duplicates before allowing save
            const duplicateCheck = this.checkDuplicateExport(
                this.currentInvoice.client, 
                this.currentInvoice.invoiceNo, 
                this.currentInvoice.date
            );
            
            if (duplicateCheck.isDuplicate) {
                alert(`DUPLICATE SAVE BLOCKED!\n\n${duplicateCheck.message}\n\nCannot save draft as it would create a duplicate.`);
                return; // Block the save
            }
        }
        
        this.currentInvoice.status = 'draft';
        
        const existingIndex = this.invoices.findIndex(inv => inv.id === this.currentInvoice.id);
        if (existingIndex >= 0) {
            this.invoices[existingIndex] = this.currentInvoice;
        } else {
            this.invoices.push(this.currentInvoice);
            // Only increment counter for new drafts
            this.incrementInvoiceCounter();
        }
        
        this.saveToLocalStorage();
        alert('Draft saved successfully!');
    }

    autoSaveDraft() {
        if (this.currentInvoice && this.hasUnsavedChanges()) {
            this.updateInvoiceData();
            this.currentInvoice.status = 'draft';
            
            const existingIndex = this.invoices.findIndex(inv => inv.id === this.currentInvoice.id);
            if (existingIndex >= 0) {
                this.invoices[existingIndex] = this.currentInvoice;
            } else {
                this.invoices.push(this.currentInvoice);
            }
            
            this.saveToLocalStorage();
        }
    }

    hasUnsavedChanges() {
        // Simple check - in a real app, you'd want to compare with saved version
        return document.getElementById('companyName').value || 
               document.getElementById('clientSelect').value ||
               document.querySelectorAll('#itemsBody .item-row input').some(input => input.value);
    }

    showLoadInvoiceDialog() {
        console.log('Total invoices in system:', this.invoices.length);
        console.log('All invoices:', this.invoices);
        
        const exportedInvoices = this.invoices.filter(inv => inv.status === 'final');
        
        console.log('Exported invoices found:', exportedInvoices.length);
        console.log('Exported invoices:', exportedInvoices);
        
        if (exportedInvoices.length === 0) {
            alert('No exported invoices found.');
            return;
        }
        
        // Create a proper modal dialog for invoice selection
        const modalHtml = `
            <div id="loadInvoiceModal" class="modal" style="display: flex;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Load Exported Invoice</h2>
                        <button class="modal-close" onclick="this.closest('.modal').style.display='none'">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="invoice-list" id="invoiceListContainer">
                            ${exportedInvoices.map((inv, index) => `
                                <div class="invoice-item" data-invoice-id="${inv.id}">
                                    <div class="invoice-info">
                                        <strong>${inv.invoiceNo}</strong><br>
                                        Client: ${inv.client}<br>
                                        Date: ${inv.date}<br>
                                        Total: ${inv.total} AED
                                    </div>
                                    <div class="invoice-actions">
                                        <button class="btn btn-primary" onclick="invoiceApp.loadInvoiceForEdit('${inv.id}')">Load & Edit</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('loadInvoiceModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add new modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    loadInvoiceForEdit(invoiceId) {
        const invoice = this.invoices.find(inv => inv.id === invoiceId);
        if (!invoice) {
            alert('Invoice not found.');
            return;
        }
        
        // Set as editing mode
        this.isEditingInvoice = true;
        this.originalInvoiceId = invoiceId;
        
        // Load invoice data
        this.loadInvoice(invoice);
        
        // Close modal
        const modal = document.getElementById('loadInvoiceModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Update UI to show editing mode
        this.updateExportButtonForEdit();
        
        alert(`Invoice ${invoice.invoiceNo} loaded for editing.\n\nYou can now modify the invoice and export it to replace the existing file.`);
    }

    updateExportButtonForEdit() {
        const exportBtn = document.getElementById('exportPdfBtn');
        if (this.isEditingInvoice) {
            exportBtn.textContent = 'Update & Export (Replace File)';
            exportBtn.className = 'btn btn-warning';
            exportBtn.title = 'This will replace the existing invoice file';
        } else {
            exportBtn.textContent = 'Export PDF';
            exportBtn.className = 'btn btn-success';
            exportBtn.title = '';
        }
    }

    loadInvoice(invoice) {
        // Load company details
        document.getElementById('companyName').value = invoice.company.name;
        document.getElementById('officeAddress').value = invoice.company.address;
        document.getElementById('cityCountry').value = invoice.company.cityCountry;
        document.getElementById('contactNumber').value = invoice.company.contact;
        document.getElementById('trn').value = invoice.company.trn;
        
        // Load invoice details
        document.getElementById('invoiceNo').value = invoice.invoiceNo;
        document.getElementById('invoiceDate').value = invoice.date;
        document.getElementById('paymentMode').value = invoice.paymentMode;
        document.getElementById('dueDate').value = invoice.dueDate;
        
        // Load client - find and select the client
        const client = this.clients.find(c => c.name === invoice.client);
        if (client) {
            document.getElementById('clientSelect').value = client.id;
        } else {
            document.getElementById('clientSelect').value = '';
        }
        
        // Load items
        const itemsBody = document.getElementById('itemsBody');
        itemsBody.innerHTML = '';
        
        invoice.items.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'item-row';
            row.innerHTML = `
                <td>${item.sl}</td>
                <td>
                    <select class="input-field service-input">
                        <option value="">Select Service</option>
                        <option value="Recreational Facility" ${item.service === 'Recreational Facility' ? 'selected' : ''}>Recreational Facility</option>
                        <option value="Learner Assistance" ${item.service === 'Learner Assistance' ? 'selected' : ''}>Learner Assistance</option>
                    </select>
                </td>
                <td>
                    <select class="input-field description-input">
                        <option value="">Select Month</option>
                        <option value="Payment for Month of January" ${item.description === 'Payment for Month of January' ? 'selected' : ''}>Payment for Month of January</option>
                        <option value="Payment for Month of February" ${item.description === 'Payment for Month of February' ? 'selected' : ''}>Payment for Month of February</option>
                        <option value="Payment for Month of March" ${item.description === 'Payment for Month of March' ? 'selected' : ''}>Payment for Month of March</option>
                        <option value="Payment for Month of April" ${item.description === 'Payment for Month of April' ? 'selected' : ''}>Payment for Month of April</option>
                        <option value="Payment for Month of May" ${item.description === 'Payment for Month of May' ? 'selected' : ''}>Payment for Month of May</option>
                        <option value="Payment for Month of June" ${item.description === 'Payment for Month of June' ? 'selected' : ''}>Payment for Month of June</option>
                        <option value="Payment for Month of July" ${item.description === 'Payment for Month of July' ? 'selected' : ''}>Payment for Month of July</option>
                        <option value="Payment for Month of August" ${item.description === 'Payment for Month of August' ? 'selected' : ''}>Payment for Month of August</option>
                        <option value="Payment for Month of September" ${item.description === 'Payment for Month of September' ? 'selected' : ''}>Payment for Month of September</option>
                        <option value="Payment for Month of October" ${item.description === 'Payment for Month of October' ? 'selected' : ''}>Payment for Month of October</option>
                        <option value="Payment for Month of November" ${item.description === 'Payment for Month of November' ? 'selected' : ''}>Payment for Month of November</option>
                        <option value="Payment for Month of December" ${item.description === 'Payment for Month of December' ? 'selected' : ''}>Payment for Month of December</option>
                    </select>
                </td>
                <td><input type="number" class="input-field amount-input" value="${item.amount}" placeholder="0.00" step="0.01"></td>
                <td class="vat-cell">${item.vat.toFixed(2)}</td>
                <td class="total-cell">${item.total.toFixed(2)}</td>
                <td><button class="btn btn-small btn-danger remove-row">✕</button></td>
            `;
            itemsBody.appendChild(row);
        });
        
        // Update totals
        document.getElementById('subtotal').textContent = invoice.subtotal.toFixed(2);
        document.getElementById('vatTotal').textContent = invoice.vatTotal.toFixed(2);
        document.getElementById('grandTotal').textContent = invoice.grandTotal.toFixed(2);
        document.getElementById('amountInWords').textContent = invoice.amountInWords;
        
        this.currentInvoice = invoice;
    }

    validateInvoice() {
        const companyName = document.getElementById('companyName').value.trim();
        const clientName = this.getSelectedClientName().trim();
        const trn = document.getElementById('trn').value.trim();
        
        if (!companyName) {
            alert('Please enter company name.');
            return false;
        }
        
        if (!clientName) {
            alert('Please select a client.');
            return false;
        }
        
        if (!trn) {
            alert('Please enter TRN.');
            return false;
        }
        
        if (!/^\d+$/.test(trn)) {
            alert('TRN must contain only numbers.');
            return false;
        }
        
        if (trn.length < 7 || trn.length > 15) {
            alert('TRN must be between 7 and 15 digits.');
            return false;
        }
        
        // Check if at least one item has data
        const hasItems = Array.from(document.querySelectorAll('#itemsBody .item-row')).some(row => {
            const service = row.querySelector('.service-input').value;
            const amount = parseFloat(row.querySelector('.amount-input').value) || 0;
            return service && amount > 0;
        });
        
        if (!hasItems) {
            alert('Please add at least one item with service and amount.');
            return false;
        }
        
        return true;
    }

    checkDuplicateExport(clientName, invoiceNo, invoiceDate) {
        console.log('Checking duplicate for:', {
            clientName,
            invoiceNo,
            invoiceDate,
            totalInvoices: this.invoices.length,
            finalInvoices: this.invoices.filter(inv => inv.status === 'final').length,
            isEditing: this.isEditingInvoice,
            currentInvoiceId: this.currentInvoice?.id
        });
        
        // Check 1: Invoice number already exists in FINAL/EXPORTED invoices only
        // Exclude current invoice being edited and drafts
        const existingInvoiceNo = this.invoices.find(inv => 
            inv.invoiceNo === invoiceNo && 
            inv.status === 'final' &&
            (!this.isEditingInvoice || inv.id !== this.currentInvoice?.id)
        );
        
        if (existingInvoiceNo) {
            console.log('Found duplicate invoice number:', existingInvoiceNo);
            return {
                isDuplicate: true,
                reason: 'invoice_number',
                existingInvoice: existingInvoiceNo,
                message: `Invoice number "${invoiceNo}" already exists!\n\nExisting Invoice: ${existingInvoiceNo.invoiceNo}\nClient: ${existingInvoiceNo.client}\nDate: ${existingInvoiceNo.date}\n\nEach invoice number must be unique.`
            };
        }
        
        // Check 2: Client name already exists in the SAME MONTH (MONTHLY restriction)
        // Exclude current invoice being edited
        const date = new Date(invoiceDate);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const existingClientInSameMonth = this.invoices.find(inv => 
            inv.status === 'final' && 
            inv.client.toLowerCase() === clientName.toLowerCase() &&
            inv.date.startsWith(monthYear) &&
            (!this.isEditingInvoice || inv.id !== this.currentInvoice?.id)
        );
        
        if (existingClientInSameMonth) {
            console.log('Found duplicate client in same month:', existingClientInSameMonth);
            return {
                isDuplicate: true,
                reason: 'client_same_month',
                existingInvoice: existingClientInSameMonth,
                message: `Client "${clientName}" already has an exported invoice for ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}!\n\nExisting Invoice: ${existingClientInSameMonth.invoiceNo}\nDate: ${existingClientInSameMonth.date}\n\nTo prevent duplicates, you cannot export multiple invoices for the same client in the same month.`
            };
        }
        
        console.log('No duplicates found - export allowed');
        return {
            isDuplicate: false
        };
    }

    generateSafeFileName(clientName, invoiceNo) {
        // Remove any characters that could cause file system issues
        const safeClientName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
        const safeInvoiceNo = invoiceNo.replace(/[^a-zA-Z0-9]/g, '_');
        
        // Generate timestamp to ensure uniqueness
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        
        return `${safeInvoiceNo}_${safeClientName}_${timestamp}.pdf`;
    }

    populatePrintTemplate() {
        this.updateInvoiceData();
        const invoice = this.currentInvoice;
        
        if (!invoice) {
            alert('No invoice data to export.');
            return;
        }
        
        // Populate company fields
        document.querySelectorAll('[data-field="companyName"]').forEach(el => el.textContent = invoice.company.name);
        document.querySelectorAll('[data-field="officeAddress"]').forEach(el => el.textContent = invoice.company.address);
        document.querySelectorAll('[data-field="cityCountry"]').forEach(el => el.textContent = invoice.company.cityCountry);
        document.querySelectorAll('[data-field="contactNumber"]').forEach(el => el.textContent = invoice.company.contact);
        document.querySelectorAll('[data-field="trn"]').forEach(el => el.textContent = invoice.company.trn);
        
        // Populate invoice fields
        document.querySelectorAll('[data-field="invoiceNo"]').forEach(el => el.textContent = invoice.invoiceNo);
        document.querySelectorAll('[data-field="invoiceDate"]').forEach(el => el.textContent = invoice.date);
        document.querySelectorAll('[data-field="paymentMode"]').forEach(el => el.textContent = invoice.paymentMode);
        document.querySelectorAll('[data-field="currency"]').forEach(el => el.textContent = invoice.currency);
        document.querySelectorAll('[data-field="dueDate"]').forEach(el => el.textContent = invoice.dueDate);
        document.querySelectorAll('[data-field="clientName"]').forEach(el => el.textContent = invoice.client);
        
        // Populate client details (phone and address)
        const client = this.clients.find(c => c.name === invoice.client);
        console.log('All clients:', this.clients); // Debug all clients
        console.log('Looking for client:', invoice.client); // Debug what we're searching for
        console.log('Found client:', client); // Debug found client
        
        const clientPhone = client ? (client.phone || '') : '';
        const clientAddress = client ? (client.address || '') : '';
        
        console.log('Client phone:', clientPhone, 'Client address:', clientAddress); // Debug values
        
        const phoneElements = document.querySelectorAll('[data-field="clientPhone"]');
        const addressElements = document.querySelectorAll('[data-field="clientAddress"]');
        
        console.log('Phone elements found:', phoneElements.length);
        console.log('Address elements found:', addressElements.length);
        console.log('Phone elements:', phoneElements);
        console.log('Address elements:', addressElements);
        
        // Clear elements first
        phoneElements.forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
        
        addressElements.forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
        
        // Now populate with correct data
        addressElements.forEach(el => {
            if (clientAddress) {
                el.textContent = clientAddress;
                el.style.display = 'block';
                console.log('Address element set to:', el.textContent, 'display: block');
            } else {
                el.textContent = '';
                el.style.display = 'none';  // Hide if empty
                console.log('Address element empty, hiding');
            }
        });
        
        phoneElements.forEach(el => {
            if (clientPhone) {
                el.textContent = clientPhone;
                el.style.display = 'block';
                console.log('Phone element set to:', el.textContent, 'display: block');
            } else {
                el.textContent = '';
                el.style.display = 'none';  // Hide if empty
                console.log('Phone element empty, hiding');
            }
        });
        
        // Populate items
        const populateItemsTable = (tbodyId) => {
            const tbody = document.getElementById(tbodyId);
            tbody.innerHTML = '';
            
            invoice.items.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.sl}</td>
                    <td>${item.service}</td>
                    <td>${item.description}</td>
                    <td style="text-align: right">${item.amount.toFixed(2)}</td>
                    <td style="text-align: right">${item.vat.toFixed(2)}</td>
                    <td style="text-align: right">${item.total.toFixed(2)}</td>
                `;
                tbody.appendChild(row);
            });
        };
        
        populateItemsTable('printItemsBody');
        populateItemsTable('printItemsBody2');
        
        // Populate totals
        document.getElementById('printAmountInWords').textContent = invoice.amountInWords;
        document.getElementById('printAmountInWords2').textContent = invoice.amountInWords;
        document.getElementById('printSubtotal').textContent = invoice.subtotal.toFixed(2);
        document.getElementById('printSubtotal2').textContent = invoice.subtotal.toFixed(2);
        document.getElementById('printVatTotal').textContent = invoice.vatTotal.toFixed(2);
        document.getElementById('printVatTotal2').textContent = invoice.vatTotal.toFixed(2);
        document.getElementById('printGrandTotal').textContent = invoice.grandTotal.toFixed(2);
        document.getElementById('printGrandTotal2').textContent = invoice.grandTotal.toFixed(2);
    }

    async exportToPDF() {
        if (!this.validateInvoice()) {
            return;
        }
        
        this.updateInvoiceData();
        
        // Skip duplicate check if editing existing invoice
        if (!this.isEditingInvoice) {
            // Check for duplicates - STRICT BLOCK
            const duplicateCheck = this.checkDuplicateExport(
                this.currentInvoice.client, 
                this.currentInvoice.invoiceNo, 
                this.currentInvoice.date
            );
            
            if (duplicateCheck.isDuplicate) {
                alert(`DUPLICATE EXPORT BLOCKED!\n\n${duplicateCheck.message}`);
                return; // Completely block the export
            }
        }
        
        // Check if export folder is set
        if (!this.exportFolder) {
            const setFolder = confirm('No export folder has been set. Would you like to set one now?\n\nClick "OK" to select a folder, or "Cancel" to use browser default.');
            if (setFolder) {
                this.selectExportFolder();
                return; // User will need to try export again after selecting folder
            }
        }
        
        // Generate PDF first, then handle saving
        try {
            this.populatePrintTemplate();
            
            const template = document.getElementById('invoiceTemplate');
            template.style.display = 'block';
            
            const canvas = await html2canvas(template.querySelector('.invoice-page'), {
                scale: 2,
                useCORS: true,
                allowTaint: true
            });
            
            template.style.display = 'none';
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
            
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            // Generate clean filename
            const fileName = this.generateSafeFileName(this.currentInvoice.client, this.currentInvoice.invoiceNo);
            
            // Handle saving based on browser capabilities
            await this.savePDF(pdf, fileName);
            
            // Handle invoice update vs new invoice
            if (this.isEditingInvoice) {
                // Update existing invoice
                const existingIndex = this.invoices.findIndex(inv => inv.id === this.originalInvoiceId);
                if (existingIndex >= 0) {
                    this.invoices[existingIndex] = this.currentInvoice;
                }
                
                alert(`Invoice updated successfully!\n\nFile: ${fileName}\nInvoice No: ${this.currentInvoice.invoiceNo}\nClient: ${this.currentInvoice.client}\nDate: ${this.currentInvoice.date}\n\nThe existing file has been replaced.`);
                
                // Reset editing mode
                this.isEditingInvoice = false;
                this.originalInvoiceId = null;
                this.updateExportButtonForEdit();
            } else {
                // New invoice - increment counter
                this.incrementInvoiceCounter();
                this.currentInvoice.status = 'final';
                
                console.log('Saving new invoice:', this.currentInvoice);
                console.log('Current invoices before save:', this.invoices.length);
                
                const existingIndex = this.invoices.findIndex(inv => inv.id === this.currentInvoice.id);
                if (existingIndex >= 0) {
                    this.invoices[existingIndex] = this.currentInvoice;
                    console.log('Updated existing invoice at index:', existingIndex);
                } else {
                    this.invoices.push(this.currentInvoice);
                    console.log('Added new invoice. Total invoices:', this.invoices.length);
                }
                
                console.log('Invoices after save:', this.invoices.length);
                console.log('Final status invoices:', this.invoices.filter(inv => inv.status === 'final').length);
            }
            
            this.saveToLocalStorage();
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        }
    }

    async savePDF(pdf, fileName) {
        // Try to save directly to selected folder using File System Access API (Chrome/Edge)
        if ('showDirectoryPicker' in window && this.exportFolder) {
            try {
                let directoryHandle = this.directoryHandle;
                
                // If we don't have a valid directory handle, request it again
                if (!directoryHandle) {
                    try {
                        directoryHandle = await window.showDirectoryPicker({
                            mode: 'readwrite'
                        });
                        this.directoryHandle = directoryHandle;
                    } catch (dirError) {
                        console.log('Directory access needed, falling back to file picker');
                        // Fall back to file picker
                        await this.saveWithFilePicker(pdf, fileName);
                        return;
                    }
                }
                
                // Save directly to the selected directory
                try {
                    const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
                    const writable = await fileHandle.createWritable();
                    const pdfBlob = pdf.output('blob');
                    await writable.write(pdfBlob);
                    await writable.close();
                    
                    alert(`Invoice exported successfully!\n\nFile: ${fileName}\nClient: ${this.currentInvoice.client}\nInvoice No: ${this.currentInvoice.invoiceNo}\nDate: ${this.currentInvoice.date}\n\nSaved directly to folder: ${directoryHandle.name}`);
                } catch (fileError) {
                    console.log('Direct save failed, trying file picker:', fileError);
                    // Fall back to file picker
                    await this.saveWithFilePicker(pdf, fileName);
                }
                
            } catch (error) {
                console.error('File System Access API error:', error);
                if (error.name === 'AbortError') {
                    // User cancelled - don't save
                    console.log('User cancelled directory access');
                    return;
                } else {
                    // Other error - fallback to browser download
                    alert('Unable to save to selected folder. Using browser download instead.');
                    this.downloadPDF(pdf, fileName);
                }
            }
        } else {
            // Fallback to browser download for other browsers or when no folder is set
            this.downloadPDF(pdf, fileName);
        }
    }

    async saveWithFilePicker(pdf, fileName) {
        try {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: fileName,
                types: [{
                    description: 'PDF Files',
                    accept: { 'application/pdf': ['.pdf'] }
                }]
            });
            
            const writable = await fileHandle.createWritable();
            const pdfBlob = pdf.output('blob');
            await writable.write(pdfBlob);
            await writable.close();
            
            alert(`Invoice exported successfully!\n\nFile: ${fileName}\nClient: ${this.currentInvoice.client}\nInvoice No: ${this.currentInvoice.invoiceNo}\nDate: ${this.currentInvoice.date}\n\nSaved to your selected location.`);
            
        } catch (error) {
            if (error.name === 'AbortError') {
                // User cancelled - don't save
                console.log('User cancelled file picker');
                return;
            } else {
                // Other error - fallback to browser download
                alert('Unable to save with file picker. Using browser download instead.');
                this.downloadPDF(pdf, fileName);
            }
        }
    }

    downloadPDF(pdf, fileName) {
        // Use browser's native save dialog
        pdf.save(fileName);
        
        const folderInfo = this.exportFolder ? 
            `\nPreferred Folder: ${this.exportFolder}\n\nNote: Please manually save to this folder for consistency.` :
            '\nNo specific export folder set.';
            
        alert(`Invoice exported successfully!\n\nFile: ${fileName}\nClient: ${this.currentInvoice.client}\nInvoice No: ${this.currentInvoice.invoiceNo}\nDate: ${this.currentInvoice.date}${folderInfo}`);
    }

    async printInvoice() {
        if (!this.validateInvoice()) {
            return;
        }
        
        this.updateInvoiceData();
        this.populatePrintTemplate();
        
        try {
            const template = document.getElementById('invoiceTemplate');
            template.style.display = 'block';
            
            // Use EXACT same canvas settings as PDF export
            const canvas = await html2canvas(template.querySelector('.invoice-page'), {
                scale: 2,
                useCORS: true,
                allowTaint: true
            });
            
            template.style.display = 'none';
            
            const imgData = canvas.toDataURL('image/png');
            
            // Use exact same dimensions as PDF export
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Create a new window with exact same layout as PDF
            const printWindow = window.open('', '_blank', 'width=800,height=1000');
            
            if (!printWindow) {
                alert('Please allow popups for this website to use the print feature.');
                return;
            }
            
            // Use safer HTML construction to avoid TrustedTypePolicy errors
            const printHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Invoice Print</title>
                    <style>
                        @page {
                            size: A4;
                            margin: 0mm;
                        }
                        html, body {
                            margin: 0;
                            padding: 0;
                            width: 210mm;
                            height: 297mm;
                            overflow: hidden;
                        }
                        .print-container {
                            width: 210mm;
                            height: 297mm;
                            position: relative;
                        }
                        .print-page {
                            width: 100%;
                            height: 100%;
                            display: flex;
                            flex-direction: column;
                        }
                        .invoice-image {
                            width: 100%;
                            height: auto;
                            display: block;
                        }
                        @media print {
                            html, body {
                                margin: 0;
                                padding: 0;
                            }
                            .print-container {
                                page-break-after: always;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        <div class="print-page">
                            <img src="${imgData}" class="invoice-image" alt="Invoice">
                        </div>
                    </div>
                </body>
                </html>
            `;
            
            // Write HTML safely
            printWindow.document.open();
            printWindow.document.write(printHTML);
            printWindow.document.close();
            
            // Wait for content to load before printing
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                
                // Show confirmation dialog after print window opens
                setTimeout(() => {
                    const save = confirm('Would you like to save/export this invoice as PDF?');
                    if (save) {
                        this.exportToPDF();
                    }
                    printWindow.close();
                }, 1500);
            }, 1000);
            
        } catch (error) {
            console.error('Error preparing print:', error);
            alert('Error preparing print. Please try again or use Export PDF instead.');
        }
    }

    saveToLocalStorage() {
        const data = {
            invoiceNumber: this.invoiceNumber,
            clients: this.clients,
            invoices: this.invoices
        };
        localStorage.setItem('uaeInvoiceSystem', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const stored = localStorage.getItem('uaeInvoiceSystem');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.invoiceNumber = data.invoiceNumber || 1;
                this.clients = (data.clients || []).map(client => ({
                    id: client.id || Date.now().toString(),
                    name: client.name || '',
                    phone: client.phone || '',
                    address: client.address || '',
                    createdAt: client.createdAt || new Date().toISOString()
                }));
                this.invoices = data.invoices || [];
                this.updateClientSelect();
                
                // Calculate next invoice number based on existing invoices
                this.updateInvoiceNumberCounter();
            } catch (error) {
                console.error('Error loading data from localStorage:', error);
            }
        }
    }

    updateInvoiceNumberCounter() {
        // Find the highest invoice number from existing invoices for current month
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const currentMonthPrefix = `INV-${year}${month}-`;
        
        const existingInvoicesThisMonth = this.invoices
            .map(inv => inv.invoiceNo)
            .filter(no => no && no.startsWith(currentMonthPrefix))
            .map(no => parseInt(no.split('-')[2]) || 0);
        
        if (existingInvoicesThisMonth.length > 0) {
            const maxNumber = Math.max(...existingInvoicesThisMonth);
            this.invoiceNumber = maxNumber + 1;
        } else {
            this.invoiceNumber = 1;
        }
        
        console.log('Updated invoice number counter to:', this.invoiceNumber);
    }

    // Function to fix swapped phone/address data
    fixClientPhoneAddressSwap(clientName) {
        const client = this.clients.find(c => c.name === clientName);
        if (client) {
            console.log('Before fix:', { phone: client.phone, address: client.address });
            
            // Check if phone and address appear to be swapped
            // Phone numbers are typically shorter and contain digits
            // Addresses are typically longer and contain letters
            const looksLikePhone = (str) => /^\d[\d\-\s\(\)]+$/.test(str.trim());
            const looksLikeAddress = (str) => /[a-zA-Z]/.test(str.trim()) && str.trim().length > 10;
            
            if (client.phone && client.address) {
                if (looksLikePhone(client.address) && looksLikeAddress(client.phone)) {
                    // They appear to be swapped, so fix them
                    const temp = client.phone;
                    client.phone = client.address;
                    client.address = temp;
                    
                    this.saveToLocalStorage();
                    console.log('After fix:', { phone: client.phone, address: client.address });
                    return true;
                }
            }
            
            console.log('No swap detected or data is correct');
            return false;
        } else {
            console.log(`Client "${clientName}" not found`);
            return false;
        }
    }

    // Test function to verify client details display
    testClientDetailsDisplay() {
        console.log('=== TESTING CLIENT DETAILS DISPLAY ===');
        
        // Check if elements exist
        const phoneElements = document.querySelectorAll('[data-field="clientPhone"]');
        const addressElements = document.querySelectorAll('[data-field="clientAddress"]');
        
        console.log('Phone elements found:', phoneElements.length);
        console.log('Address elements found:', addressElements.length);
        
        // Check current clients
        console.log('Current clients:', this.clients);
        
        // Test with first client if available
        if (this.clients.length > 0) {
            const testClient = this.clients[0];
            console.log('Testing with client:', testClient);
            
            phoneElements.forEach(el => {
                el.textContent = testClient.phone || 'TEST PHONE';
                el.style.display = 'block';
                console.log('Set phone to:', el.textContent);
            });
            
            addressElements.forEach(el => {
                el.textContent = testClient.address || 'TEST ADDRESS';
                el.style.display = 'block';
                console.log('Set address to:', el.textContent);
            });
        }
        
        console.log('=== END TEST ===');
    }
}

// Initialize the invoice system when the page loads
let invoiceApp; // Global reference for access from HTML

document.addEventListener('DOMContentLoaded', () => {
    invoiceApp = new InvoiceSystem();
});
