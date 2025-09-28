// Example usage of the Instruments API

// Basic search
fetch('http://localhost:6900/api/instruments?search=RELIANCE&limit=5')
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log('Found instruments:', data.data.data);
            console.log('Total count:', data.data.pagination.total_count);
        }
    });

// Search with filters
fetch('http://localhost:6900/api/instruments?exchange=NSE&instrument_type=EQ&limit=10')
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log('NSE Equity stocks:', data.data.data.length);
        }
    });

// Get specific instrument
fetch('http://localhost:6900/api/instruments/RELIANCE')
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log('Instrument details:', data.data);
        }
    });

// Search for options with pagination
fetch('http://localhost:6900/api/instruments?instrument_type=OPT&page=1&limit=20')
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log('Options found:', data.data.data.length);
            console.log('Has next page:', data.data.pagination.has_next);
        }
    });

// Search with sorting
fetch('http://localhost:6900/api/instruments?sort_by=name&sort_order=asc&limit=10')
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log('Sorted instruments:', data.data.data);
        }
    });