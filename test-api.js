const t0 = performance.now();

fetch('http://localhost:3000/api/listings')
    .then(res => {
        const t1 = performance.now();
        console.log(`Response received in ${t1 - t0} milliseconds.`);
        console.log(`Status: ${res.status}`);
        return res.json();
    })
    .then(data => {
        const t2 = performance.now();
        console.log(`Data parsed in ${t2 - t1} milliseconds. Total time: ${t2 - t0} ms`);
        console.log(`Number of listings: ${data.length}`);
    })
    .catch(err => {
        console.error('Error fetching data:', err);
    });
