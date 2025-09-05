import log from "loglevel";
import { Media, Message } from "@twilio/conversations";
import { Box } from "@twilio-paste/core/box";
import { ScreenReaderOnly } from "@twilio-paste/core/screen-reader-only";
import { useSelector } from "react-redux";
import { Text } from "@twilio-paste/core/text";
import { Flex } from "@twilio-paste/core/flex";
import { Button } from "@twilio-paste/core/button";
import { Key, KeyboardEvent, useEffect, useRef, useState } from "react";
import { SuccessIcon } from "@twilio-paste/icons/esm/SuccessIcon";

import { AppState } from "../store/definitions";
import { FilePreview } from "./FilePreview";
import { parseMessageBody } from "../utils/parseMessageBody";
import {
    getAvatarContainerStyles,
    getInnerContainerStyles,
    authorStyles,
    timeStampStyles,
    bodyStyles,
    outerContainerStyles,
    readStatusStyles,
    bubbleAndAvatarContainerStyles,
    boxButtonOptionsStyles,
    descriptionOptionsStyles,
    buttonOptionsStyles
} from "./styles/MessageBubble.styles";

const doubleDigit = (number: number) => `${number < 10 ? 0 : ""}${number}`;

type MessageOptions = {
    id: string;
    label: string;
    description: string;
    type: string;
};

interface CustomMessage extends Message {
    attributes: {
        options?: MessageOptions[];
    };
}

