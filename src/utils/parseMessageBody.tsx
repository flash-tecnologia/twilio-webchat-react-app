export const parseMessageBody = (body: string, belongToCurrentUser: boolean) => {
    const urlRegex = /(\b(https?):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi;
    const asteriskRegex = /\*([^*]+)\*/g;
    let messageBodyFormatted = body.replace(asteriskRegex, "<b>$1</b>");

    const checkIfBodyHasURL = body.match(urlRegex);
    if (checkIfBodyHasURL && checkIfBodyHasURL?.length > 0) {
        messageBodyFormatted = body.replace(
            urlRegex,
            `<a href=${checkIfBodyHasURL[0]} style="color: ${
                belongToCurrentUser ? "#ffffff" : "#000000"
            }">${checkIfBodyHasURL}</a>`
        );
    }

    return messageBodyFormatted;
};