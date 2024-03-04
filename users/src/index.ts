import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { server } from './server';
const version = '1.0.1';


const PORT = process.env.PORT || 4001;

// Server startup
(async () => {
    await mongoose.connect(process.env.MONGO_URI!);

    server.listen(PORT, () => {
        console.log(`Users listening on ${PORT}`);
        console.log(`version: ${version}`)
    });
})();