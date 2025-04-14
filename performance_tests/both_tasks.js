import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
    vus: 1000, // 100 virtual users
    duration: '30s', // 30 seconds
    thresholds: {
        http_req_duration: ['p(95)<200'], // 95% of requests <200ms
        checks: ['rate>0.99'], // 99% of checks pass
    },
};

export default function () {
    // Step 1: POST /shorten with random URL
    const randomUrl = `https://${randomString(10)}.com`;
    console.log(`Sending POST with longUrl: ${randomUrl}`); // Debug

    const payload = JSON.stringify({
        longUrl: randomUrl,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const shortenRes = http.post('http://localhost:5000/shorten', payload, params);

    check(shortenRes, {
        'POST /shorten status is 200': (r) => r.status === 200,
        'POST /shorten returns shortUrl': (r) => {
            const shortUrl = r.json('shortUrl');
            return shortUrl !== undefined;
        },
        'POST /shorten shortUrl is valid': (r) => {
            const shortUrl = r.json('shortUrl');
            return shortUrl && shortUrl.startsWith('http://localhost:5000/s/');
        },
    });

    // Debug POST failures
    if (shortenRes.status !== 200) {
        console.log(`POST failed: Status=${shortenRes.status}, Body=${shortenRes.body}`);
    }

    // Step 2: GET /s/:shortCode (disable redirect following)
    const shortUrl = shortenRes.json('shortUrl');
    const shortCode = shortUrl ? shortUrl.split('/s/')[1] : null;

    if (shortCode) {
        console.log(`Sending GET to /s/${shortCode}`);
        const redirectRes = http.get(`http://localhost:5000/s/${shortCode}`, {
            redirects: 0, // Disable following redirects
        });

        check(redirectRes, {
            'GET /s/:shortCode status is 301': (r) => r.status === 301,
            'GET /s/:shortCode redirects to correct URL': (r) => {
                const location = r.headers['Location'];
                return location === randomUrl;
            },
        });

        // Debug GET failures
        if (redirectRes.status !== 301) {
            console.log(`GET failed: Status=${redirectRes.status}, Body=${redirectRes.body}, Location=${redirectRes.headers['Location']}`);
        }
    }

    // Mimic user behavior
    sleep(0.1); // 100ms delay
}