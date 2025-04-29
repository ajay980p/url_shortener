import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
    thresholds: {
        http_req_duration: ['p(95)<200'],
        checks: ['rate>0.99'],
    },
    stages: [
        { duration: '30s', target: 5000 },
        { duration: '30s', target: 5000 },
        { duration: '1m', target: 10000 },
        { duration: '30s', target: 0 },
    ]
};

export default function () {
    // --- Step 1: Shorten a random URL ---
    const randomUrl = `https://${randomString(10)}.com`;

    const payload = JSON.stringify({
        longUrl: randomUrl,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const shortenRes = http.post('http://localhost:5000/shorten', payload, params);

    const postChecks = check(shortenRes, {
        'POST: status is 201': (r) => r.status === 201,
        'POST: shortUrl exists': (r) => !!r.json('shortUrl'),
        'POST: shortUrl format valid': (r) => {
            const shortUrl = r.json('shortUrl');
            return shortUrl && shortUrl.startsWith('http://localhost:5000/s/');
        },
    });

    if (!postChecks) {
        console.error(`❌ POST /shorten failed:
        Status: ${shortenRes.status}
        URL: ${randomUrl}
        Body: ${shortenRes.body}`);
        return;
    }


    // --- Step 2: Try GET for the generated short code ---
    const shortUrl = shortenRes.json('shortUrl');
    const shortCode = shortUrl ? shortUrl.split('/s/')[1] : null;

    if (shortCode) {
        const redirectRes = http.get(`http://localhost:5000/s/${shortCode}`, {
            redirects: 0,
        });

        const getChecks = check(redirectRes, {
            'GET: status is 301': (r) => r.status === 301
        });

        if (!getChecks) {
            console.error(`❌ GET /s/${shortCode} failed:
            Status: ${redirectRes.status}
            Expected redirect to: ${randomUrl}
            Got Location: ${redirectRes.headers['Location']}
            Body: ${redirectRes.body}`);
        }
    } else {
        console.error(`❌ No shortCode found in: ${shortUrl}`);
    }

    sleep(0.1);
}