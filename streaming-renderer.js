import * as smd from './smd.js';

/**
 * Streaming renderer with fade-in animation support
 * @param {HTMLElement} root 
 * @returns {smd.Default_Renderer}
 */
export function streaming_renderer(root) {
    // CSS animation for fade-in effect
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(5px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .fade-in {
            animation: fadeIn 0.3s ease-out forwards;
        }
        
        .stream-block {
            opacity: 0;
        }
    `;
    
    if (!document.querySelector('style[data-streaming-markdown]')) {
        style.setAttribute('data-streaming-markdown', '');
        document.head.appendChild(style);
    }

    const baseRenderer = smd.default_renderer(root);
    
    // Track current block-level elements for grouping
    let currentBlockElement = null;
    let pendingFadeIn = null;
    let fadeInTimer = null;
    
    // Elements that should trigger fade-in animation
    const BLOCK_LEVEL_TOKENS = new Set([
        smd.PARAGRAPH,
        smd.HEADING_1,
        smd.HEADING_2,
        smd.HEADING_3,
        smd.HEADING_4,
        smd.HEADING_5,
        smd.HEADING_6,
        smd.LIST_ITEM,
        smd.CODE_BLOCK,
        smd.CODE_FENCE,
        smd.BLOCKQUOTE,
        smd.TABLE_ROW,
        smd.RULE
    ]);
    
    // Container elements that should fade in as a whole
    const CONTAINER_TOKENS = new Set([
        smd.LIST_UNORDERED,
        smd.LIST_ORDERED,
        smd.TABLE
    ]);
    
    // Elements that should not be hidden initially
    const NO_FADE_TOKENS = new Set([
        smd.LIST_UNORDERED,
        smd.LIST_ORDERED,
        smd.TABLE
    ]);
    
    function scheduleFadeIn(element) {
        if (fadeInTimer) {
            clearTimeout(fadeInTimer);
        }
        
        pendingFadeIn = element;
        
        // Small delay to batch multiple additions
        fadeInTimer = setTimeout(() => {
            if (pendingFadeIn) {
                pendingFadeIn.classList.add('fade-in');
                pendingFadeIn = null;
            }
        }, 10);
    }
    
    // Override add_token to track block elements
    const originalAddToken = baseRenderer.add_token;
    baseRenderer.add_token = function(data, type) {
        originalAddToken.call(this, data, type);
        
        const element = data.nodes[data.index];
        
        if (BLOCK_LEVEL_TOKENS.has(type)) {
            // Mark as stream block initially
            element.classList.add('stream-block');
            currentBlockElement = element;
            
            // Schedule fade-in immediately for block elements
            scheduleFadeIn(element);
        } else if (CONTAINER_TOKENS.has(type)) {
            // For containers, don't hide them initially
            element.dataset.tokenType = type.toString();
            // Don't add stream-block class to containers
        }
    };
    
    // Override end_token
    const originalEndToken = baseRenderer.end_token;
    baseRenderer.end_token = function(data) {
        originalEndToken.call(this, data);
    };
    
    return baseRenderer;
}

/**
 * Create a streaming parser with fade-in animation
 * @param {HTMLElement} root 
 * @returns {smd.Parser}
 */
export function create_streaming_parser(root) {
    const renderer = streaming_renderer(root);
    return smd.parser(renderer);
}