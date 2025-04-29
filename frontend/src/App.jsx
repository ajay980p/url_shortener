import React, { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function UrlShortener() {
    const [longUrl, setLongUrl] = useState('');
    const [shortUrl, setShortUrl] = useState('');

    const Url = import.meta.env.VITE_BASE_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${Url}/shorten`, { longUrl });
            setShortUrl(response.data.shortUrl);
            toast.success('URL shortened successfully!', {
                position: 'top-right',
                autoClose: 3000,
            });
        } catch (error) {
            console.error('Error shortening URL:', error);
            toast.error('Failed to shorten URL. Please try again.', {
                position: 'top-right',
                autoClose: 3000,
            });
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={longUrl}
                    onChange={(e) => setLongUrl(e.target.value)}
                    placeholder="Enter long URL"
                    required
                />
                <button type="submit">Shorten</button>
            </form>
            {shortUrl && (
                <div className="short-url">
                    Short URL:
                    <a href={shortUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'blue', cursor: 'pointer' }}>
                        {shortUrl}
                    </a>
                </div>
            )}
            <ToastContainer />
        </div>
    );
}

export default UrlShortener;