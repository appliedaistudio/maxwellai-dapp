export function searchWikipedia(query, callback) {
    if (!query) {
        callback('Please provide a search query.', null);
        return;
    }

    // Wikipedia API endpoint with JSONP format
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}&callback=?`;

    // JSONP request
    const script = document.createElement('script');
    script.src = apiUrl;

    // Define callback function to handle JSONP response
    window.jsonpCallback = function(data) {
        if (data.error) {
            callback(`Error fetching data: ${data.error.info}`, null);
        } else {
            const results = data.query.search.map(result => {
                return `${result.title}: ${result.snippet}\nRead more: https://en.wikipedia.org/wiki/${encodeURIComponent(result.title)}\n\n`;
            });
            callback(null, results.join('\n'));
        }
        // Clean up - remove the script tag and callback function
        document.body.removeChild(script);
        delete window.jsonpCallback;
    };

    // Append script tag to initiate JSONP request
    document.body.appendChild(script);
}

// Example usage:
searchWikipedia("Albert Einstein", (error, results) => {
    if (error) {
        console.error(error);
    } else {
        console.log(results);
    }
});

