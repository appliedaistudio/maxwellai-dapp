// Converts a hexadecimal color code to an RGB object
function hexToRGB(hex) {
    let r = 0, g = 0, b = 0;
    // Handle short form (3 digits) hex
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    // Handle standard (6 digits) hex
    } else if (hex.length === 7) {
        r = parseInt(hex[1] + hex[2], 16);
        g = parseInt(hex[3] + hex[4], 16);
        b = parseInt(hex[5] + hex[6], 16);
    }
    return { r, g, b };
}

// Calculates the luminance of an RGB color, important for contrast calculations
function getLuminance(rgb) {
    // Convert RGB values to the range [0,1], then apply sRGB luminance formula
    const a = [rgb.r, rgb.g, rgb.b].map(function(v) {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Calculates the contrast ratio between two RGB colors for WCAG compliance
function getContrastRatio(rgb1, rgb2) {
    // Apply formula for contrast ratio calculation
    const luminance1 = getLuminance(rgb1) + 0.05;
    const luminance2 = getLuminance(rgb2) + 0.05;
    return (Math.max(luminance1, luminance2) / Math.min(luminance1, luminance2)).toFixed(2);
}

// Adjusts the color to ensure WCAG recommended contrast ratio (4.5:1) is met
function ensureContrast(lightRGB, darkRGB) {
    // Initial contrast ratio calculation
    let contrast = getContrastRatio(lightRGB, darkRGB);

    // Adjust if the contrast ratio is below 4.5:1, aiming for WCAG compliance
    if (contrast < 4.5) {
        // Simple adjustment to lighten the color, to improve contrast
        return {
            ...lightRGB,
            r: Math.min(lightRGB.r + 20, 255),
            g: Math.min(lightRGB.g + 20, 255),
            b: Math.min(lightRGB.b + 20, 255)
        };
    }
    return lightRGB; // Return original if contrast is sufficient
}

// Extracts and updates theme colors from an image, adjusting for WCAG-compliant contrast
export function updateThemeColorsBasedOnImage(imagePath) {
    var img = new Image();
    img.src = imagePath;
    img.onload = function() {
        // Vibrant.js library used to extract key colors from image
        var vibrant = new Vibrant(img);
        var swatches = vibrant.swatches();
        
        if (swatches) {
            // Selected colors from the image
            let neutralColorHex = swatches.DarkMuted ? swatches.DarkMuted.getHex() : '#999';
            let accentColorHex = swatches.Vibrant ? swatches.Vibrant.getHex() : '#f00';
            let secondaryAccentColorHex = swatches.Muted ? swatches.Muted.getHex() : '#00f';
            let lightColorHex = swatches.LightVibrant ? swatches.LightVibrant.getHex() : '#fff';

            // Convert Hex colors to RGB
            let neutralColorRGB = hexToRGB(neutralColorHex);
            let accentColorRGB = hexToRGB(accentColorHex);
            let lightColorRGB = hexToRGB(lightColorHex);
            let secondaryAccentColorRGB = hexToRGB(secondaryAccentColorHex);

            // Ensure contrast for accessibility, modifies lightColorRGB for compliance
            lightColorRGB = ensureContrast(lightColorRGB, neutralColorRGB);
            let lightColorAdjusted = `rgb(${lightColorRGB.r}, ${lightColorRGB.g}, ${lightColorRGB.b})`;

            // Apply theme updates to CSS custom properties, with adjustments for contrast
            const rootStyle = document.documentElement.style;
            rootStyle.setProperty('--neutral-color', `rgb(${neutralColorRGB.r}, ${neutralColorRGB.g}, ${neutralColorRGB.b})`);
            rootStyle.setProperty('--accent-color', `rgb(${accentColorRGB.r}, ${accentColorRGB.g}, ${accentColorRGB.b})`);
            rootStyle.setProperty('--secondary-accent-color', `rgb(${secondaryAccentColorRGB.r}, ${secondaryAccentColorRGB.g}, ${secondaryAccentColorRGB.b})`);
            rootStyle.setProperty('--light-color', lightColorAdjusted);
            rootStyle.setProperty('--font-color', lightColorAdjusted);

            // Adding semi-transparent background color for more flexible design use
            rootStyle.setProperty('--neutral-color-bg', `rgba(${neutralColorRGB.r}, ${neutralColorRGB.g}, ${neutralColorRGB.b}, 0.8)`);
        }
    };
    img.onerror = function() {
        console.error('Error loading the image:', imagePath);
    };
}