import { server } from "./server";

const PORT = process.env.PORT || 4007;

(async () => {
    // Server startup
    server.listen(PORT, () => {
        console.log(`Scheduler listening on ${PORT}`);
    });
})();