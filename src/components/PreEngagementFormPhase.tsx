import { Box } from "@twilio-paste/core/box";
import { Button } from "@twilio-paste/core/button";
import { Text } from "@twilio-paste/core/text";
import { FormEvent } from "react";
import { useDispatch } from "react-redux";

import { notifications } from "../notifications";
import { sessionDataHandler } from "../sessionDataHandler";
import { addNotification, changeEngagementPhase } from "../store/actions/genericActions";
import { initSession } from "../store/actions/initActions";
import { EngagementPhase } from "../store/definitions";
import { Header } from "./Header";
import { NotificationBar } from "./NotificationBar";
import { formStyles, introStyles, titleStyles } from "./styles/PreEngagementFormPhase.styles";

export const PreEngagementFormPhase = () => {
    const dispatch = useDispatch();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        dispatch(changeEngagementPhase({ phase: EngagementPhase.Loading }));
        try {
            const data = await sessionDataHandler.fetchAndStoreNewSession();
            dispatch(initSession({ token: data.token, conversationSid: data.conversationSid }));
        } catch (err) {
            dispatch(addNotification(notifications.failedToInitSessionNotification((err as Error).message)));
            dispatch(changeEngagementPhase({ phase: EngagementPhase.PreEngagementForm }));
        }
    };

    return (
        <>
            <Header />
            <NotificationBar />
            <Box as="form" data-test="pre-engagement-chat-form" onSubmit={handleSubmit} {...formStyles}>
                <Text {...titleStyles} as="h3">
                    Olá!
                </Text>
                <Text {...introStyles} as="p">
                    Estamos aqui para te ajudar. Eu sou a atendente digital!
                </Text>
                <Button variant="primary" type="submit" data-test="pre-engagement-start-chat-button">
                    Iniciar chat
                </Button>
            </Box>
        </>
    );
};
