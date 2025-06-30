/**
 * Stock Debugger JavaScript
 * Handles the rental calendar debugging functionality
 */

(function($) {
    'use strict';
    
    // Debug helper function
    const debug = (message) => {
        console.log('🛠️ Stock Debugger: ' + message);
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
            
            // Try to get from content element with data-product-id attribute
            const contentEl = $('.content[data-product-id]');
            if (contentEl.length) {
                const contentProductId = contentEl.attr('data-product-id');
                if (contentProductId) {
                    return contentProductId;
                }
            }
            
            return match ? match[1] : null;
        }

        getData() {
            debug('Getting data for product ID: ' + this.productId);
            
            // First, get initial and current stock from the debug info div
            const debugInfoEl = $('.stock-debug-info');
            if (debugInfoEl.length) {
                const initialStockText = debugInfoEl.find('p:contains("Initial Stock")').text();
                const currentStockText = debugInfoEl.find('p:contains("Current Stock")').text();
                
                const initialStockMatch = initialStockText.match(/Initial Stock:\s*(\d+)/);
                const currentStockMatch = currentStockText.match(/Current Stock:\s*(\d+)/);
                
                if (initialStockMatch && initialStockMatch[1]) {
                    this.initialStock = parseInt(initialStockMatch[1], 10);
                }
                
                if (currentStockMatch && currentStockMatch[1]) {
                    this.currentStock = parseInt(currentStockMatch[1], 10);
                }
                
                debug('Found stock data in DOM: Initial=' + this.initialStock + ', Current=' + this.currentStock);
            }

            // Now get reserved dates using the rental datepicker endpoint
            $.ajax({
                url: wc_add_to_cart_params.ajax_url,
                method: 'POST',
                data: {
                    action: 'get_booked_dates',  // Using the working endpoint
                    product_id: this.productId,
                    nonce: wc_add_to_cart_params.ajax_nonce || rentalDatepicker.nonce  // Try both nonce sources
                },
                success: (response) => {
                    if (response.success) {
                        debug('Data received successfully');
                        
                        // Process the booked dates from the rental datepicker response
                        if (response.data && response.data.booked_dates) {
                            // Transform the data to match our expected format
                            this.processBookedDates(response.data.booked_dates);
                        }
                        
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
        
        processBookedDates(bookedDates) {
            if (!Array.isArray(bookedDates) || bookedDates.length === 0) {
                debug('No booked dates found');
                return;
            }
            
            debug('Processing ' + bookedDates.length + ' booked dates');
            
            // Group dates by order ID if possible
            const datesByOrder = {};
            const processedDates = [];
            
            // Check for dates that look like they have order data
            const hasOrderData = bookedDates.some(date => typeof date === 'object' && date.order_id);
            
            if (hasOrderData) {
                // Process dates that have order data
                this.reservedDates = bookedDates.map(date => {
                    return {
                        start_date: date.start_date || date.date,
                        end_date: date.end_date || date.date,
                        qty: date.qty || 1,
                        order_id: date.order_id || 'N/A',
                        status: date.status || 'booked'
                    };
                });
            } else {
                // Process simple date strings (YYYY-MM-DD)
                // Group consecutive dates as ranges
                let currentRange = null;
                
                // Sort dates chronologically
                bookedDates.sort();
                
                for (let i = 0; i < bookedDates.length; i++) {
                    const currentDate = bookedDates[i];
                    
                    // Skip if we've already processed this date
                    if (processedDates.includes(currentDate)) continue;
                    
                    processedDates.push(currentDate);
                    
                    if (!currentRange) {
                        currentRange = {
                            start_date: currentDate,
                            end_date: currentDate,
                            qty: 1,
                            order_id: 'N/A',
                            status: 'booked'
                        };
                    } else {
                        // Check if this date is consecutive with the current range
                        const lastDate = new Date(currentRange.end_date);
                        const nextDay = new Date(lastDate);
                        nextDay.setDate(nextDay.getDate() + 1);
                        
                        if (currentDate === formatDate(nextDay)) {
                            // Extend the current range
                            currentRange.end_date = currentDate;
                        } else {
                            // Start a new range
                            this.reservedDates.push(currentRange);
                            currentRange = {
                                start_date: currentDate,
                                end_date: currentDate,
                                qty: 1,
                                order_id: 'N/A',
                                status: 'booked'
                            };
                        }
                    }
                }
                
                // Add the last range if it exists
                if (currentRange) {
                    this.reservedDates.push(currentRange);
                }
            }
            
            debug('Processed ' + this.reservedDates.length + ' reservation entries');
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
