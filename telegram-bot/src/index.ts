import dotenv from 'dotenv';
dotenv.config();

import { server } from './server';

const PORT = process.env.PORT || 4003;

// Server startup
(async () => {
    server.listen(PORT, () => {
        console.log(`Telegram Bot listening on ${PORT}`);
    });
})();