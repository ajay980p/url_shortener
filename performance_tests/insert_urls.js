import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
    vus: 300,
    duration: '30s',
    thresholds: {
        http_req_duration: ['p(95)<200'],
        checks: ['rate>0.99'],
    },
};

export default function () {
    const randomUrl = `https://${randomString(10)}.com`;

    const payload = JSON.stringify({
        longUrl: randomUrl,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const res = http.post('http://localhost:5000/shorten', payload, params);

    // Expected: status 201 Created and valid short URL in response
    const result = check(res, {
        '✅ status is 201': (r) => r.status === 201,
        '✅ shortUrl exists': (r) => !!r.json('shortUrl'),
        '✅ shortUrl format valid': (r) => {
            const shortUrl = r.json('shortUrl');
            return shortUrl && shortUrl.startsWith('http://localhost:5000/s/');
        },
    });

    if (!result) {
        console.error(`❌ Failed request:
        Status: ${res.status}
        URL: ${randomUrl}
        Body: ${res.body}`);
    }

    sleep(0.1);
}