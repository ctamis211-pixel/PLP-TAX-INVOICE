# PLP TAX INVOICE

A comprehensive, tax-compliant invoice system that supports professional invoice creation, export, and printing functionality.

## Features

### 🎨 Professional Design
- Clean, black & white professional layout
- A4 page size optimized for printing
- Two identical invoice copies (Original + Duplicate) on one page
- Arial/Helvetica-style fonts for business correspondence
- Pixel-perfect spacing and alignment

### 🧾 Invoice Management
- Auto-generated incremental invoice numbers
- Date-based invoice numbering system
- Client management with save/load functionality
- Draft and final invoice status tracking
- Invoice history with search capabilities
- Auto-save draft every 30 seconds

### 💰 VAT Compliance
- UAE VAT compliant (5% default rate)
- Configurable VAT rate
- Automatic VAT calculations
- Amount in words conversion (AED)
- TRN validation (numeric, 7-15 digits)

### 📤 Export & Print
- PDF export with perfect layout preservation
- Print-ready formatting
- Two copies per page (Original + Duplicate)
- No UI elements in exported/printed invoices
- Post-print save confirmation prompt

### 🔒 Professional Features
- Input validation and error handling
- Keyboard navigation support
- Responsive screen layout
- Local storage for data persistence
- Company and client information management

## Usage

### Getting Started
1. Open `index.html` in a web browser
2. Fill in your company information (Name, Address, TRN, etc.)
3. Add client information or select from existing clients
4. Add invoice items with services and amounts
5. Review automatic calculations (VAT, totals, amount in words)

### Creating an Invoice
1. **New Invoice**: Click "New Invoice" to start fresh
2. **Company Details**: Enter your company information in the left section
3. **Invoice Details**: Fill in invoice number (auto-generated), date, payment mode
4. **Client Selection**: Choose existing client or add new one
5. **Add Items**: 
   - Enter service description
   - Add monthly description
   - Input amount (VAT and total calculate automatically)
   - Add/remove rows as needed
6. **Review**: Check totals and amount in words

### Export and Print
1. **Export PDF**: Click "Export PDF" to save as PDF file
2. **Print**: Click "Print" to print directly
3. After printing, you'll be prompted to save as PDF

### Saving and Loading
1. **Save Draft**: Manually save current work as draft
2. **Auto-save**: System automatically saves drafts every 30 seconds
3. **Load Invoice**: Load previously saved drafts

## File Structure

```
├── index.html          # Main HTML file with invoice structure
├── styles.css          # Complete styling for screen and print
├── script.js           # JavaScript functionality and logic
└── README.md          # This documentation file
```

## Technical Implementation

### HTML Structure
- Semantic HTML5 markup
- Separate print template for clean exports
- Form inputs for data entry
- Responsive table structure for invoice items

### CSS Features
- Print-optimized CSS with `@media print`
- A4 page dimensions (210mm x 297mm)
- Professional typography and spacing
- Responsive design for various screen sizes
- Clean black & white design for business use

### JavaScript Functionality
- ES6 class-based architecture
- Local storage for data persistence
- Real-time calculations
- PDF export using jsPDF and html2canvas
- Form validation and error handling
- Auto-save functionality

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Dependencies

The system uses the following CDN libraries:
- jsPDF 2.5.1 - PDF generation
- html2canvas 1.4.1 - HTML to image conversion

## VAT Compliance Notes

- Default VAT rate: 5% (UAE standard)
- Currency: AED (UAE Dirham)
- TRN format validation: 7-15 numeric digits
- Professional invoice layout as per UAE business standards

## Customization

### VAT Rate
To change the default VAT rate, modify the `vatRate` property in the `InvoiceSystem` constructor in `script.js`:

```javascript
this.vatRate = 5; // Change this value
```

### Company Information
Default company information can be set by modifying the initialization in `script.js`.

### Styling
All visual customization can be done in `styles.css`. The print styles are specifically optimized for A4 printing.

## Data Storage

All invoice data is stored locally in the browser's localStorage:
- Company information
- Client database
- Invoice history
- Draft invoices

## Security Notes

- All data is stored locally in the browser
- No external API calls for data storage
- TRN validation for compliance
- Input sanitization for security

## Support

For issues or questions:
1. Check browser console for error messages
2. Ensure all dependencies are loaded
3. Verify localStorage is enabled in browser
4. Check PDF export permissions in browser settings

## License

This project is open source and available for commercial use.
