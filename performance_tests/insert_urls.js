import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
    vus: 10000, // 100 virtual users
    duration: '30s', // 30 seconds
    thresholds: {
        http_req_duration: ['p(95)<200'], // 95% of requests <200ms
        checks: ['rate>0.99'], // 99% of checks pass
    },
};

export default function () {
    // Generate a random URL
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

    const res = http.post('http://localhost:5000/shorten', payload, params);

    check(res, {
        'POST /shorten status is 200': (r) => r.status === 200,
        'POST /shorten returns shortUrl': (r) => r.json('shortUrl') !== undefined,
        'POST /shorten shortUrl is valid': (r) => {
            const shortUrl = r.json('shortUrl');
            return shortUrl && shortUrl.startsWith('http://localhost:5000/s/');
        },
    });

    // Debug failed requests
    if (res.status !== 200) {
        console.log(`Failed POST: Status=${res.status}, Body=${res.body}`);
    }

    sleep(0.1); // 100ms delay
}