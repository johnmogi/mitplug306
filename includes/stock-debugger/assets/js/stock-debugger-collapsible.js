/**
 * Stock Debugger Collapsible Panel Functionality
 */
jQuery(document).ready(function($) {
    // Get the debug panel
    const $debugPanel = $('#stock-debugger');
    
    if (!$debugPanel.length) {
        console.log('Stock debugger panel not found');
        return;
    }
    
    // Add toggle indicator to the header
    $('.debug-header h3').prepend('<span class="debug-toggle">▼</span>');
    
    // Toggle debug panel collapse when clicking the header
    $('.debug-header').on('click', function(e) {
        // Don't collapse if clicking the close button
        if (!$(e.target).hasClass('debug-close') && !$(e.target).closest('.debug-close').length) {
            $debugPanel.toggleClass('collapsed');
            
            // Update toggle indicator
            if ($debugPanel.hasClass('collapsed')) {
                $('.debug-toggle').text('►');
            } else {
                $('.debug-toggle').text('▼');
            }
            
            // Store collapsed state in localStorage
            localStorage.setItem('stockDebuggerCollapsed', $debugPanel.hasClass('collapsed'));
        }
    });
    
    // Close debug panel when clicking the close button
    $('.debug-close').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation(); // Stop event from bubbling to the header click handler
        $debugPanel.hide();
    });
    
    // Refresh debug data when clicking the refresh button
    $('#refresh-debug-data').on('click', function(e) {
        e.preventDefault();
        location.reload();
    });
    
    // Restore collapsed state from localStorage
    if (localStorage.getItem('stockDebuggerCollapsed') === 'true') {
        $debugPanel.addClass('collapsed');
        $('.debug-toggle').text('►');
    }
    
    console.log('Stock debugger collapsible functionality initialized');
});
