/**
 * Stock Debugger JavaScript
 * Handles the rental calendar debugging functionality
 */

(function($) {
    'use strict';
    
    // Debug helper function
    const debug = (message) => {
        // console.log('🛠️ Stock Debugger: ' + message);
    };
    
    debug('Script Loaded');
    
    /**
     * Format date as YYYY-MM-DD
     * @param {Date} date - Date object to format
     * @return {string} Formatted date string
     */
    function formatDate(date) {
        if (!date || isNaN(date.getTime())) {
            return '';
        }
        
        var year = date.getFullYear();
        var month = String(date.getMonth() + 1).padStart(2, '0');
        var day = String(date.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    }
    
    /**
     * Parse date string in DD.MM.YYYY or YYYY-MM-DD format
     * @param {string} dateStr - Date string to parse
     * @return {Date|null} Parsed date or null if invalid
     */
    function parseDate(dateStr) {
        if (!dateStr) {
            return null;
        }
        
        try {
            // Check if format is DD.MM.YYYY
            if (dateStr.includes('.')) {
                var parts = dateStr.split('.');
                if (parts.length !== 3) {
                    return null;
                }
                
                var day = parseInt(parts[0], 10);
                var month = parseInt(parts[1], 10) - 1; // Months are 0-based in JS
                var year = parseInt(parts[2], 10);
                
                // Validate date components
                if (isNaN(day) || isNaN(month) || isNaN(year)) {
                    return null;
                }
                
                var date = new Date(year, month, day);
                return isNaN(date.getTime()) ? null : date;
            } 
            // Check if format is YYYY-MM-DD
            else if (dateStr.includes('-')) {
                var parts = dateStr.split('-');
                if (parts.length !== 3) {
                    return null;
                }
                
                var year = parseInt(parts[0], 10);
                var month = parseInt(parts[1], 10) - 1; // Months are 0-based in JS
                var day = parseInt(parts[2], 10);
                
                // Validate date components
                if (isNaN(day) || isNaN(month) || isNaN(year)) {
                    return null;
                }
                
                var date = new Date(year, month, day);
                return isNaN(date.getTime()) ? null : date;
            }
            
            return null;
        } catch (error) {
            console.error('Error parsing date:', dateStr, error);
            return null;
        }
    }
    
    /**
     * Format a date string for display
     * @param {string} dateStr - Date string in YYYY-MM-DD format
     * @return {string} Formatted date string
     */
    function formatDisplayDate(dateStr) {
        if (!dateStr) {
            return '';
        }
        
        try {
            var date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                return dateStr; // Return original if parsing fails
            }
            
            // Format as DD.MM.YYYY
            var day = String(date.getDate()).padStart(2, '0');
            var month = String(date.getMonth() + 1).padStart(2, '0');
            var year = date.getFullYear();
            
            return day + '.' + month + '.' + year;
        } catch (error) {
            console.error('Error formatting date:', dateStr, error);
            return dateStr;
        }
    }

    // Stock Debugger Class
    class StockDebugger {
        constructor() {
            this.productId = this.getProductId();
            this.initialStock = 0;
            this.currentStock = 0;
            this.reservedDates = [];
            this.bufferDates = [];
            this.showReservedDates = true;
            this.showBufferDates = true;

            // Elements
            this.container = $('#stock-debugger');
            this.toggleBtn = $('#toggle-stock-debugger');
            this.initialStockEl = $('#initial-stock');
            this.currentStockEl = $('#current-stock');
            this.reservedDatesTableBodyEl = $('#reserved-dates-table tbody');
            this.bufferDatesTableBodyEl = $('#buffer-dates-table tbody');

            if (!this.container.length) {
                debug('Container not found');
                return;
            }

            if (!this.productId) {
                debug('No product ID found');
                return;
            }

            // Initialize
            this.getData();
            this.bindEvents();
        }

        getProductId() {
            // Try to get product ID from body class
            const bodyClasses = document.body.className;
            const match = bodyClasses.match(/postid-(\d+)/);
            
            // If not found in body class, try data attribute on debugger
            if (!match && this.container && this.container.length) {
                const dataProductId = this.container.attr('data-product-id');
                if (dataProductId) {
                    return dataProductId;
                }
            }
            
            return match ? match[1] : null;
        }

        getData() {
            debug('Getting data for product ID: ' + this.productId);

            $.ajax({
                url: wc_add_to_cart_params.ajax_url,
                method: 'POST',
                data: {
                    action: 'get_stock_debug_info',
                    product_id: this.productId,
                    nonce: wc_add_to_cart_params.ajax_nonce
                },
                success: (response) => {
                    if (response.success) {
                        debug('Data received successfully');
                        this.initialStock = parseInt(response.data.initial_stock, 10) || 0;
                        this.currentStock = parseInt(response.data.current_stock, 10) || 0;
                        this.reservedDates = Array.isArray(response.data.reserved_dates) ? response.data.reserved_dates : [];
                        this.bufferDates = Array.isArray(response.data.buffer_dates) ? response.data.buffer_dates : [];
                        
                        this.updateUI();
                    } else {
                        debug('Error: ' + (response.data ? response.data.message : 'Unknown error'));
                    }
                },
                error: (xhr, status, error) => {
                    debug('Ajax error: ' + error);
                    console.error('Stock debugger AJAX error:', xhr.responseText);
                }
            });
        }

        bindEvents() {
            // Toggle stock debugger panel
            this.toggleBtn.on('click', (e) => {
                e.preventDefault();
                this.container.slideToggle(200);
            });

            // Show/hide reserved dates
            $('#show-reserved-dates').on('change', () => {
                this.showReservedDates = $('#show-reserved-dates').is(':checked');
                this.updateUI();
            });
            
            // Show/hide buffer dates
            $('#show-buffer-dates').on('change', () => {
                this.showBufferDates = $('#show-buffer-dates').is(':checked');
                this.updateUI();
            });
        }

        // Update UI with current data
        updateUI() {
            // Update stock values
            this.initialStockEl.text(this.initialStock);
            this.currentStockEl.text(this.currentStock);
            
            // Update reserved dates table
            this.updateReservedDatesTable();
            
            // Update buffer dates table
            this.updateBufferDatesTable();
            
            debug('UI updated');
        }
        
        // Update reserved dates table
        updateReservedDatesTable() {
            if (!this.reservedDatesTableBodyEl.length) {
                debug('Reserved dates table not found');
                return;
            }
            
            let html = '';
            
            if (!this.reservedDates || this.reservedDates.length === 0) {
                html = '<tr><td colspan="5" class="no-data">No reservation data available</td></tr>';
            } else {
                this.reservedDates.forEach((reservation) => {
                    const startDate = formatDisplayDate(reservation.start_date);
                    const endDate = formatDisplayDate(reservation.end_date);
                    const qty = parseInt(reservation.qty, 10) || 1;
                    const orderId = reservation.order_id || 'N/A';
                    
                    html += '<tr>';
                    html += '<td>' + orderId + '</td>';
                    html += '<td>' + startDate + '</td>';
                    html += '<td>' + endDate + '</td>';
                    html += '<td>' + qty + '</td>';
                    html += '<td>' + (reservation.status || 'N/A') + '</td>';
                    html += '</tr>';
                });
            }
            
            this.reservedDatesTableBodyEl.html(html);
        }
        
        // Update buffer dates table
        updateBufferDatesTable() {
            if (!this.bufferDatesTableBodyEl.length) {
                debug('Buffer dates table not found');
                return;
            }
            
            let html = '';
            
            if (!this.bufferDates || this.bufferDates.length === 0) {
                html = '<tr><td colspan="3" class="no-data">No buffer dates available</td></tr>';
            } else {
                this.bufferDates.forEach((buffer) => {
                    const date = formatDisplayDate(buffer.date);
                    const reason = buffer.reason || 'N/A';
                    
                    html += '<tr>';
                    html += '<td>' + date + '</td>';
                    html += '<td>' + reason + '</td>';
                    html += '</tr>';
                });
            }
            
            this.bufferDatesTableBodyEl.html(html);
        }
    }

    // Initialize when document is ready
    $(document).ready(function() {
        // Only initialize if we're on a product page with the debugger container
        if ($('#stock-debugger').length) {
            debug('Initializing stock debugger');
            new StockDebugger();
        }
    });

})(jQuery);
