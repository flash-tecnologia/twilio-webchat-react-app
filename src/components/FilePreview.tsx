import log from "loglevel";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box } from "@twilio-paste/core/box";
import { Text } from "@twilio-paste/core/text";
import { FileIcon } from "@twilio-paste/icons/esm/FileIcon";
import { CloseIcon } from "@twilio-paste/icons/esm/CloseIcon";
import { Button } from "@twilio-paste/core/button";
import { Modal, ModalBody } from "@twilio-paste/core/modal";
import { Media } from "@twilio/conversations";
import { extension as mimeToExtension } from "mime-types";
import { Truncate } from "@twilio-paste/core/truncate";

import { addNotification, detachFiles } from "../store/actions/genericActions";
import { AppState } from "../store/definitions";
import { notifications } from "../notifications";
import { roundFileSizeInMB } from "../utils/roundFileSizeInMB";
import {
    actionIconContainerStyles,
    fileDescriptionContainerStyles,
    fileIconContainerStyles,
    fileNameStyles,
    fileSizeStyles,
    getContainerStyles,
    outerContainerStyles,
    downloadButtonStyles
} from "./styles/FilePreview.styles";

interface FilePreviewProps {
    file: File;
    isBubble: boolean;
    disabled?: boolean;
    media?: Media;
    contentMedia?: string,
    focusable: boolean;
}

export const FilePreview = (props: FilePreviewProps) => {
    const { file, isBubble, disabled, media, focusable, contentMedia } = props;
    const [isHovered, setIsHovered] = useState(false);
    const [mediaUrl, setMediaUrl] = useState("");
    const [mediaModalOpened, setMediaModalOpened] = useState(false);

    const dispatch = useDispatch();
    const fileAttachmentConfig = useSelector((state: AppState) => state.config.fileAttachment);

    const handleDetach = () => {
        dispatch(detachFiles([file]));
    };

    const getMediaUrl = async () => {
        if (contentMedia) {
            setMediaUrl(contentMedia);
        } else {
            const url = media ? await media.getContentTemporaryUrl() : URL.createObjectURL(file);
            setMediaUrl(url);
        }
    };

    useEffect(() => {
        getMediaUrl();
    }, []);

    const handleDownload = async () => {
        if (fileAttachmentConfig?.maxFileSize && file.size > fileAttachmentConfig.maxFileSize) {
            dispatch(
                addNotification(
                    notifications.fileDownloadInvalidSizeNotification({
                        fileName: file.name,
                        maxFileSize: `${roundFileSizeInMB(fileAttachmentConfig.maxFileSize)}MB`
                    })
                )
            );
            return;
        }

        if (
            fileAttachmentConfig?.acceptedExtensions &&
            !fileAttachmentConfig.acceptedExtensions.includes(mimeToExtension(file.type) as string)
        ) {
            dispatch(
                addNotification(
                    notifications.fileDownloadInvalidTypeNotification({
                        fileName: file.name
                    })
                )
            );
            return;
        }

        try {
            window.open(mediaUrl);
        } catch (e) {
            log.error(`Failed downloading message attachment: ${e}`);
        }
    };

    const handleBoxClick = () => {
        if (!disabled) {
            handleDownload();
        }
    };

    useEffect(() => {
       console.log("media?.contentType", media?.contentType);
    }, [media?.contentType]);

    return (
        <Box {...outerContainerStyles}>
            {(media?.contentType || file.type).includes("image") ? (
                <>
                    <img src={mediaUrl} alt="MMS" width="150px" onClick={() => setMediaModalOpened(true)} />
                    <Modal
                        isOpen={mediaModalOpened}
                        onDismiss={() => setMediaModalOpened(false)}
                        size="wide"
                        ariaLabelledby="form-dialog-title"
                    >
                        <ModalBody>
                            <img
                                width="100%"
                                src={mediaUrl}
                                alt="MMS Media"
                                style={{
                                    objectFit: "contain",
                                    height: "calc(100vh - 96px)"
                                }}
                            />
                        </ModalBody>
                        <Box
                            as="button"
                            type="button"
                            appearance="none"
                            data-test="file-preview-main-area"
                            {...downloadButtonStyles(isBubble, disabled)}
                            onClick={handleBoxClick}
                            onMouseEnter={() => setIsHovered(true)}
                            onFocus={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            onBlur={() => setIsHovered(false)}
                            tabIndex={focusable ? 0 : -1}
                        >
                            Download
                        </Box>
                    </Modal>
                </>
            ) : (
                <>
                    <Box
                        as="button"
                        type="button"
                        appearance="none"
                        data-test="file-preview-main-area"
                        {...getContainerStyles(isBubble, disabled)}
                        onClick={handleBoxClick}
                        onMouseEnter={() => setIsHovered(true)}
                        onFocus={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        onBlur={() => setIsHovered(false)}
                        tabIndex={focusable ? 0 : -1}
                    >
                        <Box {...fileIconContainerStyles}>
                            <FileIcon decorative={false} title="Arquivo anexado" size="sizeIcon40" />
                        </Box>
                        <Box {...fileDescriptionContainerStyles}>
                            <Text as="h1" {...fileNameStyles}>
                                <Truncate title={file.name}>{file.name}</Truncate>
                            </Text>
                            <Text as="p" {...fileSizeStyles}>
                                {isHovered ? "Clique para abrir" : `${roundFileSizeInMB(file.size)}MB`}
                            </Text>
                        </Box>
                    </Box>
                    <Box {...actionIconContainerStyles}>
                        {!isBubble && (
                            <Button
                                variant="secondary_icon"
                                size="icon_small"
                                onClick={handleDetach}
                                type="button"
                                data-test="message-file-attachment-remove-button"
                            >
                                <CloseIcon
                                    decorative={false}
                                    title="Remover arquivo anexado"
                                    size="sizeIcon30"
                                    color="inherit"
                                />
                            </Button>
                        )}
                    </Box>
                </>
            )}
        </Box>
    );
};
