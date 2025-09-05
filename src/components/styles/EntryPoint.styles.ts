import { BoxStyleProps } from "@twilio-paste/core/box";

export const containerStyles: BoxStyleProps = {
    border: "none",
    backgroundColor: "colorBackgroundPrimary",
    display: "flex",
    height: "sizeIcon90",
    width: "sizeIcon90",
    fontSize: "fontSize50",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "borderRadiusCircle",
    color: "colorTextWeakest",
    cursor: "pointer",
    transition: "background-color 0.2s",
    outline: "0px",
    padding: "space0",
    _hover: {
        backgroundColor: "colorBackgroundPrimaryStronger",
        borderRadius: "borderRadiusCircle"
    },
    _focusVisible: {
        borderRadius: "borderRadiusCircle",
        backgroundColor: "colorBackgroundPrimaryStronger",
        boxShadow: "shadowFocus"
    }
};