export const MessageBubble = ({
    message,
    isLast,
    isLastOfUserGroup,
    focusable,
    updateFocus
}: {
    message: CustomMessage;
    isLast: boolean;
    isLastOfUserGroup: boolean;
    focusable: boolean;
    updateFocus: (newFocus: number) => void;
}) => {
    const [read, setRead] = useState(false);
    const [isMouseDown, setIsMouseDown] = useState(false);
    const { conversation, conversationsClient, participants, users, fileAttachmentConfig } = useSelector(
        (state: AppState) => ({
            conversationsClient: state.chat.conversationsClient,
            participants: state.chat.participants,
            users: state.chat.users,
            fileAttachmentConfig: state.config.fileAttachment,
            conversation: state.chat.conversation
        })
    );
    const [options, setOptions] = useState<MessageOptions[]>([]);
    const messageRef = useRef<HTMLDivElement>(null);

    const belongsToCurrentUser = message.author === conversationsClient?.user.identity;

    useEffect(() => {
        if (isLast && participants && belongsToCurrentUser) {
            const getOtherParticipants = participants.filter(
                (p: { identity: any }) => p.identity !== conversationsClient?.user.identity
            );
            setRead(
                Boolean(getOtherParticipants.length) &&
                    getOtherParticipants.every(
                        (p: { lastReadMessageIndex: any }) => p.lastReadMessageIndex === message.index
                    )
            );
        } else {
            setRead(false);
        }

        if (message.attributes && message.attributes?.options) {
            setOptions(message.attributes?.options);
        }
    }, [participants, isLast, belongsToCurrentUser, conversationsClient, message]);

    useEffect(() => {
        if (focusable) {
            messageRef.current?.focus();
        }
    }, [focusable]);

    const sendOptionSelected =  (option: MessageOptions) => {
        if (!conversation) {
            log.error("Failed sending message: no conversation found");
            return;
        }

        let preparedMessage = conversation.prepareMessage();
        preparedMessage = preparedMessage.setBody(option.id);

        preparedMessage.build().send()
    };

    const renderMedia = () => {
        if (fileAttachmentConfig?.enabled) {
            if (!message.attachedMedia) {
                return null;
            }

            return message.attachedMedia.map((media: Media, index: Key) => {
                const file = {
                    name: media.filename,
                    type: media.contentType,
                    size: media.size
                } as File;
                return <FilePreview key={index} file={file} isBubble={true} media={media} focusable={focusable} />;
            });
        }

        return <i>Media messages are not supported</i>;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            const newFocusValue = message.index + (e.key === "ArrowUp" ? -1 : 1);
            updateFocus(newFocusValue);
        }
    };

    const handleMouseDown = () => {
        setIsMouseDown(true);
    };

    const handleMouseUp = () => {
        setIsMouseDown(false);
    };

    const handleFocus = () => {
        // Ignore focus from clicks
        if (!isMouseDown) {
            // Necessary since screen readers can set the focus to any focusable element
            updateFocus(message.index);
        }
    };

    const author = users?.find((u: { identity: any }) => u.identity === message.author)?.friendlyName || "Agente";

    return (
        <Box
            {...outerContainerStyles}
            tabIndex={focusable ? 0 : -1}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            ref={messageRef}
            data-message-bubble
            data-testid="message-bubble"
        >
            <Box {...bubbleAndAvatarContainerStyles}>
                {!belongsToCurrentUser && (
                    <Box {...getAvatarContainerStyles(!isLastOfUserGroup)} data-testid="avatar-container">
                        {isLastOfUserGroup && (
                            <img
                                src="https://lava-goat-5720.twil.io/assets/flash_icon.png"
                                alt="Logo Flash"
                                style={{ width: "24px", height: "24px" }}
                            />
                        )}
                    </Box>
                )}
                <Box {...getInnerContainerStyles(belongsToCurrentUser)}>
                    <Flex hAlignContent="between" width="100%" vAlignContent="center" marginBottom="space20">
                        <Text {...authorStyles} as="p" aria-hidden style={{ textOverflow: "ellipsis" }} title={author}>
                            {author.startsWith("CH") ? "Agente" : author.split(" ")[0]}
                        </Text>
                        <ScreenReaderOnly as="p">
                            {belongsToCurrentUser
                                ? "Você enviou em"
                                : `${
                                      users?.find((u: { identity: any }) => u.identity === message.author)?.friendlyName
                                  } enviado em`}
                        </ScreenReaderOnly>
                        <Text {...timeStampStyles} as="p">
                            {`${doubleDigit(message.dateCreated?.getHours() || 0)}:${doubleDigit(
                                message.dateCreated?.getMinutes() || 0
                            )}`}
                        </Text>
                    </Flex>
                    <Text
                        as="p"
                        dangerouslySetInnerHTML={{
                            __html: message.body ? parseMessageBody(`${message.body}`, belongsToCurrentUser) : ""
                        }}
                        {...bodyStyles}
                    />
                    {options.length ? (
                        <Box {...boxButtonOptionsStyles}>
                            {options.map((option) => {
                                if (option.type === "media") {
                                    const mediaName = option.id.split("/");
                                    const file = {
                                        name: mediaName[mediaName.length - 1],
                                        type: "image/png",
                                        size: 10000
                                    } as File;

                                    const media = {
                                        contentType: "image/png"
                                    } as Media;

                                    return (
                                        <FilePreview
                                            key={option.id}
                                            file={file}
                                            isBubble={true}
                                            focusable={true}
                                            contentMedia={option.id}
                                            media={media}
                                        />
                                    );
                                } else if (option.type === "call-to-action") {
                                    return (
                                        <Button
                                            {...buttonOptionsStyles}
                                            key={option.id}
                                            title={option.description}
                                            data-test="message-send-button"
                                            variant="secondary"
                                            size="icon_small"
                                            type="button"
                                            onClick={() => window.open(option.description, "_blank")}
                                        >
                                            <Box>
                                                <Text as="p">{option.label}</Text>
                                            </Box>
                                        </Button>
                                    );
                                }

                                return (
                                    <Button
                                        {...buttonOptionsStyles}
                                        key={option.id}
                                        title={option.description}
                                        data-test="message-send-button"
                                        variant="secondary"
                                        size="icon_small"
                                        type="button"
                                        onClick={() => sendOptionSelected(option)}
                                    >
                                        <Box>
                                            <Text as="p">{option.label}</Text>
                                            <Text as="p" {...descriptionOptionsStyles}>
                                                {option.description}
                                            </Text>
                                        </Box>
                                    </Button>
                                );
                            })}
                        </Box>
                    ) : null}
                    {message.type === "media" ? renderMedia() : null}
                </Box>
            </Box>
            {read && (
                <Flex hAlignContent="right" vAlignContent="center" marginTop="space20">
                    <Text as="p" {...readStatusStyles}>
                        Lido
                    </Text>
                    <SuccessIcon decorative={true} size="sizeIcon10" color="colorTextWeak" />
                </Flex>
            )}
        </Box>
    );
};
