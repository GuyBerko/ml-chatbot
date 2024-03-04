import { ServerErrors, StripeErrors } from "./types";

const errors: ServerErrors = {
    400: {
        status: 400,
        key: 'BAD_REQUEST',
        description: 'Bad Request'
    },
    404: {
        status: 404,
        key: 'NOT_FOUND',
        description: 'Not Found'
    },
    500: {
        status: 500,
        key: 'INTERNAL_SERVER_ERROR',
        description: 'Backend server error'
    }
};

export const stripeErrors: StripeErrors = {
    card_declined: {
        generic_decline: 'Your card has been declined',
        insufficient_funds: 'lost_card',
        lost_card: 'lost_card',
        stolen_card: 'stolen_card',
    }
}

export default errors;