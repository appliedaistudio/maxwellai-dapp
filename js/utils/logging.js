
// Log a message with function name if the current verbosity level is equal to or higher than the specified minimum verbosity level
function log(message, currentVerbosity, minVerbosity, functionName) {
    if (currentVerbosity >= minVerbosity) { // Log only if verbosity level is equal to or higher than the specified minimum verbosity level
        console.log(`[${functionName}] ${message}`);
    }
}

export {log}