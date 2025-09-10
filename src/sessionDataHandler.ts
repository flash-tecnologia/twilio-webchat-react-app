import log from "loglevel";

import { Token } from "./definitions";

const LOCAL_STORAGE_ITEM_ID = "TWILIO_WEBCHAT_WIDGET";

let _endpoint = "";

export async function contactBackend<T>(endpointRoute: string, body: Record<string, unknown> = {}): Promise<T> {
    const response = await fetch(_endpoint + endpointRoute, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error("Request to backend failed");
    }

    return response.json();
}

function storeSessionData(data: Token) {
    localStorage.setItem(LOCAL_STORAGE_ITEM_ID, JSON.stringify(data));
}

function getStoredSessionData() {
    const item = localStorage.getItem(LOCAL_STORAGE_ITEM_ID);
    let storedData: Token;

    if (!item) {
        return null;
    }

    try {
        storedData = JSON.parse(item);
    } catch (e) {
        log.log("Couldn't parse locally stored data");
        return null;
    }

    return storedData;
}

export const sessionDataHandler = {
    setEndpoint(endpoint: string = "") {
        _endpoint = endpoint;
    },

    getEndpoint() {
        return _endpoint;
    },

    tryResumeExistingSession(): Token | null {
        log.debug("sessionDataHandler: trying to refresh existing session");
        const storedTokenData = getStoredSessionData();

        if (!storedTokenData) {
            log.debug("sessionDataHandler: no tokens stored, no session to refresh");
            return null;
        }

        if (Date.now() >= new Date(storedTokenData.expiration).getTime()) {
            log.debug("sessionDataHandler: token expired, ignoring existing sessions");
            return null;
        }

        log.debug("sessionDataHandler: existing token still valid, using existing session data");
        return storedTokenData;
    },

    async getUpdatedToken(): Promise<Token> {
        log.debug("sessionDataHandler: trying to get updated token from BE");
        const storedTokenData = getStoredSessionData();

        if (!storedTokenData) {
            throw Error("Can't update token: current token doesn't exist");
        }

        let newTokenData: Token;

        try {
            newTokenData = await contactBackend<Token>("/refreshToken", {
                token: storedTokenData.token
            });
        } catch (e) {
            throw Error(`Something went wrong when trying to get an updated token: ${e}`);
        }

        // Server won't return a conversation SID, so we merge the existing data with the latest one
        const updatedSessionData = {
            ...storedTokenData,
            ...newTokenData
        };

        storeSessionData(updatedSessionData);

        return updatedSessionData;
    },

    fetchAndStoreNewSession: async () => {
        log.debug("sessionDataHandler: trying to create new session");

        // Get employeeId from URL params, data attributes, localStorage, or global variables
        const urlParams = new URLSearchParams(window.location.search);
        const employeeId = urlParams.get('employeeId') || 
                          document.body.getAttribute('data-employee-id') || 
                          localStorage.getItem('employeeId') ||
                          'unknown';

        const utmParams = Array.from(new URLSearchParams(window.location.search).entries())
            .filter((p) => p[0].toLowerCase().startsWith("utm"))
            .reduce<{ [id: string]: string }>((acc, currVal) => {
                acc[currVal[0].toLowerCase()] = currVal[1];
                return acc;
            }, {});

        const allParams = Array.from(new URLSearchParams(window.location.search).entries()).reduce<{
            [id: string]: string;
        }>((acc, currVal) => {
            acc[currVal[0].toLowerCase()] = currVal[1];
            return acc;
        }, {});

        // Add employeeId to allParams
        allParams.employeeid = employeeId;

        let newTokenData;

        try {
            newTokenData = await contactBackend<Token>("/initWebchat", {
                utmParams,
                allParams,
                formData: {
                    employeeId
                }
            });
        } catch (e) {
            throw Error("No results from server");
        }

        // Store employeeId with session data for resumed sessions
        const sessionDataWithEmployeeId = {
            ...newTokenData,
            employeeId
        };

        log.debug("sessionDataHandler: new session successfully created");
        storeSessionData(sessionDataWithEmployeeId);

        return sessionDataWithEmployeeId;
    },

    clear: () => {
        localStorage.removeItem(LOCAL_STORAGE_ITEM_ID);
    }
};
