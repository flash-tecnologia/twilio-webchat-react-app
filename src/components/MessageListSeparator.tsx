import { Message } from "@twilio/conversations";
import { Box } from "@twilio-paste/core/box";
import { Text } from "@twilio-paste/core/text";

import { getDaysOld } from "../utils/getDaysOld";
import {
    separatorContainerStyles,
    getSeparatorLineStyles,
    getSeparatorTextStyles
} from "./styles/MessageListSeparator.styles";
import { SeparatorType } from "./definitions";

export const MessageListSeparator = ({
    message,
    separatorType
}: {
    message: Message;
    separatorType: SeparatorType;
}) => {
    const getSeparatorText = () => {
        let separatorText;
        if (separatorType === "new") {
            separatorText = "Novo";
        } else {
            const daysOld = getDaysOld(message.dateCreated);
            if (daysOld === 0) {
                separatorText = "Hoje";
            } else if (daysOld === 1) {
                separatorText = "Ontem";
            } else {
                separatorText = message.dateCreated.toLocaleDateString();
            }
        }

        return separatorText;
    };

    return (
        <Box {...separatorContainerStyles} data-test="new-message-separator" role="separator">
            <Box {...getSeparatorLineStyles(separatorType)} aria-hidden="true" />
            <Text as="p" {...getSeparatorTextStyles(separatorType)}>
                {getSeparatorText()}
            </Text>
            <Box {...getSeparatorLineStyles(separatorType)} aria-hidden="true" />
        </Box>
    );
};
