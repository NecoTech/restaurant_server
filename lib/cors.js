import Cors from 'cors';

// Initialize the cors middleware
const cors = Cors({
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
    origin: process.env.FRONTEND_URL, // Replace with your frontend URL
    credentials: true,
});

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
}

// Wrapper function to apply CORS to an API route
export function withCors(handler) {
    return async (req, res) => {
        await runMiddleware(req, res, cors);
        return handler(req, res);
    };
}