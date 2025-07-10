/**
 * Stock Debugger Debug Log
 * Connects rental datepicker data with stock debugger
 */

(function($) {
    'use strict';
    
    // Create global namespace for sharing data between scripts
    window.rentalDebugData = window.rentalDebugData || {
        bookedDates: [],
        initialStock: 0,
        currentStock: 0,
        productId: null
    };
    
    // Listen for the custom event from rental datepicker
    $(document).on('rentalDatesLoaded', function(event, data) {
        // console.log('🔄 Rental dates loaded event received:', data);
        
        // Store the data globally
        if (data && data.bookedDates) {
            window.rentalDebugData.bookedDates = data.bookedDates;
            window.rentalDebugData.initialStock = data.initialStock || 0;
            window.rentalDebugData.currentStock = data.currentStock || 0;
            window.rentalDebugData.productId = data.productId || null;
            
            // Format dates for the stock debugger
            const formattedDates = formatDatesForStockDebugger(data.bookedDates);
            
            // Debug the DOM structure of the stock debugger panel
            // console.log('🔍 Stock Debugger DOM Structure:');
            // console.log('Stock debugger panel:', $('#stock-debugger-panel').length ? 'Found' : 'Not found');
            
            // Look for tables in the stock debugger panel
            const tables = $('#stock-debugger-panel table');
            // console.log('Tables in stock debugger panel:', tables.length);
            tables.each(function(index) {
                // console.log(`Table ${index}:`, {
                //     id: this.id || 'No ID',
                //     className: this.className || 'No class',
                //     caption: $(this).find('caption').text() || 'No caption',
                //     theadText: $(this).find('thead').text().trim().substring(0, 50) || 'No thead',
                //     rows: $(this).find('tbody tr').length
                // });
            });
            
            // Update the stock debugger table if it exists
            updateStockDebuggerTable(formattedDates);
            
            // console.log('📊 Stock debugger data updated:', formattedDates);
        }
    });
    
    /**
     * Format booked dates for the stock debugger table
     * @param {Array} bookedDates - The booked dates from rental datepicker
     * @return {Array} Formatted dates for stock debugger
     */
    function formatDatesForStockDebugger(bookedDates) {
        if (!Array.isArray(bookedDates) || bookedDates.length === 0) {
            // console.log('No booked dates to format');
            return [];
        }
        
        const formattedDates = [];
        
        // Check if we have ranges or individual dates
        const hasRanges = bookedDates.some(date => 
            date.start_date && date.end_date && date.start_date !== date.end_date);
            
        if (hasRanges) {
            // We have date ranges, use them directly
            bookedDates.forEach(dateRange => {
                formattedDates.push({
                    start_date: dateRange.start_date || dateRange.date,
                    end_date: dateRange.end_date || dateRange.date,
                    qty: dateRange.qty || 1,
                    order_id: dateRange.order_id || 'Unknown',
                    status: dateRange.status || 'booked'
                });
            });
        } else {
            // Group individual dates into ranges where possible
            let currentGroup = null;
            
            // Sort dates chronologically if they're in YYYY-MM-DD format
            const sortedDates = [...bookedDates].sort((a, b) => {
                const dateA = a.date || a;
                const dateB = b.date || b;
                return dateA.localeCompare(dateB);
            });
            
            sortedDates.forEach(date => {
                const dateStr = typeof date === 'string' ? date : (date.date || '');
                const dateObj = parseDate(dateStr);
                
                if (!dateObj) return;
                
                if (!currentGroup) {
                    // Start a new group
                    currentGroup = {
                        start_date: dateStr,
                        end_date: dateStr,
                        dates: [dateStr],
                        qty: 1,
                        status: 'booked'
                    };
                } else {
                    // Check if this date is consecutive with the current group
                    const lastDate = parseDate(currentGroup.end_date);
                    lastDate.setDate(lastDate.getDate() + 1);
                    const nextDateStr = formatDate(lastDate);
                    
                    if (dateStr === nextDateStr) {
                        // Add to the current group
                        currentGroup.end_date = dateStr;
                        currentGroup.dates.push(dateStr);
                    } else {
                        // End the current group and start a new one
                        formattedDates.push({
                            start_date: currentGroup.start_date,
                            end_date: currentGroup.end_date,
                            qty: currentGroup.qty,
                            order_id: 'N/A',
                            status: currentGroup.status
                        });
                        
                        currentGroup = {
                            start_date: dateStr,
                            end_date: dateStr,
                            dates: [dateStr],
                            qty: 1,
                            status: 'booked'
                        };
                    }
                }
            });
            
            // Add the last group if it exists
            if (currentGroup) {
                formattedDates.push({
                    start_date: currentGroup.start_date,
                    end_date: currentGroup.end_date,
                    qty: currentGroup.qty,
                    order_id: 'N/A',
                    status: currentGroup.status
                });
            }
        }
        
        return formattedDates;
    }
    
    /**
     * Parse date string in YYYY-MM-DD format
     * @param {string} dateStr - Date string to parse
     * @return {Date|null} Parsed date or null if invalid
     */
    function parseDate(dateStr) {
        if (!dateStr) return null;
        
        try {
            const parts = dateStr.split('-');
            if (parts.length !== 3) return null;
            
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Months are 0-based in JS
            const day = parseInt(parts[2], 10);
            
            const date = new Date(year, month, day);
            return isNaN(date.getTime()) ? null : date;
        } catch (error) {
            console.error('Error parsing date:', dateStr, error);
            return null;
        }
    }
    
    /**
     * Format date as YYYY-MM-DD
     * @param {Date} date - Date object to format
     * @return {string} Formatted date string
     */
    function formatDate(date) {
        if (!date || isNaN(date.getTime())) return '';
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }
    
    /**
     * Format a date string for display (DD.MM.YYYY)
     * @param {string} dateStr - Date string in YYYY-MM-DD format
     * @return {string} Formatted date string
     */
    function formatDisplayDate(dateStr) {
        if (!dateStr) return '';
        
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            
            return `${day}.${month}.${year}`;
        } catch (error) {
            console.error('Error formatting date:', dateStr, error);
            return dateStr;
        }
    }
    
    /**
     * Update the stock debugger reserved dates table
     * @param {Array} reservedDates - Formatted dates for the table
     */
    function updateStockDebuggerTable(reservedDates) {
        // Try different possible selectors for the table
        let tableBody = $('#reserved-dates-table tbody');
        if (!tableBody.length) {
            tableBody = $('.stock-debugger-table.reserved-dates-table tbody');
        }
        if (!tableBody.length) {
            tableBody = $('.reserved-dates-table tbody');
        }
        if (!tableBody.length) {
            // Last resort - get any table in the stock debugger panel
            tableBody = $('#stock-debugger-panel table tbody');
        }
        
        if (!tableBody.length) {
            // console.log('Reserved dates table not found - creating it');
            
            // Find the stock debugger panel
            const panel = $('#stock-debugger-panel');
            if (!panel.length) {
                // console.log('Stock debugger panel not found');
                console.table(reservedDates); // Log data as table for debugging
                return;
            }
            
            // Create the table structure
            const tableHTML = `
                <h3>Reserved Dates</h3>
                <div class="stock-debugger-reserved-dates">
                    <table class="stock-debugger-table reserved-dates-table" id="reserved-dates-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Qty</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            `;
            
            // Append the table to the panel
            panel.append(tableHTML);
            
            // Get the table body reference
            tableBody = $('#reserved-dates-table tbody');
            
            // console.log('Created reserved dates table');
        }
        
        let html = '';
        
        if (!reservedDates || reservedDates.length === 0) {
            html = '<tr><td colspan="5" class="no-data">No reservation data available</td></tr>';
        } else {
            reservedDates.forEach(reservation => {
                const startDate = formatDisplayDate(reservation.start_date);
                const endDate = formatDisplayDate(reservation.end_date);
                const qty = parseInt(reservation.qty, 10) || 1;
                const orderId = reservation.order_id || 'N/A';
                const status = reservation.status || 'N/A';
                
                html += '<tr>';
                html += `<td>${orderId}</td>`;
                html += `<td>${startDate}</td>`;
                html += `<td>${endDate}</td>`;
                html += `<td>${qty}</td>`;
                html += `<td>${status}</td>`;
                html += '</tr>';
            });
        }
        
        tableBody.html(html);
        // console.log('Stock debugger table updated with', reservedDates.length, 'entries');
    }
    
    // Expose debug API for manual use
    window.stockDebuggerAPI = {
        updateTable: updateStockDebuggerTable,
        formatDates: formatDatesForStockDebugger,
        // debugData: () => console.log('Current debug data:', window.rentalDebugData)
    };
    
    // console.log('📋 Stock Debugger Debug Log initialized');
    
})(jQuery);
