export interface ServerErrors {
    [key: number]: {
        status: number,
        key: string,
        description: string
    }
}

export interface StripeErrors {
    [key: string]: {
        [subKey: string]: string
    };
}

export interface UserMetrics {
    [key: string]: {
        interactionsCount: number;
        correctionCount: number;
        questionsCount: number;
        avgCharactersPerInput: number;
        createdAt: Date
    }
}

export interface UserSessions {
    [key: string]: {
        loginDate: Date;
        logoutDate: Date;
        sessionDuration: string;
        interactionsCount: number;
        didExceededInteractionLimit: boolean;
    }
}