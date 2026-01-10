/**
 * Debounce Utility
 * 
 * Creates debounced functions that delay execution until after a specified wait time
 * has elapsed since the last invocation. Useful for search inputs and filter operations.
 * 
 * @module utils/debounce
 * @author Costco Dashboard Team
 * @since 1.0.0
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {boolean} [immediate=false] - If true, trigger function on leading edge instead of trailing
 * @returns {Function} Debounced function with cancel method
 * 
 * @example
 * // Debounce search input
 * const debouncedSearch = debounce((query) => {
 *   performSearch(query);
 * }, 300);
 * 
 * searchInput.addEventListener('input', (e) => {
 *   debouncedSearch(e.target.value);
 * });
 * 
 * @example
 * // Cancel pending execution
 * const debounced = debounce(expensiveFunction, 1000);
 * debounced(); // Schedule execution
 * debounced.cancel(); // Cancel before it runs
 */
export function debounce(func, wait, immediate = false) {
    if (typeof func !== 'function') {
        throw new TypeError('debounce: func must be a function');
    }

    if (typeof wait !== 'number' || wait < 0) {
        throw new TypeError('debounce: wait must be a non-negative number');
    }

    let timeout = null;

    const debounced = function (...args) {
        const context = this;
        
        const later = function () {
            timeout = null;
            if (!immediate) {
                func.apply(context, args);
            }
        };

        const callNow = immediate && !timeout;
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);

        if (callNow) {
            func.apply(context, args);
        }
    };

    /**
     * Cancels any pending execution
     */
    debounced.cancel = function () {
        if (timeout !== null) {
            clearTimeout(timeout);
            timeout = null;
        }
    };

    /**
     * Immediately invokes the function and cancels pending execution
     */
    debounced.flush = function (...args) {
        debounced.cancel();
        return func.apply(this, args);
    };

    return debounced;
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds
 * 
 * @param {Function} func - The function to throttle
 * @param {number} wait - The number of milliseconds to throttle invocations to
 * @returns {Function} Throttled function
 * 
 * @example
 * // Throttle scroll event handler
 * const throttledScroll = throttle(() => {
 *   updateScrollPosition();
 * }, 100);
 * 
 * window.addEventListener('scroll', throttledScroll);
 */
export function throttle(func, wait) {
    if (typeof func !== 'function') {
        throw new TypeError('throttle: func must be a function');
    }

    if (typeof wait !== 'number' || wait < 0) {
        throw new TypeError('throttle: wait must be a non-negative number');
    }

    let timeout = null;
    let previous = 0;

    return function (...args) {
        const now = Date.now();
        const remaining = wait - (now - previous);
        const context = this;

        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            func.apply(context, args);
        } else if (!timeout) {
            timeout = setTimeout(() => {
                previous = Date.now();
                timeout = null;
                func.apply(context, args);
            }, remaining);
        }
    };
}
